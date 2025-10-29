/**
 * Integration shader - Updates velocity and position from forces and gravity
 */

import { ComputeShader } from "@atlas/webgpu-renderer";

export class IntegrateShader extends ComputeShader {
  commonCode(): string {
    return `
      // RigidBody structure (64 bytes = 16 floats)
      struct RigidBody {
        // Position + rotation + padding (vec4)
        position: vec2f,
        rotation: f32,
        _pad0: f32,

        // Velocity + angular velocity + padding (vec4)
        velocity: vec2f,
        angularVel: f32,
        _pad1: f32,

        // Mass properties (vec4)
        mass: f32,
        invMass: f32,
        inertia: f32,
        invInertia: f32,

        // Material properties (vec4)
        friction: f32,
        restitution: f32,
        linearDamping: f32,
        angularDamping: f32,

        // Gravity + flags + entityId + padding (vec4)
        gravityScale: f32,
        flags: u32,
        entityId: u32,
        _pad2: f32
      }

      // Physics configuration
      struct PhysicsConfig {
        gravity: vec2f,
        deltaTime: f32,
        substeps: u32,
        iterations: u32,
        _pad0: f32,
        _pad1: f32,
        _pad2: f32
      }

      // Flags
      const FLAG_STATIC: u32 = 1u;
      const FLAG_KINEMATIC: u32 = 2u;
      const FLAG_SLEEPING: u32 = 4u;
      const FLAG_CCD: u32 = 8u;
      const FLAG_LOCK_ROTATION: u32 = 16u;
      const FLAG_LOCK_TRANSLATION_X: u32 = 32u;
      const FLAG_LOCK_TRANSLATION_Y: u32 = 64u;
    `;
  }

  shader(): string {
    return `
      @group(0) @binding(0) var<storage, read> bodiesSrc: array<RigidBody>;
      @group(0) @binding(1) var<storage, read_write> bodiesDst: array<RigidBody>;
      @group(0) @binding(2) var<uniform> config: PhysicsConfig;

      @compute @workgroup_size(64)
      fn main(@builtin(global_invocation_id) id: vec3<u32>) {
        let index = id.x;
        if (index >= arrayLength(&bodiesSrc)) {
          return;
        }

        // Read body from source
        var body = bodiesSrc[index];

        // Skip static and kinematic bodies (they don't respond to forces)
        if ((body.flags & FLAG_STATIC) != 0u || (body.flags & FLAG_KINEMATIC) != 0u) {
          bodiesDst[index] = body;
          return;
        }

        // Skip sleeping bodies
        if ((body.flags & FLAG_SLEEPING) != 0u) {
          bodiesDst[index] = body;
          return;
        }

        let dt = config.deltaTime;

        // Apply gravity
        let gravity = config.gravity * body.gravityScale;
        body.velocity += gravity * dt;

        // Apply damping (exponential decay)
        body.velocity *= exp(-body.linearDamping * dt);
        body.angularVel *= exp(-body.angularDamping * dt);

        // Apply locked axes
        if ((body.flags & FLAG_LOCK_TRANSLATION_X) != 0u) {
          body.velocity.x = 0.0;
        }
        if ((body.flags & FLAG_LOCK_TRANSLATION_Y) != 0u) {
          body.velocity.y = 0.0;
        }
        if ((body.flags & FLAG_LOCK_ROTATION) != 0u) {
          body.angularVel = 0.0;
        }

        // Integrate position (semi-implicit Euler)
        body.position += body.velocity * dt;
        body.rotation += body.angularVel * dt;

        // Normalize rotation to [-π, π]
        let PI = 3.14159265359;
        if (body.rotation > PI) {
          body.rotation -= 2.0 * PI;
        } else if (body.rotation < -PI) {
          body.rotation += 2.0 * PI;
        }

        // Write back to destination
        bodiesDst[index] = body;
      }
    `;
  }

  entryPoint(): string {
    return "main";
  }
}
