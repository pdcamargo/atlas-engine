import { Color } from "@atlas/core";
import { SceneNode } from "./SceneNode";

/**
 * Base class for primitives with solid colors
 */
export abstract class Primitive extends SceneNode {
  public color: Color = new Color(1, 1, 1, 1);

  constructor(color?: Color, id?: string) {
    super(id);

    if (color) {
      this.color.copyFrom(color);
    }
  }

  /**
   * Set the color of the primitive
   */
  setColor(r: number, g: number, b: number, a: number = 1): void {
    this.color.set(r, g, b, a);
  }
}

/**
 * Square primitive (quad with solid color)
 */
export class Square extends Primitive {
  public size: number;

  constructor(size: number = 1, color?: Color, id?: string) {
    super(color, id);
    this.size = size;
  }

  /**
   * Set the size of the square
   */
  setSize(size: number): void {
    this.size = size;
  }
}
