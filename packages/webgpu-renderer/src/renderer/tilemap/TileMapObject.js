import { Tile } from "./Tile";
import { Color } from "@atlas/core";
/**
 * TileMapObject represents a single object in an object layer
 * Unlike tiles, objects can be positioned at arbitrary floating-point coordinates
 * and can have custom dimensions independent of the tilemap's tile size
 */
export class TileMapObject {
    id;
    x;
    y;
    width;
    height;
    tileSet;
    tile;
    rotation;
    visible;
    tint;
    name;
    type;
    metadata;
    static nextId = 0;
    constructor(options) {
        this.id = options.id ?? `object_${TileMapObject.nextId++}`;
        this.x = options.x;
        this.y = options.y;
        this.width = options.width ?? 0;
        this.height = options.height ?? 0;
        this.tileSet = options.tileSet;
        this.tile = options.tile;
        this.rotation = options.rotation ?? 0;
        this.visible = options.visible ?? true;
        this.tint = options.tint ?? Color.white();
        this.name = options.name;
        this.type = options.type;
        this.metadata = options.metadata ?? {};
    }
    /**
     * Get the resolved tile instance (if tile is an ID, resolve it from tileset)
     */
    getResolvedTile() {
        if (!this.tile || !this.tileSet) {
            return undefined;
        }
        if (this.tile instanceof Tile) {
            return this.tile;
        }
        // Try to resolve tile ID
        return this.tileSet.getTile(this.tile);
    }
    /**
     * Check if this object has a visual representation (tile)
     */
    hasVisual() {
        return this.getResolvedTile() !== undefined;
    }
    /**
     * Clone this object
     */
    clone() {
        return new TileMapObject({
            id: `${this.id}_clone_${TileMapObject.nextId++}`,
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height,
            tileSet: this.tileSet,
            tile: this.tile,
            rotation: this.rotation,
            visible: this.visible,
            tint: this.tint.clone(),
            name: this.name,
            type: this.type,
            metadata: { ...this.metadata },
        });
    }
    /**
     * Get the bounding box of this object
     */
    getBounds() {
        return {
            left: this.x,
            right: this.x + this.width,
            top: this.y,
            bottom: this.y + this.height,
        };
    }
}
