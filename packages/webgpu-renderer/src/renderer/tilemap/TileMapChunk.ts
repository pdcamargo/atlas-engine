import { Mat4 } from "gl-matrix";
import { TileMapBatch } from "./TileMapBatch";
import { TileSet } from "./TileSet";
import { Tile } from "./Tile";
import { Color } from "@atlas/core";

export interface ChunkBounds {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

/**
 * TileMapChunk represents a spatial subdivision of a tilemap
 * Each chunk contains a subset of tiles and manages its own batches
 */
export class TileMapChunk {
  public readonly chunkX: number;
  public readonly chunkY: number;
  public worldBounds: ChunkBounds;

  // One batch per tileset used in this chunk
  private batches = new Map<string, TileMapBatch>();
  private device?: GPUDevice;

  constructor(chunkX: number, chunkY: number) {
    this.chunkX = chunkX;
    this.chunkY = chunkY;
    this.worldBounds = { left: 0, right: 0, top: 0, bottom: 0 };
  }

  /**
   * Initialize GPU resources for this chunk
   */
  initialize(device: GPUDevice): void {
    this.device = device;
    for (const batch of this.batches.values()) {
      batch.initialize(device);
    }
  }

  /**
   * Add a tile to this chunk
   */
  addTile(
    x: number,
    y: number,
    tile: Tile,
    tileSet: TileSet,
    layerIndex: number,
    tint: Color
  ): void {
    const tileSetId = tileSet.id;

    // Get or create batch for this tileset
    let batch = this.batches.get(tileSetId);
    if (!batch) {
      batch = new TileMapBatch(tileSet);
      if (this.device) {
        batch.initialize(this.device);
      }
      this.batches.set(tileSetId, batch);
    }

    // Add tile to batch
    batch.addTile(x, y, tile, layerIndex, tint);
  }

  /**
   * Calculate world bounds for this chunk
   */
  calculateWorldBounds(
    chunkSize: number,
    tileWidth: number,
    tileHeight: number,
    worldMatrix: Float32Array
  ): void {
    // Extract world transform
    const tileMapWorldX = worldMatrix[12];
    const tileMapWorldY = worldMatrix[13];
    const scaleX = Math.sqrt(
      worldMatrix[0] * worldMatrix[0] + worldMatrix[1] * worldMatrix[1]
    );
    const scaleY = Math.sqrt(
      worldMatrix[4] * worldMatrix[4] + worldMatrix[5] * worldMatrix[5]
    );

    // Calculate chunk bounds in world space
    this.worldBounds = {
      left: tileMapWorldX + this.chunkX * chunkSize * tileWidth * scaleX,
      right: tileMapWorldX + (this.chunkX + 1) * chunkSize * tileWidth * scaleX,
      bottom: tileMapWorldY + this.chunkY * chunkSize * tileHeight * scaleY,
      top: tileMapWorldY + (this.chunkY + 1) * chunkSize * tileHeight * scaleY,
    };
  }

  /**
   * Check if this chunk is within the view bounds
   */
  isInView(viewBounds: ChunkBounds): boolean {
    return (
      this.worldBounds.right >= viewBounds.left &&
      this.worldBounds.left <= viewBounds.right &&
      this.worldBounds.top >= viewBounds.bottom &&
      this.worldBounds.bottom <= viewBounds.top
    );
  }

  /**
   * Check if this chunk is empty
   */
  isEmpty(): boolean {
    return this.batches.size === 0;
  }

  /**
   * Get the number of tiles in this chunk
   */
  getTileCount(): number {
    let count = 0;
    for (const batch of this.batches.values()) {
      count += batch.getCount();
    }
    return count;
  }

  /**
   * Render all batches in this chunk
   */
  render(
    renderPass: GPURenderPassEncoder,
    device: GPUDevice,
    vpMatrix: Mat4,
    worldMatrix: Mat4,
    tileWidth: number,
    tileHeight: number,
    spriteInstancedPipeline: GPURenderPipeline,
    spriteInstancedBindGroupLayout: GPUBindGroupLayout,
    quadBuffers: {
      buffers: GPUBuffer[];
      bufferLayouts: GPUVertexBufferLayout[];
      numElements: number;
      indexBuffer?: GPUBuffer;
      indexFormat?: GPUIndexFormat;
    },
    textureViewCache: Map<string, GPUTextureView>
  ): void {
    for (const batch of this.batches.values()) {
      if (batch.isEmpty()) continue;

      // Rebuild batch if needed
      batch.rebuild(vpMatrix, worldMatrix, tileWidth, tileHeight);

      const instanceDataInfo = batch.getInstanceData();
      if (instanceDataInfo.count === 0) continue;

      // Get or create instance buffer
      const instanceBuffer = batch.getOrCreateInstanceBuffer();

      // Write instance data to GPU
      device.queue.writeBuffer(
        instanceBuffer,
        0,
        instanceDataInfo.data.buffer,
        0,
        instanceDataInfo.count * 96 // 96 bytes per instance
      );

      // Get or create texture view
      let textureView = textureViewCache.get(batch.tileSet.texture.id);
      if (!textureView) {
        textureView = batch.tileSet.texture.gpuTexture.createView();
        textureViewCache.set(batch.tileSet.texture.id, textureView);
      }

      // Create bind group
      const bindGroup = device.createBindGroup({
        layout: spriteInstancedBindGroupLayout,
        entries: [
          { binding: 0, resource: { buffer: instanceBuffer } },
          { binding: 1, resource: batch.tileSet.texture.sampler },
          { binding: 2, resource: textureView },
        ],
      });

      // Draw instanced
      renderPass.setPipeline(spriteInstancedPipeline);
      renderPass.setBindGroup(0, bindGroup);
      for (let i = 0; i < quadBuffers.bufferLayouts.length; i++) {
        renderPass.setVertexBuffer(i, quadBuffers.buffers[i]);
      }
      if (quadBuffers.indexBuffer) {
        renderPass.setIndexBuffer(
          quadBuffers.indexBuffer,
          quadBuffers.indexFormat!
        );
        renderPass.drawIndexed(quadBuffers.numElements, instanceDataInfo.count);
      } else {
        renderPass.draw(quadBuffers.numElements, instanceDataInfo.count);
      }
    }
  }

  /**
   * Clean up GPU resources
   */
  destroy(): void {
    for (const batch of this.batches.values()) {
      batch.destroy();
    }
    this.batches.clear();
  }
}
