/**
 * Compute Shader Framework
 *
 * A Bevy-inspired framework for declarative GPU compute operations in WebGPU.
 *
 * @example
 * ```typescript
 * // 1. Define a compute shader
 * class MultiplyShader extends ComputeShader {
 *   shader() {
 *     return `
 *       @group(0) @binding(0) var<uniform> multiplier: f32;
 *       @group(0) @binding(1) var<storage, read_write> data: array<f32>;
 *
 *       @compute @workgroup_size(64)
 *       fn main(@builtin(global_invocation_id) id: vec3<u32>) {
 *         if (id.x < arrayLength(&data)) {
 *           data[id.x] = data[id.x] * multiplier;
 *         }
 *       }
 *     `;
 *   }
 * }
 *
 * // 2. Define a compute worker
 * class MultiplyWorker extends ComputeWorker {
 *   build(device: GPUDevice) {
 *     return new ComputeWorkerBuilder(device)
 *       .addUniform("multiplier", 2.0)
 *       .addStaging("data", [1, 2, 3, 4])
 *       .addPass(MultiplyShader, [64, 1, 1], ["multiplier", "data"])
 *       .build();
 *   }
 * }
 *
 * // 3. Execute the worker
 * const worker = new MultiplyWorker().build(device);
 * await worker.execute();
 * const result = await worker.readVec("data"); // [2, 4, 6, 8]
 * ```
 */
export { ComputeShader } from "./ComputeShader";
export { ComputeWorker } from "./ComputeWorker";
export { ComputeWorkerBuilder } from "./ComputeWorkerBuilder";
export { ComputeWorkerInstance } from "./ComputeWorkerInstance";
export { BufferType } from "./types";
export type { BufferDefinition, PassDefinition, WorkgroupSize, BufferData, TypedArray, } from "./types";
export { createUniformBuffer, createStorageBuffer, createStagingBuffer, writeBuffer, readBuffer, toTypedArray, getBufferSize, alignBufferSize, } from "./utils/buffer-helpers";
//# sourceMappingURL=index.d.ts.map