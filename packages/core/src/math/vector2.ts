import { vec2 } from "gl-matrix";

export interface Vector2Like {
  x: number;
  y: number;
}

export class Vector2 {
  private _data: Float32Array;

  constructor(x: number = 0, y: number = 0) {
    this._data = new Float32Array(2);
    this._data[0] = x;
    this._data[1] = y;
  }

  get x(): number {
    return this._data[0];
  }

  set x(value: number) {
    this._data[0] = value;
  }

  get y(): number {
    return this._data[1];
  }

  set y(value: number) {
    this._data[1] = value;
  }

  get data(): Float32Array {
    return this._data;
  }

  // Instance methods
  copyFrom(other: Vector2 | Vector2Like): Vector2 {
    if (other instanceof Vector2) {
      this._data.set(other._data);
    } else {
      this._data[0] = other.x;
      this._data[1] = other.y;
    }
    return this;
  }

  clone(): Vector2 {
    return new Vector2(this.x, this.y);
  }

  set(x: number, y: number): Vector2 {
    this._data[0] = x;
    this._data[1] = y;
    return this;
  }

  add(other: Vector2 | Vector2Like): Vector2 {
    if (other instanceof Vector2) {
      vec2.add(this._data, this._data, other._data);
    } else {
      this._data[0] += other.x;
      this._data[1] += other.y;
    }
    return this;
  }

  subtract(other: Vector2 | Vector2Like): Vector2 {
    if (other instanceof Vector2) {
      vec2.subtract(this._data, this._data, other._data);
    } else {
      this._data[0] -= other.x;
      this._data[1] -= other.y;
    }
    return this;
  }

  multiply(scalar: number): Vector2 {
    vec2.scale(this._data, this._data, scalar);
    return this;
  }

  divide(scalar: number): Vector2 {
    if (scalar === 0) throw new Error("Division by zero");
    vec2.scale(this._data, this._data, 1 / scalar);
    return this;
  }

  dot(other: Vector2 | Vector2Like): number {
    if (other instanceof Vector2) {
      return vec2.dot(this._data, other._data);
    }
    return this.x * other.x + this.y * other.y;
  }

  cross(other: Vector2 | Vector2Like): number {
    if (other instanceof Vector2) {
      return this.x * other.y - this.y * other.x;
    }
    return this.x * other.y - this.y * other.x;
  }

  length(): number {
    return vec2.length(this._data);
  }

  lengthSquared(): number {
    return vec2.squaredLength(this._data);
  }

  normalize(): Vector2 {
    vec2.normalize(this._data, this._data);
    return this;
  }

  distance(other: Vector2 | Vector2Like): number {
    if (other instanceof Vector2) {
      return vec2.distance(this._data, other._data);
    }
    const dx = this.x - other.x;
    const dy = this.y - other.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  distanceSquared(other: Vector2 | Vector2Like): number {
    if (other instanceof Vector2) {
      return vec2.squaredDistance(this._data, other._data);
    }
    const dx = this.x - other.x;
    const dy = this.y - other.y;
    return dx * dx + dy * dy;
  }

  lerp(other: Vector2 | Vector2Like, t: number): Vector2 {
    if (other instanceof Vector2) {
      vec2.lerp(this._data, this._data, other._data, t);
    } else {
      this._data[0] = this.x + (other.x - this.x) * t;
      this._data[1] = this.y + (other.y - this.y) * t;
    }
    return this;
  }

  negate(): Vector2 {
    vec2.negate(this._data, this._data);
    return this;
  }

  equals(other: Vector2 | Vector2Like, epsilon: number = 0.0001): boolean {
    if (other instanceof Vector2) {
      return (
        vec2.exactEquals(this._data, other._data) ||
        vec2.equals(this._data, other._data)
      );
    }
    return (
      Math.abs(this.x - other.x) < epsilon &&
      Math.abs(this.y - other.y) < epsilon
    );
  }

  toString(): string {
    return `Vector2(${this.x}, ${this.y})`;
  }

  toArray(): [number, number] {
    return [this.x, this.y];
  }

  toObject(): Vector2Like {
    return { x: this.x, y: this.y };
  }

  // Static methods
  static zero(): Vector2 {
    return new Vector2(0, 0);
  }

  static one(): Vector2 {
    return new Vector2(1, 1);
  }

  static up(): Vector2 {
    return new Vector2(0, 1);
  }

  static down(): Vector2 {
    return new Vector2(0, -1);
  }

  static left(): Vector2 {
    return new Vector2(-1, 0);
  }

  static right(): Vector2 {
    return new Vector2(1, 0);
  }

  static fromArray(array: number[]): Vector2 {
    return new Vector2(array[0] || 0, array[1] || 0);
  }

  static fromObject(obj: Vector2Like): Vector2 {
    return new Vector2(obj.x, obj.y);
  }

  static add(a: Vector2 | Vector2Like, b: Vector2 | Vector2Like): Vector2 {
    const result = new Vector2();
    if (a instanceof Vector2 && b instanceof Vector2) {
      vec2.add(result._data, a._data, b._data);
    } else {
      const ax = a instanceof Vector2 ? a.x : a.x;
      const ay = a instanceof Vector2 ? a.y : a.y;
      const bx = b instanceof Vector2 ? b.x : b.x;
      const by = b instanceof Vector2 ? b.y : b.y;
      result.set(ax + bx, ay + by);
    }
    return result;
  }

  static subtract(a: Vector2 | Vector2Like, b: Vector2 | Vector2Like): Vector2 {
    const result = new Vector2();
    if (a instanceof Vector2 && b instanceof Vector2) {
      vec2.subtract(result._data, a._data, b._data);
    } else {
      const ax = a instanceof Vector2 ? a.x : a.x;
      const ay = a instanceof Vector2 ? a.y : a.y;
      const bx = b instanceof Vector2 ? b.x : b.x;
      const by = b instanceof Vector2 ? b.y : b.y;
      result.set(ax - bx, ay - by);
    }
    return result;
  }

  static multiply(a: Vector2 | Vector2Like, scalar: number): Vector2 {
    const result = new Vector2();
    if (a instanceof Vector2) {
      vec2.scale(result._data, a._data, scalar);
    } else {
      result.set(a.x * scalar, a.y * scalar);
    }
    return result;
  }

  static divide(a: Vector2 | Vector2Like, scalar: number): Vector2 {
    if (scalar === 0) throw new Error("Division by zero");
    return Vector2.multiply(a, 1 / scalar);
  }

  static dot(a: Vector2 | Vector2Like, b: Vector2 | Vector2Like): number {
    if (a instanceof Vector2 && b instanceof Vector2) {
      return vec2.dot(a._data, b._data);
    }
    const ax = a instanceof Vector2 ? a.x : a.x;
    const ay = a instanceof Vector2 ? a.y : a.y;
    const bx = b instanceof Vector2 ? b.x : b.x;
    const by = b instanceof Vector2 ? b.y : b.y;
    return ax * bx + ay * by;
  }

  static cross(a: Vector2 | Vector2Like, b: Vector2 | Vector2Like): number {
    const ax = a instanceof Vector2 ? a.x : a.x;
    const ay = a instanceof Vector2 ? a.y : a.y;
    const bx = b instanceof Vector2 ? b.x : b.x;
    const by = b instanceof Vector2 ? b.y : b.y;
    return ax * by - ay * bx;
  }

  static length(a: Vector2 | Vector2Like): number {
    if (a instanceof Vector2) {
      return vec2.length(a._data);
    }
    return Math.sqrt(a.x * a.x + a.y * a.y);
  }

  static lengthSquared(a: Vector2 | Vector2Like): number {
    if (a instanceof Vector2) {
      return vec2.squaredLength(a._data);
    }
    return a.x * a.x + a.y * a.y;
  }

  static normalize(a: Vector2 | Vector2Like): Vector2 {
    const result = new Vector2();
    if (a instanceof Vector2) {
      vec2.normalize(result._data, a._data);
    } else {
      const length = Math.sqrt(a.x * a.x + a.y * a.y);
      if (length === 0) return result;
      result.set(a.x / length, a.y / length);
    }
    return result;
  }

  static distance(a: Vector2 | Vector2Like, b: Vector2 | Vector2Like): number {
    if (a instanceof Vector2 && b instanceof Vector2) {
      return vec2.distance(a._data, b._data);
    }
    const ax = a instanceof Vector2 ? a.x : a.x;
    const ay = a instanceof Vector2 ? a.y : a.y;
    const bx = b instanceof Vector2 ? b.x : b.x;
    const by = b instanceof Vector2 ? b.y : b.y;
    const dx = ax - bx;
    const dy = ay - by;
    return Math.sqrt(dx * dx + dy * dy);
  }

  static distanceSquared(
    a: Vector2 | Vector2Like,
    b: Vector2 | Vector2Like
  ): number {
    if (a instanceof Vector2 && b instanceof Vector2) {
      return vec2.squaredDistance(a._data, b._data);
    }
    const ax = a instanceof Vector2 ? a.x : a.x;
    const ay = a instanceof Vector2 ? a.y : a.y;
    const bx = b instanceof Vector2 ? b.x : b.x;
    const by = b instanceof Vector2 ? b.y : b.y;
    const dx = ax - bx;
    const dy = ay - by;
    return dx * dx + dy * dy;
  }

  static lerp(
    a: Vector2 | Vector2Like,
    b: Vector2 | Vector2Like,
    t: number
  ): Vector2 {
    const result = new Vector2();
    if (a instanceof Vector2 && b instanceof Vector2) {
      vec2.lerp(result._data, a._data, b._data, t);
    } else {
      const ax = a instanceof Vector2 ? a.x : a.x;
      const ay = a instanceof Vector2 ? a.y : a.y;
      const bx = b instanceof Vector2 ? b.x : b.x;
      const by = b instanceof Vector2 ? b.y : b.y;
      result.set(ax + (bx - ax) * t, ay + (by - ay) * t);
    }
    return result;
  }

  static negate(a: Vector2 | Vector2Like): Vector2 {
    const result = new Vector2();
    if (a instanceof Vector2) {
      vec2.negate(result._data, a._data);
    } else {
      result.set(-a.x, -a.y);
    }
    return result;
  }

  static equals(
    a: Vector2 | Vector2Like,
    b: Vector2 | Vector2Like,
    epsilon: number = 0.0001
  ): boolean {
    if (a instanceof Vector2 && b instanceof Vector2) {
      return (
        vec2.exactEquals(a._data, b._data) || vec2.equals(a._data, b._data)
      );
    }
    const ax = a instanceof Vector2 ? a.x : a.x;
    const ay = a instanceof Vector2 ? a.y : a.y;
    const bx = b instanceof Vector2 ? b.x : b.x;
    const by = b instanceof Vector2 ? b.y : b.y;
    return Math.abs(ax - bx) < epsilon && Math.abs(ay - by) < epsilon;
  }
}
