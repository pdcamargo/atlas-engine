import { TileSet } from "./TileSet";
import { Tile } from "./Tile";
import { Color } from "@atlas/core";
export interface TileMapObjectOptions {
    id?: string;
    x: number;
    y: number;
    width?: number;
    height?: number;
    tileSet?: TileSet;
    tile?: Tile | number | string;
    rotation?: number;
    visible?: boolean;
    tint?: Color;
    name?: string;
    type?: string;
    metadata?: Record<string, any>;
}
/**
 * TileMapObject represents a single object in an object layer
 * Unlike tiles, objects can be positioned at arbitrary floating-point coordinates
 * and can have custom dimensions independent of the tilemap's tile size
 */
export declare class TileMapObject {
    readonly id: string;
    x: number;
    y: number;
    width: number;
    height: number;
    tileSet?: TileSet;
    tile?: Tile | number | string;
    rotation: number;
    visible: boolean;
    tint: Color;
    name?: string;
    type?: string;
    metadata: Record<string, any>;
    private static nextId;
    constructor(options: TileMapObjectOptions);
    /**
     * Get the resolved tile instance (if tile is an ID, resolve it from tileset)
     */
    getResolvedTile(): Tile | undefined;
    /**
     * Check if this object has a visual representation (tile)
     */
    hasVisual(): boolean;
    /**
     * Clone this object
     */
    clone(): TileMapObject;
    /**
     * Get the bounding box of this object
     */
    getBounds(): {
        left: number;
        right: number;
        top: number;
        bottom: number;
    };
}
//# sourceMappingURL=TileMapObject.d.ts.map