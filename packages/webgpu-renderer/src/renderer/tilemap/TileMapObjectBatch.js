// Global buffer ID counter for unique bind group keys
let globalBufferId = 0;
/**
 * TileMapObjectBatch batches objects by tileset for instanced rendering
 * Similar to TileMapBatch but handles objects with arbitrary positions and sizes
 */
export class TileMapObjectBatch {
    tileSet;
    objects = [];
    instanceData;
    instanceBuffer;
    device;
    instanceCount = 0;
    bufferId;
    // Same layout as TileMapBatch:
    // - position (2 floats = 8 bytes)
    // - size (2 floats = 8 bytes)
    // - frame (4 floats = 16 bytes)
    // - tint (4 floats = 16 bytes)
    // Total: 12 floats = 48 bytes
    static BYTES_PER_INSTANCE = 48;
    static FLOATS_PER_INSTANCE = 12;
    constructor(tileSet) {
        this.tileSet = tileSet;
        this.instanceData = new Float32Array(0);
        this.bufferId = ++globalBufferId;
    }
    /**
     * Initialize GPU resources
     */
    initialize(device) {
        this.device = device;
    }
    /**
     * Add an object to this batch
     */
    addObject(object, tile, layerTint) {
        this.objects.push({ object, tile, layerTint });
    }
    /**
     * Clear all objects from this batch
     */
    clear() {
        this.objects = [];
        this.instanceCount = 0;
    }
    /**
     * Check if batch is empty
     */
    isEmpty() {
        return this.objects.length === 0;
    }
    /**
     * Get the number of objects in this batch
     */
    getCount() {
        return this.objects.length;
    }
    /**
     * Get unique buffer ID for bind group caching
     */
    getBufferId() {
        return this.bufferId;
    }
    /**
     * Rebuild instance data from current objects
     * Objects use world coordinates directly (not tile grid coordinates)
     */
    rebuild(vpMatrix, worldMatrix) {
        this.instanceCount = this.objects.length;
        if (this.instanceCount === 0) {
            this.instanceData = new Float32Array(0);
            return;
        }
        // Allocate instance data
        const floatCount = this.instanceCount * TileMapObjectBatch.FLOATS_PER_INSTANCE;
        this.instanceData = new Float32Array(floatCount);
        let offset = 0;
        for (const { object, tile, layerTint } of this.objects) {
            // Calculate final tint (object tint * layer tint)
            const finalTint = object.tint.clone();
            finalTint.multiplyColor(layerTint);
            // Position: use object's world position directly
            this.instanceData[offset++] = object.x;
            this.instanceData[offset++] = object.y;
            // Size: use object's dimensions (can be different from tile size)
            this.instanceData[offset++] = object.width;
            this.instanceData[offset++] = object.height;
            // Frame UV coordinates (from tile)
            this.instanceData[offset++] = tile.frame.x;
            this.instanceData[offset++] = tile.frame.y;
            this.instanceData[offset++] = tile.frame.width;
            this.instanceData[offset++] = tile.frame.height;
            // Tint color
            this.instanceData[offset++] = finalTint.r;
            this.instanceData[offset++] = finalTint.g;
            this.instanceData[offset++] = finalTint.b;
            this.instanceData[offset++] = finalTint.a;
        }
    }
    /**
     * Get instance data for GPU upload
     */
    getInstanceData() {
        return {
            data: this.instanceData,
            count: this.instanceCount,
        };
    }
    /**
     * Get or create the instance buffer
     */
    getOrCreateInstanceBuffer() {
        if (!this.device) {
            throw new Error("Device not initialized");
        }
        const requiredSize = Math.max(this.instanceCount * TileMapObjectBatch.BYTES_PER_INSTANCE, 16 // Minimum buffer size
        );
        // Check if we need to recreate the buffer (size changed)
        if (!this.instanceBuffer ||
            this.instanceBuffer.size < requiredSize ||
            this.instanceBuffer.size > requiredSize * 2) {
            // Destroy old buffer if it exists
            if (this.instanceBuffer) {
                this.instanceBuffer.destroy();
            }
            // Create new buffer with some padding for growth
            const bufferSize = Math.ceil(requiredSize * 1.5);
            this.instanceBuffer = this.device.createBuffer({
                size: bufferSize,
                usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
            });
        }
        return this.instanceBuffer;
    }
    /**
     * Destroy GPU resources
     */
    destroy() {
        if (this.instanceBuffer) {
            this.instanceBuffer.destroy();
            this.instanceBuffer = undefined;
        }
    }
}
