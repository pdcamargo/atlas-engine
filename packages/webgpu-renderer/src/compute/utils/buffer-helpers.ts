import type { BufferData, TypedArray } from "../types";

/**
 * Convert various data types into a typed array suitable for GPU buffers
 */
export function toTypedArray(data: BufferData): TypedArray {
  // Already a typed array
  if (ArrayBuffer.isView(data)) {
    return data as TypedArray;
  }

  // ArrayBuffer - wrap as Uint8Array
  if (data instanceof ArrayBuffer) {
    return new Uint8Array(data);
  }

  // Single number - wrap as Float32Array
  if (typeof data === "number") {
    return new Float32Array([data]);
  }

  // Number array - convert to Float32Array
  if (Array.isArray(data)) {
    return new Float32Array(data);
  }

  throw new Error(`Unsupported buffer data type: ${typeof data}`);
}

/**
 * Calculate the size in bytes needed for buffer data
 */
export function getBufferSize(data: BufferData): number {
  const typedArray = toTypedArray(data);
  return typedArray.byteLength;
}

/**
 * Align a size to the specified byte alignment (WebGPU requirement)
 * @param size - Size in bytes
 * @param alignment - Alignment in bytes (typically 16 for uniforms, 4 for storage)
 */
export function alignBufferSize(size: number, alignment: number = 16): number {
  return Math.ceil(size / alignment) * alignment;
}

/**
 * Create a uniform buffer (read-only from GPU)
 */
export function createUniformBuffer(
  device: GPUDevice,
  data: BufferData,
  label?: string
): GPUBuffer {
  const typedArray = toTypedArray(data);
  const size = alignBufferSize(typedArray.byteLength, 16); // Uniforms need 16-byte alignment

  const buffer = device.createBuffer({
    size,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    label: label || "Uniform Buffer",
  });

  // Write initial data
  device.queue.writeBuffer(buffer, 0, typedArray.buffer);

  return buffer;
}

/**
 * Create a storage buffer (read/write from GPU, no CPU read access)
 */
export function createStorageBuffer(
  device: GPUDevice,
  data: BufferData,
  label?: string
): GPUBuffer {
  const typedArray = toTypedArray(data);
  const size = typedArray.byteLength;

  const buffer = device.createBuffer({
    size,
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    label: label || "Storage Buffer",
  });

  // Write initial data
  device.queue.writeBuffer(buffer, 0, typedArray.buffer);

  return buffer;
}

/**
 * Create a staging buffer (storage buffer with CPU read/write capability)
 * Returns both the GPU storage buffer and a CPU-readable buffer
 */
export function createStagingBuffer(
  device: GPUDevice,
  data: BufferData,
  label?: string
): { buffer: GPUBuffer; readbackBuffer: GPUBuffer } {
  const typedArray = toTypedArray(data);
  const size = typedArray.byteLength;

  // Main storage buffer (used in compute shaders)
  const buffer = device.createBuffer({
    size,
    usage:
      GPUBufferUsage.STORAGE |
      GPUBufferUsage.COPY_DST |
      GPUBufferUsage.COPY_SRC,
    label: label || "Staging Buffer",
  });

  // Readback buffer (CPU can map for reading)
  const readbackBuffer = device.createBuffer({
    size,
    usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST,
    label: `${label || "Staging"} Readback Buffer`,
  });

  // Write initial data
  device.queue.writeBuffer(buffer, 0, typedArray.buffer);

  return { buffer, readbackBuffer };
}

/**
 * Write data to a buffer
 */
export function writeBuffer(
  device: GPUDevice,
  buffer: GPUBuffer,
  data: BufferData,
  offset: number = 0
): void {
  const typedArray = toTypedArray(data);
  device.queue.writeBuffer(buffer, offset, typedArray.buffer);
}

/**
 * Read data from a staging buffer (async operation)
 */
export async function readBuffer(
  device: GPUDevice,
  sourceBuffer: GPUBuffer,
  readbackBuffer: GPUBuffer,
  size: number
): Promise<ArrayBuffer> {
  // Copy from source to readback buffer
  const commandEncoder = device.createCommandEncoder();
  commandEncoder.copyBufferToBuffer(sourceBuffer, 0, readbackBuffer, 0, size);
  device.queue.submit([commandEncoder.finish()]);

  // Map the readback buffer and read data
  await readbackBuffer.mapAsync(GPUMapMode.READ);
  const mappedRange = readbackBuffer.getMappedRange();
  const result = mappedRange.slice(0); // Copy data
  readbackBuffer.unmap();

  return result;
}
