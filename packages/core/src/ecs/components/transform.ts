import { mat4 } from "gl-matrix";
import {
  Quaternion,
  type QuaternionLike,
  Vector2,
  type Vector2Like,
} from "../../math";
import { Serializable, SerializeProperty } from "../serialization";

@Serializable()
export class Transform {
  @SerializeProperty()
  public position: Vector2;
  @SerializeProperty()
  public rotation: Quaternion;
  @SerializeProperty()
  public scale: Vector2;

  #isDirty: boolean;
  #matrix: Float32Array;

  constructor(
    position: Vector2Like = { x: 0, y: 0 },
    rotation: QuaternionLike = { x: 0, y: 0, z: 0, w: 1 },
    scale: Vector2Like = { x: 1, y: 1 },
    onChange?: () => void
  ) {
    // Create points with callback to mark transform as dirty when they change
    this.position = new Vector2(position.x, position.y, () => {
      this.#isDirty = true;
      onChange?.();
    });

    this.rotation = new Quaternion(
      rotation.x,
      rotation.y,
      rotation.z,
      rotation.w,
      () => {
        this.#isDirty = true;
        onChange?.();
      }
    );

    this.scale = new Vector2(scale.x, scale.y, () => {
      this.#isDirty = true;
      onChange?.();
    });

    this.#isDirty = true;
    this.#matrix = mat4.create();
    this.#updateMatrix();
  }

  public setPosition(position: Vector2Like) {
    this.position.copyFrom(position);
  }

  public setRotation(rotation: QuaternionLike) {
    this.rotation.copyFrom(rotation);
  }

  public setScale(scale: Vector2Like) {
    this.scale.copyFrom(scale);
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

    mat4.fromRotationTranslationScale(
      this.#matrix,
      this.rotation.data,
      this.position.data,
      this.scale.data
    );
  }

  public static fromPosition(position: Vector2Like) {
    const transform = new Transform();
    transform.setPosition(position);
    return transform;
  }

  public static fromRotation(rotation: QuaternionLike) {
    const transform = new Transform();
    transform.setRotation(rotation);
    return transform;
  }

  public static fromScale(scale: Vector2Like) {
    const transform = new Transform();
    transform.setScale(scale);
    return transform;
  }
}
