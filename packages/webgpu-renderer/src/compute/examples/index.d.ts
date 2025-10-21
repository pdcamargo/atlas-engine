/**
 * Compute Shader Framework Examples
 *
 * This module contains comprehensive examples demonstrating various
 * patterns and use cases for the compute shader framework.
 *
 * Run all examples:
 * ```typescript
 * import { runAllExamples } from '@atlas/webgpu-renderer';
 *
 * const device = await navigator.gpu.requestAdapter()
 *   .then(adapter => adapter.requestDevice());
 *
 * await runAllExamples(device);
 * ```
 */
export { runSimpleExample } from "./simple";
export { runMultiPassExample } from "./multi-pass";
export { runOneShotExample, conditionalExecutionExample, } from "./one-shot";
export { runGameOfLifeExample, runGliderExample, } from "./game-of-life";
/**
 * Run all compute shader examples in sequence
 */
export declare function runAllExamples(device: GPUDevice): Promise<void>;
//# sourceMappingURL=index.d.ts.map