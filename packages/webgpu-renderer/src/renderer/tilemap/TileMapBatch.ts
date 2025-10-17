import { Mat4, mat4 } from "gl-matrix";
import { TileSet } from "./TileSet";
import { Tile } from "./Tile";
import { Color } from "@atlas/core";

interface TileInstance {
  x: number;
  y: number;
  tile: Tile;
  tint: Color;
  layerIndex: number;
}

// Global buffer ID counter for unique bind group keys
let globalBufferId = 0;

/**
 * TileMapBatch batches tiles by tileset for instanced rendering
 * Similar to RenderBatch but optimized for static tilemap data
 */
export class TileMapBatch {
  public readonly tileSet: TileSet;
  private tiles: TileInstance[] = [];
  private instanceData: Float32Array;
  private instanceBuffer?: GPUBuffer;
  private device?: GPUDevice;
  private instanceCount: number = 0;
  private bufferId: number; // Unique ID for bind group caching (globally unique)

  // Bytes per tile instance (GPU-optimized layout):
  // - position (2 floats = 8 bytes)
  // - size (2 floats = 8 bytes)
  // - frame (4 floats = 16 bytes)
  // - tint (4 floats = 16 bytes)
  // Total: 12 floats = 48 bytes (was 96 bytes - 50% reduction!)
  private static readonly BYTES_PER_INSTANCE = 48;
  private static readonly FLOATS_PER_INSTANCE = 12;

  constructor(tileSet: TileSet) {
    this.tileSet = tileSet;
    this.instanceData = new Float32Array(0);
    // Assign globally unique buffer ID
    this.bufferId = ++globalBufferId;
  }

  /**
   * Initialize GPU resources
   */
  initialize(device: GPUDevice): void {
    this.device = device;
  }

  /**
   * Add a tile to this batch
   */
  addTile(
    x: number,
    y: number,
    tile: Tile,
    layerIndex: number,
    tint: Color = Color.white()
  ): void {
    this.tiles.push({ x, y, tile, tint, layerIndex });
  }

  /**
   * Clear all tiles from this batch
   */
  clear(): void {
    this.tiles = [];
    this.instanceCount = 0;
  }

  /**
   * Get the number of tiles in this batch
   */
  getCount(): number {
    return this.tiles.length;
  }

  /**
   * Check if this batch is empty
   */
  isEmpty(): boolean {
    return this.tiles.length === 0;
  }

  /**
   * Rebuild instance data for all tiles
   * GPU-optimized: stores position+size, MVP computed in vertex shader
   */
  rebuild(
    vpMatrix: Mat4,
    worldMatrix: Mat4,
    tileWidth: number,
    tileHeight: number
  ): void {
    this.instanceCount = this.tiles.length;

    if (this.instanceCount === 0) {
      return;
    }

    // Resize instance data buffer if needed
    const requiredSize = this.instanceCount * TileMapBatch.FLOATS_PER_INSTANCE;
    if (this.instanceData.length < requiredSize) {
      this.instanceData = new Float32Array(requiredSize);
    }

    // Extract world transform from matrix
    const worldX = worldMatrix[12];
    const worldY = worldMatrix[13];
    const scaleX = Math.sqrt(
      worldMatrix[0] * worldMatrix[0] + worldMatrix[1] * worldMatrix[1]
    );
    const scaleY = Math.sqrt(
      worldMatrix[4] * worldMatrix[4] + worldMatrix[5] * worldMatrix[5]
    );

    // Pack instance data for each tile
    let offset = 0;

    for (const tileInstance of this.tiles) {
      // Calculate world position (tilemap transform applied)
      const worldPosX = worldX + tileInstance.x * tileWidth * scaleX;
      const worldPosY = worldY + tileInstance.y * tileHeight * scaleY;

      // Calculate world size (tilemap scale applied)
      const worldSizeX = tileWidth * scaleX;
      const worldSizeY = tileHeight * scaleY;

      // Pack data: position (2) + size (2) + frame (4) + tint (4) = 12 floats
      this.instanceData[offset + 0] = worldPosX;
      this.instanceData[offset + 1] = worldPosY;
      this.instanceData[offset + 2] = worldSizeX;
      this.instanceData[offset + 3] = worldSizeY;

      // Frame and tint
      this.instanceData.set(tileInstance.tile.frame.data, offset + 4);
      this.instanceData.set(tileInstance.tint.data, offset + 8);

      offset += TileMapBatch.FLOATS_PER_INSTANCE;
    }
  }

  /**
   * Get the instance data for GPU upload
   */
  getInstanceData(): { data: Float32Array; count: number } {
    return {
      data: this.instanceData,
      count: this.instanceCount,
    };
  }

  /**
   * Get or create instance buffer (capped at safe size for WebGPU limits)
   */
  getOrCreateInstanceBuffer(): GPUBuffer {
    if (!this.device) {
      throw new Error("TileMapBatch not initialized with device");
    }

    const requiredSize = this.instanceCount * TileMapBatch.BYTES_PER_INSTANCE;

    // WebGPU buffer size limit is typically 256 MB, but we'll be conservative
    // Max 65536 instances = ~6.3 MB per buffer (safe for chunking)
    const MAX_BUFFER_SIZE = 65536 * TileMapBatch.BYTES_PER_INSTANCE; // ~6.3 MB

    // Cap the buffer size to prevent exceeding WebGPU limits
    const bufferSize = Math.min(Math.max(requiredSize, 1024), MAX_BUFFER_SIZE);

    // Create or resize buffer if needed
    if (!this.instanceBuffer || this.instanceBuffer.size < bufferSize) {
      // Destroy old buffer
      if (this.instanceBuffer) {
        this.instanceBuffer.destroy();
      }

      // Create new buffer
      this.instanceBuffer = this.device.createBuffer({
        size: bufferSize,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
        label: `TileMap Instance Buffer (TileSet ${this.tileSet.id}) - Batch ${this.bufferId}`,
      });

      // Note: bufferId is set once in constructor and never changes
      // Each batch has a globally unique ID for bind group caching
    }

    return this.instanceBuffer;
  }

  /**
   * Get unique buffer ID for bind group caching
   */
  getBufferId(): number {
    return this.bufferId;
  }

  /**
   * Clean up GPU resources
   */
  destroy(): void {
    if (this.instanceBuffer) {
      this.instanceBuffer.destroy();
      this.instanceBuffer = undefined;
    }
  }
}
