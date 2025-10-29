/**
 * Physics world resource managing GPU compute state
 */

import type { ComputeWorkerInstance } from "@atlas/webgpu-renderer";
import type { Entity } from "@atlas/core";
import type { PhysicsSettings } from "./physics-settings";
import type {
  GpuRigidBody,
  GpuCollider,
  PhysicsConfig,
} from "../../gpu/types";

/**
 * PhysicsWorld manages the GPU compute pipeline and buffer state
 */
export class PhysicsWorld {
  /**
   * GPU compute worker instance
   */
  public worker!: ComputeWorkerInstance;

  /**
   * Mapping from buffer index to entity ID
   */
  private bodySlots: Map<number, Entity> = new Map();

  /**
   * Next available buffer slot
   */
  private nextSlot = 0;

  /**
   * Last bodies snapshot from GPU (cached for reads)
   */
  private lastBodiesSnapshot: Float32Array;

  /**
   * Last colliders snapshot from GPU (cached for reads)
   */
  private lastCollidersSnapshot: Float32Array;

  /**
   * Physics settings reference
   */
  private readonly settings: PhysicsSettings;

  /**
   * GPU device reference
   */
  private readonly device: GPUDevice;

  constructor(device: GPUDevice, settings: PhysicsSettings) {
    this.device = device;
    this.settings = settings;
    this.lastBodiesSnapshot = new Float32Array(settings.maxBodies * 16);
    this.lastCollidersSnapshot = new Float32Array(settings.maxColliders * 32);
  }

  /**
   * Set the compute worker instance (called by worker builder)
   */
  setWorker(worker: ComputeWorkerInstance): void {
    this.worker = worker;
  }

  /**
   * Allocate a new body slot in the GPU buffer
   */
  allocateBodySlot(entity: Entity): number {
    const index = this.nextSlot++;
    this.bodySlots.set(index, entity);
    return index;
  }

  /**
   * Get entity ID for a buffer index
   */
  getEntity(bufferIndex: number): Entity | undefined {
    return this.bodySlots.get(bufferIndex);
  }

  /**
   * Upload a rigid body to GPU
   */
  uploadBody(index: number, data: Partial<GpuRigidBody>): void {
    const buffer = new Float32Array(16);

    // Pack data into buffer matching GPU layout
    buffer[0] = data.position?.[0] ?? 0;
    buffer[1] = data.position?.[1] ?? 0;
    buffer[2] = data.rotation ?? 0;
    buffer[3] = 0; // padding

    buffer[4] = data.velocity?.[0] ?? 0;
    buffer[5] = data.velocity?.[1] ?? 0;
    buffer[6] = data.angularVel ?? 0;
    buffer[7] = 0; // padding

    buffer[8] = data.mass ?? 1;
    buffer[9] = data.invMass ?? 1;
    buffer[10] = data.inertia ?? 1;
    buffer[11] = data.invInertia ?? 1;

    buffer[12] = data.friction ?? 0.5;
    buffer[13] = data.restitution ?? 0.2;
    buffer[14] = data.linearDamping ?? 0.01;
    buffer[15] = data.angularDamping ?? 0.05;

    // Pack gravity/flags into same buffer
    const buffer2 = new Float32Array(4);
    buffer2[0] = data.gravityScale ?? 1.0;
    buffer2[1] = data.flags ?? 0;
    buffer2[2] = data.entityId ?? 0;
    buffer2[3] = 0; // padding

    // Combine into single 16-float body data (matches WGSL struct exactly)
    const fullBuffer = new Float32Array(16);
    fullBuffer.set(buffer.subarray(0, 12), 0); // First 12 floats
    fullBuffer.set(buffer2, 12); // Last 4 floats (gravity, flags, entityId, padding)

    // Write to buffer (16 floats per body)
    const offset = index * 16;
    this.worker.writeSlice("bodiesSrc", fullBuffer, offset);
  }

  /**
   * Upload a collider to GPU
   */
  uploadCollider(index: number, data: Partial<GpuCollider>): void {
    const buffer = new Float32Array(32);

    // Pack collider data
    buffer[0] = data.bodyIndex ?? 0;
    buffer[1] = data.shapeType ?? 0;
    buffer[2] = data.isSensor ?? 0;
    buffer[3] = data.vertexCount ?? 0;

    buffer[4] = data.offset?.[0] ?? 0;
    buffer[5] = data.offset?.[1] ?? 0;
    buffer[6] = data.radius ?? 0;
    buffer[7] = 0; // padding

    buffer[8] = data.halfExtents?.[0] ?? 0;
    buffer[9] = data.halfExtents?.[1] ?? 0;
    buffer[10] = 0; // padding
    buffer[11] = 0; // padding

    // Vertices (16 floats)
    if (data.vertices) {
      for (let i = 0; i < 16; i++) {
        buffer[12 + i] = data.vertices[i] ?? 0;
      }
    }

    // Padding (4 floats)
    buffer[28] = 0;
    buffer[29] = 0;
    buffer[30] = 0;
    buffer[31] = 0;

    this.worker.writeSlice("colliders", buffer, index * 32);
  }

  /**
   * Update body transform (for kinematic bodies)
   */
  updateBodyTransform(
    index: number,
    transform: { position: [number, number]; rotation: number }
  ): void {
    const buffer = new Float32Array(4);
    buffer[0] = transform.position[0];
    buffer[1] = transform.position[1];
    buffer[2] = transform.rotation;
    buffer[3] = 0; // padding

    this.worker.writeSlice("bodiesSrc", buffer, index * 16);
  }

  /**
   * Update physics config uniform
   */
  updateConfig(config: Partial<PhysicsConfig>): void {
    const buffer = new Float32Array(8);
    buffer[0] = config.gravity?.[0] ?? this.settings.gravity.x;
    buffer[1] = config.gravity?.[1] ?? this.settings.gravity.y;
    buffer[2] = config.deltaTime ?? 1 / 60;
    buffer[3] = config.substeps ?? this.settings.substeps;
    buffer[4] = config.iterations ?? this.settings.solverIterations;
    buffer[5] = 0; // padding
    buffer[6] = 0; // padding
    buffer[7] = 0; // padding

    this.worker.write("config", buffer);
  }

  /**
   * Get last bodies snapshot (avoid re-reading from GPU)
   */
  getLastBodiesSnapshot(): Float32Array {
    return this.lastBodiesSnapshot;
  }

  /**
   * Update bodies snapshot cache
   */
  updateBodiesSnapshot(snapshot: Float32Array): void {
    this.lastBodiesSnapshot = snapshot;
  }

  /**
   * Get number of active bodies
   */
  getBodyCount(): number {
    return this.nextSlot;
  }

  /**
   * Remove a body (mark slot as free)
   */
  removeBody(bufferIndex: number): void {
    this.bodySlots.delete(bufferIndex);
    // TODO: Implement slot recycling for removed bodies
  }
}
