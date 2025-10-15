import { mat4 } from "gl-matrix";

export class Point {
  #x: number;
  #y: number;
  #onChanged?: () => void;

  constructor(x: number = 0, y: number = 0, onChanged?: () => void) {
    this.#x = x;
    this.#y = y;
    this.#onChanged = onChanged;
  }

  public get x(): number {
    return this.#x;
  }

  public set x(value: number) {
    if (this.#x !== value) {
      this.#x = value;
      this.#onChanged?.();
    }
  }

  public get y(): number {
    return this.#y;
  }

  public set y(value: number) {
    if (this.#y !== value) {
      this.#y = value;
      this.#onChanged?.();
    }
  }

  public copyFrom(point: PointLike | { x: number; y: number }): this {
    this.x = point.x;
    this.y = point.y;
    return this;
  }
}

export interface PointLike {
  x: number;
  y: number;
}

export class Transform {
  #position: Point;
  #rotation: number;
  #scale: Point;

  #isDirty: boolean;
  #matrix: Float32Array;

  constructor(
    position: { x: number; y: number } = { x: 0, y: 0 },
    rotation: number = 0,
    scale: { x: number; y: number } = { x: 1, y: 1 }
  ) {
    // Create points with callback to mark transform as dirty when they change
    this.#position = new Point(position.x, position.y, () => {
      this.#isDirty = true;
    });
    this.#rotation = rotation;
    this.#scale = new Point(scale.x, scale.y, () => {
      this.#isDirty = true;
    });
    this.#isDirty = true;
    this.#matrix = mat4.create();
    this.#updateMatrix();
  }

  public get position() {
    return this.#position;
  }

  public get rotation() {
    return this.#rotation;
  }

  public get scale() {
    return this.#scale;
  }

  public set position(position: PointLike) {
    this.#position.copyFrom(position);
    this.#isDirty = true;
  }

  public setPosition(position: PointLike | { x: number; y: number }) {
    this.#position.copyFrom(position);
    this.#isDirty = true;
  }

  public set rotation(rotation: number) {
    this.#rotation = rotation;
    this.#isDirty = true;
  }

  public setRotation(rotation: number) {
    this.#rotation = rotation;
    this.#isDirty = true;
  }

  public set scale(scale: PointLike) {
    this.#scale.copyFrom(scale);
    this.#isDirty = true;
  }

  public get isDirty() {
    return this.#isDirty;
  }

  public set isDirty(isDirty: boolean) {
    this.#isDirty = isDirty;
  }

  /**
   * Get the transformation matrix (auto-updates if dirty)
   */
  public get matrix(): Float32Array {
    if (this.#isDirty) {
      this.#updateMatrix();
      this.#isDirty = false;
    }
    return this.#matrix;
  }

  /**
   * Update the transformation matrix from position, rotation, and scale
   */
  #updateMatrix(): void {
    // Reset to identity
    mat4.identity(this.#matrix);

    // Apply transformations in order: Translate -> Rotate -> Scale
    mat4.translate(this.#matrix, this.#matrix, [
      this.#position.x,
      this.#position.y,
      0,
    ]);

    // Rotation around Z axis (for 2D)
    mat4.rotateZ(this.#matrix, this.#matrix, this.#rotation);

    mat4.scale(this.#matrix, this.#matrix, [this.#scale.x, this.#scale.y, 1]);
  }

  public static fromPosition(position: PointLike | { x: number; y: number }) {
    const transform = new Transform();
    transform.setPosition(position);
    return transform;
  }

  public static fromRotation(rotation: number) {
    const transform = new Transform();
    transform.rotation = rotation;
    return transform;
  }
}
