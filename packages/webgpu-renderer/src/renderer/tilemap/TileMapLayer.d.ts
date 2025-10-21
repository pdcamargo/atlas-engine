import { Tile } from "./Tile";
import { TileSet } from "./TileSet";
import { Color } from "@atlas/core";
export interface TileData {
    tileSet: TileSet;
    tile: Tile;
    tint?: Color;
}
export interface PendingTileData {
    x: number;
    y: number;
    tileSet: TileSet;
    tile: Tile | number | string;
    tint?: Color;
}
export interface LayerBounds {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
}
/**
 * TileMapLayer manages tiles in a single layer using sparse storage
 * Only tiles that exist are stored in memory
 */
export declare class TileMapLayer {
    readonly name: string;
    visible: boolean;
    tint: Color;
    zIndex: number;
    private tiles;
    private pendingTiles;
    private onDirtyCallback?;
    private animatedTiles;
    constructor(name: string, onDirtyCallback?: () => void);
    /**
     * Generate a key for tile position
     */
    private getKey;
    /**
     * Parse a key back to position
     */
    private parseKey;
    /**
     * Set a tile at a specific position
     * If the tileset texture is not ready or tile is undefined, the tile is queued for later application
     */
    setTile(x: number, y: number, tileSet: TileSet, tile: Tile | number | string | undefined, tint?: Color): void;
    /**
     * Set a tile by its ID (defers lookup until texture is loaded)
     * This is useful when tiles haven't been created yet from addTilesFromGrid
     */
    setTileById(x: number, y: number, tileSet: TileSet, tileId: number | string, tint?: Color): void;
    /**
     * Remove a tile at a specific position
     */
    removeTile(x: number, y: number): boolean;
    /**
     * Get tile data at a specific position
     */
    getTile(x: number, y: number): TileData | undefined;
    /**
     * Check if a tile exists at a position
     */
    hasTile(x: number, y: number): boolean;
    /**
     * Clear all tiles from this layer
     */
    clear(): void;
    /**
     * Get all tile positions and data
     */
    getAllTiles(): Array<{
        x: number;
        y: number;
        data: TileData;
    }>;
    /**
     * Get only animated tiles (for efficient animation updates)
     */
    getAnimatedTiles(): Array<{
        x: number;
        y: number;
        data: TileData;
    }>;
    /**
     * Get the bounds of all tiles in this layer
     */
    getBounds(): LayerBounds | null;
    /**
     * Get the number of tiles in this layer
     */
    getTileCount(): number;
    /**
     * Mark the parent tilemap as dirty
     */
    private markDirty;
    /**
     * Set layer tint color
     */
    setTint(color: Color): void;
    /**
     * Set layer visibility
     */
    setVisible(visible: boolean): void;
    /**
     * Sync pending tiles whose textures are now ready
     * Returns the number of tiles that were applied
     */
    syncPendingTiles(): number;
    /**
     * Get the number of pending tiles waiting for textures to load
     */
    getPendingTileCount(): number;
    /**
     * Get all unique tilesets used in this layer (including pending tiles)
     */
    getAllTileSets(): Set<TileSet>;
}
//# sourceMappingURL=TileMapLayer.d.ts.map