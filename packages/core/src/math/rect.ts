import { Vector2, Vector2Like } from "./vector2";

export interface RectLike {
  x: number;
  y: number;
  width: number;
  height: number;
}

export class Rect {
  private _data: Float32Array;

  constructor(
    x: number = 0,
    y: number = 0,
    width: number = 0,
    height: number = 0
  ) {
    this._data = new Float32Array(4);
    this._data[0] = x;
    this._data[1] = y;
    this._data[2] = width;
    this._data[3] = height;
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

  get width(): number {
    return this._data[2];
  }

  set width(value: number) {
    this._data[2] = value;
  }

  get height(): number {
    return this._data[3];
  }

  set height(value: number) {
    this._data[3] = value;
  }

  get data(): Float32Array {
    return this._data;
  }

  get left(): number {
    return this.x;
  }

  get right(): number {
    return this.x + this.width;
  }

  get top(): number {
    return this.y;
  }

  get bottom(): number {
    return this.y + this.height;
  }

  get centerX(): number {
    return this.x + this.width / 2;
  }

  get centerY(): number {
    return this.y + this.height / 2;
  }

  get center(): Vector2 {
    return new Vector2(this.centerX, this.centerY);
  }

  get position(): Vector2 {
    return new Vector2(this.x, this.y);
  }

  get size(): Vector2 {
    return new Vector2(this.width, this.height);
  }

  get area(): number {
    return this.width * this.height;
  }

  get perimeter(): number {
    return 2 * (this.width + this.height);
  }

  // Instance methods
  copyFrom(other: Rect | RectLike): Rect {
    if (other instanceof Rect) {
      this._data.set(other._data);
    } else {
      this._data[0] = other.x;
      this._data[1] = other.y;
      this._data[2] = other.width;
      this._data[3] = other.height;
    }
    return this;
  }

  clone(): Rect {
    return new Rect(this.x, this.y, this.width, this.height);
  }

  set(x: number, y: number, width: number, height: number): Rect {
    this._data[0] = x;
    this._data[1] = y;
    this._data[2] = width;
    this._data[3] = height;
    return this;
  }

  setPosition(x: number, y: number): Rect {
    this._data[0] = x;
    this._data[1] = y;
    return this;
  }

  setSize(width: number, height: number): Rect {
    this._data[2] = width;
    this._data[3] = height;
    return this;
  }

  setCenter(x: number, y: number): Rect {
    this._data[0] = x - this.width / 2;
    this._data[1] = y - this.height / 2;
    return this;
  }

  setCenterFromVector(center: Vector2 | Vector2Like): Rect {
    if (center instanceof Vector2) {
      this.setCenter(center.x, center.y);
    } else {
      this.setCenter(center.x, center.y);
    }
    return this;
  }

  expand(amount: number): Rect {
    this._data[0] -= amount;
    this._data[1] -= amount;
    this._data[2] += amount * 2;
    this._data[3] += amount * 2;
    return this;
  }

  contract(amount: number): Rect {
    return this.expand(-amount);
  }

  translate(deltaX: number, deltaY: number): Rect {
    this._data[0] += deltaX;
    this._data[1] += deltaY;
    return this;
  }

  translateVector(delta: Vector2 | Vector2Like): Rect {
    if (delta instanceof Vector2) {
      this._data[0] += delta.x;
      this._data[1] += delta.y;
    } else {
      this._data[0] += delta.x;
      this._data[1] += delta.y;
    }
    return this;
  }

  scale(scaleX: number, scaleY: number = scaleX): Rect {
    const centerX = this.centerX;
    const centerY = this.centerY;
    this._data[2] *= scaleX;
    this._data[3] *= scaleY;
    this.setCenter(centerX, centerY);
    return this;
  }

  scaleFromCenter(scale: number): Rect {
    return this.scale(scale, scale);
  }

  contains(point: Vector2 | Vector2Like): boolean {
    const px = point instanceof Vector2 ? point.x : point.x;
    const py = point instanceof Vector2 ? point.y : point.y;
    return (
      px >= this.left && px <= this.right && py >= this.top && py <= this.bottom
    );
  }

  containsRect(other: Rect | RectLike): boolean {
    const otherRect =
      other instanceof Rect
        ? other
        : new Rect(other.x, other.y, other.width, other.height);
    return (
      this.left <= otherRect.left &&
      this.right >= otherRect.right &&
      this.top <= otherRect.top &&
      this.bottom >= otherRect.bottom
    );
  }

  intersects(other: Rect | RectLike): boolean {
    const otherRect =
      other instanceof Rect
        ? other
        : new Rect(other.x, other.y, other.width, other.height);
    return (
      this.left < otherRect.right &&
      this.right > otherRect.left &&
      this.top < otherRect.bottom &&
      this.bottom > otherRect.top
    );
  }

  intersection(other: Rect | RectLike): Rect {
    const otherRect =
      other instanceof Rect
        ? other
        : new Rect(other.x, other.y, other.width, other.height);
    const left = Math.max(this.left, otherRect.left);
    const top = Math.max(this.top, otherRect.top);
    const right = Math.min(this.right, otherRect.right);
    const bottom = Math.min(this.bottom, otherRect.bottom);

    if (left >= right || top >= bottom) {
      return new Rect(0, 0, 0, 0);
    }

    return new Rect(left, top, right - left, bottom - top);
  }

  union(other: Rect | RectLike): Rect {
    const otherRect =
      other instanceof Rect
        ? other
        : new Rect(other.x, other.y, other.width, other.height);
    const left = Math.min(this.left, otherRect.left);
    const top = Math.min(this.top, otherRect.top);
    const right = Math.max(this.right, otherRect.right);
    const bottom = Math.max(this.bottom, otherRect.bottom);

    return new Rect(left, top, right - left, bottom - top);
  }

  clamp(other: Rect | RectLike): Rect {
    const otherRect =
      other instanceof Rect
        ? other
        : new Rect(other.x, other.y, other.width, other.height);
    const clampedX = Math.max(
      otherRect.left,
      Math.min(this.x, otherRect.right - this.width)
    );
    const clampedY = Math.max(
      otherRect.top,
      Math.min(this.y, otherRect.bottom - this.height)
    );
    return new Rect(clampedX, clampedY, this.width, this.height);
  }

  normalize(): Rect {
    if (this.width < 0) {
      this._data[0] += this.width;
      this._data[2] = -this.width;
    }
    if (this.height < 0) {
      this._data[1] += this.height;
      this._data[3] = -this.height;
    }
    return this;
  }

  isEmpty(): boolean {
    return this.width <= 0 || this.height <= 0;
  }

  equals(other: Rect | RectLike, epsilon: number = 0.0001): boolean {
    if (other instanceof Rect) {
      return (
        Math.abs(this._data[0] - other._data[0]) < epsilon &&
        Math.abs(this._data[1] - other._data[1]) < epsilon &&
        Math.abs(this._data[2] - other._data[2]) < epsilon &&
        Math.abs(this._data[3] - other._data[3]) < epsilon
      );
    }
    return (
      Math.abs(this.x - other.x) < epsilon &&
      Math.abs(this.y - other.y) < epsilon &&
      Math.abs(this.width - other.width) < epsilon &&
      Math.abs(this.height - other.height) < epsilon
    );
  }

  toString(): string {
    return `Rect(${this.x.toFixed(3)}, ${this.y.toFixed(3)}, ${this.width.toFixed(3)}, ${this.height.toFixed(3)})`;
  }

  toArray(): [number, number, number, number] {
    return [this.x, this.y, this.width, this.height];
  }

  toObject(): RectLike {
    return { x: this.x, y: this.y, width: this.width, height: this.height };
  }

  // Static methods
  static zero(): Rect {
    return new Rect(0, 0, 0, 0);
  }

  static fromArray(array: number[]): Rect {
    return new Rect(array[0] || 0, array[1] || 0, array[2] || 0, array[3] || 0);
  }

  static fromObject(obj: RectLike): Rect {
    return new Rect(obj.x, obj.y, obj.width, obj.height);
  }

  static fromPositionAndSize(
    position: Vector2 | Vector2Like,
    size: Vector2 | Vector2Like
  ): Rect {
    const pos =
      position instanceof Vector2
        ? position
        : new Vector2(position.x, position.y);
    const siz = size instanceof Vector2 ? size : new Vector2(size.x, size.y);
    return new Rect(pos.x, pos.y, siz.x, siz.y);
  }

  static fromCenterAndSize(
    center: Vector2 | Vector2Like,
    size: Vector2 | Vector2Like
  ): Rect {
    const cen =
      center instanceof Vector2 ? center : new Vector2(center.x, center.y);
    const siz = size instanceof Vector2 ? size : new Vector2(size.x, size.y);
    return new Rect(cen.x - siz.x / 2, cen.y - siz.y / 2, siz.x, siz.y);
  }

  static fromPoints(
    point1: Vector2 | Vector2Like,
    point2: Vector2 | Vector2Like
  ): Rect {
    const p1 =
      point1 instanceof Vector2 ? point1 : new Vector2(point1.x, point1.y);
    const p2 =
      point2 instanceof Vector2 ? point2 : new Vector2(point2.x, point2.y);
    const left = Math.min(p1.x, p2.x);
    const top = Math.min(p1.y, p2.y);
    const right = Math.max(p1.x, p2.x);
    const bottom = Math.max(p1.y, p2.y);
    return new Rect(left, top, right - left, bottom - top);
  }

  static contains(a: Rect | RectLike, point: Vector2 | Vector2Like): boolean {
    const rect = a instanceof Rect ? a : new Rect(a.x, a.y, a.width, a.height);
    return rect.contains(point);
  }

  static containsRect(a: Rect | RectLike, b: Rect | RectLike): boolean {
    const rectA = a instanceof Rect ? a : new Rect(a.x, a.y, a.width, a.height);
    return rectA.containsRect(b);
  }

  static intersects(a: Rect | RectLike, b: Rect | RectLike): boolean {
    const rectA = a instanceof Rect ? a : new Rect(a.x, a.y, a.width, a.height);
    return rectA.intersects(b);
  }

  static intersection(a: Rect | RectLike, b: Rect | RectLike): Rect {
    const rectA = a instanceof Rect ? a : new Rect(a.x, a.y, a.width, a.height);
    return rectA.intersection(b);
  }

  static union(a: Rect | RectLike, b: Rect | RectLike): Rect {
    const rectA = a instanceof Rect ? a : new Rect(a.x, a.y, a.width, a.height);
    return rectA.union(b);
  }

  static clamp(rect: Rect | RectLike, bounds: Rect | RectLike): Rect {
    const r =
      rect instanceof Rect
        ? rect
        : new Rect(rect.x, rect.y, rect.width, rect.height);
    return r.clamp(bounds);
  }

  static equals(
    a: Rect | RectLike,
    b: Rect | RectLike,
    epsilon: number = 0.0001
  ): boolean {
    if (a instanceof Rect && b instanceof Rect) {
      return (
        Math.abs(a._data[0] - b._data[0]) < epsilon &&
        Math.abs(a._data[1] - b._data[1]) < epsilon &&
        Math.abs(a._data[2] - b._data[2]) < epsilon &&
        Math.abs(a._data[3] - b._data[3]) < epsilon
      );
    }
    const aObj = a instanceof Rect ? a.toObject() : a;
    const bObj = b instanceof Rect ? b.toObject() : b;
    return (
      Math.abs(aObj.x - bObj.x) < epsilon &&
      Math.abs(aObj.y - bObj.y) < epsilon &&
      Math.abs(aObj.width - bObj.width) < epsilon &&
      Math.abs(aObj.height - bObj.height) < epsilon
    );
  }
}
