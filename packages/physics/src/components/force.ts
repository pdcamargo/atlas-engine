/**
 * Force component for applying forces and torques to physics bodies
 */

/**
 * Accumulates forces and torques to be applied to a body
 * Forces are cleared each frame after integration
 */
export class Force {
  public force: { x: number; y: number };
  public torque: number;

  constructor() {
    this.force = { x: 0, y: 0 };
    this.torque = 0;
  }

  /**
   * Add a force at the center of mass
   */
  addForce(x: number, y: number): void {
    this.force.x += x;
    this.force.y += y;
  }

  /**
   * Add a force at a specific point (generates torque)
   */
  addForceAtPoint(
    forceX: number,
    forceY: number,
    pointX: number,
    pointY: number,
    centerX: number,
    centerY: number
  ): void {
    this.force.x += forceX;
    this.force.y += forceY;

    // Calculate torque from cross product
    const rx = pointX - centerX;
    const ry = pointY - centerY;
    this.torque += rx * forceY - ry * forceX;
  }

  /**
   * Add a torque (rotational force)
   */
  addTorque(torque: number): void {
    this.torque += torque;
  }

  /**
   * Clear all accumulated forces (called after integration)
   */
  clear(): void {
    this.force.x = 0;
    this.force.y = 0;
    this.torque = 0;
  }
}
