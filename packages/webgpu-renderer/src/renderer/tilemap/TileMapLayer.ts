import { Tile } from "./Tile";
import { AnimatedTile } from "./AnimatedTile";
import { TileSet } from "./TileSet";
import { Color } from "@atlas/core";

export interface TileData {
  tileSet: TileSet;
  tile: Tile;
  tint?: Color;
}

export interface PendingTileData {
  x: number;
  y: number;
  tileSet: TileSet;
  tile: Tile | number | string; // Can be a Tile instance or a tile ID (for deferred lookup)
  tint?: Color;
}

export interface LayerBounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

/**
 * TileMapLayer manages tiles in a single layer using sparse storage
 * Only tiles that exist are stored in memory
 */
export class TileMapLayer {
  public readonly name: string;
  public visible: boolean = true;
  public tint: Color = Color.white();
  public zIndex: number = 0; // For layer ordering

  private tiles: Map<string, TileData> = new Map();
  private pendingTiles: PendingTileData[] = [];
  private onDirtyCallback?: () => void;
  private animatedTiles: Map<string, TileData> = new Map(); // Separate tracking for animated tiles

  constructor(name: string, onDirtyCallback?: () => void) {
    this.name = name;
    this.onDirtyCallback = onDirtyCallback;
  }

  /**
   * Generate a key for tile position
   */
  private getKey(x: number, y: number): string {
    return `${x},${y}`;
  }

  /**
   * Parse a key back to position
   */
  private parseKey(key: string): { x: number; y: number } {
    const [x, y] = key.split(",").map(Number);
    return { x, y };
  }

  /**
   * Set a tile at a specific position
   * If the tileset texture is not ready or tile is undefined, the tile is queued for later application
   */
  setTile(
    x: number,
    y: number,
    tileSet: TileSet,
    tile: Tile | number | string | undefined,
    tint?: Color
  ): void {
    // If tile is undefined, warn and skip
    if (tile === undefined) {
      console.warn(
        `[TileMapLayer] Tile is undefined for position (${x}, ${y}). This usually means the tileset texture hasn't loaded yet and tiles haven't been created. Consider using setTileById() instead.`
      );
      return;
    }

    // If tile is an ID (number or string), defer until tileset is ready
    if (typeof tile === "number" || typeof tile === "string") {
      this.setTileById(x, y, tileSet, tile, tint);
      return;
    }

    // Check if texture is ready
    if (!tileSet.isTextureReady()) {
      // Queue for later application
      this.pendingTiles.push({ x, y, tileSet, tile, tint });
      return;
    }

    // Texture is ready, apply immediately
    const key = this.getKey(x, y);
    const tileData = { tileSet, tile, tint };
    this.tiles.set(key, tileData);

    // Track animated tiles separately for efficient updates
    if (tile instanceof AnimatedTile) {
      this.animatedTiles.set(key, tileData);
    }

    this.markDirty();
  }

  /**
   * Set a tile by its ID (defers lookup until texture is loaded)
   * This is useful when tiles haven't been created yet from addTilesFromGrid
   */
  setTileById(
    x: number,
    y: number,
    tileSet: TileSet,
    tileId: number | string,
    tint?: Color
  ): void {
    // Try to get the tile now
    const tile = tileSet.getTile(tileId);

    if (tile) {
      // Tile exists, use normal setTile
      this.setTile(x, y, tileSet, tile, tint);
    } else {
      // Tile doesn't exist yet (likely deferred), queue with ID
      this.pendingTiles.push({ x, y, tileSet, tile: tileId, tint });
    }
  }

  /**
   * Remove a tile at a specific position
   */
  removeTile(x: number, y: number): boolean {
    const key = this.getKey(x, y);
    const removed = this.tiles.delete(key);
    // Also remove from animated tiles tracking if present
    this.animatedTiles.delete(key);
    if (removed) {
      this.markDirty();
    }
    return removed;
  }

  /**
   * Get tile data at a specific position
   */
  getTile(x: number, y: number): TileData | undefined {
    const key = this.getKey(x, y);
    return this.tiles.get(key);
  }

  /**
   * Check if a tile exists at a position
   */
  hasTile(x: number, y: number): boolean {
    const key = this.getKey(x, y);
    return this.tiles.has(key);
  }

  /**
   * Clear all tiles from this layer
   */
  clear(): void {
    if (this.tiles.size > 0) {
      this.tiles.clear();
      this.animatedTiles.clear();
      this.markDirty();
    }
  }

  /**
   * Get all tile positions and data
   */
  getAllTiles(): Array<{ x: number; y: number; data: TileData }> {
    const result: Array<{ x: number; y: number; data: TileData }> = [];
    for (const [key, data] of this.tiles) {
      const { x, y } = this.parseKey(key);
      result.push({ x, y, data });
    }
    return result;
  }

  /**
   * Get only animated tiles (for efficient animation updates)
   */
  getAnimatedTiles(): Array<{ x: number; y: number; data: TileData }> {
    const result: Array<{ x: number; y: number; data: TileData }> = [];
    for (const [key, data] of this.animatedTiles) {
      const { x, y } = this.parseKey(key);
      result.push({ x, y, data });
    }
    return result;
  }

  /**
   * Get the bounds of all tiles in this layer
   */
  getBounds(): LayerBounds | null {
    if (this.tiles.size === 0) {
      return null;
    }

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    for (const key of this.tiles.keys()) {
      const { x, y } = this.parseKey(key);
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }

    return { minX, minY, maxX, maxY };
  }

  /**
   * Get the number of tiles in this layer
   */
  getTileCount(): number {
    return this.tiles.size;
  }

  /**
   * Mark the parent tilemap as dirty
   */
  private markDirty(): void {
    if (this.onDirtyCallback) {
      this.onDirtyCallback();
    }
  }

  /**
   * Set layer tint color
   */
  setTint(color: Color): void {
    this.tint.copyFrom(color);
    this.markDirty();
  }

  /**
   * Set layer visibility
   */
  setVisible(visible: boolean): void {
    if (this.visible !== visible) {
      this.visible = visible;
      this.markDirty();
    }
  }

  /**
   * Sync pending tiles whose textures are now ready
   * Returns the number of tiles that were applied
   */
  syncPendingTiles(): number {
    if (this.pendingTiles.length === 0) {
      return 0;
    }

    let appliedCount = 0;
    const stillPending: PendingTileData[] = [];

    for (const pendingTile of this.pendingTiles) {
      if (pendingTile.tileSet.isTextureReady()) {
        // Resolve tile if it's an ID
        let tile: Tile | undefined;
        if (typeof pendingTile.tile === "number" || typeof pendingTile.tile === "string") {
          tile = pendingTile.tileSet.getTile(pendingTile.tile);
          if (!tile) {
            // Tile still doesn't exist, keep pending
            stillPending.push(pendingTile);
            continue;
          }
        } else {
          tile = pendingTile.tile;
        }

        // Texture is ready and tile is resolved, apply the tile
        const key = this.getKey(pendingTile.x, pendingTile.y);
        const tileData = {
          tileSet: pendingTile.tileSet,
          tile: tile,
          tint: pendingTile.tint,
        };
        this.tiles.set(key, tileData);

        // Track animated tiles separately for efficient updates
        if (tile instanceof AnimatedTile) {
          this.animatedTiles.set(key, tileData);
        }

        appliedCount++;
      } else {
        // Still not ready, keep in pending queue
        stillPending.push(pendingTile);
      }
    }

    // Update pending tiles array
    this.pendingTiles = stillPending;

    // Mark dirty if we applied any tiles
    if (appliedCount > 0) {
      this.markDirty();
    }

    return appliedCount;
  }

  /**
   * Get the number of pending tiles waiting for textures to load
   */
  getPendingTileCount(): number {
    return this.pendingTiles.length;
  }

  /**
   * Get all unique tilesets used in this layer (including pending tiles)
   */
  getAllTileSets(): Set<TileSet> {
    const tileSets = new Set<TileSet>();

    // Add tilesets from placed tiles
    for (const data of this.tiles.values()) {
      tileSets.add(data.tileSet);
    }

    // Add tilesets from pending tiles
    for (const pendingTile of this.pendingTiles) {
      tileSets.add(pendingTile.tileSet);
    }

    return tileSets;
  }
}
