import { mat3, vec3 } from "gl-matrix";
import { Vector3, Vector3Like } from "./vector3";

export interface Mat3Like {
  m00: number;
  m01: number;
  m02: number;
  m10: number;
  m11: number;
  m12: number;
  m20: number;
  m21: number;
  m22: number;
}

export class Mat3 {
  private _data: Float32Array;

  constructor(
    m00: number = 1,
    m01: number = 0,
    m02: number = 0,
    m10: number = 0,
    m11: number = 1,
    m12: number = 0,
    m20: number = 0,
    m21: number = 0,
    m22: number = 1
  ) {
    this._data = new Float32Array(9);
    this._data[0] = m00;
    this._data[1] = m01;
    this._data[2] = m02;
    this._data[3] = m10;
    this._data[4] = m11;
    this._data[5] = m12;
    this._data[6] = m20;
    this._data[7] = m21;
    this._data[8] = m22;
  }

  get data(): Float32Array {
    return this._data;
  }

  // Accessors for matrix elements
  get m00(): number {
    return this._data[0];
  }
  set m00(value: number) {
    this._data[0] = value;
  }
  get m01(): number {
    return this._data[1];
  }
  set m01(value: number) {
    this._data[1] = value;
  }
  get m02(): number {
    return this._data[2];
  }
  set m02(value: number) {
    this._data[2] = value;
  }
  get m10(): number {
    return this._data[3];
  }
  set m10(value: number) {
    this._data[3] = value;
  }
  get m11(): number {
    return this._data[4];
  }
  set m11(value: number) {
    this._data[4] = value;
  }
  get m12(): number {
    return this._data[5];
  }
  set m12(value: number) {
    this._data[5] = value;
  }
  get m20(): number {
    return this._data[6];
  }
  set m20(value: number) {
    this._data[6] = value;
  }
  get m21(): number {
    return this._data[7];
  }
  set m21(value: number) {
    this._data[7] = value;
  }
  get m22(): number {
    return this._data[8];
  }
  set m22(value: number) {
    this._data[8] = value;
  }

  // Instance methods
  copyFrom(other: Mat3 | Mat3Like): Mat3 {
    if (other instanceof Mat3) {
      this._data.set(other._data);
    } else {
      this._data[0] = other.m00;
      this._data[1] = other.m01;
      this._data[2] = other.m02;
      this._data[3] = other.m10;
      this._data[4] = other.m11;
      this._data[5] = other.m12;
      this._data[6] = other.m20;
      this._data[7] = other.m21;
      this._data[8] = other.m22;
    }
    return this;
  }

  clone(): Mat3 {
    return new Mat3(
      this.m00,
      this.m01,
      this.m02,
      this.m10,
      this.m11,
      this.m12,
      this.m20,
      this.m21,
      this.m22
    );
  }

  set(
    m00: number,
    m01: number,
    m02: number,
    m10: number,
    m11: number,
    m12: number,
    m20: number,
    m21: number,
    m22: number
  ): Mat3 {
    this._data[0] = m00;
    this._data[1] = m01;
    this._data[2] = m02;
    this._data[3] = m10;
    this._data[4] = m11;
    this._data[5] = m12;
    this._data[6] = m20;
    this._data[7] = m21;
    this._data[8] = m22;
    return this;
  }

  identity(): Mat3 {
    mat3.identity(this._data);
    return this;
  }

  add(other: Mat3 | Mat3Like): Mat3 {
    if (other instanceof Mat3) {
      for (let i = 0; i < 9; i++) {
        this._data[i] += other._data[i];
      }
    } else {
      this._data[0] += other.m00;
      this._data[1] += other.m01;
      this._data[2] += other.m02;
      this._data[3] += other.m10;
      this._data[4] += other.m11;
      this._data[5] += other.m12;
      this._data[6] += other.m20;
      this._data[7] += other.m21;
      this._data[8] += other.m22;
    }
    return this;
  }

  subtract(other: Mat3 | Mat3Like): Mat3 {
    if (other instanceof Mat3) {
      for (let i = 0; i < 9; i++) {
        this._data[i] -= other._data[i];
      }
    } else {
      this._data[0] -= other.m00;
      this._data[1] -= other.m01;
      this._data[2] -= other.m02;
      this._data[3] -= other.m10;
      this._data[4] -= other.m11;
      this._data[5] -= other.m12;
      this._data[6] -= other.m20;
      this._data[7] -= other.m21;
      this._data[8] -= other.m22;
    }
    return this;
  }

  multiply(other: Mat3 | Mat3Like): Mat3 {
    if (other instanceof Mat3) {
      mat3.multiply(this._data, this._data, other._data);
    } else {
      const temp = new Mat3(
        other.m00,
        other.m01,
        other.m02,
        other.m10,
        other.m11,
        other.m12,
        other.m20,
        other.m21,
        other.m22
      );
      mat3.multiply(this._data, this._data, temp._data);
    }
    return this;
  }

  multiplyScalar(scalar: number): Mat3 {
    mat3.scale(this._data, this._data, [scalar, scalar]);
    return this;
  }

  transpose(): Mat3 {
    mat3.transpose(this._data, this._data);
    return this;
  }

  inverse(): Mat3 {
    mat3.invert(this._data, this._data);
    return this;
  }

  determinant(): number {
    return mat3.determinant(this._data);
  }

  transformVector(vector: Vector3 | Vector3Like): Vector3 {
    const result = new Vector3();
    if (vector instanceof Vector3) {
      vec3.transformMat3(result.data, vector.data, this._data);
    } else {
      const temp = new Vector3(vector.x, vector.y, vector.z);
      vec3.transformMat3(result.data, temp.data, this._data);
    }
    return result;
  }

  equals(other: Mat3 | Mat3Like, epsilon: number = 0.0001): boolean {
    if (other instanceof Mat3) {
      return (
        mat3.exactEquals(this._data, other._data) ||
        mat3.equals(this._data, other._data)
      );
    }
    return (
      Math.abs(this.m00 - other.m00) < epsilon &&
      Math.abs(this.m01 - other.m01) < epsilon &&
      Math.abs(this.m02 - other.m02) < epsilon &&
      Math.abs(this.m10 - other.m10) < epsilon &&
      Math.abs(this.m11 - other.m11) < epsilon &&
      Math.abs(this.m12 - other.m12) < epsilon &&
      Math.abs(this.m20 - other.m20) < epsilon &&
      Math.abs(this.m21 - other.m21) < epsilon &&
      Math.abs(this.m22 - other.m22) < epsilon
    );
  }

  toString(): string {
    return `Mat3(
  ${this.m00.toFixed(3)}, ${this.m01.toFixed(3)}, ${this.m02.toFixed(3)}
  ${this.m10.toFixed(3)}, ${this.m11.toFixed(3)}, ${this.m12.toFixed(3)}
  ${this.m20.toFixed(3)}, ${this.m21.toFixed(3)}, ${this.m22.toFixed(3)}
)`;
  }

  toArray(): number[] {
    return Array.from(this._data);
  }

  toObject(): Mat3Like {
    return {
      m00: this.m00,
      m01: this.m01,
      m02: this.m02,
      m10: this.m10,
      m11: this.m11,
      m12: this.m12,
      m20: this.m20,
      m21: this.m21,
      m22: this.m22,
    };
  }

  // Static methods
  static identity(): Mat3 {
    return new Mat3();
  }

  static zero(): Mat3 {
    return new Mat3(0, 0, 0, 0, 0, 0, 0, 0, 0);
  }

  static fromArray(array: number[]): Mat3 {
    return new Mat3(
      array[0] || 0,
      array[1] || 0,
      array[2] || 0,
      array[3] || 0,
      array[4] || 0,
      array[5] || 0,
      array[6] || 0,
      array[7] || 0,
      array[8] || 0
    );
  }

  static fromObject(obj: Mat3Like): Mat3 {
    return new Mat3(
      obj.m00,
      obj.m01,
      obj.m02,
      obj.m10,
      obj.m11,
      obj.m12,
      obj.m20,
      obj.m21,
      obj.m22
    );
  }

  static add(a: Mat3 | Mat3Like, b: Mat3 | Mat3Like): Mat3 {
    const result = new Mat3();
    if (a instanceof Mat3 && b instanceof Mat3) {
      for (let i = 0; i < 9; i++) {
        result._data[i] = a._data[i] + b._data[i];
      }
    } else {
      const aObj = a instanceof Mat3 ? a.toObject() : a;
      const bObj = b instanceof Mat3 ? b.toObject() : b;
      result.set(
        aObj.m00 + bObj.m00,
        aObj.m01 + bObj.m01,
        aObj.m02 + bObj.m02,
        aObj.m10 + bObj.m10,
        aObj.m11 + bObj.m11,
        aObj.m12 + bObj.m12,
        aObj.m20 + bObj.m20,
        aObj.m21 + bObj.m21,
        aObj.m22 + bObj.m22
      );
    }
    return result;
  }

  static subtract(a: Mat3 | Mat3Like, b: Mat3 | Mat3Like): Mat3 {
    const result = new Mat3();
    if (a instanceof Mat3 && b instanceof Mat3) {
      for (let i = 0; i < 9; i++) {
        result._data[i] = a._data[i] - b._data[i];
      }
    } else {
      const aObj = a instanceof Mat3 ? a.toObject() : a;
      const bObj = b instanceof Mat3 ? b.toObject() : b;
      result.set(
        aObj.m00 - bObj.m00,
        aObj.m01 - bObj.m01,
        aObj.m02 - bObj.m02,
        aObj.m10 - bObj.m10,
        aObj.m11 - bObj.m11,
        aObj.m12 - bObj.m12,
        aObj.m20 - bObj.m20,
        aObj.m21 - bObj.m21,
        aObj.m22 - bObj.m22
      );
    }
    return result;
  }

  static multiply(a: Mat3 | Mat3Like, b: Mat3 | Mat3Like): Mat3 {
    const result = new Mat3();
    if (a instanceof Mat3 && b instanceof Mat3) {
      mat3.multiply(result._data, a._data, b._data);
    } else {
      const aMat = a instanceof Mat3 ? a : Mat3.fromObject(a);
      const bMat = b instanceof Mat3 ? b : Mat3.fromObject(b);
      mat3.multiply(result._data, aMat._data, bMat._data);
    }
    return result;
  }

  static multiplyScalar(a: Mat3 | Mat3Like, scalar: number): Mat3 {
    const result = new Mat3();
    if (a instanceof Mat3) {
      mat3.scale(result._data, a._data, [scalar, scalar]);
    } else {
      const aMat = Mat3.fromObject(a);
      mat3.scale(result._data, aMat._data, [scalar, scalar]);
    }
    return result;
  }

  static transpose(a: Mat3 | Mat3Like): Mat3 {
    const result = new Mat3();
    if (a instanceof Mat3) {
      mat3.transpose(result._data, a._data);
    } else {
      const aMat = Mat3.fromObject(a);
      mat3.transpose(result._data, aMat._data);
    }
    return result;
  }

  static inverse(a: Mat3 | Mat3Like): Mat3 {
    const result = new Mat3();
    if (a instanceof Mat3) {
      mat3.invert(result._data, a._data);
    } else {
      const aMat = Mat3.fromObject(a);
      mat3.invert(result._data, aMat._data);
    }
    return result;
  }

  static determinant(a: Mat3 | Mat3Like): number {
    if (a instanceof Mat3) {
      return mat3.determinant(a._data);
    }
    const aMat = Mat3.fromObject(a);
    return mat3.determinant(aMat._data);
  }

  static transformVector(
    a: Mat3 | Mat3Like,
    vector: Vector3 | Vector3Like
  ): Vector3 {
    const result = new Vector3();
    if (a instanceof Mat3 && vector instanceof Vector3) {
      vec3.transformMat3(result.data, vector.data, a._data);
    } else {
      const aMat = a instanceof Mat3 ? a : Mat3.fromObject(a);
      const v =
        vector instanceof Vector3
          ? vector
          : new Vector3(vector.x, vector.y, vector.z);
      vec3.transformMat3(result.data, v.data, aMat._data);
    }
    return result;
  }

  static equals(
    a: Mat3 | Mat3Like,
    b: Mat3 | Mat3Like,
    epsilon: number = 0.0001
  ): boolean {
    if (a instanceof Mat3 && b instanceof Mat3) {
      return (
        mat3.exactEquals(a._data, b._data) || mat3.equals(a._data, b._data)
      );
    }
    const aObj = a instanceof Mat3 ? a.toObject() : a;
    const bObj = b instanceof Mat3 ? b.toObject() : b;
    return (
      Math.abs(aObj.m00 - bObj.m00) < epsilon &&
      Math.abs(aObj.m01 - bObj.m01) < epsilon &&
      Math.abs(aObj.m02 - bObj.m02) < epsilon &&
      Math.abs(aObj.m10 - bObj.m10) < epsilon &&
      Math.abs(aObj.m11 - bObj.m11) < epsilon &&
      Math.abs(aObj.m12 - bObj.m12) < epsilon &&
      Math.abs(aObj.m20 - bObj.m20) < epsilon &&
      Math.abs(aObj.m21 - bObj.m21) < epsilon &&
      Math.abs(aObj.m22 - bObj.m22) < epsilon
    );
  }
}
