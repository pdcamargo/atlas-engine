import { Texture } from "../Texture";
import { Tile } from "./Tile";
import { Rect } from "@atlas/core";

export interface TileSetOptions {
  spacing?: number; // Spacing between tiles in pixels
  margin?: number; // Margin around the tileset in pixels
}

/**
 * TileSet manages a texture and its tile definitions
 * Multiple tiles can reference different regions of the same texture
 */
export class TileSet {
  public readonly texture: Texture;
  public readonly tileWidth: number;
  public readonly tileHeight: number;
  public readonly id: string;

  private tiles: Map<number | string, Tile> = new Map();
  private options: TileSetOptions;

  constructor(
    texture: Texture,
    tileWidth: number,
    tileHeight: number,
    options: TileSetOptions = {}
  ) {
    this.texture = texture;
    this.tileWidth = tileWidth;
    this.tileHeight = tileHeight;
    this.id = texture.id;
    this.options = {
      spacing: options.spacing ?? 0,
      margin: options.margin ?? 0,
    };
  }

  /**
   * Add a tile manually with a specific frame
   */
  addTile(
    id: number | string,
    frame: Rect,
    metadata?: Record<string, any>
  ): Tile {
    const tile = new Tile(id, frame, metadata);
    this.tiles.set(id, tile);
    return tile;
  }

  /**
   * Add a tile from pixel coordinates
   */
  addTileFromPixels(
    id: number | string,
    x: number,
    y: number,
    width: number,
    height: number,
    metadata?: Record<string, any>
  ): Tile {
    const tile = Tile.fromPixels(
      id,
      x,
      y,
      width,
      height,
      this.texture.width,
      this.texture.height,
      metadata
    );
    this.tiles.set(id, tile);
    return tile;
  }

  /**
   * Auto-generate tiles from a grid layout
   * Tiles are numbered sequentially from left to right, top to bottom
   * @param columns Number of columns in the grid
   * @param rows Number of rows in the grid
   * @param startId Starting ID for tiles (default: 0)
   */
  addTilesFromGrid(columns: number, rows: number, startId: number = 0): Tile[] {
    const tiles: Tile[] = [];
    const { spacing, margin } = this.options;

    let id = startId;
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < columns; col++) {
        const x = margin! + col * (this.tileWidth + spacing!);
        const y = margin! + row * (this.tileHeight + spacing!);

        const tile = this.addTileFromPixels(
          id,
          x,
          y,
          this.tileWidth,
          this.tileHeight
        );
        tiles.push(tile);
        id++;
      }
    }

    return tiles;
  }

  /**
   * Get a tile by its ID
   */
  getTile(id: number | string): Tile | undefined {
    return this.tiles.get(id);
  }

  /**
   * Check if a tile exists
   */
  hasTile(id: number | string): boolean {
    return this.tiles.has(id);
  }

  /**
   * Remove a tile by its ID
   */
  removeTile(id: number | string): boolean {
    return this.tiles.delete(id);
  }

  /**
   * Get all tile IDs
   */
  getTileIds(): (number | string)[] {
    return Array.from(this.tiles.keys());
  }

  /**
   * Get all tiles
   */
  getAllTiles(): Tile[] {
    return Array.from(this.tiles.values());
  }

  /**
   * Get the number of tiles in this tileset
   */
  getTileCount(): number {
    return this.tiles.size;
  }

  /**
   * Clear all tiles from this tileset
   */
  clear(): void {
    this.tiles.clear();
  }
}
