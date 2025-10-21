import { SceneNode } from "../SceneNode";
import { TileMapLayer } from "./TileMapLayer";
import { TileSet } from "./TileSet";
import { Tile } from "./Tile";
import { Color } from "@atlas/core";
import { TileMapChunk, ChunkBounds } from "./TileMapChunk";
export interface TileMapOptions {
    tileWidth: number;
    tileHeight: number;
    chunkSize?: number;
    id?: string;
}
/**
 * TileMap is a scene node that manages multiple layers of tiles
 * It uses a dirty flag system to optimize rendering and batch updates
 */
export declare class TileMap extends SceneNode {
    readonly tileWidth: number;
    readonly tileHeight: number;
    readonly chunkSize: number;
    private layers;
    private layerOrder;
    private chunks;
    private dirty;
    constructor(options: TileMapOptions);
    /**
     * Add a new layer to the tilemap
     */
    addLayer(name: string, zIndex?: number): TileMapLayer;
    /**
     * Get a layer by name
     */
    getLayer(name: string): TileMapLayer | undefined;
    /**
     * Ensure a layer exists, creating it if it doesn't
     */
    ensureLayer(name: string, zIndex?: number): TileMapLayer;
    /**
     * Remove a layer by name
     */
    removeLayer(name: string): boolean;
    /**
     * Get all layer names in rendering order
     */
    getLayerNames(): string[];
    /**
     * Get all layers in rendering order
     */
    getLayers(): TileMapLayer[];
    /**
     * Set a tile at a specific position in a layer (convenience method)
     * Supports both Tile instances and tile IDs (for deferred loading)
     */
    setTile(x: number, y: number, layerName: string, tileSet: TileSet, tile: Tile | number | string | undefined, tint?: Color): void;
    /**
     * Set a tile by its ID (convenience method for deferred loading)
     */
    setTileById(x: number, y: number, layerName: string, tileSet: TileSet, tileId: number | string, tint?: Color): void;
    /**
     * Remove a tile at a specific position in a layer (convenience method)
     */
    removeTile(x: number, y: number, layerName: string): boolean;
    /**
     * Get tile data at a specific position in a layer (convenience method)
     */
    getTile(x: number, y: number, layerName: string): import("./TileMapLayer").TileData | undefined;
    /**
     * Clear all tiles from all layers
     */
    clear(): void;
    /**
     * Clear a specific layer
     */
    clearLayer(name: string): void;
    /**
     * Check if the tilemap is dirty and needs rebuilding
     */
    isDirty(): boolean;
    /**
     * Mark the tilemap as dirty (needs rebuild)
     */
    markDirty(): void;
    /**
     * Mark the tilemap as clean (rebuilt)
     */
    markClean(): void;
    /**
     * Sort layers by zIndex
     */
    private sortLayers;
    /**
     * Set the zIndex of a layer and re-sort
     */
    setLayerZIndex(name: string, zIndex: number): void;
    /**
     * Get the total number of tiles across all layers
     */
    getTotalTileCount(): number;
    /**
     * Get bounds of all tiles across all layers
     */
    getBounds(): {
        minX: number;
        minY: number;
        maxX: number;
        maxY: number;
    } | null;
    /**
     * Generate chunk key from coordinates using integer hashing
     * This avoids string allocation and provides faster lookups
     */
    private getChunkKey;
    /**
     * Calculate which chunk a tile belongs to
     */
    private getChunkCoords;
    /**
     * Get all chunks
     */
    getChunks(): Map<number, TileMapChunk>;
    /**
     * Clear all chunks
     */
    clearChunks(): void;
    /**
     * Build chunks from current layer data
     */
    buildChunks(device: GPUDevice): void;
    /**
     * Update world bounds for all chunks
     */
    updateChunkBounds(worldMatrix: Float32Array): void;
    /**
     * Get chunks that are visible within the view bounds, including adjacent chunks
     * This provides a natural padding buffer to prevent tile popping
     */
    getVisibleChunks(viewBounds: ChunkBounds): TileMapChunk[];
    /**
     * Sync pending tiles across all layers whose textures are now ready
     * This is called automatically by the tileset loading system when textures load
     * Returns the total number of tiles that were applied
     */
    syncPendingTiles(): number;
    /**
     * Get the total number of pending tiles waiting for textures to load
     */
    getTotalPendingTileCount(): number;
    /**
     * Get all unique tilesets used in this tilemap (including from pending tiles)
     */
    getAllTileSets(): Set<TileSet>;
}
//# sourceMappingURL=TileMap.d.ts.map