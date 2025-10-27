import { SceneNode } from "../SceneNode";
import { TileMapLayer } from "./TileMapLayer";
import { TileSet } from "./TileSet";
import { Tile } from "./Tile";
import { Color } from "@atlas/core";
import { TileMapChunk, ChunkBounds } from "./TileMapChunk";
import { Material } from "../../materials/Material";
import { DEFAULT_SPRITE_MATERIAL } from "../../materials/SpriteMaterial";
import { PixelsPerUnit } from "../../ecs/resources/pixels-per-unit";

export interface TileMapOptions {
  tileWidth: number; // Tile width in pixels (will be converted to world units)
  tileHeight: number; // Tile height in pixels (will be converted to world units)
  chunkSize?: number;
  id?: string;
}

/**
 * TileMap is a scene node that manages multiple layers of tiles
 * It uses a dirty flag system to optimize rendering and batch updates
 *
 * Coordinate System:
 * - tileWidth/tileHeight are specified in PIXELS and automatically converted to world units
 * - Uses the global PixelsPerUnit setting (default: 100 pixels = 1 world unit)
 * - Must match Sprite dimensions for consistent scaling
 *
 * Usage:
 * ```typescript
 * // Set global PPU first (before creating any sprites or tilemaps)
 * PixelsPerUnit.setGlobal(16); // 16 pixels = 1 world unit
 *
 * // Create tilemap with 16x16 pixel tiles (becomes 1x1 world units)
 * const tilemap = new TileMap({ tileWidth: 16, tileHeight: 16 });
 *
 * // Create sprite with same size - they will match!
 * const sprite = new Sprite(texture, 16, 16); // Also 1x1 world units
 * ```
 */
export class TileMap extends SceneNode {
  public readonly tileWidth: number;
  public readonly tileHeight: number;
  public readonly chunkSize: number;
  public material: Material = DEFAULT_SPRITE_MATERIAL; // Material for tilemap rendering

  private layers: Map<string, TileMapLayer> = new Map();
  private layerOrder: string[] = []; // Maintain layer rendering order
  private chunks: Map<number, TileMapChunk> = new Map(); // key: integer hash of (chunkX,chunkY)
  private dirty: boolean = true;
  private isProgressiveLoading: boolean = false; // Track if we're in progressive loading mode

  constructor(options: TileMapOptions) {
    super(options.id);

    // Convert pixel dimensions to world units using global PixelsPerUnit
    this.tileWidth = PixelsPerUnit.toWorldUnits(options.tileWidth);
    this.tileHeight = PixelsPerUnit.toWorldUnits(options.tileHeight);
    this.chunkSize = options.chunkSize ?? 10; // Default 10x10 tiles per chunk
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
   * Supports both Tile instances and tile IDs (for deferred loading)
   */
  setTile(
    x: number,
    y: number,
    layerName: string,
    tileSet: TileSet,
    tile: Tile | number | string | undefined,
    tint?: Color
  ): void {
    const layer = this.ensureLayer(layerName);
    layer.setTile(x, y, tileSet, tile, tint);
  }

  /**
   * Set a tile by its ID (convenience method for deferred loading)
   */
  setTileById(
    x: number,
    y: number,
    layerName: string,
    tileSet: TileSet,
    tileId: number | string,
    tint?: Color
  ): void {
    const layer = this.ensureLayer(layerName);
    layer.setTileById(x, y, tileSet, tileId, tint);
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
   * Returns false during progressive loading to prevent partial rebuilds
   */
  isDirty(): boolean {
    return this.dirty && !this.isProgressiveLoading;
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

  /**
   * Generate chunk key from coordinates using integer hashing
   * This avoids string allocation and provides faster lookups
   */
  private getChunkKey(chunkX: number, chunkY: number): number {
    // Pack two 16-bit signed integers into one 32-bit integer
    // Supports chunk coordinates from -32768 to 32767
    return ((chunkX & 0xffff) | ((chunkY & 0xffff) << 16)) >>> 0;
  }

  /**
   * Calculate which chunk a tile belongs to
   */
  private getChunkCoords(
    tileX: number,
    tileY: number
  ): {
    chunkX: number;
    chunkY: number;
  } {
    return {
      chunkX: Math.floor(tileX / this.chunkSize),
      chunkY: Math.floor(tileY / this.chunkSize),
    };
  }

  /**
   * Get all chunks
   */
  getChunks(): Map<number, TileMapChunk> {
    return this.chunks;
  }

  /**
   * Clear all chunks
   */
  clearChunks(): void {
    for (const chunk of this.chunks.values()) {
      chunk.destroy();
    }
    this.chunks.clear();
  }

  /**
   * Build chunks from current layer data
   * Uses iterator-based access to avoid allocating intermediate arrays
   */
  buildChunks(device: GPUDevice): void {
    // Clear existing chunks
    this.clearChunks();

    // Iterate through all layers and tiles
    const layers = this.getLayers();
    for (let layerIndex = 0; layerIndex < layers.length; layerIndex++) {
      const layer = layers[layerIndex];
      if (!layer.visible) continue;

      // Use iterator to avoid allocating array for large tile counts
      for (const { x, y, data } of layer.getTilesIterator()) {
        // Calculate chunk coordinates
        const { chunkX, chunkY } = this.getChunkCoords(x, y);
        const chunkKey = this.getChunkKey(chunkX, chunkY);

        // Get or create chunk
        let chunk = this.chunks.get(chunkKey);
        if (!chunk) {
          chunk = new TileMapChunk(chunkX, chunkY);
          chunk.initialize(device);
          this.chunks.set(chunkKey, chunk);
        }

        // Calculate final tint (layer tint * tile tint)
        const finalTint = data.tint ? data.tint.clone() : layer.tint.clone();
        if (data.tint && !data.tint.equals(layer.tint)) {
          finalTint.multiplyColor(layer.tint);
        }

        // Add tile to chunk
        chunk.addTile(x, y, data.tile, data.tileSet, layerIndex, finalTint);
      }
    }
  }

  /**
   * Update world bounds for all chunks
   */
  updateChunkBounds(worldMatrix: Float32Array): void {
    for (const chunk of this.chunks.values()) {
      chunk.calculateWorldBounds(
        this.chunkSize,
        this.tileWidth,
        this.tileHeight,
        worldMatrix
      );
    }
  }

  /**
   * Get chunks that are visible within the view bounds, including adjacent chunks
   * This provides a natural padding buffer to prevent tile popping
   */
  getVisibleChunks(viewBounds: ChunkBounds): TileMapChunk[] {
    const visibleChunks: TileMapChunk[] = [];

    // First pass: find directly visible chunks
    for (const chunk of this.chunks.values()) {
      if (chunk.isInView(viewBounds)) {
        visibleChunks.push(chunk);
      }
    }

    // Second pass: add adjacent chunks (8 neighbors)
    const chunksToAdd = new Set<number>();
    for (const chunk of visibleChunks) {
      // Add all 9 positions (current + 8 neighbors)
      for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
          const neighborKey = this.getChunkKey(
            chunk.chunkX + dx,
            chunk.chunkY + dy
          );
          chunksToAdd.add(neighborKey);
        }
      }
    }

    // Collect all chunks (visible + adjacent)
    const result: TileMapChunk[] = [];
    for (const chunkKey of chunksToAdd) {
      const chunk = this.chunks.get(chunkKey);
      if (chunk) {
        result.push(chunk);
      }
    }

    return result;
  }

  /**
   * Sync pending tiles across all layers whose textures are now ready
   * This is called automatically by the tileset loading system when textures load
   * Returns the total number of tiles that were applied
   *
   * @deprecated Use syncPendingTilesBatch for better performance with large tile counts
   */
  syncPendingTiles(): number {
    let totalApplied = 0;

    for (const layer of this.layers.values()) {
      const appliedCount = layer.syncPendingTiles();
      totalApplied += appliedCount;
    }

    return totalApplied;
  }

  /**
   * Sync pending tiles progressively across all layers to avoid UI freezes
   * Processes tiles until maxTiles is reached OR maxTimeMs is exceeded
   *
   * @param maxTiles Maximum number of tiles to process per layer in this batch (default: 5000)
   * @param maxTimeMs Maximum time budget in milliseconds (default: 8ms for 60fps)
   * @returns Object with total applied count, remaining count across all layers, and done flag
   */
  syncPendingTilesBatch(
    maxTiles: number = 5000,
    maxTimeMs: number = 8
  ): { applied: number; remaining: number; done: boolean } {
    let totalApplied = 0;
    let totalRemaining = 0;
    let allDone = true;

    for (const layer of this.layers.values()) {
      const result = layer.syncPendingTilesBatch(maxTiles, maxTimeMs);
      totalApplied += result.applied;
      totalRemaining += result.remaining;
      if (!result.done) {
        allDone = false;
      }
    }

    // Enable progressive loading mode if we have pending tiles
    if (totalRemaining > 0) {
      this.isProgressiveLoading = true;
    }

    // When all tiles are synced, exit progressive loading mode and mark dirty
    if (allDone && totalRemaining === 0) {
      this.isProgressiveLoading = false;
      // Mark dirty to trigger chunk rebuild with all tiles
      this.markDirty();
    }

    return {
      applied: totalApplied,
      remaining: totalRemaining,
      done: allDone,
    };
  }

  /**
   * Get the total number of pending tiles waiting for textures to load
   */
  getTotalPendingTileCount(): number {
    let count = 0;
    for (const layer of this.layers.values()) {
      count += layer.getPendingTileCount();
    }
    return count;
  }

  /**
   * Get all unique tilesets used in this tilemap (including from pending tiles)
   */
  getAllTileSets(): Set<TileSet> {
    const tileSets = new Set<TileSet>();

    for (const layer of this.layers.values()) {
      const layerTileSets = layer.getAllTileSets();
      for (const tileSet of layerTileSets) {
        tileSets.add(tileSet);
      }
    }

    return tileSets;
  }
}
