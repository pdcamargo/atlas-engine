import { Rect } from "@atlas/core";
/**
 * Represents a tile definition within a tileset
 * A tile is a reference to a specific region of a texture
 */
export declare class Tile {
    readonly id: number | string;
    frame: Rect;
    readonly metadata?: Record<string, any>;
    constructor(id: number | string, frame: Rect, metadata?: Record<string, any>);
    /**
     * Create a tile from pixel coordinates (not normalized)
     */
    static fromPixels(id: number | string, x: number, y: number, width: number, height: number, textureWidth: number, textureHeight: number, metadata?: Record<string, any>): Tile;
}
//# sourceMappingURL=Tile.d.ts.map