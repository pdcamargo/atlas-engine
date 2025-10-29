/**
 * System to sync physics results from GPU back to Transform components
 */

import { sys, QueryBuilder, Transform } from "@atlas/core";
import { Sprite } from "@atlas/webgpu-renderer";
import { PhysicsBody } from "../../components/physics-body";
import { RigidBody } from "../../components/rigidbody";
import { Velocity } from "../../components/velocity";
import { PhysicsWorld } from "../resources/physics-world";
import { PhysicsSettings } from "../resources/physics-settings";

// Query for dynamic bodies that need Transform updates
const dynamicBodyQuery = new QueryBuilder(
  PhysicsBody,
  Transform,
  RigidBody,
  Velocity
);

/**
 * Sync physics results from GPU to ECS Transform components
 */
export const syncFromGpu = sys(({ commands }) => {
  const world = commands.getResource(PhysicsWorld);
  const settings = commands.getResource(PhysicsSettings);

  // Use cached snapshot from step-physics system
  const bodies = world.getLastBodiesSnapshot();
  const ppu = settings.pixelsPerUnit;

  commands
    .query(dynamicBodyQuery)
    .forEach((entity, physBody, transform, rb, velocity) => {
      // Skip static bodies (they never move)
      if (rb.type === "static") {
        return;
      }

      // Read from GPU buffer
      // Each body is 16 floats
      const offset = physBody.bufferIndex * 16;

      const posX = bodies[offset + 0];
      const posY = bodies[offset + 1];
      const rotation = bodies[offset + 2];

      const velX = bodies[offset + 4];
      const velY = bodies[offset + 5];
      const angularVel = bodies[offset + 6];

      // Update Transform (convert physics units back to world units)
      transform.position.x = posX * ppu;
      transform.position.y = posY * ppu;

      // Convert rotation from radians to quaternion (2D rotation around Z-axis)
      const halfAngle = rotation / 2;
      const sinHalf = Math.sin(halfAngle);
      const cosHalf = Math.cos(halfAngle);
      transform.rotation.x = 0;
      transform.rotation.y = 0;
      transform.rotation.z = sinHalf;
      transform.rotation.w = cosHalf;

      // Update Velocity component (for user code access)
      velocity.linear.x = velX * ppu;
      velocity.linear.y = velY * ppu;
      velocity.angular = angularVel;

      // Update Sprite position if present (Sprite has its own transform)
      const sprite = commands.tryGetComponent(entity, Sprite);
      if (sprite) {
        sprite.setPosition({
          x: posX * ppu,
          y: posY * ppu,
          z: sprite.position.z, // Keep existing Z
        });
        sprite.setRotation(rotation); // Rotation in radians
      }
    });
}).label("SyncFromGpu");
