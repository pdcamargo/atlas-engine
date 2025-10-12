import { mat4 } from "gl-matrix";
import { Vec2 } from "../utils/math";

/**
 * Global transform component (calculated from local transforms in hierarchy)
 */
export class GlobalTransform {
  public matrix: Float32Array;

  constructor(matrix?: Float32Array) {
    this.matrix = matrix ?? mat4.create();
  }

  /**
   * Create from position, rotation, and scale
   */
  public static from2D(
    position: Vec2,
    rotation: number,
    scale: Vec2
  ): GlobalTransform {
    const matrix = mat4.create();
    mat4.translate(matrix, matrix, [position.x, position.y, 0]);
    mat4.rotateZ(matrix, matrix, rotation);
    mat4.scale(matrix, matrix, [scale.x, scale.y, 1]);
    return new GlobalTransform(matrix);
  }

  /**
   * Get position from matrix
   */
  public getPosition(): Vec2 {
    return new Vec2(this.matrix[12], this.matrix[13]);
  }

  /**
   * Clone the transform
   */
  public clone(): GlobalTransform {
    return new GlobalTransform(mat4.clone(this.matrix));
  }
}
