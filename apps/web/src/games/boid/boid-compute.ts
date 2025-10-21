/**
 * Boid Flocking Simulation - Compute Shader
 *
 * Implements Craig Reynolds' Boids algorithm on the GPU:
 * 1. Separation: Steer to avoid crowding local flockmates
 * 2. Alignment: Steer towards the average heading of local flockmates
 * 3. Cohesion: Steer to move toward the average position of local flockmates
 */

import {
  ComputeShader,
  ComputeWorker,
  ComputeWorkerBuilder,
  type ComputeWorkerInstance,
} from "@atlas/engine";

/**
 * Boid data structure shader code (shared between update and rendering)
 */
export const boidStructCode = `
  struct Boid {
    position: vec2f,
    velocity: vec2f,
  }

  struct SimParams {
    deltaTime: f32,
    separationDistance: f32,
    alignmentDistance: f32,
    cohesionDistance: f32,
    separationScale: f32,
    alignmentScale: f32,
    cohesionScale: f32,
    maxSpeed: f32,
    maxForce: f32,
    boundarySize: f32,
    boundaryMargin: f32,
    boundaryTurnFactor: f32,
  }
`;

/**
 * Boid update compute shader implementing flocking behavior
 */
export class BoidUpdateShader extends ComputeShader {
  commonCode() {
    return boidStructCode;
  }

  shader() {
    return `
      @group(0) @binding(0) var<uniform> params: SimParams;
      @group(0) @binding(1) var<storage, read> boidsSrc: array<Boid>;
      @group(0) @binding(2) var<storage, read_write> boidsDst: array<Boid>;

      // Helper function to clamp vector length
      fn clamp_length(v: vec2f, max_length: f32) -> vec2f {
        let len = length(v);
        if (len > max_length) {
          return normalize(v) * max_length;
        }
        return v;
      }

      @compute @workgroup_size(64)
      fn main(@builtin(global_invocation_id) global_id: vec3<u32>) {
        let total = arrayLength(&boidsSrc);
        let index = global_id.x;

        if (index >= total) {
          return;
        }

        var boid = boidsSrc[index];
        var pos = boid.position;
        var vel = boid.velocity;

        // Flocking forces
        var separation = vec2f(0.0, 0.0);
        var alignment = vec2f(0.0, 0.0);
        var cohesion = vec2f(0.0, 0.0);

        var separationCount = 0u;
        var alignmentCount = 0u;
        var cohesionCount = 0u;

        // Check neighbors
        for (var i = 0u; i < total; i = i + 1u) {
          if (i == index) {
            continue;
          }

          let other = boidsSrc[i];
          let diff = pos - other.position;
          let dist = length(diff);

          // Separation: avoid crowding
          if (dist < params.separationDistance && dist > 0.0) {
            separation += diff / dist;
            separationCount += 1u;
          }

          // Alignment: align with neighbors' velocity
          if (dist < params.alignmentDistance) {
            alignment += other.velocity;
            alignmentCount += 1u;
          }

          // Cohesion: move toward center of mass
          if (dist < params.cohesionDistance) {
            cohesion += other.position;
            cohesionCount += 1u;
          }
        }

        // Calculate steering forces
        var steer = vec2f(0.0, 0.0);

        // Separation
        if (separationCount > 0u) {
          separation = separation / f32(separationCount);
          if (length(separation) > 0.0) {
            separation = normalize(separation) * params.maxSpeed;
            separation = separation - vel;
            separation = clamp_length(separation, params.maxForce);
          }
          steer += separation * params.separationScale;
        }

        // Alignment
        if (alignmentCount > 0u) {
          alignment = alignment / f32(alignmentCount);
          if (length(alignment) > 0.0) {
            alignment = normalize(alignment) * params.maxSpeed;
            alignment = alignment - vel;
            alignment = clamp_length(alignment, params.maxForce);
          }
          steer += alignment * params.alignmentScale;
        }

        // Cohesion
        if (cohesionCount > 0u) {
          cohesion = cohesion / f32(cohesionCount);
          var desired = cohesion - pos;
          if (length(desired) > 0.0) {
            desired = normalize(desired) * params.maxSpeed;
            desired = desired - vel;
            desired = clamp_length(desired, params.maxForce);
          }
          steer += desired * params.cohesionScale;
        }

        // Apply steering
        vel += steer;

        // Limit speed
        vel = clamp_length(vel, params.maxSpeed);

        // Update position
        pos += vel * params.deltaTime;

        // Boundary handling (soft boundaries with turning)
        let halfBounds = params.boundarySize * 0.5;

        if (pos.x < -halfBounds + params.boundaryMargin) {
          vel.x += params.boundaryTurnFactor * params.deltaTime;
        }
        if (pos.x > halfBounds - params.boundaryMargin) {
          vel.x -= params.boundaryTurnFactor * params.deltaTime;
        }
        if (pos.y < -halfBounds + params.boundaryMargin) {
          vel.y += params.boundaryTurnFactor * params.deltaTime;
        }
        if (pos.y > halfBounds - params.boundaryMargin) {
          vel.y -= params.boundaryTurnFactor * params.deltaTime;
        }

        // Hard boundary wrap (backup)
        if (pos.x < -halfBounds) {
          pos.x = halfBounds;
        }
        if (pos.x > halfBounds) {
          pos.x = -halfBounds;
        }
        if (pos.y < -halfBounds) {
          pos.y = halfBounds;
        }
        if (pos.y > halfBounds) {
          pos.y = -halfBounds;
        }

        // Write back
        boidsDst[index] = Boid(pos, vel);
      }
    `;
  }
}

/**
 * Simulation parameters for the boid flocking algorithm
 */
export interface BoidSimParams {
  deltaTime: number;
  separationDistance: number;
  alignmentDistance: number;
  cohesionDistance: number;
  separationScale: number;
  alignmentScale: number;
  cohesionScale: number;
  maxSpeed: number;
  maxForce: number;
  boundarySize: number;
  boundaryMargin: number;
  boundaryTurnFactor: number;
}

/**
 * Default boid simulation parameters
 */
export const DEFAULT_BOID_PARAMS: BoidSimParams = {
  deltaTime: 0.016,
  separationDistance: 0.15,
  alignmentDistance: 0.3,
  cohesionDistance: 0.3,
  separationScale: 1.5,
  alignmentScale: 1.0,
  cohesionScale: 1.0,
  maxSpeed: 1,
  maxForce: 0.05,
  boundarySize: 4.0,
  boundaryMargin: 0.5,
  boundaryTurnFactor: 5.0,
};

/**
 * Boid compute worker managing the flocking simulation
 */
export class BoidComputeWorker extends ComputeWorker {
  constructor(
    private boidCount: number,
    private params: BoidSimParams = DEFAULT_BOID_PARAMS
  ) {
    super();
  }

  build(device: GPUDevice): ComputeWorkerInstance<this> {
    // Create initial boid data
    const boidData = new Float32Array(this.boidCount * 4); // 4 floats per boid (pos.xy, vel.xy)

    // Initialize boids with random positions and velocities
    for (let i = 0; i < this.boidCount; i++) {
      const offset = i * 4;

      // Random position within bounds
      const halfBounds = this.params.boundarySize * 0.5;
      boidData[offset + 0] =
        (Math.random() - 0.5) * this.params.boundarySize * 0.8; // x
      boidData[offset + 1] =
        (Math.random() - 0.5) * this.params.boundarySize * 0.8; // y

      // Random velocity
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * this.params.maxSpeed * 0.5;
      boidData[offset + 2] = Math.cos(angle) * speed; // vx
      boidData[offset + 3] = Math.sin(angle) * speed; // vy
    }

    // Pack simulation parameters
    const paramsData = new Float32Array([
      this.params.deltaTime,
      this.params.separationDistance,
      this.params.alignmentDistance,
      this.params.cohesionDistance,
      this.params.separationScale,
      this.params.alignmentScale,
      this.params.cohesionScale,
      this.params.maxSpeed,
      this.params.maxForce,
      this.params.boundarySize,
      this.params.boundaryMargin,
      this.params.boundaryTurnFactor,
    ]);

    return new ComputeWorkerBuilder(device)
      .addUniform("params", paramsData)
      .addStorage("boidsSrc", boidData)
      .addStaging("boidsDst", boidData)
      .addPass(
        BoidUpdateShader,
        [Math.ceil(this.boidCount / 64), 1, 1],
        ["params", "boidsSrc", "boidsDst"]
      )
      .build();
  }

  /**
   * Update simulation parameters
   */
  updateParams(worker: ComputeWorkerInstance, params: Partial<BoidSimParams>) {
    this.params = { ...this.params, ...params };

    const paramsData = new Float32Array([
      this.params.deltaTime,
      this.params.separationDistance,
      this.params.alignmentDistance,
      this.params.cohesionDistance,
      this.params.separationScale,
      this.params.alignmentScale,
      this.params.cohesionScale,
      this.params.maxSpeed,
      this.params.maxForce,
      this.params.boundarySize,
      this.params.boundaryMargin,
      this.params.boundaryTurnFactor,
    ]);

    worker.write("params", paramsData);
  }
}
