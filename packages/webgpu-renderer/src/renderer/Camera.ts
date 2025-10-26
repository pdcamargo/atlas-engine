import { Mat4, Vector3 } from "@atlas/core";
import { mat4, quat, vec3 } from "gl-matrix";
import { Sprite } from "./Sprite";
import { Frustum } from "./Frustum";

/**
 * Base camera class with Unity-like API
 */
export abstract class Camera {
  public position: Vector3 = new Vector3();
  public rotation: Vector3 = new Vector3(); // Euler angles (pitch, yaw, roll) in radians
  public up: Vector3 = new Vector3(0, 1, 0);
  public enableOcclusionCulling: boolean = true;

  protected _aspectRatio: number = 1;
  protected _frustum: Frustum = new Frustum();

  protected _viewMatrix: Mat4 = new Mat4();
  protected _projectionMatrix: Mat4 = new Mat4();
  protected _viewProjectionMatrix: Mat4 = new Mat4();
  protected _viewDirty: boolean = true;
  protected _projectionDirty: boolean = true;
  protected _viewProjectionDirty: boolean = true;
  protected _frustumDirty: boolean = true;

  /**
   * Mark view matrix as dirty
   */
  markViewDirty(): void {
    this._viewDirty = true;
    this._viewProjectionDirty = true;
    this._frustumDirty = true;
  }

  /**
   * Mark projection matrix as dirty
   */
  markProjectionDirty(): void {
    this._projectionDirty = true;
    this._viewProjectionDirty = true;
    this._frustumDirty = true;
  }

  /**
   * Get the aspect ratio
   */
  getAspectRatio(): number {
    return this._aspectRatio;
  }

  /**
   * Set the aspect ratio
   */
  setAspectRatio(aspectRatio: number): void {
    const isAspectRatioChanged = aspectRatio !== this._aspectRatio;
    if (isAspectRatioChanged) {
      this._aspectRatio = aspectRatio;
      this.markProjectionDirty();
    }
  }

  /**
   * Get the forward vector (derived from rotation)
   */
  getForward(): Vector3 {
    const q = quat.create();
    quat.fromEuler(q, this.rotation.x * (180 / Math.PI), this.rotation.y * (180 / Math.PI), this.rotation.z * (180 / Math.PI));

    const forward = vec3.create();
    vec3.transformQuat(forward, [0, 0, -1], q);

    return new Vector3(forward[0], forward[1], forward[2]);
  }

  /**
   * Get the right vector (derived from rotation)
   */
  getRight(): Vector3 {
    const q = quat.create();
    quat.fromEuler(q, this.rotation.x * (180 / Math.PI), this.rotation.y * (180 / Math.PI), this.rotation.z * (180 / Math.PI));

    const right = vec3.create();
    vec3.transformQuat(right, [1, 0, 0], q);

    return new Vector3(right[0], right[1], right[2]);
  }

  /**
   * Get the up vector (derived from rotation)
   */
  getUp(): Vector3 {
    const q = quat.create();
    quat.fromEuler(q, this.rotation.x * (180 / Math.PI), this.rotation.y * (180 / Math.PI), this.rotation.z * (180 / Math.PI));

    const up = vec3.create();
    vec3.transformQuat(up, [0, 1, 0], q);

    return new Vector3(up[0], up[1], up[2]);
  }

  /**
   * Helper method to look at a target point (for easier migration from old API)
   */
  lookAt(target: Vector3): void {
    // Calculate direction from position to target
    const direction = new Vector3(
      target.x - this.position.x,
      target.y - this.position.y,
      target.z - this.position.z
    );

    // Calculate rotation from direction
    const length = Math.sqrt(
      direction.x * direction.x +
      direction.y * direction.y +
      direction.z * direction.z
    );

    if (length > 0.00001) {
      direction.x /= length;
      direction.y /= length;
      direction.z /= length;

      // Calculate yaw (rotation around Y axis)
      this.rotation.y = Math.atan2(direction.x, -direction.z);

      // Calculate pitch (rotation around X axis)
      const horizontalDistance = Math.sqrt(
        direction.x * direction.x + direction.z * direction.z
      );
      this.rotation.x = Math.atan2(direction.y, horizontalDistance);

      // Roll is kept as-is (or could be set to 0)
      this.markViewDirty();
    }
  }

  /**
   * Update view matrix using position and rotation
   */
  protected updateViewMatrix(): void {
    // Create quaternion from euler angles
    const q = quat.create();
    quat.fromEuler(
      q,
      this.rotation.x * (180 / Math.PI),
      this.rotation.y * (180 / Math.PI),
      this.rotation.z * (180 / Math.PI)
    );

    // Create rotation matrix from quaternion
    const rotationMatrix = mat4.create();
    mat4.fromQuat(rotationMatrix, q);

    // Create translation matrix
    const translationMatrix = mat4.create();
    mat4.fromTranslation(translationMatrix, [
      -this.position.x,
      -this.position.y,
      -this.position.z,
    ]);

    // View matrix = rotation * translation
    mat4.multiply(this._viewMatrix.data, rotationMatrix, translationMatrix);

    this._viewDirty = false;
  }

  /**
   * Update projection matrix (to be implemented by subclasses)
   */
  protected abstract updateProjectionMatrix(): void;

  /**
   * Get the view matrix
   */
  getViewMatrix(): Mat4 {
    if (this._viewDirty) {
      this.updateViewMatrix();
    }
    return this._viewMatrix;
  }

  /**
   * Get the projection matrix
   */
  getProjectionMatrix(): Mat4 {
    if (this._projectionDirty) {
      this.updateProjectionMatrix();
    }
    return this._projectionMatrix;
  }

  /**
   * Get the combined view-projection matrix (cached)
   */
  getViewProjectionMatrix(): Mat4 {
    if (this._viewProjectionDirty) {
      const view = this.getViewMatrix();
      const projection = this.getProjectionMatrix();
      mat4.multiply(this._viewProjectionMatrix.data, projection.data, view.data);
      this._viewProjectionDirty = false;
    }
    return this._viewProjectionMatrix;
  }

  /**
   * Get the frustum for culling tests
   */
  getFrustum(): Frustum {
    if (this._frustumDirty) {
      const vp = this.getViewProjectionMatrix();
      this._frustum.setFromMatrix(vp);
      this._frustumDirty = false;
    }
    return this._frustum;
  }

  /**
   * Check if a sprite is within the camera's view frustum
   * To be implemented by subclasses
   */
  abstract isInView(sprite: Sprite): boolean;
}

/**
 * Perspective camera with field of view
 */
export class PerspectiveCamera extends Camera {
  public fov: number;
  public near: number;
  public far: number;

  constructor(
    fov: number = Math.PI / 4,
    aspect: number = 1,
    near: number = 0.1,
    far: number = 1000
  ) {
    super();
    this.fov = fov;
    this._aspectRatio = aspect;
    this.near = near;
    this.far = far;
    this.markProjectionDirty();
  }

  protected updateProjectionMatrix(): void {
    // Create perspective projection for WebGPU (Z range 0 to 1)
    const f = 1.0 / Math.tan(this.fov / 2);
    const nf = 1 / (this.near - this.far);

    this._projectionMatrix.data[0] = f / this._aspectRatio;
    this._projectionMatrix.data[1] = 0;
    this._projectionMatrix.data[2] = 0;
    this._projectionMatrix.data[3] = 0;

    this._projectionMatrix.data[4] = 0;
    this._projectionMatrix.data[5] = f;
    this._projectionMatrix.data[6] = 0;
    this._projectionMatrix.data[7] = 0;

    this._projectionMatrix.data[8] = 0;
    this._projectionMatrix.data[9] = 0;
    this._projectionMatrix.data[10] = this.far * nf; // WebGPU: Z range 0 to 1
    this._projectionMatrix.data[11] = -1;

    this._projectionMatrix.data[12] = 0;
    this._projectionMatrix.data[13] = 0;
    this._projectionMatrix.data[14] = this.far * this.near * nf; // WebGPU: Z range 0 to 1
    this._projectionMatrix.data[15] = 0;

    this._projectionDirty = false;
  }

  /**
   * Check if a sprite is within the perspective camera's view frustum
   * Uses frustum culling with sphere bounding volume
   */
  isInView(sprite: Sprite): boolean {
    if (!this.enableOcclusionCulling) {
      return true;
    }

    // Get sprite position in world space from transform matrix
    const worldMatrix = sprite.getWorldMatrix();
    const spritePos = new Vector3(worldMatrix[12], worldMatrix[13], worldMatrix[14]);

    // Calculate sprite bounding sphere radius
    const radius = Math.sqrt(sprite.width * sprite.width + sprite.height * sprite.height) / 2;

    // Use frustum sphere test
    const frustum = this.getFrustum();
    return frustum.containsSphere(spritePos, radius);
  }
}

/**
 * Orthographic camera with size parameter (Unity-like)
 */
export class OrthographicCamera extends Camera {
  public size: number; // Half-height of the orthographic view
  public near: number;
  public far: number;

  constructor(
    size: number = 10,
    near: number = 0.1,
    far: number = 1000
  ) {
    super();
    this.size = size;
    this.near = near;
    this.far = far;
    this.markProjectionDirty();
  }

  /**
   * Get the calculated bounds based on size and aspect ratio
   */
  private getBounds(): { left: number; right: number; bottom: number; top: number } {
    const height = this.size * 2;
    const width = height * this._aspectRatio;

    return {
      left: -width / 2,
      right: width / 2,
      bottom: -height / 2,
      top: height / 2,
    };
  }

  protected updateProjectionMatrix(): void {
    const bounds = this.getBounds();
    const { left, right, bottom, top } = bounds;

    // Create orthographic projection for WebGPU (Z range 0 to 1)
    const lr = 1 / (left - right);
    const bt = 1 / (bottom - top);
    const nf = 1 / (this.near - this.far);

    this._projectionMatrix.data[0] = -2 * lr;
    this._projectionMatrix.data[1] = 0;
    this._projectionMatrix.data[2] = 0;
    this._projectionMatrix.data[3] = 0;

    this._projectionMatrix.data[4] = 0;
    this._projectionMatrix.data[5] = -2 * bt;
    this._projectionMatrix.data[6] = 0;
    this._projectionMatrix.data[7] = 0;

    this._projectionMatrix.data[8] = 0;
    this._projectionMatrix.data[9] = 0;
    this._projectionMatrix.data[10] = nf; // WebGPU uses 0 to 1 for Z
    this._projectionMatrix.data[11] = 0;

    this._projectionMatrix.data[12] = (left + right) * lr;
    this._projectionMatrix.data[13] = (top + bottom) * bt;
    this._projectionMatrix.data[14] = this.near * nf; // WebGPU: map near to 0
    this._projectionMatrix.data[15] = 1;

    this._projectionDirty = false;
  }

  /**
   * Check if a sprite is within the orthographic camera's view frustum
   * Uses AABB frustum culling
   */
  isInView(sprite: Sprite): boolean {
    if (!this.enableOcclusionCulling) {
      return true;
    }

    // Get sprite position in world space from transform matrix
    const worldMatrix = sprite.getWorldMatrix();
    const spriteX = worldMatrix[12];
    const spriteY = worldMatrix[13];
    const spriteZ = worldMatrix[14];

    // Calculate sprite half-extents
    const halfWidth = sprite.width / 2;
    const halfHeight = sprite.height / 2;

    // Use frustum AABB test
    const frustum = this.getFrustum();
    return frustum.containsAABBCenterSize(
      spriteX,
      spriteY,
      spriteZ,
      halfWidth,
      halfHeight,
      0
    );
  }
}
