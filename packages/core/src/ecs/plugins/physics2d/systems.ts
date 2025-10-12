import { sys } from "../../system_builder";
import * as RAPIER from "@dimforge/rapier2d";
import {
  Collider2D,
  Collider2DHandle,
  Damping,
  GravityScale,
  RigidBody2DHandle,
  Sensor,
  Velocity,
} from "./components";
import {
  rigidBody2DToUpdateTransformQuery,
  unprocessedColliders2DQuery,
  unprocessedRigidBodies2DQuery,
} from "./queries";
import { Physics2DWorld, Physics2DWorldSettings } from "./resources";
import { QueryBuilder, Renderer2D, SceneGraph } from "../../..";

export const processColliders = sys(({ commands }) => {
  const world = commands.getResource(Physics2DWorld);
  const settings = commands.getResource(Physics2DWorldSettings);
  const ppu = settings.pixelPerUnit;

  commands
    .query(unprocessedColliders2DQuery)
    .forEach((entityId, collider2D, transform) => {
      console.log("processing collider", entityId);

      if (!entityId) {
        return;
      }

      const staticBodyDesc = RAPIER.RigidBodyDesc.fixed();
      const staticBody = world.createRigidBody(staticBodyDesc);

      staticBody.setTranslation(
        {
          x: transform.position.x / ppu,
          y: transform.position.y / ppu,
        },
        false
      );

      staticBody.setRotation(transform.rotation * (Math.PI / 180), false);
      staticBody.setLinvel({ x: 0, y: 0 }, false);
      staticBody.setAngvel(0, false);

      let colliderDesc: RAPIER.ColliderDesc | null = null;

      if (collider2D.shape.kind === "rect") {
        colliderDesc = RAPIER.ColliderDesc.cuboid(
          collider2D.shape.width / 2 / ppu,
          collider2D.shape.height / 2 / ppu
        );
      } else if (collider2D.shape.kind === "circle") {
        colliderDesc = RAPIER.ColliderDesc.ball(collider2D.shape.radius / ppu);
      } else if (collider2D.shape.kind === "polygon") {
        const flat = new Float32Array(collider2D.shape.points.length * 2);
        for (let i = 0; i < collider2D.shape.points.length; i++) {
          flat[i * 2] = collider2D.shape.points[i].x / ppu;
          flat[i * 2 + 1] = collider2D.shape.points[i].y / ppu;
        }
        colliderDesc =
          RAPIER.ColliderDesc.convexHull(flat) ??
          RAPIER.ColliderDesc.convexPolyline(flat)!;
      }

      colliderDesc?.setSensor(commands.hasComponent(entityId, Sensor));

      if (colliderDesc) {
        if (collider2D.offset) {
          colliderDesc.setTranslation(
            collider2D.offset.x / ppu,
            collider2D.offset.y / ppu
          );
        }

        world.createCollider(colliderDesc, staticBody);
        commands.addComponents(
          entityId,
          new Collider2DHandle(staticBody.handle)
        );
      }
    });
});

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

      if (rigidBody2D.fixedRotation) {
        bodyDesc.lockRotations();
      }

      const gravityScale = commands.tryGetComponent(entityId, GravityScale);
      if (gravityScale) {
        bodyDesc.setGravityScale(gravityScale.gravityScale);
      }

      const damping = commands.tryGetComponent(entityId, Damping);
      if (damping) {
        if (damping.linearDamping !== undefined) {
          bodyDesc.setLinearDamping(damping.linearDamping);
        }
        if (damping.angularDamping !== undefined) {
          bodyDesc.setAngularDamping(damping.angularDamping);
        }
      }

      // Initial velocity if present
      const vel = commands.tryGetComponent(entityId, Velocity);
      if (vel) bodyDesc.setLinvel(vel.linvel.x / ppu, vel.linvel.y / ppu);

      const body = world.createRigidBody(bodyDesc);

      // Create collider if present
      const col = commands.tryGetComponent(entityId, Collider2D);
      if (col) {
        let colliderDesc: RAPIER.ColliderDesc | null = null;
        if (col.shape.kind === "circle") {
          colliderDesc = RAPIER.ColliderDesc.ball(col.shape.radius / ppu);
        } else if (col.shape.kind === "rect") {
          // Rapier cuboid takes half extents
          colliderDesc = RAPIER.ColliderDesc.cuboid(
            col.shape.width / 2 / ppu,
            col.shape.height / 2 / ppu
          );
        } else if (col.shape.kind === "polygon") {
          const flat = new Float32Array(col.shape.points.length * 2);
          for (let i = 0; i < col.shape.points.length; i++) {
            flat[i * 2] = col.shape.points[i].x / ppu;
            flat[i * 2 + 1] = col.shape.points[i].y / ppu;
          }
          colliderDesc =
            RAPIER.ColliderDesc.convexHull(flat) ??
            RAPIER.ColliderDesc.convexPolyline(flat)!;
        }

        if (colliderDesc) {
          colliderDesc.setSensor(commands.hasComponent(entityId, Sensor));
          if (col.density !== undefined) colliderDesc.setDensity(col.density);
          if (col.friction !== undefined)
            colliderDesc.setFriction(col.friction);
          if (col.restitution !== undefined)
            colliderDesc.setRestitution(col.restitution);

          if (col.offset) {
            colliderDesc.setTranslation(col.offset.x / ppu, col.offset.y / ppu);
          }

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
      transform.setRotation(rotation * (180 / Math.PI));
    });
})
  .label("update-transforms")
  .afterLabel("step-world");

const velocityQuery = new QueryBuilder(Velocity, RigidBody2DHandle);

export const applyVelocities = sys(({ commands }) => {
  const world = commands.getResource(Physics2DWorld);
  const settings = commands.getResource(Physics2DWorldSettings);
  const ppu = settings.pixelPerUnit;

  commands.query(velocityQuery).forEach((_, v, handle) => {
    const body = world.getRigidBody(handle.handle);

    if (!body) {
      return;
    }

    body.setLinvel({ x: v.linvel.x / ppu, y: v.linvel.y / ppu }, true);

    if (v.angvel) {
      body.setAngvel(v.angvel, true);
    }
  });
})
  .label("apply-velocities")
  .afterLabel("process-rigid-bodies");

import * as PIXI from "pixi.js";
let lines: PIXI.Graphics | null = null;

export const debugDraw = sys(({ commands }) => {
  const world = commands.getResource(Physics2DWorld);
  const sceneGraph = commands.getResource(SceneGraph);

  const { vertices, colors } = world.debugRender();

  const ppu = 100;

  if (!lines) {
    lines = new PIXI.Graphics();
    sceneGraph.addChild(lines, 5);
  }

  lines.clear();

  for (let i = 0; i < vertices.length / 4; i += 1) {
    let color = rgb2hex([colors[i * 8], colors[i * 8 + 1], colors[i * 8 + 2]]);

    lines.lineStyle(1.0, color, colors[i * 8 + 3]);
    lines.moveTo(vertices[i * 4] * ppu, -vertices[i * 4 + 1] * ppu);
    lines.lineTo(vertices[i * 4 + 2] * ppu, -vertices[i * 4 + 3] * ppu);
  }
})
  .label("debug-draw")
  .afterLabel("step-world");

function rgb2hex(arg0: [number, number, number]) {
  return new PIXI.Color({ r: arg0[0], g: arg0[1], b: arg0[2] });
}
