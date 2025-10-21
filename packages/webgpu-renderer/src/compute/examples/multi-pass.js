/**
 * Multi-Pass Compute Example
 *
 * This example demonstrates chaining multiple compute passes:
 * - First pass: Add a value to each input element
 * - Second pass: Multiply each element by itself (square)
 *
 * The output of the first pass becomes the input of the second pass
 * without copying data back to the CPU in between.
 *
 * Input: [1, 2, 3, 4]
 * After first pass: [1+3, 2+3, 3+3, 4+3] = [4, 5, 6, 7]
 * After second pass: [4*4, 5*5, 6*6, 7*7] = [16, 25, 36, 49]
 */
import { ComputeShader, ComputeWorker, ComputeWorkerBuilder, } from "../index";
/**
 * First pass: Add value to each element from input to output
 */
class FirstPassShader extends ComputeShader {
    shader() {
        return `
      @group(0) @binding(0)
      var<uniform> value: f32;

      @group(0) @binding(1)
      var<storage> input: array<f32>;

      @group(0) @binding(2)
      var<storage, read_write> output: array<f32>;

      @compute @workgroup_size(1)
      fn main(@builtin(global_invocation_id) invocation_id: vec3<u32>) {
        if (invocation_id.x < arrayLength(&input)) {
          output[invocation_id.x] = input[invocation_id.x] + value;
        }
      }
    `;
    }
}
/**
 * Second pass: Square each element in-place
 */
class SecondPassShader extends ComputeShader {
    shader() {
        return `
      @group(0) @binding(0)
      var<storage, read_write> output: array<f32>;

      @compute @workgroup_size(1)
      fn main(@builtin(global_invocation_id) invocation_id: vec3<u32>) {
        if (invocation_id.x < arrayLength(&output)) {
          let val = output[invocation_id.x];
          output[invocation_id.x] = val * val;
        }
      }
    `;
    }
}
/**
 * Multi-pass compute worker
 */
class MultiPassComputeWorker extends ComputeWorker {
    build(device) {
        return new ComputeWorkerBuilder(device)
            .addUniform("value", 3.0)
            .addStorage("input", [1.0, 2.0, 3.0, 4.0])
            .addStaging("output", [0.0, 0.0, 0.0, 0.0])
            // First pass: add 'value' from 'input' to 'output'
            .addPass(FirstPassShader, [4, 1, 1], ["value", "input", "output"])
            // Second pass: square each element of 'output'
            .addPass(SecondPassShader, [4, 1, 1], ["output"])
            .build();
    }
}
/**
 * Example usage
 */
export async function runMultiPassExample(device) {
    console.log("=== Multi-Pass Compute Example ===");
    // Create and build the worker
    const worker = new MultiPassComputeWorker().build(device);
    // Execute both passes in sequence
    await worker.execute();
    // Read the final result
    const result = await worker.readVec("output");
    console.log("Input:  [1, 2, 3, 4]");
    console.log("After first pass (add 3): [4, 5, 6, 7]");
    console.log("After second pass (square):", result); // [16, 25, 36, 49]
    // We can also modify buffers and re-run
    worker.write("value", 1.0); // Change the additive value
    worker.write("input", [10.0, 20.0, 30.0, 40.0]); // New input
    await worker.execute();
    const result2 = await worker.readVec("output");
    console.log("\nWith new input [10, 20, 30, 40] and value=1:");
    console.log("Result:", result2); // [121, 441, 961, 1681] = [(10+1)^2, (20+1)^2, ...]
    // Clean up
    worker.destroy();
    console.log("Multi-pass example completed!\n");
}
