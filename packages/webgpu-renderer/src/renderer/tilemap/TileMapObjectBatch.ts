import { Mat4, mat4 } from "gl-matrix";
import { TileSet } from "./TileSet";
import { Tile } from "./Tile";
import { TileMapObject } from "./TileMapObject";
import { Color } from "@atlas/core";

interface ObjectInstance {
  object: TileMapObject;
  tile: Tile;
  layerTint: Color;
}

// Global buffer ID counter for unique bind group keys
let globalBufferId = 0;

/**
 * TileMapObjectBatch batches objects by tileset for instanced rendering
 * Similar to TileMapBatch but handles objects with arbitrary positions and sizes
 */
export class TileMapObjectBatch {
  public readonly tileSet: TileSet;
  private objects: ObjectInstance[] = [];
  private instanceData: Float32Array;
  private instanceBuffer?: GPUBuffer;
  private device?: GPUDevice;
  private instanceCount: number = 0;
  private bufferId: number;

  // Same layout as TileMapBatch:
  // - position (2 floats = 8 bytes)
  // - size (2 floats = 8 bytes)
  // - frame (4 floats = 16 bytes)
  // - tint (4 floats = 16 bytes)
  // Total: 12 floats = 48 bytes
  private static readonly BYTES_PER_INSTANCE = 48;
  private static readonly FLOATS_PER_INSTANCE = 12;

  constructor(tileSet: TileSet) {
    this.tileSet = tileSet;
    this.instanceData = new Float32Array(0);
    this.bufferId = ++globalBufferId;
  }

  /**
   * Initialize GPU resources
   */
  initialize(device: GPUDevice): void {
    this.device = device;
  }

  /**
   * Add an object to this batch
   */
  addObject(object: TileMapObject, tile: Tile, layerTint: Color): void {
    this.objects.push({ object, tile, layerTint });
  }

  /**
   * Clear all objects from this batch
   */
  clear(): void {
    this.objects = [];
    this.instanceCount = 0;
  }

  /**
   * Check if batch is empty
   */
  isEmpty(): boolean {
    return this.objects.length === 0;
  }

  /**
   * Get the number of objects in this batch
   */
  getCount(): number {
    return this.objects.length;
  }

  /**
   * Get unique buffer ID for bind group caching
   */
  getBufferId(): number {
    return this.bufferId;
  }

  /**
   * Rebuild instance data from current objects
   * Objects use world coordinates directly (not tile grid coordinates)
   */
  rebuild(vpMatrix: Mat4, worldMatrix: Mat4): void {
    this.instanceCount = this.objects.length;

    if (this.instanceCount === 0) {
      this.instanceData = new Float32Array(0);
      return;
    }

    // Allocate instance data
    const floatCount =
      this.instanceCount * TileMapObjectBatch.FLOATS_PER_INSTANCE;
    this.instanceData = new Float32Array(floatCount);

    let offset = 0;
    for (const { object, tile, layerTint } of this.objects) {
      // Calculate final tint (object tint * layer tint)
      const finalTint = object.tint.clone();
      finalTint.multiplyColor(layerTint);

      // Position: use object's world position directly
      this.instanceData[offset++] = object.x;
      this.instanceData[offset++] = object.y;

      // Size: use object's dimensions (can be different from tile size)
      this.instanceData[offset++] = object.width;
      this.instanceData[offset++] = object.height;

      // Frame UV coordinates (from tile)
      this.instanceData[offset++] = tile.frame.x;
      this.instanceData[offset++] = tile.frame.y;
      this.instanceData[offset++] = tile.frame.width;
      this.instanceData[offset++] = tile.frame.height;

      // Tint color
      this.instanceData[offset++] = finalTint.r;
      this.instanceData[offset++] = finalTint.g;
      this.instanceData[offset++] = finalTint.b;
      this.instanceData[offset++] = finalTint.a;
    }
  }

  /**
   * Get instance data for GPU upload
   */
  getInstanceData(): { data: Float32Array; count: number } {
    return {
      data: this.instanceData,
      count: this.instanceCount,
    };
  }

  /**
   * Get or create the instance buffer
   */
  getOrCreateInstanceBuffer(): GPUBuffer {
    if (!this.device) {
      throw new Error("Device not initialized");
    }

    const requiredSize = Math.max(
      this.instanceCount * TileMapObjectBatch.BYTES_PER_INSTANCE,
      16 // Minimum buffer size
    );

    // Check if we need to recreate the buffer (size changed)
    if (
      !this.instanceBuffer ||
      this.instanceBuffer.size < requiredSize ||
      this.instanceBuffer.size > requiredSize * 2
    ) {
      // Destroy old buffer if it exists
      if (this.instanceBuffer) {
        this.instanceBuffer.destroy();
      }

      // Create new buffer with some padding for growth
      const bufferSize = Math.ceil(requiredSize * 1.5);

      this.instanceBuffer = this.device.createBuffer({
        size: bufferSize,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
      });
    }

    return this.instanceBuffer;
  }

  /**
   * Destroy GPU resources
   */
  destroy(): void {
    if (this.instanceBuffer) {
      this.instanceBuffer.destroy();
      this.instanceBuffer = undefined;
    }
  }
}
