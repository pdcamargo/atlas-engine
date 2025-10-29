/**
 * Continuous Collision Detection component
 */

/**
 * Enable continuous collision detection for fast-moving bodies
 * CCD uses swept collision tests to prevent tunneling through thin objects
 */
export class ContinuousCollision {
  public readonly enabled: boolean;

  constructor(enabled: boolean = true) {
    this.enabled = enabled;
  }
}
