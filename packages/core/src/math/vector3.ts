import { vec3 } from "gl-matrix";
import { Vector2, Vector2Like } from "./vector2";

export interface Vector3Like {
  x: number;
  y: number;
  z: number;
}

export class Vector3 {
  private _data: Float32Array;
  private _onChange?: () => void;

  constructor(
    x: number = 0,
    y: number = 0,
    z: number = 0,
    onChange?: () => void
  ) {
    this._data = new Float32Array(3);
    this._data[0] = x;
    this._data[1] = y;
    this._data[2] = z;

    this._onChange = onChange;
  }

  /**
   * Set a callback that will be called whenever this vector changes
   * Useful for notifying parent objects (like SceneNode) that transforms need updating
   */
  public setOnChange(callback: (() => void) | undefined): void {
    this._onChange = callback;
  }

  get x(): number {
    return this._data[0];
  }

  set x(value: number) {
    this._data[0] = value;
    this._onChange?.();
  }

  get y(): number {
    return this._data[1];
  }

  set y(value: number) {
    this._data[1] = value;
    this._onChange?.();
  }

  get z(): number {
    return this._data[2];
  }

  set z(value: number) {
    this._data[2] = value;
    this._onChange?.();
  }

  get data(): Float32Array {
    return this._data;
  }

  // Instance methods
  copyFrom(other: Vector2 | Vector2Like): Vector3;
  copyFrom(other: Vector3 | Vector3Like | Vector2 | Vector2Like): Vector3 {
    if ("z" in other) {
      vec3.set(this._data, other.x, other.y, other.z);
    } else {
      vec3.set(this._data, other.x, other.y, this.z);
    }
    this._onChange?.();
    return this;
  }

  clone(): Vector3 {
    return new Vector3(this.x, this.y, this.z);
  }

  set(x: number, y: number, z: number): Vector3 {
    this._data[0] = x;
    this._data[1] = y;
    this._data[2] = z;

    this._onChange?.();
    return this;
  }

  add(other: Vector3 | Vector3Like): Vector3 {
    if (other instanceof Vector3) {
      vec3.add(this._data, this._data, other._data);
    } else {
      this._data[0] += other.x;
      this._data[1] += other.y;
      this._data[2] += other.z;
    }

    this._onChange?.();

    return this;
  }

  subtract(other: Vector3 | Vector3Like): Vector3 {
    if (other instanceof Vector3) {
      vec3.subtract(this._data, this._data, other._data);
    } else {
      this._data[0] -= other.x;
      this._data[1] -= other.y;
      this._data[2] -= other.z;
    }

    this._onChange?.();

    return this;
  }

  multiply(scalar: number): Vector3 {
    vec3.scale(this._data, this._data, scalar);

    this._onChange?.();

    return this;
  }

  divide(scalar: number): Vector3 {
    if (scalar === 0) throw new Error("Division by zero");

    vec3.scale(this._data, this._data, 1 / scalar);

    this._onChange?.();

    return this;
  }

  dot(other: Vector3 | Vector3Like): number {
    if (other instanceof Vector3) {
      return vec3.dot(this._data, other._data);
    }

    return this.x * other.x + this.y * other.y + this.z * other.z;
  }

  cross(other: Vector3 | Vector3Like): Vector3 {
    if (other instanceof Vector3) {
      vec3.cross(this._data, this._data, other._data);
    } else {
      const x = this.y * other.z - this.z * other.y;
      const y = this.z * other.x - this.x * other.z;
      const z = this.x * other.y - this.y * other.x;
      this.set(x, y, z);
    }

    this._onChange?.();

    return this;
  }

  length(): number {
    return vec3.length(this._data);
  }

  lengthSquared(): number {
    return vec3.squaredLength(this._data);
  }

  normalize(): Vector3 {
    vec3.normalize(this._data, this._data);
    return this;
  }

  distance(other: Vector3 | Vector3Like): number {
    if (other instanceof Vector3) {
      return vec3.distance(this._data, other._data);
    }
    const dx = this.x - other.x;
    const dy = this.y - other.y;
    const dz = this.z - other.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  distanceSquared(other: Vector3 | Vector3Like): number {
    if (other instanceof Vector3) {
      return vec3.squaredDistance(this._data, other._data);
    }
    const dx = this.x - other.x;
    const dy = this.y - other.y;
    const dz = this.z - other.z;
    return dx * dx + dy * dy + dz * dz;
  }

  lerp(other: Vector3 | Vector3Like, t: number): Vector3 {
    if (other instanceof Vector3) {
      vec3.lerp(this._data, this._data, other._data, t);
    } else {
      this._data[0] = this.x + (other.x - this.x) * t;
      this._data[1] = this.y + (other.y - this.y) * t;
      this._data[2] = this.z + (other.z - this.z) * t;
    }

    this._onChange?.();

    return this;
  }

  negate(): Vector3 {
    vec3.negate(this._data, this._data);

    this._onChange?.();

    return this;
  }

  equals(other: Vector3 | Vector3Like, epsilon: number = 0.0001): boolean {
    if (other instanceof Vector3) {
      return (
        vec3.exactEquals(this._data, other._data) ||
        vec3.equals(this._data, other._data)
      );
    }
    return (
      Math.abs(this.x - other.x) < epsilon &&
      Math.abs(this.y - other.y) < epsilon &&
      Math.abs(this.z - other.z) < epsilon
    );
  }

  toString(): string {
    return `Vector3(${this.x}, ${this.y}, ${this.z})`;
  }

  toArray(): [number, number, number] {
    return [this.x, this.y, this.z];
  }

  toObject(): Vector3Like {
    return { x: this.x, y: this.y, z: this.z };
  }

  // Static methods
  static zero(): Vector3 {
    return new Vector3(0, 0, 0);
  }

  static one(): Vector3 {
    return new Vector3(1, 1, 1);
  }

  static up(): Vector3 {
    return new Vector3(0, 1, 0);
  }

  static down(): Vector3 {
    return new Vector3(0, -1, 0);
  }

  static left(): Vector3 {
    return new Vector3(-1, 0, 0);
  }

  static right(): Vector3 {
    return new Vector3(1, 0, 0);
  }

  static forward(): Vector3 {
    return new Vector3(0, 0, 1);
  }

  static back(): Vector3 {
    return new Vector3(0, 0, -1);
  }

  static fromArray(array: number[]): Vector3 {
    return new Vector3(array[0] || 0, array[1] || 0, array[2] || 0);
  }

  static fromObject(obj: Vector3Like): Vector3 {
    return new Vector3(obj.x, obj.y, obj.z);
  }

  static add(a: Vector3 | Vector3Like, b: Vector3 | Vector3Like): Vector3 {
    const result = new Vector3();
    if (a instanceof Vector3 && b instanceof Vector3) {
      vec3.add(result._data, a._data, b._data);
    } else {
      const ax = a instanceof Vector3 ? a.x : a.x;
      const ay = a instanceof Vector3 ? a.y : a.y;
      const az = a instanceof Vector3 ? a.z : a.z;
      const bx = b instanceof Vector3 ? b.x : b.x;
      const by = b instanceof Vector3 ? b.y : b.y;
      const bz = b instanceof Vector3 ? b.z : b.z;
      result.set(ax + bx, ay + by, az + bz);
    }
    return result;
  }

  static subtract(a: Vector3 | Vector3Like, b: Vector3 | Vector3Like): Vector3 {
    const result = new Vector3();
    if (a instanceof Vector3 && b instanceof Vector3) {
      vec3.subtract(result._data, a._data, b._data);
    } else {
      const ax = a instanceof Vector3 ? a.x : a.x;
      const ay = a instanceof Vector3 ? a.y : a.y;
      const az = a instanceof Vector3 ? a.z : a.z;
      const bx = b instanceof Vector3 ? b.x : b.x;
      const by = b instanceof Vector3 ? b.y : b.y;
      const bz = b instanceof Vector3 ? b.z : b.z;
      result.set(ax - bx, ay - by, az - bz);
    }
    return result;
  }

  static multiply(a: Vector3 | Vector3Like, scalar: number): Vector3 {
    const result = new Vector3();
    if (a instanceof Vector3) {
      vec3.scale(result._data, a._data, scalar);
    } else {
      result.set(a.x * scalar, a.y * scalar, a.z * scalar);
    }
    return result;
  }

  static divide(a: Vector3 | Vector3Like, scalar: number): Vector3 {
    if (scalar === 0) throw new Error("Division by zero");
    return Vector3.multiply(a, 1 / scalar);
  }

  static dot(a: Vector3 | Vector3Like, b: Vector3 | Vector3Like): number {
    if (a instanceof Vector3 && b instanceof Vector3) {
      return vec3.dot(a._data, b._data);
    }
    const ax = a.x;
    const ay = a.y;
    const az = a.z;
    const bx = b.x;
    const by = b.y;
    const bz = b.z;
    return ax * bx + ay * by + az * bz;
  }

  static cross(a: Vector3 | Vector3Like, b: Vector3 | Vector3Like): Vector3 {
    const result = new Vector3();
    if (a instanceof Vector3 && b instanceof Vector3) {
      vec3.cross(result._data, a._data, b._data);
    } else {
      const ax = a.x;
      const ay = a.y;
      const az = a.z;
      const bx = b.x;
      const by = b.y;
      const bz = b.z;
      result.set(ay * bz - az * by, az * bx - ax * bz, ax * by - ay * bx);
    }

    return result;
  }

  static length(a: Vector3 | Vector3Like): number {
    if (a instanceof Vector3) {
      return vec3.magnitude(a._data);
    }
    return Math.sqrt(a.x * a.x + a.y * a.y + a.z * a.z);
  }

  static lengthSquared(a: Vector3 | Vector3Like): number {
    if (a instanceof Vector3) {
      return vec3.squaredLength(a._data);
    }

    return a.x * a.x + a.y * a.y + a.z * a.z;
  }

  static normalize(a: Vector3 | Vector3Like): Vector3 {
    const result = new Vector3();
    if (a instanceof Vector3) {
      vec3.normalize(result._data, a._data);
    } else {
      const length = Math.sqrt(a.x * a.x + a.y * a.y + a.z * a.z);
      if (length === 0) return result;
      result.set(a.x / length, a.y / length, a.z / length);
    }
    return result;
  }

  static distance(a: Vector3 | Vector3Like, b: Vector3 | Vector3Like): number {
    if (a instanceof Vector3 && b instanceof Vector3) {
      return vec3.distance(a._data, b._data);
    }
    const ax = a.x;
    const ay = a.y;
    const az = a.z;
    const bx = b.x;
    const by = b.y;
    const bz = b.z;
    const dx = ax - bx;
    const dy = ay - by;
    const dz = az - bz;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  static distanceSquared(
    a: Vector3 | Vector3Like,
    b: Vector3 | Vector3Like
  ): number {
    if (a instanceof Vector3 && b instanceof Vector3) {
      return vec3.squaredDistance(a._data, b._data);
    }
    const ax = a.x;
    const ay = a.y;
    const az = a.z;
    const bx = b.x;
    const by = b.y;
    const bz = b.z;
    const dx = ax - bx;
    const dy = ay - by;
    const dz = az - bz;
    return dx * dx + dy * dy + dz * dz;
  }

  static lerp(
    a: Vector3 | Vector3Like,
    b: Vector3 | Vector3Like,
    t: number
  ): Vector3 {
    const result = new Vector3();
    if (a instanceof Vector3 && b instanceof Vector3) {
      vec3.lerp(result._data, a._data, b._data, t);
    } else {
      const ax = a.x;
      const ay = a.y;
      const az = a.z;
      const bx = b.x;
      const by = b.y;
      const bz = b.z;
      result.set(ax + (bx - ax) * t, ay + (by - ay) * t, az + (bz - az) * t);
    }
    return result;
  }

  static negate(a: Vector3 | Vector3Like): Vector3 {
    const result = new Vector3();
    if (a instanceof Vector3) {
      vec3.negate(result._data, a._data);
    } else {
      result.set(-a.x, -a.y, -a.z);
    }
    return result;
  }

  static equals(
    a: Vector3 | Vector3Like,
    b: Vector3 | Vector3Like,
    epsilon: number = 0.0001
  ): boolean {
    if (a instanceof Vector3 && b instanceof Vector3) {
      return (
        vec3.exactEquals(a._data, b._data) || vec3.equals(a._data, b._data)
      );
    }
    const ax = a.x;
    const ay = a.y;
    const az = a.z;
    const bx = b.x;
    const by = b.y;
    const bz = b.z;
    return (
      Math.abs(ax - bx) < epsilon &&
      Math.abs(ay - by) < epsilon &&
      Math.abs(az - bz) < epsilon
    );
  }
}
