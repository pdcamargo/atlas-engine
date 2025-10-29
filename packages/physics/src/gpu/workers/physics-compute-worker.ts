/**
 * Physics compute worker - Orchestrates the physics simulation pipeline
 */

import {
  ComputeWorker,
  ComputeWorkerBuilder,
  type ComputeWorkerInstance,
} from "@atlas/webgpu-renderer";
import { IntegrateShader } from "../shaders/integrate";
import type { PhysicsSettings } from "../../ecs/resources/physics-settings";

/**
 * PhysicsComputeWorker manages the multi-pass GPU physics pipeline
 */
export class PhysicsComputeWorker extends ComputeWorker {
  constructor(private readonly settings: PhysicsSettings) {
    super();
  }

  build(device: GPUDevice): ComputeWorkerInstance {
    const bodyFloats = this.settings.maxBodies * 16; // 16 floats per body
    const colliderFloats = this.settings.maxColliders * 32; // 32 floats per collider

    // Initialize buffers with zeros
    const bodyData = new Float32Array(bodyFloats);
    const colliderData = new Float32Array(colliderFloats);

    // Physics config uniform
    const configData = new Float32Array(8);
    configData[0] = this.settings.gravity.x / this.settings.pixelsPerUnit; // Convert to physics units
    configData[1] = this.settings.gravity.y / this.settings.pixelsPerUnit;
    configData[2] = 1 / 60; // deltaTime (will be updated per frame)
    configData[3] = this.settings.substeps;
    configData[4] = this.settings.solverIterations;
    configData[5] = 0; // padding
    configData[6] = 0; // padding
    configData[7] = 0; // padding

    // Calculate workgroup count
    const workgroupSize = 64;
    const workgroupCount = Math.ceil(this.settings.maxBodies / workgroupSize);

    return new ComputeWorkerBuilder(device)
      // Configuration uniform
      .addUniform("config", configData)

      // Bodies (ping-pong buffers for stability)
      .addStorage("bodiesSrc", bodyData)
      .addStaging("bodiesDst", bodyData)

      // Colliders (static, no ping-pong needed yet)
      .addStorage("colliders", colliderData)

      // Integration pass (gravity + damping + position update)
      .addPass(
        IntegrateShader,
        [workgroupCount, 1, 1],
        ["bodiesSrc", "bodiesDst", "config"]
      )

      .build();
  }

  /**
   * Update physics configuration (called per frame)
   */
  updateConfig(
    worker: ComputeWorkerInstance,
    deltaTime: number,
    gravity?: { x: number; y: number }
  ): void {
    const configData = new Float32Array(8);
    configData[0] =
      (gravity?.x ?? this.settings.gravity.x) / this.settings.pixelsPerUnit;
    configData[1] =
      (gravity?.y ?? this.settings.gravity.y) / this.settings.pixelsPerUnit;
    configData[2] = deltaTime;
    configData[3] = this.settings.substeps;
    configData[4] = this.settings.solverIterations;
    configData[5] = 0; // padding
    configData[6] = 0; // padding
    configData[7] = 0; // padding

    worker.write("config", configData);
  }
}
