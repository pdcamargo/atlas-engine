import { SceneNode } from "./SceneNode";
import { Texture } from "./Texture";
import { Rect, Color, Handle, ImageAsset } from "@atlas/core";

/**
 * Sprite class for rendering textured quads
 * Supports both pre-loaded Textures and lazy-loaded Handles
 */
export class Sprite extends SceneNode {
  public texture: Texture | Handle<ImageAsset> | null = null;
  public width: number;
  public height: number;
  public frame: Rect;
  public tint: Color;

  constructor(
    texture: Texture | Handle<ImageAsset> | null = null,
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
  setTexture(texture: Texture | Handle<ImageAsset>): void {
    this.texture = texture;
  }

  /**
   * Get the loaded Texture (returns null if texture is a Handle or not loaded)
   */
  getTexture(): Texture | null {
    return this.texture instanceof Texture ? this.texture : null;
  }

  /**
   * Get the Handle if texture is still loading (returns null if already a Texture)
   */
  getHandle(): Handle<ImageAsset> | null {
    return this.texture && !(this.texture instanceof Texture)
      ? (this.texture as Handle<ImageAsset>)
      : null;
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
