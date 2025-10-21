import { TileMapBatch } from "./TileMapBatch";
/**
 * TileMapChunk represents a spatial subdivision of a tilemap
 * Each chunk contains a subset of tiles and manages its own batches
 */
export class TileMapChunk {
    chunkX;
    chunkY;
    worldBounds;
    // One batch per tileset used in this chunk
    batches = new Map();
    device;
    // Cached world matrix values for bounds calculation
    cachedWorldMatrixHash = NaN; // Use NaN as sentinel for "not cached"
    cachedChunkSize = 0;
    cachedTileWidth = 0;
    cachedTileHeight = 0;
    constructor(chunkX, chunkY) {
        this.chunkX = chunkX;
        this.chunkY = chunkY;
        this.worldBounds = { left: 0, right: 0, top: 0, bottom: 0 };
    }
    /**
     * Initialize GPU resources for this chunk
     */
    initialize(device) {
        this.device = device;
        for (const batch of this.batches.values()) {
            batch.initialize(device);
        }
    }
    /**
     * Add a tile to this chunk
     */
    addTile(x, y, tile, tileSet, layerIndex, tint) {
        const tileSetId = tileSet.id;
        // Get or create batch for this tileset
        let batch = this.batches.get(tileSetId);
        if (!batch) {
            batch = new TileMapBatch(tileSet);
            if (this.device) {
                batch.initialize(this.device);
            }
            this.batches.set(tileSetId, batch);
        }
        // Add tile to batch
        batch.addTile(x, y, tile, layerIndex, tint);
    }
    /**
     * Calculate world bounds for this chunk (with caching)
     */
    calculateWorldBounds(chunkSize, tileWidth, tileHeight, worldMatrix) {
        // Create a simple hash of the world matrix (using key transform values)
        const worldMatrixHash = worldMatrix[0] * 1000 +
            worldMatrix[5] * 100 +
            worldMatrix[12] * 10 +
            worldMatrix[13];
        // Check if we can use cached bounds
        if (this.cachedWorldMatrixHash === worldMatrixHash &&
            this.cachedChunkSize === chunkSize &&
            this.cachedTileWidth === tileWidth &&
            this.cachedTileHeight === tileHeight) {
            return; // Use cached worldBounds
        }
        // Extract world transform
        const tileMapWorldX = worldMatrix[12];
        const tileMapWorldY = worldMatrix[13];
        const scaleX = Math.sqrt(worldMatrix[0] * worldMatrix[0] + worldMatrix[1] * worldMatrix[1]);
        const scaleY = Math.sqrt(worldMatrix[4] * worldMatrix[4] + worldMatrix[5] * worldMatrix[5]);
        // Calculate chunk bounds in world space
        this.worldBounds = {
            left: tileMapWorldX + this.chunkX * chunkSize * tileWidth * scaleX,
            right: tileMapWorldX + (this.chunkX + 1) * chunkSize * tileWidth * scaleX,
            bottom: tileMapWorldY + this.chunkY * chunkSize * tileHeight * scaleY,
            top: tileMapWorldY + (this.chunkY + 1) * chunkSize * tileHeight * scaleY,
        };
        // Cache the parameters
        this.cachedWorldMatrixHash = worldMatrixHash;
        this.cachedChunkSize = chunkSize;
        this.cachedTileWidth = tileWidth;
        this.cachedTileHeight = tileHeight;
    }
    /**
     * Check if this chunk is within the view bounds
     */
    isInView(viewBounds) {
        return (this.worldBounds.right >= viewBounds.left &&
            this.worldBounds.left <= viewBounds.right &&
            this.worldBounds.top >= viewBounds.bottom &&
            this.worldBounds.bottom <= viewBounds.top);
    }
    /**
     * Check if this chunk is empty
     */
    isEmpty() {
        return this.batches.size === 0;
    }
    /**
     * Get the number of tiles in this chunk
     */
    getTileCount() {
        let count = 0;
        for (const batch of this.batches.values()) {
            count += batch.getCount();
        }
        return count;
    }
    /**
     * Render all batches in this chunk
     */
    render(renderPass, device, vpMatrix, worldMatrix, tileWidth, tileHeight, spriteInstancedPipeline, spriteInstancedBindGroupLayout, quadBuffers, textureViewCache, bindGroupCache, vpMatrixBuffer) {
        for (const batch of this.batches.values()) {
            if (batch.isEmpty())
                continue;
            // Check if tileset texture is loaded (skip if still a handle)
            const texture = batch.tileSet.getTexture();
            if (!texture) {
                // Texture not loaded yet, skip this batch
                continue;
            }
            // Rebuild batch if needed
            batch.rebuild(vpMatrix, worldMatrix, tileWidth, tileHeight);
            const instanceDataInfo = batch.getInstanceData();
            if (instanceDataInfo.count === 0)
                continue;
            // Get or create instance buffer
            const instanceBuffer = batch.getOrCreateInstanceBuffer();
            // Write instance data to GPU
            device.queue.writeBuffer(instanceBuffer, 0, instanceDataInfo.data.buffer, 0, instanceDataInfo.count * 48 // 48 bytes per instance (GPU-optimized)
            );
            // Get or create texture view
            let textureView = textureViewCache.get(texture.id);
            if (!textureView) {
                textureView = texture.gpuTexture.createView();
                textureViewCache.set(texture.id, textureView);
            }
            // Create bind group key (textureId + bufferId)
            const bindGroupKey = `${texture.id}_${batch.getBufferId()}`;
            // Get or create bind group using cache
            const bindGroup = bindGroupCache.getOrCreate(bindGroupKey, () => {
                return device.createBindGroup({
                    layout: spriteInstancedBindGroupLayout,
                    entries: [
                        { binding: 0, resource: { buffer: vpMatrixBuffer } }, // VP matrix uniform
                        { binding: 1, resource: { buffer: instanceBuffer } }, // Instance data storage
                        { binding: 2, resource: texture.sampler },
                        { binding: 3, resource: textureView },
                    ],
                });
            });
            // Draw instanced
            renderPass.setPipeline(spriteInstancedPipeline);
            renderPass.setBindGroup(0, bindGroup);
            for (let i = 0; i < quadBuffers.bufferLayouts.length; i++) {
                renderPass.setVertexBuffer(i, quadBuffers.buffers[i]);
            }
            if (quadBuffers.indexBuffer) {
                renderPass.setIndexBuffer(quadBuffers.indexBuffer, quadBuffers.indexFormat);
                renderPass.drawIndexed(quadBuffers.numElements, instanceDataInfo.count);
            }
            else {
                renderPass.draw(quadBuffers.numElements, instanceDataInfo.count);
            }
        }
    }
    /**
     * Clean up GPU resources
     */
    destroy() {
        for (const batch of this.batches.values()) {
            batch.destroy();
        }
        this.batches.clear();
    }
}
