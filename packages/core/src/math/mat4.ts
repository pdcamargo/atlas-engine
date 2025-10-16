import { mat4, vec3, Mat4 as Mat4GL } from "gl-matrix";
import { Vector3, Vector3Like } from "./vector3";

export interface Mat4Like {
  m00: number;
  m01: number;
  m02: number;
  m03: number;
  m10: number;
  m11: number;
  m12: number;
  m13: number;
  m20: number;
  m21: number;
  m22: number;
  m23: number;
  m30: number;
  m31: number;
  m32: number;
  m33: number;
}

export class Mat4 {
  private _data: Mat4GL;

  constructor(
    m00: number = 1,
    m01: number = 0,
    m02: number = 0,
    m03: number = 0,
    m10: number = 0,
    m11: number = 1,
    m12: number = 0,
    m13: number = 0,
    m20: number = 0,
    m21: number = 0,
    m22: number = 1,
    m23: number = 0,
    m30: number = 0,
    m31: number = 0,
    m32: number = 0,
    m33: number = 1
  ) {
    this._data = mat4.fromValues(
      m00,
      m01,
      m02,
      m03,
      m10,
      m11,
      m12,
      m13,
      m20,
      m21,
      m22,
      m23,
      m30,
      m31,
      m32,
      m33
    );
  }

  get data() {
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
  get m03(): number {
    return this._data[3];
  }
  set m03(value: number) {
    this._data[3] = value;
  }
  get m10(): number {
    return this._data[4];
  }
  set m10(value: number) {
    this._data[4] = value;
  }
  get m11(): number {
    return this._data[5];
  }
  set m11(value: number) {
    this._data[5] = value;
  }
  get m12(): number {
    return this._data[6];
  }
  set m12(value: number) {
    this._data[6] = value;
  }
  get m13(): number {
    return this._data[7];
  }
  set m13(value: number) {
    this._data[7] = value;
  }
  get m20(): number {
    return this._data[8];
  }
  set m20(value: number) {
    this._data[8] = value;
  }
  get m21(): number {
    return this._data[9];
  }
  set m21(value: number) {
    this._data[9] = value;
  }
  get m22(): number {
    return this._data[10];
  }
  set m22(value: number) {
    this._data[10] = value;
  }
  get m23(): number {
    return this._data[11];
  }
  set m23(value: number) {
    this._data[11] = value;
  }
  get m30(): number {
    return this._data[12];
  }
  set m30(value: number) {
    this._data[12] = value;
  }
  get m31(): number {
    return this._data[13];
  }
  set m31(value: number) {
    this._data[13] = value;
  }
  get m32(): number {
    return this._data[14];
  }
  set m32(value: number) {
    this._data[14] = value;
  }
  get m33(): number {
    return this._data[15];
  }
  set m33(value: number) {
    this._data[15] = value;
  }

  // Instance methods
  copyFrom(other: Mat4 | Mat4Like): Mat4 {
    if (other instanceof Mat4) {
      this._data.set(other._data);
    } else {
      this._data[0] = other.m00;
      this._data[1] = other.m01;
      this._data[2] = other.m02;
      this._data[3] = other.m03;
      this._data[4] = other.m10;
      this._data[5] = other.m11;
      this._data[6] = other.m12;
      this._data[7] = other.m13;
      this._data[8] = other.m20;
      this._data[9] = other.m21;
      this._data[10] = other.m22;
      this._data[11] = other.m23;
      this._data[12] = other.m30;
      this._data[13] = other.m31;
      this._data[14] = other.m32;
      this._data[15] = other.m33;
    }
    return this;
  }

  clone(): Mat4 {
    return new Mat4(
      this.m00,
      this.m01,
      this.m02,
      this.m03,
      this.m10,
      this.m11,
      this.m12,
      this.m13,
      this.m20,
      this.m21,
      this.m22,
      this.m23,
      this.m30,
      this.m31,
      this.m32,
      this.m33
    );
  }

  set(
    m00: number,
    m01: number,
    m02: number,
    m03: number,
    m10: number,
    m11: number,
    m12: number,
    m13: number,
    m20: number,
    m21: number,
    m22: number,
    m23: number,
    m30: number,
    m31: number,
    m32: number,
    m33: number
  ): Mat4 {
    this._data[0] = m00;
    this._data[1] = m01;
    this._data[2] = m02;
    this._data[3] = m03;
    this._data[4] = m10;
    this._data[5] = m11;
    this._data[6] = m12;
    this._data[7] = m13;
    this._data[8] = m20;
    this._data[9] = m21;
    this._data[10] = m22;
    this._data[11] = m23;
    this._data[12] = m30;
    this._data[13] = m31;
    this._data[14] = m32;
    this._data[15] = m33;
    return this;
  }

  identity(): Mat4 {
    mat4.identity(this._data);
    return this;
  }

  add(other: Mat4 | Mat4Like): Mat4 {
    if (other instanceof Mat4) {
      for (let i = 0; i < 16; i++) {
        this._data[i] += other._data[i];
      }
    } else {
      this._data[0] += other.m00;
      this._data[1] += other.m01;
      this._data[2] += other.m02;
      this._data[3] += other.m03;
      this._data[4] += other.m10;
      this._data[5] += other.m11;
      this._data[6] += other.m12;
      this._data[7] += other.m13;
      this._data[8] += other.m20;
      this._data[9] += other.m21;
      this._data[10] += other.m22;
      this._data[11] += other.m23;
      this._data[12] += other.m30;
      this._data[13] += other.m31;
      this._data[14] += other.m32;
      this._data[15] += other.m33;
    }
    return this;
  }

  subtract(other: Mat4 | Mat4Like): Mat4 {
    if (other instanceof Mat4) {
      for (let i = 0; i < 16; i++) {
        this._data[i] -= other._data[i];
      }
    } else {
      this._data[0] -= other.m00;
      this._data[1] -= other.m01;
      this._data[2] -= other.m02;
      this._data[3] -= other.m03;
      this._data[4] -= other.m10;
      this._data[5] -= other.m11;
      this._data[6] -= other.m12;
      this._data[7] -= other.m13;
      this._data[8] -= other.m20;
      this._data[9] -= other.m21;
      this._data[10] -= other.m22;
      this._data[11] -= other.m23;
      this._data[12] -= other.m30;
      this._data[13] -= other.m31;
      this._data[14] -= other.m32;
      this._data[15] -= other.m33;
    }
    return this;
  }

  multiply(other: Mat4 | Mat4Like): Mat4 {
    if (other instanceof Mat4) {
      mat4.multiply(this._data, this._data, other._data);
    } else {
      const temp = new Mat4(
        other.m00,
        other.m01,
        other.m02,
        other.m03,
        other.m10,
        other.m11,
        other.m12,
        other.m13,
        other.m20,
        other.m21,
        other.m22,
        other.m23,
        other.m30,
        other.m31,
        other.m32,
        other.m33
      );
      mat4.multiply(this._data, this._data, temp._data);
    }
    return this;
  }

  multiplyScalar(scalar: number): Mat4 {
    for (let i = 0; i < 16; i++) {
      this._data[i] *= scalar;
    }
    return this;
  }

  transpose(): Mat4 {
    mat4.transpose(this._data, this._data);
    return this;
  }

  inverse(): Mat4 {
    mat4.invert(this._data, this._data);
    return this;
  }

  determinant(): number {
    return mat4.determinant(this._data);
  }

  transformVector(vector: Vector3 | Vector3Like): Vector3 {
    const result = new Vector3();
    if (vector instanceof Vector3) {
      vec3.transformMat4(result.data, vector.data, this._data);
    } else {
      const temp = new Vector3(vector.x, vector.y, vector.z);
      vec3.transformMat4(result.data, temp.data, this._data);
    }
    return result;
  }

  translate(translation: Vector3 | Vector3Like): Mat4 {
    if (translation instanceof Vector3) {
      mat4.translate(this._data, this._data, translation.data);
    } else {
      const temp = new Vector3(translation.x, translation.y, translation.z);
      mat4.translate(this._data, this._data, temp.data);
    }
    return this;
  }

  scale(scaling: Vector3 | Vector3Like): Mat4 {
    if (scaling instanceof Vector3) {
      mat4.scale(this._data, this._data, scaling.data);
    } else {
      const temp = new Vector3(scaling.x, scaling.y, scaling.z);
      mat4.scale(this._data, this._data, temp.data);
    }
    return this;
  }

  rotate(angle: number, axis: Vector3 | Vector3Like): Mat4 {
    if (axis instanceof Vector3) {
      mat4.rotate(this._data, this._data, angle, axis.data);
    } else {
      const temp = new Vector3(axis.x, axis.y, axis.z);
      mat4.rotate(this._data, this._data, angle, temp.data);
    }
    return this;
  }

  rotateX(angle: number): Mat4 {
    mat4.rotateX(this._data, this._data, angle);
    return this;
  }

  rotateY(angle: number): Mat4 {
    mat4.rotateY(this._data, this._data, angle);
    return this;
  }

  rotateZ(angle: number): Mat4 {
    mat4.rotateZ(this._data, this._data, angle);
    return this;
  }

  equals(other: Mat4 | Mat4Like, epsilon: number = 0.0001): boolean {
    if (other instanceof Mat4) {
      return (
        mat4.exactEquals(this._data, other._data) ||
        mat4.equals(this._data, other._data)
      );
    }
    return (
      Math.abs(this.m00 - other.m00) < epsilon &&
      Math.abs(this.m01 - other.m01) < epsilon &&
      Math.abs(this.m02 - other.m02) < epsilon &&
      Math.abs(this.m03 - other.m03) < epsilon &&
      Math.abs(this.m10 - other.m10) < epsilon &&
      Math.abs(this.m11 - other.m11) < epsilon &&
      Math.abs(this.m12 - other.m12) < epsilon &&
      Math.abs(this.m13 - other.m13) < epsilon &&
      Math.abs(this.m20 - other.m20) < epsilon &&
      Math.abs(this.m21 - other.m21) < epsilon &&
      Math.abs(this.m22 - other.m22) < epsilon &&
      Math.abs(this.m23 - other.m23) < epsilon &&
      Math.abs(this.m30 - other.m30) < epsilon &&
      Math.abs(this.m31 - other.m31) < epsilon &&
      Math.abs(this.m32 - other.m32) < epsilon &&
      Math.abs(this.m33 - other.m33) < epsilon
    );
  }

  toString(): string {
    return `Mat4(
  ${this.m00.toFixed(3)}, ${this.m01.toFixed(3)}, ${this.m02.toFixed(3)}, ${this.m03.toFixed(3)}
  ${this.m10.toFixed(3)}, ${this.m11.toFixed(3)}, ${this.m12.toFixed(3)}, ${this.m13.toFixed(3)}
  ${this.m20.toFixed(3)}, ${this.m21.toFixed(3)}, ${this.m22.toFixed(3)}, ${this.m23.toFixed(3)}
  ${this.m30.toFixed(3)}, ${this.m31.toFixed(3)}, ${this.m32.toFixed(3)}, ${this.m33.toFixed(3)}
)`;
  }

  toArray(): number[] {
    return Array.from(this._data);
  }

  toObject(): Mat4Like {
    return {
      m00: this.m00,
      m01: this.m01,
      m02: this.m02,
      m03: this.m03,
      m10: this.m10,
      m11: this.m11,
      m12: this.m12,
      m13: this.m13,
      m20: this.m20,
      m21: this.m21,
      m22: this.m22,
      m23: this.m23,
      m30: this.m30,
      m31: this.m31,
      m32: this.m32,
      m33: this.m33,
    };
  }

  // Static methods
  static identity(): Mat4 {
    return new Mat4();
  }

  static zero(): Mat4 {
    return new Mat4(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
  }

  static fromArray(array: number[]): Mat4 {
    return new Mat4(
      array[0] || 0,
      array[1] || 0,
      array[2] || 0,
      array[3] || 0,
      array[4] || 0,
      array[5] || 0,
      array[6] || 0,
      array[7] || 0,
      array[8] || 0,
      array[9] || 0,
      array[10] || 0,
      array[11] || 0,
      array[12] || 0,
      array[13] || 0,
      array[14] || 0,
      array[15] || 0
    );
  }

  static fromObject(obj: Mat4Like): Mat4 {
    return new Mat4(
      obj.m00,
      obj.m01,
      obj.m02,
      obj.m03,
      obj.m10,
      obj.m11,
      obj.m12,
      obj.m13,
      obj.m20,
      obj.m21,
      obj.m22,
      obj.m23,
      obj.m30,
      obj.m31,
      obj.m32,
      obj.m33
    );
  }

  static add(a: Mat4 | Mat4Like, b: Mat4 | Mat4Like): Mat4 {
    const result = new Mat4();
    if (a instanceof Mat4 && b instanceof Mat4) {
      for (let i = 0; i < 16; i++) {
        result._data[i] = a._data[i] + b._data[i];
      }
    } else {
      const aObj = a instanceof Mat4 ? a.toObject() : a;
      const bObj = b instanceof Mat4 ? b.toObject() : b;
      result.set(
        aObj.m00 + bObj.m00,
        aObj.m01 + bObj.m01,
        aObj.m02 + bObj.m02,
        aObj.m03 + bObj.m03,
        aObj.m10 + bObj.m10,
        aObj.m11 + bObj.m11,
        aObj.m12 + bObj.m12,
        aObj.m13 + bObj.m13,
        aObj.m20 + bObj.m20,
        aObj.m21 + bObj.m21,
        aObj.m22 + bObj.m22,
        aObj.m23 + bObj.m23,
        aObj.m30 + bObj.m30,
        aObj.m31 + bObj.m31,
        aObj.m32 + bObj.m32,
        aObj.m33 + bObj.m33
      );
    }
    return result;
  }

  static subtract(a: Mat4 | Mat4Like, b: Mat4 | Mat4Like): Mat4 {
    const result = new Mat4();
    if (a instanceof Mat4 && b instanceof Mat4) {
      for (let i = 0; i < 16; i++) {
        result._data[i] = a._data[i] - b._data[i];
      }
    } else {
      const aObj = a instanceof Mat4 ? a.toObject() : a;
      const bObj = b instanceof Mat4 ? b.toObject() : b;
      result.set(
        aObj.m00 - bObj.m00,
        aObj.m01 - bObj.m01,
        aObj.m02 - bObj.m02,
        aObj.m03 - bObj.m03,
        aObj.m10 - bObj.m10,
        aObj.m11 - bObj.m11,
        aObj.m12 - bObj.m12,
        aObj.m13 - bObj.m13,
        aObj.m20 - bObj.m20,
        aObj.m21 - bObj.m21,
        aObj.m22 - bObj.m22,
        aObj.m23 - bObj.m23,
        aObj.m30 - bObj.m30,
        aObj.m31 - bObj.m31,
        aObj.m32 - bObj.m32,
        aObj.m33 - bObj.m33
      );
    }
    return result;
  }

  static multiply(a: Mat4 | Mat4Like, b: Mat4 | Mat4Like, out?: Mat4GL): Mat4 {
    const result = new Mat4();
    if (a instanceof Mat4 && b instanceof Mat4) {
      mat4.multiply(result._data, a._data, b._data);
      if (out) {
        mat4.set(out, ...result._data);
      }
    } else {
      const aMat = a instanceof Mat4 ? a : Mat4.fromObject(a);
      const bMat = b instanceof Mat4 ? b : Mat4.fromObject(b);
      mat4.multiply(result._data, aMat._data, bMat._data);
      if (out) {
        mat4.set(out, ...result._data);
      }
    }
    return result;
  }

  static multiplyScalar(a: Mat4 | Mat4Like, scalar: number): Mat4 {
    const result = new Mat4();
    if (a instanceof Mat4) {
      for (let i = 0; i < 16; i++) {
        result._data[i] = a._data[i] * scalar;
      }
    } else {
      const aObj = a instanceof Mat4 ? a.toObject() : a;
      result.set(
        aObj.m00 * scalar,
        aObj.m01 * scalar,
        aObj.m02 * scalar,
        aObj.m03 * scalar,
        aObj.m10 * scalar,
        aObj.m11 * scalar,
        aObj.m12 * scalar,
        aObj.m13 * scalar,
        aObj.m20 * scalar,
        aObj.m21 * scalar,
        aObj.m22 * scalar,
        aObj.m23 * scalar,
        aObj.m30 * scalar,
        aObj.m31 * scalar,
        aObj.m32 * scalar,
        aObj.m33 * scalar
      );
    }
    return result;
  }

  static transpose(a: Mat4 | Mat4Like): Mat4 {
    const result = new Mat4();
    if (a instanceof Mat4) {
      mat4.transpose(result._data, a._data);
    } else {
      const aMat = Mat4.fromObject(a);
      mat4.transpose(result._data, aMat._data);
    }
    return result;
  }

  static inverse(a: Mat4 | Mat4Like): Mat4 {
    const result = new Mat4();
    if (a instanceof Mat4) {
      mat4.invert(result._data, a._data);
    } else {
      const aMat = Mat4.fromObject(a);
      mat4.invert(result._data, aMat._data);
    }
    return result;
  }

  static determinant(a: Mat4 | Mat4Like): number {
    if (a instanceof Mat4) {
      return mat4.determinant(a._data);
    }
    const aMat = Mat4.fromObject(a);
    return mat4.determinant(aMat._data);
  }

  static transformVector(
    a: Mat4 | Mat4Like,
    vector: Vector3 | Vector3Like
  ): Vector3 {
    const result = new Vector3();
    if (a instanceof Mat4 && vector instanceof Vector3) {
      vec3.transformMat4(result.data, vector.data, a._data);
    } else {
      const aMat = a instanceof Mat4 ? a : Mat4.fromObject(a);
      const v =
        vector instanceof Vector3
          ? vector
          : new Vector3(vector.x, vector.y, vector.z);
      vec3.transformMat4(result.data, v.data, aMat._data);
    }
    return result;
  }

  static translate(
    a: Mat4 | Mat4Like,
    translation: Vector3 | Vector3Like
  ): Mat4 {
    const result = new Mat4();
    if (a instanceof Mat4 && translation instanceof Vector3) {
      mat4.translate(result._data, a._data, translation.data);
    } else {
      const aMat = a instanceof Mat4 ? a : Mat4.fromObject(a);
      const t =
        translation instanceof Vector3
          ? translation
          : new Vector3(translation.x, translation.y, translation.z);
      mat4.translate(result._data, aMat._data, t.data);
    }
    return result;
  }

  static scale(a: Mat4 | Mat4Like, scaling: Vector3 | Vector3Like): Mat4 {
    const result = new Mat4();
    if (a instanceof Mat4 && scaling instanceof Vector3) {
      mat4.scale(result._data, a._data, scaling.data);
    } else {
      const aMat = a instanceof Mat4 ? a : Mat4.fromObject(a);
      const s =
        scaling instanceof Vector3
          ? scaling
          : new Vector3(scaling.x, scaling.y, scaling.z);
      mat4.scale(result._data, aMat._data, s.data);
    }
    return result;
  }

  static rotate(
    a: Mat4 | Mat4Like,
    angle: number,
    axis: Vector3 | Vector3Like
  ): Mat4 {
    const result = new Mat4();
    if (a instanceof Mat4 && axis instanceof Vector3) {
      mat4.rotate(result._data, a._data, angle, axis.data);
    } else {
      const aMat = a instanceof Mat4 ? a : Mat4.fromObject(a);
      const ax =
        axis instanceof Vector3 ? axis : new Vector3(axis.x, axis.y, axis.z);
      mat4.rotate(result._data, aMat._data, angle, ax.data);
    }
    return result;
  }

  static rotateX(a: Mat4 | Mat4Like, angle: number): Mat4 {
    const result = new Mat4();
    if (a instanceof Mat4) {
      mat4.rotateX(result._data, a._data, angle);
    } else {
      const aMat = Mat4.fromObject(a);
      mat4.rotateX(result._data, aMat._data, angle);
    }
    return result;
  }

  static rotateY(a: Mat4 | Mat4Like, angle: number): Mat4 {
    const result = new Mat4();
    if (a instanceof Mat4) {
      mat4.rotateY(result._data, a._data, angle);
    } else {
      const aMat = Mat4.fromObject(a);
      mat4.rotateY(result._data, aMat._data, angle);
    }
    return result;
  }

  static rotateZ(a: Mat4 | Mat4Like, angle: number): Mat4 {
    const result = new Mat4();
    if (a instanceof Mat4) {
      mat4.rotateZ(result._data, a._data, angle);
    } else {
      const aMat = Mat4.fromObject(a);
      mat4.rotateZ(result._data, aMat._data, angle);
    }
    return result;
  }

  static equals(
    a: Mat4 | Mat4Like,
    b: Mat4 | Mat4Like,
    epsilon: number = 0.0001
  ): boolean {
    if (a instanceof Mat4 && b instanceof Mat4) {
      return (
        mat4.exactEquals(a._data, b._data) || mat4.equals(a._data, b._data)
      );
    }
    const aObj = a instanceof Mat4 ? a.toObject() : a;
    const bObj = b instanceof Mat4 ? b.toObject() : b;
    return (
      Math.abs(aObj.m00 - bObj.m00) < epsilon &&
      Math.abs(aObj.m01 - bObj.m01) < epsilon &&
      Math.abs(aObj.m02 - bObj.m02) < epsilon &&
      Math.abs(aObj.m03 - bObj.m03) < epsilon &&
      Math.abs(aObj.m10 - bObj.m10) < epsilon &&
      Math.abs(aObj.m11 - bObj.m11) < epsilon &&
      Math.abs(aObj.m12 - bObj.m12) < epsilon &&
      Math.abs(aObj.m13 - bObj.m13) < epsilon &&
      Math.abs(aObj.m20 - bObj.m20) < epsilon &&
      Math.abs(aObj.m21 - bObj.m21) < epsilon &&
      Math.abs(aObj.m22 - bObj.m22) < epsilon &&
      Math.abs(aObj.m23 - bObj.m23) < epsilon &&
      Math.abs(aObj.m30 - bObj.m30) < epsilon &&
      Math.abs(aObj.m31 - bObj.m31) < epsilon &&
      Math.abs(aObj.m32 - bObj.m32) < epsilon &&
      Math.abs(aObj.m33 - bObj.m33) < epsilon
    );
  }
}
