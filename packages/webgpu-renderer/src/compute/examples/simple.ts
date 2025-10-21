/**
 * Simple Compute Example
 *
 * This example demonstrates basic compute shader usage:
 * - Creating a simple compute shader
 * - Adding uniform and staging buffers
 * - Executing a compute pass
 * - Reading results back to the CPU
 *
 * The shader adds a uniform value to each element in an array.
 */

import {
  ComputeShader,
  ComputeWorker,
  ComputeWorkerBuilder,
  type ComputeWorkerInstance,
} from "../index";

/**
 * Simple compute shader that adds a uniform value to each element
 */
class SimpleComputeShader extends ComputeShader {
  shader() {
    return `
      @group(0) @binding(0)
      var<uniform> uni: f32;

      @group(0) @binding(1)
      var<storage, read_write> values: array<f32>;

      @compute @workgroup_size(1)
      fn main(@builtin(global_invocation_id) invocation_id: vec3<u32>) {
        if (invocation_id.x < arrayLength(&values)) {
          values[invocation_id.x] = values[invocation_id.x] + uni;
        }
      }
    `;
  }
}

/**
 * Simple compute worker that processes an array of values
 */
class SimpleComputeWorker extends ComputeWorker {
  build(device: GPUDevice): ComputeWorkerInstance<this> {
    return new ComputeWorkerBuilder(device)
      // Add a uniform variable
      .addUniform("uni", 5.0)

      // Add a staging buffer - available from both CPU and GPU
      .addStaging("values", [1.0, 2.0, 3.0, 4.0])

      // Create a compute pass from the shader
      // Dispatch 4 workgroups (one per element)
      .addPass(SimpleComputeShader, [4, 1, 1], ["uni", "values"])
      .build();
  }
}

/**
 * Example usage
 */
export async function runSimpleExample(device: GPUDevice): Promise<void> {
  console.log("=== Simple Compute Example ===");

  // Create and build the worker
  const worker = new SimpleComputeWorker().build(device);

  // Execute the compute shader
  await worker.execute();

  // Read the results
  const result = await worker.readVec("values");
  console.log("Result:", result); // [6.0, 7.0, 8.0, 9.0]

  // Update the uniform and run again
  worker.write("uni", 10.0);
  await worker.execute();

  const result2 = await worker.readVec("values");
  console.log("Result after second execution:", result2); // [16.0, 17.0, 18.0, 19.0]

  // Clean up
  worker.destroy();
  console.log("Simple example completed!\n");
}
