/**
 * Sleeping component for physics optimization
 */

/**
 * Sleeping system deactivates bodies that are at rest
 * to save computation. Bodies wake up when affected by forces or collisions.
 */
export class Sleeping {
  /**
   * Energy threshold below which body can sleep
   * (linear velocity^2 + angular velocity^2)
   */
  public readonly threshold: number;

  /**
   * Minimum time (seconds) body must be below threshold before sleeping
   */
  public readonly minTime: number;

  /**
   * Current sleep state (managed by physics system)
   */
  public isSleeping: boolean;

  /**
   * Time accumulated below threshold (managed by physics system)
   */
  public timeAtRest: number;

  constructor(threshold: number = 0.01, minTime: number = 0.5) {
    this.threshold = threshold;
    this.minTime = minTime;
    this.isSleeping = false;
    this.timeAtRest = 0;
  }

  /**
   * Wake up this body
   */
  wake(): void {
    this.isSleeping = false;
    this.timeAtRest = 0;
  }

  /**
   * Put this body to sleep
   */
  sleep(): void {
    this.isSleeping = true;
  }
}
