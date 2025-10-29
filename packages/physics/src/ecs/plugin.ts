/**
 * GPU Physics 2D Plugin
 */

import type { App, EcsPlugin } from "@atlas/core";
import { SystemType } from "@atlas/core";
import { GpuRenderDevice } from "@atlas/webgpu-renderer";
import { PhysicsSettings } from "./resources/physics-settings";
import { PhysicsWorld } from "./resources/physics-world";
import { PhysicsComputeWorker } from "../gpu/workers/physics-compute-worker";
import { processNewBodies } from "./systems/process-new-bodies";
import { stepPhysics } from "./systems/step-physics";
import { syncFromGpu } from "./systems/sync-from-gpu";

/**
 * GPU-accelerated 2D physics engine plugin
 *
 * Provides:
 * - WebGPU compute shader-based physics simulation
 * - Rigid body dynamics (static, kinematic, dynamic)
 * - Collision detection and response
 * - Continuous collision detection (CCD)
 * - Sleeping bodies optimization
 * - Raycasting (future)
 *
 * @example
 * ```ts
 * const settings = new PhysicsSettings();
 * settings.gravity = { x: 0, y: -980 }; // pixels/s²
 * settings.pixelsPerUnit = 100; // 100 pixels = 1 meter
 *
 * await App.create()
 *   .addPlugins(new GpuPhysics2DPlugin(settings))
 *   .run();
 * ```
 */
export class GpuPhysics2DPlugin implements EcsPlugin {
  constructor(private settings = new PhysicsSettings()) {}

  build(app: App): void {
    // Register settings immediately
    app.setResource(this.settings);

    // Register systems in correct phases
    app
      .addSystems(
        SystemType.PreFixedUpdate,
        processNewBodies.build() // Upload new bodies to GPU
      )
      .addSystems(
        SystemType.FixedUpdate,
        stepPhysics.build() // Execute GPU simulation
      )
      .addSystems(
        SystemType.PostFixedUpdate,
        syncFromGpu.build() // Download results to Transform
      );

    console.log("GpuPhysics2DPlugin built");
  }

  /**
   * Check if GPU device is ready
   */
  ready(app: App): boolean {
    const renderDevice = app.tryGetResource(GpuRenderDevice);
    return renderDevice !== undefined;
  }

  /**
   * Initialize physics world after GPU device is ready
   */
  async finish(app: App): Promise<void> {
    // Get GPU device from renderer (guaranteed to exist after ready())
    const renderDevice = app.getResource(GpuRenderDevice);
    const device = renderDevice.get();

    // Create physics world
    const world = new PhysicsWorld(device, this.settings);

    // Build compute worker
    const workerBuilder = new PhysicsComputeWorker(this.settings);
    const worker = workerBuilder.build(device);
    world.setWorker(worker);

    // Register physics world resource
    app.setResource(world);

    console.log("✅ GPU Physics engine initialized");
  }

  name(): string {
    return "GpuPhysics2DPlugin";
  }

  isUnique(): boolean {
    return true;
  }
}
