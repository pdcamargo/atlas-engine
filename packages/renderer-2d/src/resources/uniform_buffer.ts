import { RenderDevice } from "../render_device";

/**
 * Uniform buffer for GPU data
 */
export class UniformBuffer {
  public buffer: GPUBuffer;
  #device: RenderDevice;
  #size: number;

  constructor(device: RenderDevice, size: number, label?: string) {
    this.#device = device;
    this.#size = size;
    this.buffer = device.createBuffer({
      label,
      size,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
  }

  /**
   * Write data to the uniform buffer
   */
  public write(data: ArrayBuffer | ArrayBufferView): void {
    this.#device.writeBuffer(this.buffer, 0, data);
  }

  /**
   * Destroy the buffer
   */
  public destroy(): void {
    this.buffer.destroy();
  }

  public get size(): number {
    return this.#size;
  }
}

/**
 * Dynamic uniform buffer for multiple uniform sets
 */
export class DynamicUniformBuffer {
  public buffer: GPUBuffer;
  #device: RenderDevice;
  #elementSize: number;
  #capacity: number;
  #alignedElementSize: number;

  constructor(
    device: RenderDevice,
    elementSize: number,
    capacity: number,
    label?: string
  ) {
    this.#device = device;
    this.#elementSize = elementSize;
    this.#capacity = capacity;

    // Align to 256 bytes (minimum uniform buffer alignment)
    this.#alignedElementSize = Math.ceil(elementSize / 256) * 256;

    this.buffer = device.createBuffer({
      label,
      size: this.#alignedElementSize * capacity,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
  }

  /**
   * Write data for a specific index
   */
  public writeAt(index: number, data: ArrayBuffer | ArrayBufferView): void {
    if (index >= this.#capacity) {
      throw new Error(
        `Index ${index} out of bounds (capacity: ${this.#capacity})`
      );
    }
    const offset = index * this.#alignedElementSize;
    this.#device.writeBuffer(this.buffer, offset, data);
  }

  /**
   * Get the offset for a specific index
   */
  public getOffset(index: number): number {
    return index * this.#alignedElementSize;
  }

  /**
   * Destroy the buffer
   */
  public destroy(): void {
    this.buffer.destroy();
  }

  public get capacity(): number {
    return this.#capacity;
  }

  public get alignedElementSize(): number {
    return this.#alignedElementSize;
  }
}
