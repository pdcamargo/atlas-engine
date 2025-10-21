/**
 * One-Shot Compute Example
 *
 * This example demonstrates on-demand execution of compute shaders:
 * - Workers configured with .oneShot() only execute when explicitly triggered
 * - Useful for operations that don't need to run every frame
 * - Examples: batch processing, user-triggered effects, one-time calculations
 */

import {
  ComputeShader,
  ComputeWorker,
  ComputeWorkerBuilder,
  type ComputeWorkerInstance,
} from "../index";

/**
 * Compute shader that doubles each value
 */
class DoubleShader extends ComputeShader {
  shader() {
    return `
      @group(0) @binding(0)
      var<storage, read_write> data: array<f32>;

      @compute @workgroup_size(64)
      fn main(@builtin(global_invocation_id) invocation_id: vec3<u32>) {
        if (invocation_id.x < arrayLength(&data)) {
          data[invocation_id.x] = data[invocation_id.x] * 2.0;
        }
      }
    `;
  }
}

/**
 * One-shot compute worker
 */
class OneShotComputeWorker extends ComputeWorker {
  build(device: GPUDevice): ComputeWorkerInstance<this> {
    return new ComputeWorkerBuilder(device)
      .addStaging("data", [1.0, 2.0, 3.0, 4.0, 5.0, 6.0, 7.0, 8.0])
      .addPass(DoubleShader, [1, 1, 1], ["data"]) // Single workgroup with 64 threads
      // Mark as one-shot - won't execute unless explicitly called
      .oneShot()
      .build();
  }
}

/**
 * Simulate user input or event trigger
 */
async function simulateUserClick(
  worker: ComputeWorkerInstance,
  clickNumber: number
): Promise<void> {
  console.log(`\n[Click ${clickNumber}] User clicked button - executing compute shader`);

  await worker.execute();

  const result = await worker.readVec("data");
  console.log(`[Click ${clickNumber}] Result:`, result);
}

/**
 * Example usage
 */
export async function runOneShotExample(device: GPUDevice): Promise<void> {
  console.log("=== One-Shot Compute Example ===");
  console.log("This worker only executes when explicitly triggered\n");

  // Create the worker
  const worker = new OneShotComputeWorker().build(device);

  console.log("Initial data: [1, 2, 3, 4, 5, 6, 7, 8]");

  // Simulate multiple user interactions
  await simulateUserClick(worker, 1); // [2, 4, 6, 8, 10, 12, 14, 16]
  await simulateUserClick(worker, 2); // [4, 8, 12, 16, 20, 24, 28, 32]
  await simulateUserClick(worker, 3); // [8, 16, 24, 32, 40, 48, 56, 64]

  console.log("\nNote: Worker only executed when explicitly called");
  console.log("Perfect for user-triggered operations or batch processing");

  // Reset data for another operation
  console.log("\nResetting data to [100, 200, 300, 400, 500, 600, 700, 800]");
  worker.write("data", [100.0, 200.0, 300.0, 400.0, 500.0, 600.0, 700.0, 800.0]);

  await simulateUserClick(worker, 4); // [200, 400, 600, 800, 1000, 1200, 1400, 1600]

  // Clean up
  worker.destroy();
  console.log("\nOne-shot example completed!\n");
}

/**
 * Example: Conditional execution based on state
 */
export async function conditionalExecutionExample(
  device: GPUDevice
): Promise<void> {
  console.log("=== Conditional Execution Pattern ===");

  const worker = new OneShotComputeWorker().build(device);

  // Simulate frame loop with conditional execution
  for (let frame = 0; frame < 10; frame++) {
    // Only execute every 3 frames
    if (frame % 3 === 0) {
      console.log(`Frame ${frame}: Executing compute shader`);
      await worker.execute();
    } else {
      console.log(`Frame ${frame}: Skipping (not needed this frame)`);
    }
  }

  const finalResult = await worker.readVec("data");
  console.log("Final result after selective execution:", finalResult);

  worker.destroy();
  console.log("Conditional execution example completed!\n");
}
