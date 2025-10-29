/**
 * Collider component for physics bodies
 */

import type { Shape } from "./shapes";

export interface ColliderConfig {
  /**
   * Offset from the body's center
   */
  offset?: { x: number; y: number };

  /**
   * Material density (kg/m²)
   * Used to calculate mass from shape area
   */
  density?: number;

  /**
   * Friction coefficient (0 = no friction, 1 = high friction)
   */
  friction?: number;

  /**
   * Restitution (bounciness) (0 = no bounce, 1 = perfect bounce)
   */
  restitution?: number;

  /**
   * If true, collider detects collisions but doesn't apply forces
   */
  isSensor?: boolean;
}

/**
 * Collider component defines the collision shape and material properties
 */
export class Collider {
  public readonly shape: Shape;
  public readonly offset: { x: number; y: number };
  public readonly density: number;
  public readonly friction: number;
  public readonly restitution: number;
  public readonly isSensor: boolean;

  constructor(shape: Shape, config: ColliderConfig = {}) {
    this.shape = shape;
    this.offset = config.offset ?? { x: 0, y: 0 };
    this.density = config.density ?? 1.0;
    this.friction = config.friction ?? 0.5;
    this.restitution = config.restitution ?? 0.2;
    this.isSensor = config.isSensor ?? false;
  }

  /**
   * Calculate the mass of this collider based on density
   */
  getMass(): number {
    return this.density * this.shape.area();
  }

  /**
   * Calculate the moment of inertia based on density
   */
  getInertia(): number {
    return this.density * this.shape.momentOfInertia();
  }
}
