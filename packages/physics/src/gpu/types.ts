/**
 * GPU data structure interfaces matching WGSL structs
 */

/**
 * RigidBody data structure on GPU
 * Size: 64 bytes (16 floats)
 * Alignment: 16 bytes (vec4)
 */
export interface GpuRigidBody {
  // Position (2 floats) + rotation (1 float) + padding (1 float)
  position: [number, number];
  rotation: number; // radians
  _pad0: number;

  // Velocity (2 floats) + angular velocity (1 float) + padding (1 float)
  velocity: [number, number];
  angularVel: number;
  _pad1: number;

  // Mass properties (4 floats)
  mass: number;
  invMass: number;
  inertia: number;
  invInertia: number;

  // Material properties (4 floats)
  friction: number;
  restitution: number;
  linearDamping: number;
  angularDamping: number;

  // Gravity and flags (4 floats)
  gravityScale: number;
  flags: number; // Bitfield
  entityId: number;
  _pad2: number;
}

/**
 * Flags bitfield for RigidBody
 */
export enum RigidBodyFlags {
  None = 0,
  Static = 1 << 0, // Body doesn't move (infinite mass)
  Kinematic = 1 << 1, // Body moves via Transform, not forces
  Sleeping = 1 << 2, // Body is at rest (skip simulation)
  CCD = 1 << 3, // Continuous collision detection enabled
  LockRotation = 1 << 4, // Prevent rotation
  LockTranslationX = 1 << 5, // Prevent X movement
  LockTranslationY = 1 << 6, // Prevent Y movement
}

/**
 * Shape type enum (matches WGSL)
 */
export enum ShapeType {
  Circle = 0,
  Rect = 1,
  Capsule = 2,
  Polygon = 3,
}

/**
 * Collider data structure on GPU
 * Size: 128 bytes (32 floats)
 * Alignment: 16 bytes
 */
export interface GpuCollider {
  // Metadata (4 uints)
  bodyIndex: number;
  shapeType: ShapeType;
  isSensor: number; // 0 or 1
  vertexCount: number;

  // Offset (2 floats) + radius (1 float) + padding (1 float)
  offset: [number, number];
  radius: number; // For circle/capsule
  _pad0: number;

  // Half extents (2 floats) + padding (2 floats)
  halfExtents: [number, number]; // For rect/capsule
  _pad1: number;
  _pad2: number;

  // Vertices for polygon (max 8 vertices = 16 floats)
  vertices: [
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number
  ];

  // Padding to reach 32 floats
  _pad3: [number, number, number, number];
}

/**
 * Contact constraint data structure on GPU
 * Size: 32 bytes (8 floats)
 * Alignment: 16 bytes
 */
export interface GpuContact {
  // Body indices (2 uints) + padding (2 uints)
  bodyA: number;
  bodyB: number;
  _pad0: number;
  _pad1: number;

  // Contact normal (2 floats) + penetration (1 float) + padding (1 float)
  normal: [number, number];
  penetration: number;
  _pad2: number;

  // Contact tangent (2 floats) + material properties (2 floats)
  tangent: [number, number];
  friction: number;
  restitution: number;
}

/**
 * Physics configuration uniforms
 */
export interface PhysicsConfig {
  // Gravity vector (2 floats) + deltaTime (1 float) + substeps (1 uint)
  gravity: [number, number];
  deltaTime: number;
  substeps: number;

  // Solver settings
  iterations: number;
  _pad0: number;
  _pad1: number;
  _pad2: number;
}

/**
 * Spatial grid configuration
 */
export interface SpatialConfig {
  // Grid dimensions
  gridWidth: number;
  gridHeight: number;
  cellSize: number;
  _pad0: number;

  // World bounds
  worldMinX: number;
  worldMinY: number;
  worldMaxX: number;
  worldMaxY: number;
}

/**
 * Raycast query structure
 */
export interface RaycastQuery {
  // Ray origin and direction
  origin: [number, number];
  direction: [number, number];

  // Max distance and layer mask
  maxDistance: number;
  layerMask: number;
  _pad0: number;
  _pad1: number;
}

/**
 * Raycast hit result
 */
export interface RaycastHit {
  // Entity and distance
  entityId: number;
  distance: number;
  hit: number; // 0 or 1 boolean
  _pad0: number;

  // Hit point and normal
  point: [number, number];
  normal: [number, number];
}
