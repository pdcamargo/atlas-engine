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

  // Bytes per tile instance: 16 floats (matrix) + 4 floats (frame) + 4 floats (tint) = 24 floats = 96 bytes
  private static readonly BYTES_PER_INSTANCE = 96;
  private static readonly FLOATS_PER_INSTANCE = 24;

  // Reusable buffers to avoid GC pressure
  private mvpMatrix: Mat4 = mat4.create();
  private tileModelMatrix: Mat4 = mat4.create();
  private translationVec: Float32Array = new Float32Array([0, 0, 0]);
  private scaleVec: Float32Array = new Float32Array([1, 1, 1]);

  constructor(tileSet: TileSet) {
    this.tileSet = tileSet;
    this.instanceData = new Float32Array(0);
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
   * This should be called when the tilemap is dirty
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

    // Pack instance data for each tile
    let offset = 0;

    for (const tileInstance of this.tiles) {
      // Start with world matrix (copy using gl-matrix)
      mat4.copy(this.tileModelMatrix, worldMatrix as Float32Array);

      // Apply translation to tile position using gl-matrix
      const tileX = tileInstance.x * tileWidth;
      const tileY = tileInstance.y * tileHeight;
      this.translationVec[0] = tileX;
      this.translationVec[1] = tileY;
      this.translationVec[2] = 0;
      mat4.translate(
        this.tileModelMatrix,
        this.tileModelMatrix,
        this.translationVec
      );

      // Apply tile size scaling using gl-matrix
      this.scaleVec[0] = tileWidth;
      this.scaleVec[1] = tileHeight;
      this.scaleVec[2] = 1;
      mat4.scale(this.tileModelMatrix, this.tileModelMatrix, this.scaleVec);

      // Calculate MVP using gl-matrix (reusing buffer)
      mat4.multiply(
        this.mvpMatrix,
        vpMatrix as Float32Array,
        this.tileModelMatrix
      );

      // Pack data: MVP (16) + frame (4) + tint (4)
      this.instanceData.set(this.mvpMatrix, offset);
      this.instanceData.set(tileInstance.tile.frame.data, offset + 16);
      this.instanceData.set(tileInstance.tint.data, offset + 20);

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
        label: `TileMap Instance Buffer (TileSet ${this.tileSet.id})`,
      });
    }

    return this.instanceBuffer;
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
