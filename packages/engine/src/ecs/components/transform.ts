import { Point, PointLike } from "pixi.js";

export { Point };

export class Transform {
  #position: Point;
  #rotation: number;
  #scale: Point;

  #isDirty: boolean;

  constructor() {
    this.#position = new Point(0, 0);
    this.#rotation = 0;
    this.#scale = new Point(1, 1);
    this.#isDirty = false;
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

  public set rotation(rotation: number) {
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

  public static fromPosition(position: PointLike) {
    const transform = new Transform();
    transform.position = position;
    return transform;
  }

  public static fromRotation(rotation: number) {
    const transform = new Transform();
    transform.rotation = rotation;
    return transform;
  }
}
