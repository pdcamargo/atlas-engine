/**
 * System to execute the GPU physics simulation
 */

import { sys, Time } from "@atlas/core";
import { PhysicsWorld } from "../resources/physics-world";
import { PhysicsSettings } from "../resources/physics-settings";
import { PhysicsComputeWorker } from "../../gpu/workers/physics-compute-worker";

let workerBuilder: PhysicsComputeWorker | null = null;
let isExecuting = false; // Prevent concurrent executions

/**
 * Execute the GPU physics simulation pipeline
 */
export const stepPhysics = sys(async ({ commands }) => {
  // Skip if previous frame is still executing
  if (isExecuting) {
    return;
  }

  isExecuting = true;

  try {
    const world = commands.getResource(PhysicsWorld);
    const settings = commands.getResource(PhysicsSettings);

    // Initialize worker on first run
    if (!workerBuilder) {
      workerBuilder = new PhysicsComputeWorker(settings);
    }

    // Update config with current delta time
    workerBuilder.updateConfig(world.worker, 1 / 60);

    // Execute compute pipeline
    await world.worker.execute();

    // Read results from GPU
    const bodies = await world.worker.readTypedArray("bodiesDst", Float32Array);

    // Cache snapshot for sync system
    world.updateBodiesSnapshot(bodies);

    // Ping-pong buffers: copy destination to source for next frame
    world.worker.write("bodiesSrc", bodies);
  } finally {
    isExecuting = false;
  }
}).label("StepPhysics");
