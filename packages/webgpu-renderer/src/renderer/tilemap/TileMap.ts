import { SceneNode } from "../SceneNode";
import { TileMapLayer } from "./TileMapLayer";
import { TileSet } from "./TileSet";
import { Tile } from "./Tile";
import { Color } from "@atlas/core";

export interface TileMapOptions {
  tileWidth: number;
  tileHeight: number;
  id?: string;
}

/**
 * TileMap is a scene node that manages multiple layers of tiles
 * It uses a dirty flag system to optimize rendering and batch updates
 */
export class TileMap extends SceneNode {
  public readonly tileWidth: number;
  public readonly tileHeight: number;

  private layers: Map<string, TileMapLayer> = new Map();
  private layerOrder: string[] = []; // Maintain layer rendering order
  private dirty: boolean = true;

  constructor(options: TileMapOptions) {
    super(options.id);
    this.tileWidth = options.tileWidth;
    this.tileHeight = options.tileHeight;
  }

  /**
   * Add a new layer to the tilemap
   */
  addLayer(name: string, zIndex?: number): TileMapLayer {
    if (this.layers.has(name)) {
      throw new Error(`Layer "${name}" already exists`);
    }

    const layer = new TileMapLayer(name, () => this.markDirty());
    if (zIndex !== undefined) {
      layer.zIndex = zIndex;
    }
    this.layers.set(name, layer);
    this.layerOrder.push(name);
    this.sortLayers();
    this.markDirty();
    return layer;
  }

  /**
   * Get a layer by name
   */
  getLayer(name: string): TileMapLayer | undefined {
    return this.layers.get(name);
  }

  /**
   * Ensure a layer exists, creating it if it doesn't
   */
  ensureLayer(name: string, zIndex?: number): TileMapLayer {
    const existing = this.layers.get(name);
    if (existing) {
      return existing;
    }
    return this.addLayer(name, zIndex);
  }

  /**
   * Remove a layer by name
   */
  removeLayer(name: string): boolean {
    const layer = this.layers.get(name);
    if (!layer) {
      return false;
    }

    this.layers.delete(name);
    const index = this.layerOrder.indexOf(name);
    if (index !== -1) {
      this.layerOrder.splice(index, 1);
    }
    this.markDirty();
    return true;
  }

  /**
   * Get all layer names in rendering order
   */
  getLayerNames(): string[] {
    return [...this.layerOrder];
  }

  /**
   * Get all layers in rendering order
   */
  getLayers(): TileMapLayer[] {
    return this.layerOrder.map((name) => this.layers.get(name)!);
  }

  /**
   * Set a tile at a specific position in a layer (convenience method)
   */
  setTile(
    x: number,
    y: number,
    layerName: string,
    tileSet: TileSet,
    tile: Tile,
    tint?: Color
  ): void {
    const layer = this.ensureLayer(layerName);
    layer.setTile(x, y, tileSet, tile, tint);
  }

  /**
   * Remove a tile at a specific position in a layer (convenience method)
   */
  removeTile(x: number, y: number, layerName: string): boolean {
    const layer = this.layers.get(layerName);
    if (!layer) {
      return false;
    }
    return layer.removeTile(x, y);
  }

  /**
   * Get tile data at a specific position in a layer (convenience method)
   */
  getTile(x: number, y: number, layerName: string) {
    const layer = this.layers.get(layerName);
    return layer?.getTile(x, y);
  }

  /**
   * Clear all tiles from all layers
   */
  clear(): void {
    for (const layer of this.layers.values()) {
      layer.clear();
    }
    this.markDirty();
  }

  /**
   * Clear a specific layer
   */
  clearLayer(name: string): void {
    const layer = this.layers.get(name);
    if (layer) {
      layer.clear();
    }
  }

  /**
   * Check if the tilemap is dirty and needs rebuilding
   */
  isDirty(): boolean {
    return this.dirty;
  }

  /**
   * Mark the tilemap as dirty (needs rebuild)
   */
  markDirty(): void {
    this.dirty = true;
  }

  /**
   * Mark the tilemap as clean (rebuilt)
   */
  markClean(): void {
    this.dirty = false;
  }

  /**
   * Sort layers by zIndex
   */
  private sortLayers(): void {
    this.layerOrder.sort((a, b) => {
      const layerA = this.layers.get(a)!;
      const layerB = this.layers.get(b)!;
      return layerA.zIndex - layerB.zIndex;
    });
  }

  /**
   * Set the zIndex of a layer and re-sort
   */
  setLayerZIndex(name: string, zIndex: number): void {
    const layer = this.layers.get(name);
    if (layer) {
      layer.zIndex = zIndex;
      this.sortLayers();
      this.markDirty();
    }
  }

  /**
   * Get the total number of tiles across all layers
   */
  getTotalTileCount(): number {
    let count = 0;
    for (const layer of this.layers.values()) {
      count += layer.getTileCount();
    }
    return count;
  }

  /**
   * Get bounds of all tiles across all layers
   */
  getBounds(): {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
  } | null {
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    let hasAnyTiles = false;

    for (const layer of this.layers.values()) {
      const bounds = layer.getBounds();
      if (bounds) {
        hasAnyTiles = true;
        minX = Math.min(minX, bounds.minX);
        minY = Math.min(minY, bounds.minY);
        maxX = Math.max(maxX, bounds.maxX);
        maxY = Math.max(maxY, bounds.maxY);
      }
    }

    return hasAnyTiles ? { minX, minY, maxX, maxY } : null;
  }
}
