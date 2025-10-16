import { Tile } from "./Tile";
import { TileSet } from "./TileSet";
import { Color } from "@atlas/core";

export interface TileData {
  tileSet: TileSet;
  tile: Tile;
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
  private onDirtyCallback?: () => void;

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
   */
  setTile(
    x: number,
    y: number,
    tileSet: TileSet,
    tile: Tile,
    tint?: Color
  ): void {
    const key = this.getKey(x, y);
    this.tiles.set(key, { tileSet, tile, tint });
    this.markDirty();
  }

  /**
   * Remove a tile at a specific position
   */
  removeTile(x: number, y: number): boolean {
    const key = this.getKey(x, y);
    const removed = this.tiles.delete(key);
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
}
