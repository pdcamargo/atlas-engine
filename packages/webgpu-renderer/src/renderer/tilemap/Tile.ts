import { Rect } from "@atlas/core";

/**
 * Represents a tile definition within a tileset
 * A tile is a reference to a specific region of a texture
 */
export class Tile {
  public readonly id: number | string;
  public readonly frame: Rect;
  public readonly metadata?: Record<string, any>;

  constructor(
    id: number | string,
    frame: Rect,
    metadata?: Record<string, any>
  ) {
    this.id = id;
    this.frame = frame;
    this.metadata = metadata;
  }

  /**
   * Create a tile from pixel coordinates (not normalized)
   */
  static fromPixels(
    id: number | string,
    x: number,
    y: number,
    width: number,
    height: number,
    textureWidth: number,
    textureHeight: number,
    metadata?: Record<string, any>
  ): Tile {
    const frame = new Rect(
      x / textureWidth,
      y / textureHeight,
      width / textureWidth,
      height / textureHeight
    );
    return new Tile(id, frame, metadata);
  }
}
