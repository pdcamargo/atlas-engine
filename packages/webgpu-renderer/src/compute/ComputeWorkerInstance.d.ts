import type { BufferDefinition, PassDefinition, BufferData } from "./types";
/**
 * Runtime instance of a compute worker
 * Similar to Bevy's AppComputeWorker<T>
 *
 * Manages GPU resources, executes compute passes, and provides CPU data access
 */
export declare class ComputeWorkerInstance<T = any> {
    private device;
    private buffers;
    private passes;
    private isOneShot;
    private executionPending;
    private lastExecution?;
    constructor(device: GPUDevice, buffers: Map<string, BufferDefinition>, passes: PassDefinition[], isOneShot?: boolean);
    /**
     * Execute all compute passes
     * For one-shot workers, this must be called manually
     * For continuous workers, this is called automatically every frame
     */
    execute(): Promise<void>;
    /**
     * Check if the worker is ready for CPU reads
     * Returns false while compute passes are executing
     */
    ready(): boolean;
    /**
     * Read data from a staging buffer as raw ArrayBuffer
     * Only works with staging buffers
     */
    read(name: string): Promise<ArrayBuffer>;
    /**
     * Read data from a staging buffer as a typed array
     * Automatically determines the array type based on the template parameter
     */
    readVec<T extends number = number>(name: string): Promise<T[]>;
    /**
     * Read data as a specific typed array type
     */
    readTypedArray<T extends Float32Array | Uint32Array | Int32Array>(name: string, ArrayType: new (buffer: ArrayBuffer) => T): Promise<T>;
    /**
     * Write data to a buffer (uniform, storage, or staging)
     * The buffer will be updated on the GPU
     */
    write(name: string, data: BufferData): void;
    /**
     * Write a slice of data to a buffer at a specific offset
     */
    writeSlice(name: string, data: BufferData, offset?: number): void;
    /**
     * Get the size of a buffer in bytes
     */
    getBufferSize(name: string): number;
    /**
     * Check if a buffer exists
     */
    hasBuffer(name: string): boolean;
    /**
     * Get all buffer names
     */
    getBufferNames(): string[];
    /**
     * Destroy all GPU resources
     * Should be called when the worker is no longer needed
     */
    destroy(): void;
    /**
     * Check if this is a one-shot worker
     */
    isOneShotWorker(): boolean;
}
//# sourceMappingURL=ComputeWorkerInstance.d.ts.map