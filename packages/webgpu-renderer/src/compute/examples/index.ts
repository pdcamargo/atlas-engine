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
export {
  runOneShotExample,
  conditionalExecutionExample,
} from "./one-shot";
export {
  runGameOfLifeExample,
  runGliderExample,
} from "./game-of-life";

/**
 * Run all compute shader examples in sequence
 */
export async function runAllExamples(device: GPUDevice): Promise<void> {
  console.log("\n╔════════════════════════════════════════════════════════╗");
  console.log("║   WebGPU Compute Shader Framework - Example Suite   ║");
  console.log("╚════════════════════════════════════════════════════════╝\n");

  const { runSimpleExample } = await import("./simple");
  const { runMultiPassExample } = await import("./multi-pass");
  const { runOneShotExample, conditionalExecutionExample } = await import(
    "./one-shot"
  );
  const { runGameOfLifeExample, runGliderExample } = await import(
    "./game-of-life"
  );

  try {
    await runSimpleExample(device);
    await runMultiPassExample(device);
    await runOneShotExample(device);
    await conditionalExecutionExample(device);
    await runGameOfLifeExample(device);
    await runGliderExample(device);

    console.log("╔════════════════════════════════════════════════════════╗");
    console.log("║          All examples completed successfully!         ║");
    console.log("╚════════════════════════════════════════════════════════╝\n");
  } catch (error) {
    console.error("Example failed:", error);
    throw error;
  }
}
