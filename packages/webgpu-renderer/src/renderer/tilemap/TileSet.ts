import { Texture } from "../Texture";
import { Tile } from "./Tile";
import { Rect, Handle, ImageAsset } from "@atlas/core";

export interface TileSetOptions {
  spacing?: number; // Spacing between tiles in pixels
  margin?: number; // Margin around the tileset in pixels
}

interface PendingTileGrid {
  columns: number;
  rows: number;
  startId: number;
}

/**
 * TileSet manages a texture and its tile definitions
 * Multiple tiles can reference different regions of the same texture
 * Supports both pre-loaded Textures and lazy-loaded Handles
 */
export class TileSet {
  public texture: Texture | Handle<ImageAsset>;
  public readonly tileWidth: number;
  public readonly tileHeight: number;
  public readonly id: string;

  private tiles: Map<number | string, Tile> = new Map();
  private options: TileSetOptions;
  private pendingTileGrids: PendingTileGrid[] = [];

  constructor(
    texture: Texture | Handle<ImageAsset>,
    tileWidth: number,
    tileHeight: number,
    options: TileSetOptions = {}
  ) {
    this.texture = texture;
    this.tileWidth = tileWidth;
    this.tileHeight = tileHeight;
    // Use texture ID if available, otherwise use handle ID
    this.id = texture instanceof Texture ? texture.id : texture.id.toString();
    this.options = {
      spacing: options.spacing ?? 0,
      margin: options.margin ?? 0,
    };
  }

  /**
   * Get the loaded Texture (returns null if texture is a Handle or not loaded)
   */
  getTexture(): Texture | null {
    return this.texture instanceof Texture ? this.texture : null;
  }

  /**
   * Get the Handle if texture is still loading (returns null if already a Texture)
   */
  getHandle(): Handle<ImageAsset> | null {
    return !(this.texture instanceof Texture)
      ? (this.texture as Handle<ImageAsset>)
      : null;
  }

  /**
   * Check if the texture is ready (loaded and available)
   */
  isTextureReady(): boolean {
    return this.texture instanceof Texture;
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
    const texture = this.getTexture();
    if (!texture) {
      throw new Error("Cannot add tile from pixels: texture not loaded yet");
    }
    const tile = Tile.fromPixels(
      id,
      x,
      y,
      width,
      height,
      texture.width,
      texture.height,
      metadata
    );
    this.tiles.set(id, tile);
    return tile;
  }

  /**
   * Auto-generate tiles from a grid layout
   * Tiles are numbered sequentially from left to right, top to bottom
   * If texture is not ready, the grid creation is deferred until texture loads
   * @param columns Number of columns in the grid
   * @param rows Number of rows in the grid
   * @param startId Starting ID for tiles (default: 0)
   */
  addTilesFromGrid(columns: number, rows: number, startId: number = 0): Tile[] {
    // Check if texture is ready
    if (!this.isTextureReady()) {
      // Defer grid creation until texture loads
      this.pendingTileGrids.push({ columns, rows, startId });
      return [];
    }

    // Texture is ready, create tiles immediately
    return this.createTileGrid(columns, rows, startId);
  }

  /**
   * Internal method to create tiles from a grid
   */
  private createTileGrid(columns: number, rows: number, startId: number): Tile[] {
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

  /**
   * Sync pending tile grids that were deferred until texture loads
   * This is called automatically by the tileset loading system
   * Returns the number of grids that were created
   */
  syncPendingTileGrids(): number {
    if (this.pendingTileGrids.length === 0 || !this.isTextureReady()) {
      return 0;
    }

    let createdCount = 0;
    for (const grid of this.pendingTileGrids) {
      this.createTileGrid(grid.columns, grid.rows, grid.startId);
      createdCount++;
    }

    // Clear pending grids
    this.pendingTileGrids = [];

    return createdCount;
  }

  /**
   * Get the number of pending tile grids waiting for texture to load
   */
  getPendingTileGridCount(): number {
    return this.pendingTileGrids.length;
  }
}
