import type { BufferData, TypedArray } from "../types";
/**
 * Convert various data types into a typed array suitable for GPU buffers
 */
export declare function toTypedArray(data: BufferData): TypedArray;
/**
 * Calculate the size in bytes needed for buffer data
 */
export declare function getBufferSize(data: BufferData): number;
/**
 * Align a size to the specified byte alignment (WebGPU requirement)
 * @param size - Size in bytes
 * @param alignment - Alignment in bytes (typically 16 for uniforms, 4 for storage)
 */
export declare function alignBufferSize(size: number, alignment?: number): number;
/**
 * Create a uniform buffer (read-only from GPU)
 */
export declare function createUniformBuffer(device: GPUDevice, data: BufferData, label?: string): GPUBuffer;
/**
 * Create a storage buffer (read/write from GPU, no CPU read access)
 */
export declare function createStorageBuffer(device: GPUDevice, data: BufferData, label?: string): GPUBuffer;
/**
 * Create a staging buffer (storage buffer with CPU read/write capability)
 * Returns both the GPU storage buffer and a CPU-readable buffer
 */
export declare function createStagingBuffer(device: GPUDevice, data: BufferData, label?: string): {
    buffer: GPUBuffer;
    readbackBuffer: GPUBuffer;
};
/**
 * Write data to a buffer
 */
export declare function writeBuffer(device: GPUDevice, buffer: GPUBuffer, data: BufferData, offset?: number): void;
/**
 * Read data from a staging buffer (async operation)
 */
export declare function readBuffer(device: GPUDevice, sourceBuffer: GPUBuffer, readbackBuffer: GPUBuffer, size: number): Promise<ArrayBuffer>;
//# sourceMappingURL=buffer-helpers.d.ts.map