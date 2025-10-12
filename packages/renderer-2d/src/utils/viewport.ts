/**
 * Viewport defines a rendering area
 */
export class Viewport {
  constructor(
    public x: number,
    public y: number,
    public width: number,
    public height: number
  ) {}

  /**
   * Create a viewport from position and size
   */
  public static fromRect(
    x: number,
    y: number,
    width: number,
    height: number
  ): Viewport {
    return new Viewport(x, y, width, height);
  }

  /**
   * Create a full-screen viewport
   */
  public static fullScreen(width: number, height: number): Viewport {
    return new Viewport(0, 0, width, height);
  }

  /**
   * Get aspect ratio
   */
  public get aspectRatio(): number {
    return this.width / this.height;
  }

  /**
   * Clone the viewport
   */
  public clone(): Viewport {
    return new Viewport(this.x, this.y, this.width, this.height);
  }
}
