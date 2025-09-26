import { QueryBuilder } from "../../commands";
import { Transform } from "../../components";
import { RigidBody2D, RigidBody2DHandle, Velocity } from "./components";

// the physics will update the transform of a body
export const rigidBody2DToUpdateTransformQuery = new QueryBuilder(
  Transform,
  RigidBody2DHandle,
  RigidBody2D
);

export const unprocessedRigidBodies2DQuery = new QueryBuilder(
  RigidBody2D,
  Transform
).without(RigidBody2DHandle);

export const bodiesWithVelocityQuery = new QueryBuilder(
  Velocity,
  RigidBody2DHandle
);
