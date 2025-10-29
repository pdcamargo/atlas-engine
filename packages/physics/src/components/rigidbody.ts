/**
 * RigidBody component for physics simulation
 */

export type RigidBodyType = "static" | "kinematic" | "dynamic";

export interface RigidBodyConfig {
  /**
   * Mass override (if not specified, calculated from collider density)
   */
  mass?: number;

  /**
   * Linear damping (velocity decay over time)
   * 0 = no damping, higher values = more damping
   */
  linearDamping?: number;

  /**
   * Angular damping (angular velocity decay over time)
   * 0 = no damping, higher values = more damping
   */
  angularDamping?: number;

  /**
   * Gravity scale multiplier
   * 0 = no gravity, 1 = normal gravity, -1 = reverse gravity
   */
  gravityScale?: number;

  /**
   * Lock rotation (prevent rotation from forces)
   */
  lockRotation?: boolean;

  /**
   * Lock translation on specific axes
   */
  lockTranslation?: { x?: boolean; y?: boolean };
}

/**
 * RigidBody component defines how a body responds to forces
 *
 * Types:
 * - static: Never moves, infinite mass (e.g., walls, ground)
 * - kinematic: Moves via Transform, not affected by forces (e.g., moving platforms)
 * - dynamic: Affected by forces and collisions (e.g., falling boxes)
 */
export class RigidBody {
  public readonly type: RigidBodyType;
  public readonly massOverride?: number;
  public readonly linearDamping: number;
  public readonly angularDamping: number;
  public readonly gravityScale: number;
  public readonly lockRotation: boolean;
  public readonly lockTranslation: { x: boolean; y: boolean };

  constructor(type: RigidBodyType, config: RigidBodyConfig = {}) {
    this.type = type;
    this.massOverride = config.mass;
    this.linearDamping = config.linearDamping ?? 0.01;
    this.angularDamping = config.angularDamping ?? 0.05;
    this.gravityScale = config.gravityScale ?? 1.0;
    this.lockRotation = config.lockRotation ?? false;
    this.lockTranslation = {
      x: config.lockTranslation?.x ?? false,
      y: config.lockTranslation?.y ?? false,
    };
  }
}
