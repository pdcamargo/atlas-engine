import { mat4 } from "gl-matrix";
import { Color } from "../utils/color";
import { Viewport } from "../utils/viewport";

/**
 * 2D Camera projection
 */
export class Camera2DProjection {
  public left: number;
  public right: number;
  public bottom: number;
  public top: number;
  public near: number;
  public far: number;
  public scale: number;

  constructor(options?: {
    left?: number;
    right?: number;
    bottom?: number;
    top?: number;
    near?: number;
    far?: number;
    scale?: number;
  }) {
    this.left = options?.left ?? -1;
    this.right = options?.right ?? 1;
    this.bottom = options?.bottom ?? -1;
    this.top = options?.top ?? 1;
    this.near = options?.near ?? -1000;
    this.far = options?.far ?? 1000;
    this.scale = options?.scale ?? 1;
  }

  /**
   * Create projection for a viewport
   */
  public static fromViewport(
    viewport: Viewport,
    scale: number = 1
  ): Camera2DProjection {
    const halfWidth = (viewport.width / 2) * scale;
    const halfHeight = (viewport.height / 2) * scale;

    return new Camera2DProjection({
      left: -halfWidth,
      right: halfWidth,
      bottom: -halfHeight,
      top: halfHeight,
      near: -1000,
      far: 1000,
      scale,
    });
  }

  /**
   * Get the projection matrix
   */
  public getProjectionMatrix(): Float32Array {
    const matrix = mat4.create();
    mat4.orthoNO(
      matrix,
      this.left * this.scale,
      this.right * this.scale,
      this.bottom * this.scale,
      this.top * this.scale,
      this.near,
      this.far
    );
    return matrix;
  }

  /**
   * Update for viewport size change
   */
  public resize(width: number, height: number): void {
    const halfWidth = (width / 2) * this.scale;
    const halfHeight = (height / 2) * this.scale;

    this.left = -halfWidth;
    this.right = halfWidth;
    this.bottom = -halfHeight;
    this.top = halfHeight;
  }
}

/**
 * 2D Camera component
 */
export class Camera2D {
  /**
   * Custom viewport (if undefined, uses full screen)
   */
  public viewport?: Viewport;

  /**
   * Clear color for this camera
   */
  public clearColor: Color;

  /**
   * Render order (lower renders first)
   */
  public order: number;

  /**
   * Camera projection
   */
  public projection: Camera2DProjection;

  /**
   * Whether this camera is active
   */
  public isActive: boolean;

  constructor(options?: {
    viewport?: Viewport;
    clearColor?: Color;
    order?: number;
    projection?: Camera2DProjection;
    isActive?: boolean;
  }) {
    this.viewport = options?.viewport;
    this.clearColor = options?.clearColor ?? new Color(0.1, 0.1, 0.1, 1.0);
    this.order = options?.order ?? 0;
    this.projection = options?.projection ?? new Camera2DProjection();
    this.isActive = options?.isActive ?? true;
  }

  /**
   * Create a default 2D camera
   */
  public static default(): Camera2D {
    return new Camera2D();
  }
}

/**
 * Marker component for the main camera
 */
export class MainCamera2D {
  constructor() {}
}
