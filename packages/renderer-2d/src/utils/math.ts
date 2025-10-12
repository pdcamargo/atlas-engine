/**
 * 2D Vector
 */
export class Vec2 {
  constructor(
    public x: number,
    public y: number
  ) {}

  public static ZERO = new Vec2(0, 0);
  public static ONE = new Vec2(1, 1);
  public static UP = new Vec2(0, -1);
  public static DOWN = new Vec2(0, 1);
  public static LEFT = new Vec2(-1, 0);
  public static RIGHT = new Vec2(1, 0);

  public clone(): Vec2 {
    return new Vec2(this.x, this.y);
  }

  public add(other: Vec2): Vec2 {
    return new Vec2(this.x + other.x, this.y + other.y);
  }

  public sub(other: Vec2): Vec2 {
    return new Vec2(this.x - other.x, this.y - other.y);
  }

  public mul(scalar: number): Vec2 {
    return new Vec2(this.x * scalar, this.y * scalar);
  }

  public length(): number {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }

  public normalize(): Vec2 {
    const len = this.length();
    return len > 0 ? new Vec2(this.x / len, this.y / len) : Vec2.ZERO;
  }
}

/**
 * 2D Rectangle
 */
export class Rect {
  constructor(
    public min: Vec2,
    public max: Vec2
  ) {}

  public static fromPositionSize(
    x: number,
    y: number,
    width: number,
    height: number
  ): Rect {
    return new Rect(new Vec2(x, y), new Vec2(x + width, y + height));
  }

  public get width(): number {
    return this.max.x - this.min.x;
  }

  public get height(): number {
    return this.max.y - this.min.y;
  }

  public get center(): Vec2 {
    return new Vec2(
      (this.min.x + this.max.x) / 2,
      (this.min.y + this.max.y) / 2
    );
  }
}
