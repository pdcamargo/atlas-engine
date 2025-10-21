import { Texture } from "../Texture";
import { Tile } from "./Tile";
import { AnimatedTile, AnimatedTileConfig } from "./AnimatedTile";
import { Rect, Handle, ImageAsset } from "@atlas/core";
export interface TileSetOptions {
    spacing?: number;
    margin?: number;
}
/**
 * TileSet manages a texture and its tile definitions
 * Multiple tiles can reference different regions of the same texture
 * Supports both pre-loaded Textures and lazy-loaded Handles
 */
export declare class TileSet {
    texture: Texture | Handle<ImageAsset>;
    readonly tileWidth: number;
    readonly tileHeight: number;
    readonly id: string;
    private tiles;
    private options;
    private pendingTileGrids;
    private pendingAnimatedTiles;
    constructor(texture: Texture | Handle<ImageAsset>, tileWidth: number, tileHeight: number, options?: TileSetOptions);
    /**
     * Get the loaded Texture (returns null if texture is a Handle or not loaded)
     */
    getTexture(): Texture | null;
    /**
     * Get the Handle if texture is still loading (returns null if already a Texture)
     */
    getHandle(): Handle<ImageAsset> | null;
    /**
     * Check if the texture is ready (loaded and available)
     */
    isTextureReady(): boolean;
    /**
     * Add a tile manually with a specific frame
     */
    addTile(id: number | string, frame: Rect, metadata?: Record<string, any>): Tile;
    /**
     * Add a tile from pixel coordinates
     */
    addTileFromPixels(id: number | string, x: number, y: number, width: number, height: number, metadata?: Record<string, any>): Tile;
    /**
     * Add an animated tile with custom animation frames
     * If texture is not ready, the tile creation is deferred until texture loads
     */
    addAnimatedTile(config: AnimatedTileConfig): AnimatedTile | null;
    /**
     * Add animated tiles from a grid layout (e.g., for water tiles, torch animations)
     * Creates an animated tile where each frame comes from sequential grid positions
     * If texture is not ready, the tile creation is deferred until texture loads
     * @param id The tile ID for the animated tile
     * @param startCol Starting column in the grid
     * @param startRow Starting row in the grid
     * @param frameCount Number of frames in the animation
     * @param frameDuration Duration of each frame in milliseconds (default: 100)
     * @param horizontal If true, frames go left-to-right; if false, top-to-bottom (default: true)
     * @param loop Whether the animation should loop (default: true)
     * @param speed Speed multiplier (default: 1.0)
     * @param metadata Optional metadata
     */
    addAnimatedTileFromGrid(id: number | string, startCol: number, startRow: number, frameCount: number, frameDuration?: number, horizontal?: boolean, loop?: boolean, speed?: number, metadata?: Record<string, any>): AnimatedTile | null;
    /**
     * Auto-generate tiles from a grid layout
     * Tiles are numbered sequentially from left to right, top to bottom
     * If texture is not ready, the grid creation is deferred until texture loads
     * @param columns Number of columns in the grid
     * @param rows Number of rows in the grid
     * @param startId Starting ID for tiles (default: 0)
     */
    addTilesFromGrid(columns: number, rows: number, startId?: number): Tile[];
    /**
     * Internal method to create tiles from a grid
     */
    private createTileGrid;
    /**
     * Get a tile by its ID
     */
    getTile(id: number | string): Tile | undefined;
    /**
     * Check if a tile exists
     */
    hasTile(id: number | string): boolean;
    /**
     * Remove a tile by its ID
     */
    removeTile(id: number | string): boolean;
    /**
     * Get all tile IDs
     */
    getTileIds(): (number | string)[];
    /**
     * Get all tiles
     */
    getAllTiles(): Tile[];
    /**
     * Get the number of tiles in this tileset
     */
    getTileCount(): number;
    /**
     * Clear all tiles from this tileset
     */
    clear(): void;
    /**
     * Sync pending tile grids that were deferred until texture loads
     * This is called automatically by the tileset loading system
     * Returns the number of grids that were created
     */
    syncPendingTileGrids(): number;
    /**
     * Get the number of pending tile grids waiting for texture to load
     */
    getPendingTileGridCount(): number;
}
//# sourceMappingURL=TileSet.d.ts.map