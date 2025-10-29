/**
 * Velocity component for physics bodies
 */

/**
 * Stores linear and angular velocity for a physics body
 * Can be modified by user code to apply impulses
 */
export class Velocity {
  public linear: { x: number; y: number };
  public angular: number;

  constructor(
    linear: { x: number; y: number } = { x: 0, y: 0 },
    angular: number = 0
  ) {
    this.linear = { ...linear };
    this.angular = angular;
  }

  /**
   * Set linear velocity
   */
  setLinear(x: number, y: number): void {
    this.linear.x = x;
    this.linear.y = y;
  }

  /**
   * Add to linear velocity (apply impulse)
   */
  addLinear(x: number, y: number): void {
    this.linear.x += x;
    this.linear.y += y;
  }

  /**
   * Set angular velocity
   */
  setAngular(angular: number): void {
    this.angular = angular;
  }

  /**
   * Add to angular velocity (apply angular impulse)
   */
  addAngular(angular: number): void {
    this.angular += angular;
  }

  /**
   * Get speed (magnitude of linear velocity)
   */
  getSpeed(): number {
    return Math.sqrt(
      this.linear.x * this.linear.x + this.linear.y * this.linear.y
    );
  }

  /**
   * Zero out all velocities
   */
  reset(): void {
    this.linear.x = 0;
    this.linear.y = 0;
    this.angular = 0;
  }
}
