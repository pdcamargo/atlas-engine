import { Mat4 } from "gl-matrix";
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
      // Calculate tile world position
      const tileX = tileInstance.x * tileWidth;
      const tileY = tileInstance.y * tileHeight;

      // Create model matrix for this tile (apply world transform and tile position)
      const tileModelMatrix = new Float32Array(16);

      // Start with world matrix
      for (let i = 0; i < 16; i++) {
        tileModelMatrix[i] = worldMatrix[i];
      }

      // Apply translation to tile position
      tileModelMatrix[12] += tileX * worldMatrix[0] + tileY * worldMatrix[4];
      tileModelMatrix[13] += tileX * worldMatrix[1] + tileY * worldMatrix[5];
      tileModelMatrix[14] += tileX * worldMatrix[2] + tileY * worldMatrix[6];

      // Apply tile size scaling
      tileModelMatrix[0] *= tileWidth;
      tileModelMatrix[1] *= tileWidth;
      tileModelMatrix[2] *= tileWidth;
      tileModelMatrix[4] *= tileHeight;
      tileModelMatrix[5] *= tileHeight;
      tileModelMatrix[6] *= tileHeight;

      // Calculate MVP
      const mvp = new Float32Array(16);
      this.multiplyMatrices(mvp, vpMatrix, tileModelMatrix);

      // Pack data: MVP (16) + frame (4) + tint (4)
      this.instanceData.set(mvp, offset);
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

  /**
   * Helper: Multiply two 4x4 matrices
   */
  private multiplyMatrices(
    out: Float32Array,
    a: Float32Array | Mat4,
    b: Float32Array
  ): void {
    const a00 = a[0],
      a01 = a[1],
      a02 = a[2],
      a03 = a[3];
    const a10 = a[4],
      a11 = a[5],
      a12 = a[6],
      a13 = a[7];
    const a20 = a[8],
      a21 = a[9],
      a22 = a[10],
      a23 = a[11];
    const a30 = a[12],
      a31 = a[13],
      a32 = a[14],
      a33 = a[15];

    const b00 = b[0],
      b01 = b[1],
      b02 = b[2],
      b03 = b[3];
    const b10 = b[4],
      b11 = b[5],
      b12 = b[6],
      b13 = b[7];
    const b20 = b[8],
      b21 = b[9],
      b22 = b[10],
      b23 = b[11];
    const b30 = b[12],
      b31 = b[13],
      b32 = b[14],
      b33 = b[15];

    out[0] = a00 * b00 + a01 * b10 + a02 * b20 + a03 * b30;
    out[1] = a00 * b01 + a01 * b11 + a02 * b21 + a03 * b31;
    out[2] = a00 * b02 + a01 * b12 + a02 * b22 + a03 * b32;
    out[3] = a00 * b03 + a01 * b13 + a02 * b23 + a03 * b33;

    out[4] = a10 * b00 + a11 * b10 + a12 * b20 + a13 * b30;
    out[5] = a10 * b01 + a11 * b11 + a12 * b21 + a13 * b31;
    out[6] = a10 * b02 + a11 * b12 + a12 * b22 + a13 * b32;
    out[7] = a10 * b03 + a11 * b13 + a12 * b23 + a13 * b33;

    out[8] = a20 * b00 + a21 * b10 + a22 * b20 + a23 * b30;
    out[9] = a20 * b01 + a21 * b11 + a22 * b21 + a23 * b31;
    out[10] = a20 * b02 + a21 * b12 + a22 * b22 + a23 * b32;
    out[11] = a20 * b03 + a21 * b13 + a22 * b23 + a23 * b33;

    out[12] = a30 * b00 + a31 * b10 + a32 * b20 + a33 * b30;
    out[13] = a30 * b01 + a31 * b11 + a32 * b21 + a33 * b31;
    out[14] = a30 * b02 + a31 * b12 + a32 * b22 + a33 * b32;
    out[15] = a30 * b03 + a31 * b13 + a32 * b23 + a33 * b33;
  }
}
