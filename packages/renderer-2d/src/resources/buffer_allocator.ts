import { RenderDevice } from "../render_device";

/**
 * Buffer pool entry
 */
interface BufferPoolEntry {
  buffer: GPUBuffer;
  size: number;
  usage: GPUBufferUsageFlags;
  inUse: boolean;
}

/**
 * Buffer allocator with pooling support
 */
export class BufferAllocator {
  #device: RenderDevice;
  #bufferPool: BufferPoolEntry[] = [];

  constructor(device: RenderDevice) {
    this.#device = device;
  }

  /**
   * Allocate a buffer (reuses from pool if available)
   */
  public allocate(
    size: number,
    usage: GPUBufferUsageFlags,
    label?: string
  ): GPUBuffer {
    // Try to find a suitable buffer in the pool
    for (const entry of this.#bufferPool) {
      if (
        !entry.inUse &&
        entry.size >= size &&
        entry.usage === usage &&
        entry.size < size * 2 // Don't reuse if too large
      ) {
        entry.inUse = true;
        return entry.buffer;
      }
    }

    // Create new buffer if none available
    const buffer = this.#device.createBuffer({
      label,
      size,
      usage,
    });

    this.#bufferPool.push({
      buffer,
      size,
      usage,
      inUse: true,
    });

    return buffer;
  }

  /**
   * Allocate a buffer with initial data
   */
  public allocateWithData(
    data: ArrayBuffer | ArrayBufferView,
    usage: GPUBufferUsageFlags,
    label?: string
  ): GPUBuffer {
    const size =
      data instanceof ArrayBuffer ? data.byteLength : data.byteLength;

    const buffer = this.#device.createBufferWithData({
      label,
      data,
      usage,
    });

    this.#bufferPool.push({
      buffer,
      size,
      usage,
      inUse: true,
    });

    return buffer;
  }

  /**
   * Release a buffer back to the pool
   */
  public release(buffer: GPUBuffer): void {
    const entry = this.#bufferPool.find((e) => e.buffer === buffer);
    if (entry) {
      entry.inUse = false;
    }
  }

  /**
   * Clear all buffers from the pool
   */
  public clear(): void {
    for (const entry of this.#bufferPool) {
      entry.buffer.destroy();
    }
    this.#bufferPool = [];
  }

  /**
   * Get pool statistics
   */
  public getStats(): {
    total: number;
    inUse: number;
    available: number;
    totalSize: number;
  } {
    const total = this.#bufferPool.length;
    const inUse = this.#bufferPool.filter((e) => e.inUse).length;
    const totalSize = this.#bufferPool.reduce((sum, e) => sum + e.size, 0);

    return {
      total,
      inUse,
      available: total - inUse,
      totalSize,
    };
  }
}
