import type { ComputeWorkerInstance } from "./ComputeWorkerInstance";
/**
 * Abstract base class for defining compute workers
 * Similar to Bevy's ComputeWorker trait
 *
 * Users extend this class and implement the build() method to define
 * their compute pipeline using the builder pattern
 *
 * @example
 * ```typescript
 * class MyComputeWorker extends ComputeWorker {
 *   build(device: GPUDevice): ComputeWorkerInstance<this> {
 *     return new ComputeWorkerBuilder(device)
 *       .addUniform("config", configData)
 *       .addStaging("output", initialData)
 *       .addPass(MyShader, [64, 1, 1], ["config", "output"])
 *       .build();
 *   }
 * }
 *
 * // Usage
 * const worker = new MyComputeWorker().build(device);
 * await worker.execute();
 * const result = await worker.readVec("output");
 * ```
 */
export declare abstract class ComputeWorker {
    /**
     * Build the compute worker instance
     * Implement this method to define your compute pipeline using ComputeWorkerBuilder
     *
     * @param device - The GPU device to create resources on
     * @returns A configured ComputeWorkerInstance
     */
    abstract build(device: GPUDevice): ComputeWorkerInstance<this>;
}
//# sourceMappingURL=ComputeWorker.d.ts.map