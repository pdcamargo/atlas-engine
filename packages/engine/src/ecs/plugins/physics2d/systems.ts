import { sys } from "../../system_builder";
import * as RAPIER from "@dimforge/rapier2d";
import { Collider2D, RigidBody2DHandle, Velocity } from "./components";
import {
  rigidBody2DToUpdateTransformQuery,
  unprocessedRigidBodies2DQuery,
} from "./queries";
import { Physics2DWorld, Physics2DWorldSettings } from "./resources";

export const processRigidBodies = sys(({ commands }) => {
  const world = commands.getResource(Physics2DWorld);
  const settings = commands.getResource(Physics2DWorldSettings);
  const ppu = settings.pixelPerUnit;

  commands
    .query(unprocessedRigidBodies2DQuery)
    .forEach((entityId, rigidBody2D, transform) => {
      // Build body desc from component
      let bodyDesc: RAPIER.RigidBodyDesc;
      switch (rigidBody2D.type) {
        case "dynamic":
          bodyDesc = RAPIER.RigidBodyDesc.dynamic();
          break;
        case "kinematicPosition":
          bodyDesc = RAPIER.RigidBodyDesc.kinematicPositionBased();
          break;
        case "kinematicVelocity":
          bodyDesc = RAPIER.RigidBodyDesc.kinematicVelocityBased();
          break;
        case "fixed":
        default:
          bodyDesc = RAPIER.RigidBodyDesc.fixed();
          break;
      }

      bodyDesc.setTranslation(
        transform.position.x / ppu,
        transform.position.y / ppu
      );
      bodyDesc.setRotation(transform.rotation * (Math.PI / 180));

      if (rigidBody2D.gravityScale !== undefined)
        bodyDesc.setGravityScale(rigidBody2D.gravityScale);
      if (rigidBody2D.linearDamping !== undefined)
        bodyDesc.setLinearDamping(rigidBody2D.linearDamping);
      if (rigidBody2D.angularDamping !== undefined)
        bodyDesc.setAngularDamping(rigidBody2D.angularDamping);

      // Initial velocity if present
      const vel = commands.tryGetComponent(entityId, Velocity);
      if (vel) bodyDesc.setLinvel(vel.linvel.x / ppu, vel.linvel.y / ppu);

      const body = world.createRigidBody(bodyDesc);

      // Create collider if present
      const col = commands.tryGetComponent(entityId, Collider2D);
      if (col) {
        let colliderDesc: RAPIER.ColliderDesc | null = null;
        if (col.shape.kind === "circle") {
          colliderDesc = RAPIER.ColliderDesc.ball(col.shape.radius);
        } else if (col.shape.kind === "rect") {
          // Rapier cuboid takes half extents
          colliderDesc = RAPIER.ColliderDesc.cuboid(
            col.shape.width / 2,
            col.shape.height / 2
          );
        } else if (col.shape.kind === "polygon") {
          const flat = new Float32Array(col.shape.points.length * 2);
          for (let i = 0; i < col.shape.points.length; i++) {
            flat[i * 2] = col.shape.points[i].x;
            flat[i * 2 + 1] = col.shape.points[i].y;
          }
          colliderDesc =
            RAPIER.ColliderDesc.convexHull(flat) ??
            RAPIER.ColliderDesc.convexPolyline(flat)!;
        }

        if (colliderDesc) {
          if (col.density !== undefined) colliderDesc.setDensity(col.density);
          if (col.friction !== undefined)
            colliderDesc.setFriction(col.friction);
          if (col.restitution !== undefined)
            colliderDesc.setRestitution(col.restitution);

          world.createCollider(colliderDesc, body);
        }
      }

      commands.addComponents(entityId, new RigidBody2DHandle(body.handle));
    });
}).label("process-rigid-bodies");

export const stepWorld = sys(({ commands }) => {
  const physics2dWorld = commands.getResource(Physics2DWorld);
  const settings = commands.getResource(Physics2DWorldSettings);
  physics2dWorld.setLengthUnit(settings.pixelPerUnit);
  physics2dWorld.step();
}).label("step-world");

export const syncRigidbodiesTransforms = sys(({ commands }) => {
  const physics2dWorld = commands.getResource(Physics2DWorld);
  const settings = commands.getResource(Physics2DWorldSettings);
  const ppu = settings.pixelPerUnit;

  commands
    .query(rigidBody2DToUpdateTransformQuery)
    .forEach((_, transform, rigidBodyHandle) => {
      const rigidBody = physics2dWorld.getRigidBody(rigidBodyHandle.handle);

      if (!rigidBody) {
        return;
      }

      const translation = rigidBody.translation();
      const rotation = rigidBody.rotation();

      transform.setPosition({ x: translation.x * ppu, y: translation.y * ppu });
      // Rapier rotation is radians; Transform expects degrees
      transform.setRotation((rotation as unknown as number) * (180 / Math.PI));
    });
})
  .label("update-transforms")
  .afterLabel("step-world");

export const applyVelocities = sys(({ commands }) => {
  const world = commands.getResource(Physics2DWorld);
  const settings = commands.getResource(Physics2DWorldSettings);
  const ppu = settings.pixelPerUnit;

  commands.query(Velocity, RigidBody2DHandle).forEach((_, v, handle) => {
    const body = world.getRigidBody(handle.handle);
    if (!body) return;
    body.setLinvel({ x: v.linvel.x / ppu, y: v.linvel.y / ppu } as any, true);
    if (v.angvel) body.setAngvel(v.angvel, true);
  });
})
  .label("apply-velocities")
  .afterLabel("process-rigid-bodies");
