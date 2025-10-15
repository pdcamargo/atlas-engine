import { SceneNode } from "./SceneNode";
import { Texture } from "./Texture";
import { Rect, Color } from "@atlas/core";

/**
 * Sprite class for rendering textured quads
 */
export class Sprite extends SceneNode {
  public texture: Texture | null = null;
  public width: number;
  public height: number;
  public frame: Rect;
  public tint: Color;

  constructor(
    texture: Texture | null = null,
    width: number = 1,
    height: number = 1,
    id?: string
  ) {
    super(id);

    this.texture = texture;
    this.width = width;
    this.height = height;
    this.frame = new Rect(0, 0, 1, 1); // Default to full texture
    this.tint = Color.white(); // Default to white tint
  }

  /**
   * Set the texture for this sprite
   */
  setTexture(texture: Texture): void {
    this.texture = texture;
  }

  /**
   * Set the size of the sprite
   */
  setSize(width: number, height: number): void {
    this.width = width;
    this.height = height;
  }

  /**
   * Set the frame (texture region) for this sprite
   */
  setFrame(frame: Rect): void {
    this.frame = frame;
  }

  /**
   * Set the tint color for this sprite
   */
  setTint(tint: Color): void {
    this.tint = tint;
  }
}
