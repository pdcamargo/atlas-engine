import { RenderDevice } from "../render_device";
import { Color } from "@atlas/core";

/**
 * Instance data for a single sprite
 */
export interface InstanceData {
  modelMatrix: Float32Array; // 4x4 matrix from gl-matrix
  color: Color;
  uvOffsetScale: [number, number, number, number]; // [offsetX, offsetY, scaleX, scaleY]
}

/**
 * Instance buffer for sprite batching
 */
export class InstanceBuffer {
  public buffer: GPUBuffer;
  #device: RenderDevice;
  #capacity: number;
  #currentSize: number = 0;

  // 4x4 matrix (16 floats) + color (4 floats) + uvOffsetScale (4 floats) = 24 floats
  private static readonly FLOATS_PER_INSTANCE = 24;
  private static readonly BYTES_PER_INSTANCE =
    InstanceBuffer.FLOATS_PER_INSTANCE * 4;

  constructor(device: RenderDevice, capacity: number, label?: string) {
    this.#device = device;
    this.#capacity = capacity;

    this.buffer = device.createBuffer({
      label,
      size: capacity * InstanceBuffer.BYTES_PER_INSTANCE,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });
  }

  /**
   * Write instance data to the buffer
   */
  public writeInstances(instances: InstanceData[]): void {
    if (instances.length > this.#capacity) {
      throw new Error(
        `Too many instances: ${instances.length} > ${this.#capacity}`
      );
    }

    const data = new Float32Array(
      instances.length * InstanceBuffer.FLOATS_PER_INSTANCE
    );

    for (let i = 0; i < instances.length; i++) {
      const instance = instances[i];
      const offset = i * InstanceBuffer.FLOATS_PER_INSTANCE;

      // Model matrix (16 floats)
      data.set(instance.modelMatrix, offset);

      // Color (4 floats)
      data[offset + 16] = instance.color.r;
      data[offset + 17] = instance.color.g;
      data[offset + 18] = instance.color.b;
      data[offset + 19] = instance.color.a;

      // UV offset and scale (4 floats)
      data[offset + 20] = instance.uvOffsetScale[0];
      data[offset + 21] = instance.uvOffsetScale[1];
      data[offset + 22] = instance.uvOffsetScale[2];
      data[offset + 23] = instance.uvOffsetScale[3];
    }

    this.#device.writeBuffer(this.buffer, 0, data);
    this.#currentSize = instances.length;
  }

  /**
   * Get the current number of instances
   */
  public get size(): number {
    return this.#currentSize;
  }

  /**
   * Get the capacity
   */
  public get capacity(): number {
    return this.#capacity;
  }

  /**
   * Destroy the buffer
   */
  public destroy(): void {
    this.buffer.destroy();
  }
}
