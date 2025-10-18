import { Texture } from "../Texture";
import { Tile } from "./Tile";
import { AnimatedTile, TileAnimationFrame, AnimatedTileConfig } from "./AnimatedTile";
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

interface PendingAnimatedTile {
  config: AnimatedTileConfig;
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
  private pendingAnimatedTiles: PendingAnimatedTile[] = [];

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
   * Add an animated tile with custom animation frames
   * If texture is not ready, the tile creation is deferred until texture loads
   */
  addAnimatedTile(config: AnimatedTileConfig): AnimatedTile | null {
    // Check if texture is ready
    if (!this.isTextureReady()) {
      // Defer animated tile creation until texture loads
      this.pendingAnimatedTiles.push({ config });
      return null;
    }

    // Texture is ready, create animated tile immediately
    const animatedTile = new AnimatedTile(config);
    this.tiles.set(config.id, animatedTile);
    return animatedTile;
  }

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
  addAnimatedTileFromGrid(
    id: number | string,
    startCol: number,
    startRow: number,
    frameCount: number,
    frameDuration: number = 100,
    horizontal: boolean = true,
    loop: boolean = true,
    speed: number = 1.0,
    metadata?: Record<string, any>
  ): AnimatedTile | null {
    const texture = this.getTexture();
    if (!texture) {
      // Defer creation by storing the config
      const frames: TileAnimationFrame[] = [];
      // We can't create frames yet without texture dimensions, so defer
      const config: AnimatedTileConfig = {
        id,
        frames, // Will be filled when texture loads
        loop,
        speed,
        metadata: {
          ...metadata,
          // Store grid info for deferred creation
          _gridInfo: { startCol, startRow, frameCount, frameDuration, horizontal }
        }
      };
      this.pendingAnimatedTiles.push({ config });
      return null;
    }

    // Texture is ready, create frames from grid
    const frames: TileAnimationFrame[] = [];
    const { spacing, margin } = this.options;

    for (let i = 0; i < frameCount; i++) {
      const col = horizontal ? startCol + i : startCol;
      const row = horizontal ? startRow : startRow + i;

      const x = margin! + col * (this.tileWidth + spacing!);
      const y = margin! + row * (this.tileHeight + spacing!);

      const frame = TileAnimationFrame.fromPixels(
        x,
        y,
        this.tileWidth,
        this.tileHeight,
        texture.width,
        texture.height,
        frameDuration
      );
      frames.push(frame);
    }

    const config: AnimatedTileConfig = {
      id,
      frames,
      loop,
      speed,
      metadata
    };

    const animatedTile = new AnimatedTile(config);
    this.tiles.set(id, animatedTile);
    return animatedTile;
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
    if (!this.isTextureReady()) {
      return 0;
    }

    let createdCount = 0;

    // Sync regular tile grids
    if (this.pendingTileGrids.length > 0) {
      for (const grid of this.pendingTileGrids) {
        this.createTileGrid(grid.columns, grid.rows, grid.startId);
        createdCount++;
      }
      this.pendingTileGrids = [];
    }

    // Sync animated tiles
    if (this.pendingAnimatedTiles.length > 0) {
      const texture = this.getTexture()!;
      for (const { config } of this.pendingAnimatedTiles) {
        // Check if this was created from grid (has _gridInfo metadata)
        const gridInfo = config.metadata?._gridInfo;
        if (gridInfo) {
          // Recreate from grid with proper texture dimensions
          const frames: TileAnimationFrame[] = [];
          const { spacing, margin } = this.options;
          const { startCol, startRow, frameCount, frameDuration, horizontal } = gridInfo;

          for (let i = 0; i < frameCount; i++) {
            const col = horizontal ? startCol + i : startCol;
            const row = horizontal ? startRow : startRow + i;

            const x = margin! + col * (this.tileWidth + spacing!);
            const y = margin! + row * (this.tileHeight + spacing!);

            const frame = TileAnimationFrame.fromPixels(
              x,
              y,
              this.tileWidth,
              this.tileHeight,
              texture.width,
              texture.height,
              frameDuration
            );
            frames.push(frame);
          }

          // Remove _gridInfo from metadata
          const { _gridInfo, ...cleanMetadata } = config.metadata || {};
          config.frames = frames;
          config.metadata = Object.keys(cleanMetadata).length > 0 ? cleanMetadata : undefined;
        }

        // Create the animated tile
        const animatedTile = new AnimatedTile(config);
        this.tiles.set(config.id, animatedTile);
        createdCount++;
      }
      this.pendingAnimatedTiles = [];
    }

    return createdCount;
  }

  /**
   * Get the number of pending tile grids waiting for texture to load
   */
  getPendingTileGridCount(): number {
    return this.pendingTileGrids.length;
  }
}
