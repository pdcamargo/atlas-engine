import { Mat3Like, quat } from "gl-matrix";
import { Vector3, Vector3Like } from "./vector3";

export interface QuaternionLike {
  x: number;
  y: number;
  z: number;
  w: number;
}

export class Quaternion {
  private _data: Float32Array;
  private _onChange?: () => void;

  constructor(
    x: number = 0,
    y: number = 0,
    z: number = 0,
    w: number = 1,
    onChange?: () => void
  ) {
    this._data = new Float32Array(4);
    this._data[0] = x;
    this._data[1] = y;
    this._data[2] = z;
    this._data[3] = w;
    this._onChange = onChange;
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

  get w(): number {
    return this._data[3];
  }

  set w(value: number) {
    this._data[3] = value;
    this._onChange?.();
  }

  get data(): Float32Array {
    return this._data;
  }

  // Instance methods
  copyFrom(other: Quaternion | QuaternionLike): Quaternion {
    quat.set(this._data, other.x, other.y, other.z, other.w);
    this._onChange?.();
    return this;
  }

  clone(): Quaternion {
    return new Quaternion(this.x, this.y, this.z, this.w);
  }

  fromEuler(x: number, y: number, z: number): Quaternion {
    quat.fromEuler(this._data, x, y, z);
    this._onChange?.();
    return this;
  }

  rotate2D(angle: number): Quaternion {
    quat.rotateY(this._data, this._data, angle);
    this._onChange?.();
    return this;
  }

  set(x: number, y: number, z: number, w: number): Quaternion {
    this._data[0] = x;
    this._data[1] = y;
    this._data[2] = z;
    this._data[3] = w;
    this._onChange?.();
    return this;
  }

  add(other: Quaternion | QuaternionLike): Quaternion {
    if (other instanceof Quaternion) {
      quat.add(this._data, this._data, other._data);
    } else {
      this._data[0] += other.x;
      this._data[1] += other.y;
      this._data[2] += other.z;
      this._data[3] += other.w;
    }
    this._onChange?.();
    return this;
  }

  subtract(other: Quaternion | QuaternionLike): Quaternion {
    this._data[0] -= other.x;
    this._data[1] -= other.y;
    this._data[2] -= other.z;
    this._data[3] -= other.w;
    this._onChange?.();
    return this;
  }

  multiply(other: Quaternion | QuaternionLike): Quaternion {
    if (other instanceof Quaternion) {
      quat.multiply(this._data, this._data, other._data);
    } else {
      const qx =
        this.w * other.x +
        this.x * other.w +
        this.y * other.z -
        this.z * other.y;
      const qy =
        this.w * other.y -
        this.x * other.z +
        this.y * other.w +
        this.z * other.x;
      const qz =
        this.w * other.z +
        this.x * other.y -
        this.y * other.x +
        this.z * other.w;
      const qw =
        this.w * other.w -
        this.x * other.x -
        this.y * other.y -
        this.z * other.z;
      this.set(qx, qy, qz, qw);
    }
    this._onChange?.();
    return this;
  }

  scale(scalar: number): Quaternion {
    quat.scale(this._data, this._data, scalar);
    this._onChange?.();
    return this;
  }

  dot(other: Quaternion | QuaternionLike): number {
    if (other instanceof Quaternion) {
      return quat.dot(this._data, other._data);
    }
    return (
      this.x * other.x + this.y * other.y + this.z * other.z + this.w * other.w
    );
  }

  length(): number {
    return quat.length(this._data);
  }

  lengthSquared(): number {
    return quat.squaredLength(this._data);
  }

  normalize(): Quaternion {
    quat.normalize(this._data, this._data);
    this._onChange?.();
    return this;
  }

  conjugate(): Quaternion {
    quat.conjugate(this._data, this._data);
    this._onChange?.();
    return this;
  }

  invert(): Quaternion {
    quat.invert(this._data, this._data);
    this._onChange?.();
    return this;
  }

  slerp(other: Quaternion | QuaternionLike, t: number): Quaternion {
    if (other instanceof Quaternion) {
      quat.slerp(this._data, this._data, other._data, t);
    } else {
      // Manual SLERP implementation for non-Quaternion objects
      const dot = this.dot(other);
      const absDot = Math.abs(dot);

      let t1, t2;
      if (absDot > 0.9995) {
        // Linear interpolation for very close quaternions
        t1 = 1 - t;
        t2 = t;
      } else {
        const theta = Math.acos(absDot);
        const sinTheta = Math.sin(theta);
        t1 = Math.sin((1 - t) * theta) / sinTheta;
        t2 = Math.sin(t * theta) / sinTheta;
        if (dot < 0) t2 = -t2;
      }

      this.set(
        this.x * t1 + other.x * t2,
        this.y * t1 + other.y * t2,
        this.z * t1 + other.z * t2,
        this.w * t1 + other.w * t2
      );
    }
    this._onChange?.();
    return this;
  }

  lerp(other: Quaternion | QuaternionLike, t: number): Quaternion {
    if (other instanceof Quaternion) {
      quat.lerp(this._data, this._data, other._data, t);
    } else {
      this._data[0] = this.x + (other.x - this.x) * t;
      this._data[1] = this.y + (other.y - this.y) * t;
      this._data[2] = this.z + (other.z - this.z) * t;
      this._data[3] = this.w + (other.w - this.w) * t;
    }
    this._onChange?.();
    return this;
  }

  negate(): Quaternion {
    this._data[0] = -this._data[0];
    this._data[1] = -this._data[1];
    this._data[2] = -this._data[2];
    this._data[3] = -this._data[3];
    this._onChange?.();
    return this;
  }

  equals(
    other: Quaternion | QuaternionLike,
    epsilon: number = 0.0001
  ): boolean {
    if (other instanceof Quaternion) {
      return (
        quat.exactEquals(this._data, other._data) ||
        quat.equals(this._data, other._data)
      );
    }
    return (
      Math.abs(this.x - other.x) < epsilon &&
      Math.abs(this.y - other.y) < epsilon &&
      Math.abs(this.z - other.z) < epsilon &&
      Math.abs(this.w - other.w) < epsilon
    );
  }

  toString(): string {
    return `Quaternion(${this.x}, ${this.y}, ${this.z}, ${this.w})`;
  }

  toArray(): [number, number, number, number] {
    return [this.x, this.y, this.z, this.w];
  }

  toObject(): QuaternionLike {
    return { x: this.x, y: this.y, z: this.z, w: this.w };
  }

  // Rotation methods
  setFromAxisAngle(axis: Vector3 | Vector3Like, angle: number): Quaternion {
    if (axis instanceof Vector3) {
      quat.setAxisAngle(this._data, axis.data, angle);
    } else {
      quat.setAxisAngle(this._data, [axis.x, axis.y, axis.z], angle);
    }
    this._onChange?.();
    return this;
  }

  setFromEulerAngles(x: number, y: number, z: number): Quaternion {
    quat.fromEuler(this._data, x, y, z);
    this._onChange?.();
    return this;
  }

  setFromRotationMatrix(matrix: Float32Array | number[]): Quaternion {
    quat.fromMat3(this._data, matrix as Mat3Like);
    this._onChange?.();
    return this;
  }

  getAxisAngle(): { axis: Vector3; angle: number } {
    const axis = new Vector3();
    const angle = quat.getAxisAngle(axis.data, this._data);
    return { axis, angle };
  }

  // Static methods
  static identity(): Quaternion {
    return new Quaternion(0, 0, 0, 1);
  }

  static zero(): Quaternion {
    return new Quaternion(0, 0, 0, 0);
  }

  static fromArray(array: number[]): Quaternion {
    return new Quaternion(
      array[0] || 0,
      array[1] || 0,
      array[2] || 0,
      array[3] || 1
    );
  }

  static fromObject(obj: QuaternionLike): Quaternion {
    return new Quaternion(obj.x, obj.y, obj.z, obj.w);
  }

  static fromAxisAngle(axis: Vector3 | Vector3Like, angle: number): Quaternion {
    const result = new Quaternion();
    return result.setFromAxisAngle(axis, angle);
  }

  static fromEulerAngles(x: number, y: number, z: number): Quaternion {
    const result = new Quaternion();
    return result.setFromEulerAngles(x, y, z);
  }

  static fromRotationMatrix(matrix: Float32Array | number[]): Quaternion {
    const result = new Quaternion();
    return result.setFromRotationMatrix(matrix);
  }

  static add(
    a: Quaternion | QuaternionLike,
    b: Quaternion | QuaternionLike
  ): Quaternion {
    const result = new Quaternion();
    if (a instanceof Quaternion && b instanceof Quaternion) {
      quat.add(result._data, a._data, b._data);
    } else {
      const ax = a instanceof Quaternion ? a.x : a.x;
      const ay = a instanceof Quaternion ? a.y : a.y;
      const az = a instanceof Quaternion ? a.z : a.z;
      const aw = a instanceof Quaternion ? a.w : a.w;
      const bx = b instanceof Quaternion ? b.x : b.x;
      const by = b instanceof Quaternion ? b.y : b.y;
      const bz = b instanceof Quaternion ? b.z : b.z;
      const bw = b instanceof Quaternion ? b.w : b.w;
      result.set(ax + bx, ay + by, az + bz, aw + bw);
    }
    return result;
  }

  static subtract(
    a: Quaternion | QuaternionLike,
    b: Quaternion | QuaternionLike
  ): Quaternion {
    const result = new Quaternion();

    const ax = a instanceof Quaternion ? a.x : a.x;
    const ay = a instanceof Quaternion ? a.y : a.y;
    const az = a instanceof Quaternion ? a.z : a.z;
    const aw = a instanceof Quaternion ? a.w : a.w;
    const bx = b instanceof Quaternion ? b.x : b.x;
    const by = b instanceof Quaternion ? b.y : b.y;
    const bz = b instanceof Quaternion ? b.z : b.z;
    const bw = b instanceof Quaternion ? b.w : b.w;
    result.set(ax - bx, ay - by, az - bz, aw - bw);

    return result;
  }

  static multiply(
    a: Quaternion | QuaternionLike,
    b: Quaternion | QuaternionLike
  ): Quaternion {
    const result = new Quaternion();
    if (a instanceof Quaternion && b instanceof Quaternion) {
      quat.multiply(result._data, a._data, b._data);
    } else {
      const ax = a instanceof Quaternion ? a.x : a.x;
      const ay = a instanceof Quaternion ? a.y : a.y;
      const az = a instanceof Quaternion ? a.z : a.z;
      const aw = a instanceof Quaternion ? a.w : a.w;
      const bx = b instanceof Quaternion ? b.x : b.x;
      const by = b instanceof Quaternion ? b.y : b.y;
      const bz = b instanceof Quaternion ? b.z : b.z;
      const bw = b instanceof Quaternion ? b.w : b.w;

      const qx = aw * bx + ax * bw + ay * bz - az * by;
      const qy = aw * by - ax * bz + ay * bw + az * bx;
      const qz = aw * bz + ax * by - ay * bx + az * bw;
      const qw = aw * bw - ax * bx - ay * by - az * bz;
      result.set(qx, qy, qz, qw);
    }
    return result;
  }

  static scale(a: Quaternion | QuaternionLike, scalar: number): Quaternion {
    const result = new Quaternion();
    if (a instanceof Quaternion) {
      quat.scale(result._data, a._data, scalar);
    } else {
      result.set(a.x * scalar, a.y * scalar, a.z * scalar, a.w * scalar);
    }
    return result;
  }

  static dot(
    a: Quaternion | QuaternionLike,
    b: Quaternion | QuaternionLike
  ): number {
    if (a instanceof Quaternion && b instanceof Quaternion) {
      return quat.dot(a._data, b._data);
    }
    const ax = a instanceof Quaternion ? a.x : a.x;
    const ay = a instanceof Quaternion ? a.y : a.y;
    const az = a instanceof Quaternion ? a.z : a.z;
    const aw = a instanceof Quaternion ? a.w : a.w;
    const bx = b instanceof Quaternion ? b.x : b.x;
    const by = b instanceof Quaternion ? b.y : b.y;
    const bz = b instanceof Quaternion ? b.z : b.z;
    const bw = b instanceof Quaternion ? b.w : b.w;
    return ax * bx + ay * by + az * bz + aw * bw;
  }

  static length(a: Quaternion | QuaternionLike): number {
    if (a instanceof Quaternion) {
      return quat.length(a._data);
    }
    return Math.sqrt(a.x * a.x + a.y * a.y + a.z * a.z + a.w * a.w);
  }

  static lengthSquared(a: Quaternion | QuaternionLike): number {
    if (a instanceof Quaternion) {
      return quat.squaredLength(a._data);
    }
    return a.x * a.x + a.y * a.y + a.z * a.z + a.w * a.w;
  }

  static normalize(a: Quaternion | QuaternionLike): Quaternion {
    const result = new Quaternion();
    if (a instanceof Quaternion) {
      quat.normalize(result._data, a._data);
    } else {
      const length = Math.sqrt(a.x * a.x + a.y * a.y + a.z * a.z + a.w * a.w);
      if (length === 0) return result;
      result.set(a.x / length, a.y / length, a.z / length, a.w / length);
    }
    return result;
  }

  static conjugate(a: Quaternion | QuaternionLike): Quaternion {
    const result = new Quaternion();
    if (a instanceof Quaternion) {
      quat.conjugate(result._data, a._data);
    } else {
      result.set(-a.x, -a.y, -a.z, a.w);
    }
    return result;
  }

  static invert(a: Quaternion | QuaternionLike): Quaternion {
    const result = new Quaternion();
    if (a instanceof Quaternion) {
      quat.invert(result._data, a._data);
    } else {
      const lengthSq = a.x * a.x + a.y * a.y + a.z * a.z + a.w * a.w;
      if (lengthSq === 0) return result;
      result.set(
        -a.x / lengthSq,
        -a.y / lengthSq,
        -a.z / lengthSq,
        a.w / lengthSq
      );
    }
    return result;
  }

  static slerp(
    a: Quaternion | QuaternionLike,
    b: Quaternion | QuaternionLike,
    t: number
  ): Quaternion {
    const result = new Quaternion();
    if (a instanceof Quaternion && b instanceof Quaternion) {
      quat.slerp(result._data, a._data, b._data, t);
    } else {
      const ax = a instanceof Quaternion ? a.x : a.x;
      const ay = a instanceof Quaternion ? a.y : a.y;
      const az = a instanceof Quaternion ? a.z : a.z;
      const aw = a instanceof Quaternion ? a.w : a.w;
      const bx = b instanceof Quaternion ? b.x : b.x;
      const by = b instanceof Quaternion ? b.y : b.y;
      const bz = b instanceof Quaternion ? b.z : b.z;
      const bw = b instanceof Quaternion ? b.w : b.w;

      const dot = ax * bx + ay * by + az * bz + aw * bw;
      const absDot = Math.abs(dot);

      let t1, t2;
      if (absDot > 0.9995) {
        t1 = 1 - t;
        t2 = t;
      } else {
        const theta = Math.acos(absDot);
        const sinTheta = Math.sin(theta);
        t1 = Math.sin((1 - t) * theta) / sinTheta;
        t2 = Math.sin(t * theta) / sinTheta;
        if (dot < 0) t2 = -t2;
      }

      result.set(
        ax * t1 + bx * t2,
        ay * t1 + by * t2,
        az * t1 + bz * t2,
        aw * t1 + bw * t2
      );
    }
    return result;
  }

  static lerp(
    a: Quaternion | QuaternionLike,
    b: Quaternion | QuaternionLike,
    t: number
  ): Quaternion {
    const result = new Quaternion();
    if (a instanceof Quaternion && b instanceof Quaternion) {
      quat.lerp(result._data, a._data, b._data, t);
    } else {
      const ax = a instanceof Quaternion ? a.x : a.x;
      const ay = a instanceof Quaternion ? a.y : a.y;
      const az = a instanceof Quaternion ? a.z : a.z;
      const aw = a instanceof Quaternion ? a.w : a.w;
      const bx = b instanceof Quaternion ? b.x : b.x;
      const by = b instanceof Quaternion ? b.y : b.y;
      const bz = b instanceof Quaternion ? b.z : b.z;
      const bw = b instanceof Quaternion ? b.w : b.w;
      result.set(
        ax + (bx - ax) * t,
        ay + (by - ay) * t,
        az + (bz - az) * t,
        aw + (bw - aw) * t
      );
    }
    return result;
  }

  static negate(a: Quaternion | QuaternionLike): Quaternion {
    const result = new Quaternion();

    result.set(-a.x, -a.y, -a.z, -a.w);
    return result;
  }

  static equals(
    a: Quaternion | QuaternionLike,
    b: Quaternion | QuaternionLike,
    epsilon: number = 0.0001
  ): boolean {
    if (a instanceof Quaternion && b instanceof Quaternion) {
      return (
        quat.exactEquals(a._data, b._data) || quat.equals(a._data, b._data)
      );
    }
    const ax = a instanceof Quaternion ? a.x : a.x;
    const ay = a instanceof Quaternion ? a.y : a.y;
    const az = a instanceof Quaternion ? a.z : a.z;
    const aw = a instanceof Quaternion ? a.w : a.w;
    const bx = b instanceof Quaternion ? b.x : b.x;
    const by = b instanceof Quaternion ? b.y : b.y;
    const bz = b instanceof Quaternion ? b.z : b.z;
    const bw = b instanceof Quaternion ? b.w : b.w;
    return (
      Math.abs(ax - bx) < epsilon &&
      Math.abs(ay - by) < epsilon &&
      Math.abs(az - bz) < epsilon &&
      Math.abs(aw - bw) < epsilon
    );
  }
}
