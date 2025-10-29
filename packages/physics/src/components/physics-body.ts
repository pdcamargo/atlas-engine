/**
 * Internal component marking an entity as having GPU physics state
 */

import type { Entity } from "@atlas/core";

/**
 * PhysicsBody is an internal component added by the physics system
 * to track which entities have been uploaded to GPU buffers
 */
export class PhysicsBody {
  /**
   * Index in the GPU buffer arrays
   */
  public readonly bufferIndex: number;

  /**
   * Entity ID (for collision events and debugging)
   */
  public readonly entity: Entity;

  constructor(bufferIndex: number, entity: Entity) {
    this.bufferIndex = bufferIndex;
    this.entity = entity;
  }
}
