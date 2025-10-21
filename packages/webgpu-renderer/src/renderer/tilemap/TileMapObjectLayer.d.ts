import { TileMapObject, TileMapObjectOptions } from "./TileMapObject";
import { Color } from "@atlas/core";
import { TileSet } from "./TileSet";
export interface ObjectLayerBounds {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
}
/**
 * TileMapObjectLayer manages a collection of objects at arbitrary positions
 * Unlike tile layers, object layers store objects with floating-point coordinates
 * and custom dimensions
 */
export declare class TileMapObjectLayer {
    readonly name: string;
    visible: boolean;
    tint: Color;
    zIndex: number;
    private objects;
    private onDirtyCallback?;
    constructor(name: string, onDirtyCallback?: () => void);
    /**
     * Add an object to this layer
     */
    addObject(options: TileMapObjectOptions): TileMapObject;
    /**
     * Add an existing object instance to this layer
     */
    addObjectInstance(object: TileMapObject): void;
    /**
     * Remove an object by ID
     */
    removeObject(id: string): boolean;
    /**
     * Get an object by ID
     */
    getObject(id: string): TileMapObject | undefined;
    /**
     * Check if an object exists
     */
    hasObject(id: string): boolean;
    /**
     * Get all objects
     */
    getAllObjects(): TileMapObject[];
    /**
     * Get objects within a bounding box
     */
    getObjectsInBounds(left: number, right: number, top: number, bottom: number): TileMapObject[];
    /**
     * Get objects at a specific point
     */
    getObjectsAtPoint(x: number, y: number): TileMapObject[];
    /**
     * Get objects by type
     */
    getObjectsByType(type: string): TileMapObject[];
    /**
     * Get objects by name
     */
    getObjectsByName(name: string): TileMapObject[];
    /**
     * Clear all objects from this layer
     */
    clear(): void;
    /**
     * Get the number of objects in this layer
     */
    getObjectCount(): number;
    /**
     * Get the bounds of all objects in this layer
     */
    getBounds(): ObjectLayerBounds | null;
    /**
     * Set layer tint color
     */
    setTint(color: Color): void;
    /**
     * Set layer visibility
     */
    setVisible(visible: boolean): void;
    /**
     * Mark the parent tilemap as dirty
     */
    private markDirty;
    /**
     * Get all unique tilesets used in this layer
     */
    getAllTileSets(): Set<TileSet>;
    /**
     * Find objects by custom metadata property
     */
    findObjectsByProperty(key: string, value?: any): TileMapObject[];
}
//# sourceMappingURL=TileMapObjectLayer.d.ts.map