/**
 * System to process newly added physics bodies and upload to GPU
 */

import { sys, QueryBuilder, Transform } from "@atlas/core";
import { RigidBody } from "../../components/rigidbody";
import { Collider } from "../../components/collider";
import { Velocity } from "../../components/velocity";
import { PhysicsBody } from "../../components/physics-body";
import { ContinuousCollision } from "../../components/ccd";
import { Sleeping } from "../../components/sleeping";
import { PhysicsWorld } from "../resources/physics-world";
import { PhysicsSettings } from "../resources/physics-settings";
import {
  RigidBodyFlags,
  ShapeType,
  type GpuRigidBody,
  type GpuCollider,
} from "../../gpu/types";
import {
  CircleShape,
  RectShape,
  CapsuleShape,
  PolygonShape,
} from "../../components/shapes";

// Query for new bodies that haven't been uploaded to GPU yet
const newBodyQuery = new QueryBuilder(RigidBody, Collider, Transform).without(
  PhysicsBody
);

/**
 * Process new physics bodies and upload them to GPU
 */
export const processNewBodies = sys(({ commands }) => {
  const world = commands.getResource(PhysicsWorld);
  const settings = commands.getResource(PhysicsSettings);

  const entities = commands.query(newBodyQuery).all();

  if (entities.length > 0) {
    console.log(`🔄 Processing ${entities.length} new physics bodies`);
  }

  for (const [entity, rb, collider, transform] of entities) {
    // Allocate buffer slot
    const bufferIndex = world.allocateBodySlot(entity);

    // Get optional velocity component
    const velocity = commands.tryGetComponent(entity, Velocity);
    const ccd = commands.tryGetComponent(entity, ContinuousCollision);
    const sleeping = commands.tryGetComponent(entity, Sleeping);

    // Convert position from world units to physics units
    const ppu = settings.pixelsPerUnit;
    const posX = transform.position.x / ppu;
    const posY = transform.position.y / ppu;

    // Convert rotation from degrees to radians
    // Transform rotation is stored as Quaternion, extract Z rotation
    const rotation = Math.atan2(
      2 * (transform.rotation.w * transform.rotation.z),
      1 - 2 * transform.rotation.z * transform.rotation.z
    );

    // Calculate mass properties
    const mass = rb.massOverride ?? collider.getMass();
    const inertia = collider.getInertia();

    // Build flags bitfield
    let flags = RigidBodyFlags.None;
    if (rb.type === "static") flags |= RigidBodyFlags.Static;
    if (rb.type === "kinematic") flags |= RigidBodyFlags.Kinematic;
    if (rb.lockRotation) flags |= RigidBodyFlags.LockRotation;
    if (rb.lockTranslation.x) flags |= RigidBodyFlags.LockTranslationX;
    if (rb.lockTranslation.y) flags |= RigidBodyFlags.LockTranslationY;
    if (ccd?.enabled) flags |= RigidBodyFlags.CCD;
    if (sleeping?.isSleeping) flags |= RigidBodyFlags.Sleeping;

    // Upload rigid body to GPU
    const bodyData: Partial<GpuRigidBody> = {
      position: [posX, posY],
      rotation,
      velocity: velocity
        ? [velocity.linear.x / ppu, velocity.linear.y / ppu]
        : [0, 0],
      angularVel: velocity?.angular ?? 0,
      mass: rb.type === "static" ? 0 : mass,
      invMass: rb.type === "static" ? 0 : 1 / mass,
      inertia: rb.type === "static" ? 0 : inertia,
      invInertia: rb.type === "static" ? 0 : 1 / inertia,
      friction: collider.friction,
      restitution: collider.restitution,
      linearDamping: rb.linearDamping,
      angularDamping: rb.angularDamping,
      gravityScale: rb.gravityScale,
      flags,
      entityId: entity,
    };

    world.uploadBody(bufferIndex, bodyData);

    // Upload collider to GPU
    const colliderData: Partial<GpuCollider> = {
      bodyIndex: bufferIndex,
      isSensor: collider.isSensor ? 1 : 0,
      offset: [collider.offset.x / ppu, collider.offset.y / ppu],
    };

    // Shape-specific data
    const shape = collider.shape;
    if (shape instanceof CircleShape) {
      colliderData.shapeType = ShapeType.Circle;
      colliderData.radius = shape.radius / ppu;
    } else if (shape instanceof RectShape) {
      colliderData.shapeType = ShapeType.Rect;
      colliderData.halfExtents = [
        shape.halfWidth / ppu,
        shape.halfHeight / ppu,
      ];
    } else if (shape instanceof CapsuleShape) {
      colliderData.shapeType = ShapeType.Capsule;
      colliderData.radius = shape.radius / ppu;
      colliderData.halfExtents = [0, shape.halfHeight / ppu];
    } else if (shape instanceof PolygonShape) {
      colliderData.shapeType = ShapeType.Polygon;
      colliderData.vertexCount = shape.vertices.length;
      colliderData.vertices = new Array(16).fill(0) as any;
      for (let i = 0; i < shape.vertices.length && i < 8; i++) {
        colliderData.vertices![i * 2] = shape.vertices[i].x / ppu;
        colliderData.vertices![i * 2 + 1] = shape.vertices[i].y / ppu;
      }
    }

    world.uploadCollider(bufferIndex, colliderData);

    console.log(
      `✅ Uploaded body ${bufferIndex}: pos=(${posX.toFixed(2)}, ${posY.toFixed(2)}), rot=${rotation.toFixed(2)}, mass=${mass.toFixed(2)}, type=${rb.type}`
    );

    // Mark entity as processed
    commands.entity(entity).insert(new PhysicsBody(bufferIndex, entity));

    // Add Velocity component if not present
    if (!velocity) {
      commands.entity(entity).insert(new Velocity());
    }
  }
}).label("ProcessNewBodies");
