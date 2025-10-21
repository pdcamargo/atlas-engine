import { Rect } from "@atlas/core";
/**
 * Represents a tile definition within a tileset
 * A tile is a reference to a specific region of a texture
 */
export class Tile {
    id;
    frame;
    metadata;
    constructor(id, frame, metadata) {
        this.id = id;
        this.frame = frame;
        this.metadata = metadata;
    }
    /**
     * Create a tile from pixel coordinates (not normalized)
     */
    static fromPixels(id, x, y, width, height, textureWidth, textureHeight, metadata) {
        const frame = new Rect(x / textureWidth, y / textureHeight, width / textureWidth, height / textureHeight);
        return new Tile(id, frame, metadata);
    }
}
