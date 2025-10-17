import { Mat4, Vector3 } from "@atlas/core";
import { mat4 } from "gl-matrix";
import { Sprite } from "./Sprite";

/**
 * Base camera class
 */
export abstract class Camera {
  public position: Vector3 = new Vector3();
  public target: Vector3 = new Vector3();
  public up: Vector3 = new Vector3(0, 1, 0);
  protected _aspectRatio: number = 1;

  protected _viewMatrix: Mat4 = new Mat4();
  protected _projectionMatrix: Mat4 = new Mat4();
  protected _viewProjectionMatrix: Mat4 = new Mat4();
  protected _viewDirty: boolean = true;
  protected _projectionDirty: boolean = true;
  protected _viewProjectionDirty: boolean = true;

  /**
   * Mark view matrix as dirty
   */
  markViewDirty(): void {
    this._viewDirty = true;
    this._viewProjectionDirty = true;
  }

  /**
   * Mark projection matrix as dirty
   */
  markProjectionDirty(): void {
    this._projectionDirty = true;
    this._viewProjectionDirty = true;
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
   * Update view matrix
   */
  protected updateViewMatrix(): void {
    mat4.lookAt(
      this._viewMatrix.data,
      this.position.data,
      this.target.data,
      this.up.data
    );
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
   * Check if a sprite is within the camera's view frustum
   * To be implemented by subclasses
   */
  abstract isInView(sprite: Sprite): boolean;
}

/**
 * Perspective camera
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
   * Uses a simplified frustum test
   */
  isInView(sprite: Sprite): boolean {
    // Get sprite position in world space from transform matrix
    const worldMatrix = sprite.getWorldMatrix();
    const spritePos = {
      x: worldMatrix[12],
      y: worldMatrix[13],
      z: worldMatrix[14],
    };

    // Calculate view direction
    const viewDir = {
      x: this.target.x - this.position.x,
      y: this.target.y - this.position.y,
      z: this.target.z - this.position.z,
    };

    // Vector from camera to sprite
    const toSprite = {
      x: spritePos.x - this.position.x,
      y: spritePos.y - this.position.y,
      z: spritePos.z - this.position.z,
    };

    // Distance from camera to sprite
    const distance = Math.sqrt(
      toSprite.x * toSprite.x +
        toSprite.y * toSprite.y +
        toSprite.z * toSprite.z
    );

    // Check if within near/far planes
    if (distance < this.near || distance > this.far) {
      return false;
    }

    // Normalize vectors
    const viewDirLen = Math.sqrt(
      viewDir.x * viewDir.x + viewDir.y * viewDir.y + viewDir.z * viewDir.z
    );
    viewDir.x /= viewDirLen;
    viewDir.y /= viewDirLen;
    viewDir.z /= viewDirLen;

    toSprite.x /= distance;
    toSprite.y /= distance;
    toSprite.z /= distance;

    // Dot product to check if sprite is in front of camera
    const dot =
      viewDir.x * toSprite.x + viewDir.y * toSprite.y + viewDir.z * toSprite.z;

    // Calculate frustum bounds at sprite distance
    const halfFovTan = Math.tan(this.fov / 2);
    const frustumHeight = 2 * halfFovTan * distance;
    const frustumWidth = frustumHeight * this._aspectRatio;

    // Sprite bounding box size (account for sprite dimensions)
    const spriteRadius =
      Math.sqrt(sprite.width * sprite.width + sprite.height * sprite.height) /
      2;

    // Simple frustum test with margin
    return (
      dot > 0.5 &&
      Math.abs(toSprite.x) < frustumWidth / 2 + spriteRadius &&
      Math.abs(toSprite.y) < frustumHeight / 2 + spriteRadius
    );
  }
}

/**
 * Orthographic camera
 */
export class OrthographicCamera extends Camera {
  public left: number;
  public right: number;
  public bottom: number;
  public top: number;
  public near: number;
  public far: number;

  constructor(
    left: number = -1,
    right: number = 1,
    bottom: number = -1,
    top: number = 1,
    near: number = 0.1,
    far: number = 1000
  ) {
    super();
    this.left = left;
    this.right = right;
    this.bottom = bottom;
    this.top = top;
    this.near = near;
    this.far = far;
    this.markProjectionDirty();
  }

  /**
   * Set orthographic bounds
   */
  setBounds(left: number, right: number, bottom: number, top: number): void {
    this.left = left;
    this.right = right;
    this.bottom = bottom;
    this.top = top;
    this.markProjectionDirty();
  }

  /**
   * Update bounds to maintain aspect ratio
   */
  updateBoundsForAspectRatio(): void {
    const currentWidth = this.right - this.left;
    const currentHeight = this.top - this.bottom;
    const currentAspect = currentWidth / currentHeight;

    if (Math.abs(currentAspect - this._aspectRatio) > 0.001) {
      // Adjust width to match aspect ratio
      const newWidth = currentHeight * this._aspectRatio;
      const centerX = (this.left + this.right) / 2;
      this.left = centerX - newWidth / 2;
      this.right = centerX + newWidth / 2;
      this.markProjectionDirty();
    }
  }

  /**
   * Override setAspectRatio to automatically update bounds
   */
  setAspectRatio(aspectRatio: number): void {
    const isAspectRatioChanged = aspectRatio !== this._aspectRatio;
    super.setAspectRatio(aspectRatio);

    if (isAspectRatioChanged) {
      this.updateBoundsForAspectRatio();
    }
  }

  protected updateProjectionMatrix(): void {
    // Create orthographic projection for WebGPU (Z range 0 to 1)
    // gl-matrix's mat4.ortho creates for OpenGL (Z range -1 to 1)
    // We need to manually create the correct matrix for WebGPU

    const lr = 1 / (this.left - this.right);
    const bt = 1 / (this.bottom - this.top);
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
    this._projectionMatrix.data[10] = nf; // WebGPU uses 0 to 1 for Z, so we use nf instead of 2*nf
    this._projectionMatrix.data[11] = 0;

    this._projectionMatrix.data[12] = (this.left + this.right) * lr;
    this._projectionMatrix.data[13] = (this.top + this.bottom) * bt;
    this._projectionMatrix.data[14] = this.near * nf; // WebGPU: map near to 0
    this._projectionMatrix.data[15] = 1;

    this._projectionDirty = false;
  }

  /**
   * Check if a sprite is within the orthographic camera's view frustum
   * Uses AABB (Axis-Aligned Bounding Box) intersection test
   */
  isInView(sprite: Sprite): boolean {
    // Get sprite position in world space from transform matrix
    const worldMatrix = sprite.getWorldMatrix();
    const spritePos = {
      x: worldMatrix[12],
      y: worldMatrix[13],
      z: worldMatrix[14],
    };

    // Calculate sprite bounding box in world space
    const halfWidth = sprite.width / 2;
    const halfHeight = sprite.height / 2;

    const spriteLeft = spritePos.x - halfWidth;
    const spriteRight = spritePos.x + halfWidth;
    const spriteBottom = spritePos.y - halfHeight;
    const spriteTop = spritePos.y + halfHeight;

    // For orthographic cameras looking down -Z axis at origin,
    // the view bounds map to world space coordinates centered at target
    const viewLeft = this.target.x + this.left;
    const viewRight = this.target.x + this.right;
    const viewBottom = this.target.y + this.bottom;
    const viewTop = this.target.y + this.top;

    // AABB intersection test: check if sprite box overlaps with view box
    const intersectsX = spriteRight >= viewLeft && spriteLeft <= viewRight;
    const intersectsY = spriteTop >= viewBottom && spriteBottom <= viewTop;

    // Also check Z depth (near/far planes)
    // For sprites, we check if their Z position is within the depth range
    const spriteZ = Math.abs(spritePos.z - this.position.z);
    const intersectsZ = spriteZ >= this.near && spriteZ <= this.far;

    return intersectsX && intersectsY && intersectsZ;
  }
}
