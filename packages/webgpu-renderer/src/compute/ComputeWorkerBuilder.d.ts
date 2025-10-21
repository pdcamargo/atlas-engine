import type { BufferData, WorkgroupSize } from "./types";
import { ComputeShader } from "./ComputeShader";
import { ComputeWorkerInstance } from "./ComputeWorkerInstance";
/**
 * Fluent builder for creating compute workers
 * Similar to Bevy's AppComputeWorkerBuilder
 *
 * @example
 * ```typescript
 * const worker = new ComputeWorkerBuilder(device)
 *   .addUniform("multiplier", 2.0)
 *   .addStaging("data", [1, 2, 3, 4])
 *   .addPass(MyShader, [64, 1, 1], ["multiplier", "data"])
 *   .build();
 * ```
 */
export declare class ComputeWorkerBuilder {
    private device;
    private buffers;
    private passes;
    private isOneShot;
    constructor(device: GPUDevice);
    /**
     * Add a uniform buffer (read-only from GPU, small data)
     * Uniforms are ideal for configuration values that don't change during computation
     *
     * @param name - Unique identifier for this buffer
     * @param data - Initial data (number, array, or typed array)
     */
    addUniform(name: string, data: BufferData): this;
    /**
     * Add a storage buffer (read/write from GPU, GPU-only access)
     * Storage buffers are ideal for large arrays that are only accessed on the GPU
     *
     * @param name - Unique identifier for this buffer
     * @param data - Initial data (number, array, or typed array)
     */
    addStorage(name: string, data: BufferData): this;
    /**
     * Add a staging buffer (storage buffer with CPU read/write capability)
     * Staging buffers allow data to be read back to the CPU after computation
     *
     * @param name - Unique identifier for this buffer
     * @param data - Initial data (number, array, or typed array)
     */
    addStaging(name: string, data: BufferData): this;
    /**
     * Add a compute pass to the pipeline
     * Passes are executed in the order they are added
     *
     * @param ShaderClass - The compute shader class (must extend ComputeShader)
     * @param workgroups - Workgroup dispatch size [x, y, z]
     * @param bindings - Names of buffers to bind (in binding order)
     */
    addPass<T extends typeof ComputeShader>(ShaderClass: T, workgroups: WorkgroupSize, bindings: string[]): this;
    /**
     * Configure this worker to execute only when explicitly triggered
     * By default, workers execute every frame
     */
    oneShot(): this;
    /**
     * Build the compute worker instance
     * This compiles all shaders and creates pipelines and bind groups
     */
    build(): ComputeWorkerInstance;
    /**
     * Compile a compute pass: create shader module, pipeline, and bind group
     */
    private compilePass;
}
//# sourceMappingURL=ComputeWorkerBuilder.d.ts.map