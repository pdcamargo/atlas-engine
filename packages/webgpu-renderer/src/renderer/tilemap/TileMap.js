import { SceneNode } from "../SceneNode";
import { TileMapLayer } from "./TileMapLayer";
import { TileMapChunk } from "./TileMapChunk";
/**
 * TileMap is a scene node that manages multiple layers of tiles
 * It uses a dirty flag system to optimize rendering and batch updates
 */
export class TileMap extends SceneNode {
    tileWidth;
    tileHeight;
    chunkSize;
    layers = new Map();
    layerOrder = []; // Maintain layer rendering order
    chunks = new Map(); // key: integer hash of (chunkX,chunkY)
    dirty = true;
    constructor(options) {
        super(options.id);
        this.tileWidth = options.tileWidth;
        this.tileHeight = options.tileHeight;
        this.chunkSize = options.chunkSize ?? 10; // Default 10x10 tiles per chunk
    }
    /**
     * Add a new layer to the tilemap
     */
    addLayer(name, zIndex) {
        if (this.layers.has(name)) {
            throw new Error(`Layer "${name}" already exists`);
        }
        const layer = new TileMapLayer(name, () => this.markDirty());
        if (zIndex !== undefined) {
            layer.zIndex = zIndex;
        }
        this.layers.set(name, layer);
        this.layerOrder.push(name);
        this.sortLayers();
        this.markDirty();
        return layer;
    }
    /**
     * Get a layer by name
     */
    getLayer(name) {
        return this.layers.get(name);
    }
    /**
     * Ensure a layer exists, creating it if it doesn't
     */
    ensureLayer(name, zIndex) {
        const existing = this.layers.get(name);
        if (existing) {
            return existing;
        }
        return this.addLayer(name, zIndex);
    }
    /**
     * Remove a layer by name
     */
    removeLayer(name) {
        const layer = this.layers.get(name);
        if (!layer) {
            return false;
        }
        this.layers.delete(name);
        const index = this.layerOrder.indexOf(name);
        if (index !== -1) {
            this.layerOrder.splice(index, 1);
        }
        this.markDirty();
        return true;
    }
    /**
     * Get all layer names in rendering order
     */
    getLayerNames() {
        return [...this.layerOrder];
    }
    /**
     * Get all layers in rendering order
     */
    getLayers() {
        return this.layerOrder.map((name) => this.layers.get(name));
    }
    /**
     * Set a tile at a specific position in a layer (convenience method)
     * Supports both Tile instances and tile IDs (for deferred loading)
     */
    setTile(x, y, layerName, tileSet, tile, tint) {
        const layer = this.ensureLayer(layerName);
        layer.setTile(x, y, tileSet, tile, tint);
    }
    /**
     * Set a tile by its ID (convenience method for deferred loading)
     */
    setTileById(x, y, layerName, tileSet, tileId, tint) {
        const layer = this.ensureLayer(layerName);
        layer.setTileById(x, y, tileSet, tileId, tint);
    }
    /**
     * Remove a tile at a specific position in a layer (convenience method)
     */
    removeTile(x, y, layerName) {
        const layer = this.layers.get(layerName);
        if (!layer) {
            return false;
        }
        return layer.removeTile(x, y);
    }
    /**
     * Get tile data at a specific position in a layer (convenience method)
     */
    getTile(x, y, layerName) {
        const layer = this.layers.get(layerName);
        return layer?.getTile(x, y);
    }
    /**
     * Clear all tiles from all layers
     */
    clear() {
        for (const layer of this.layers.values()) {
            layer.clear();
        }
        this.markDirty();
    }
    /**
     * Clear a specific layer
     */
    clearLayer(name) {
        const layer = this.layers.get(name);
        if (layer) {
            layer.clear();
        }
    }
    /**
     * Check if the tilemap is dirty and needs rebuilding
     */
    isDirty() {
        return this.dirty;
    }
    /**
     * Mark the tilemap as dirty (needs rebuild)
     */
    markDirty() {
        this.dirty = true;
    }
    /**
     * Mark the tilemap as clean (rebuilt)
     */
    markClean() {
        this.dirty = false;
    }
    /**
     * Sort layers by zIndex
     */
    sortLayers() {
        this.layerOrder.sort((a, b) => {
            const layerA = this.layers.get(a);
            const layerB = this.layers.get(b);
            return layerA.zIndex - layerB.zIndex;
        });
    }
    /**
     * Set the zIndex of a layer and re-sort
     */
    setLayerZIndex(name, zIndex) {
        const layer = this.layers.get(name);
        if (layer) {
            layer.zIndex = zIndex;
            this.sortLayers();
            this.markDirty();
        }
    }
    /**
     * Get the total number of tiles across all layers
     */
    getTotalTileCount() {
        let count = 0;
        for (const layer of this.layers.values()) {
            count += layer.getTileCount();
        }
        return count;
    }
    /**
     * Get bounds of all tiles across all layers
     */
    getBounds() {
        let minX = Infinity;
        let minY = Infinity;
        let maxX = -Infinity;
        let maxY = -Infinity;
        let hasAnyTiles = false;
        for (const layer of this.layers.values()) {
            const bounds = layer.getBounds();
            if (bounds) {
                hasAnyTiles = true;
                minX = Math.min(minX, bounds.minX);
                minY = Math.min(minY, bounds.minY);
                maxX = Math.max(maxX, bounds.maxX);
                maxY = Math.max(maxY, bounds.maxY);
            }
        }
        return hasAnyTiles ? { minX, minY, maxX, maxY } : null;
    }
    /**
     * Generate chunk key from coordinates using integer hashing
     * This avoids string allocation and provides faster lookups
     */
    getChunkKey(chunkX, chunkY) {
        // Pack two 16-bit signed integers into one 32-bit integer
        // Supports chunk coordinates from -32768 to 32767
        return ((chunkX & 0xffff) | ((chunkY & 0xffff) << 16)) >>> 0;
    }
    /**
     * Calculate which chunk a tile belongs to
     */
    getChunkCoords(tileX, tileY) {
        return {
            chunkX: Math.floor(tileX / this.chunkSize),
            chunkY: Math.floor(tileY / this.chunkSize),
        };
    }
    /**
     * Get all chunks
     */
    getChunks() {
        return this.chunks;
    }
    /**
     * Clear all chunks
     */
    clearChunks() {
        for (const chunk of this.chunks.values()) {
            chunk.destroy();
        }
        this.chunks.clear();
    }
    /**
     * Build chunks from current layer data
     */
    buildChunks(device) {
        // Clear existing chunks
        this.clearChunks();
        // Iterate through all layers and tiles
        const layers = this.getLayers();
        for (let layerIndex = 0; layerIndex < layers.length; layerIndex++) {
            const layer = layers[layerIndex];
            if (!layer.visible)
                continue;
            const allTiles = layer.getAllTiles();
            for (const { x, y, data } of allTiles) {
                // Calculate chunk coordinates
                const { chunkX, chunkY } = this.getChunkCoords(x, y);
                const chunkKey = this.getChunkKey(chunkX, chunkY);
                // Get or create chunk
                let chunk = this.chunks.get(chunkKey);
                if (!chunk) {
                    chunk = new TileMapChunk(chunkX, chunkY);
                    chunk.initialize(device);
                    this.chunks.set(chunkKey, chunk);
                }
                // Calculate final tint (layer tint * tile tint)
                const finalTint = data.tint ? data.tint.clone() : layer.tint.clone();
                if (data.tint && !data.tint.equals(layer.tint)) {
                    finalTint.multiplyColor(layer.tint);
                }
                // Add tile to chunk
                chunk.addTile(x, y, data.tile, data.tileSet, layerIndex, finalTint);
            }
        }
    }
    /**
     * Update world bounds for all chunks
     */
    updateChunkBounds(worldMatrix) {
        for (const chunk of this.chunks.values()) {
            chunk.calculateWorldBounds(this.chunkSize, this.tileWidth, this.tileHeight, worldMatrix);
        }
    }
    /**
     * Get chunks that are visible within the view bounds, including adjacent chunks
     * This provides a natural padding buffer to prevent tile popping
     */
    getVisibleChunks(viewBounds) {
        const visibleChunks = [];
        // First pass: find directly visible chunks
        for (const chunk of this.chunks.values()) {
            if (chunk.isInView(viewBounds)) {
                visibleChunks.push(chunk);
            }
        }
        // Second pass: add adjacent chunks (8 neighbors)
        const chunksToAdd = new Set();
        for (const chunk of visibleChunks) {
            // Add all 9 positions (current + 8 neighbors)
            for (let dx = -1; dx <= 1; dx++) {
                for (let dy = -1; dy <= 1; dy++) {
                    const neighborKey = this.getChunkKey(chunk.chunkX + dx, chunk.chunkY + dy);
                    chunksToAdd.add(neighborKey);
                }
            }
        }
        // Collect all chunks (visible + adjacent)
        const result = [];
        for (const chunkKey of chunksToAdd) {
            const chunk = this.chunks.get(chunkKey);
            if (chunk) {
                result.push(chunk);
            }
        }
        return result;
    }
    /**
     * Sync pending tiles across all layers whose textures are now ready
     * This is called automatically by the tileset loading system when textures load
     * Returns the total number of tiles that were applied
     */
    syncPendingTiles() {
        let totalApplied = 0;
        for (const layer of this.layers.values()) {
            const appliedCount = layer.syncPendingTiles();
            totalApplied += appliedCount;
        }
        return totalApplied;
    }
    /**
     * Get the total number of pending tiles waiting for textures to load
     */
    getTotalPendingTileCount() {
        let count = 0;
        for (const layer of this.layers.values()) {
            count += layer.getPendingTileCount();
        }
        return count;
    }
    /**
     * Get all unique tilesets used in this tilemap (including from pending tiles)
     */
    getAllTileSets() {
        const tileSets = new Set();
        for (const layer of this.layers.values()) {
            const layerTileSets = layer.getAllTileSets();
            for (const tileSet of layerTileSets) {
                tileSets.add(tileSet);
            }
        }
        return tileSets;
    }
}
