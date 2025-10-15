import { Color, Vector2, Rect } from "@atlas/core";
import type { Handle } from "@atlas/core";

/**
 * Sprite component for 2D rendering
 * Based on Bevy's Sprite: https://github.com/bevyengine/bevy/blob/main/crates/bevy_sprite/src/sprite.rs
 */
export class Sprite2D {
  /**
   * Color tint applied to the sprite
   */
  public color: Color;

  /**
   * Flip the sprite horizontally
   */
  public flipX: boolean;

  /**
   * Flip the sprite vertically
   */
  public flipY: boolean;

  /**
   * Custom size for the sprite (overrides texture size)
   */
  public customSize?: { width: number; height: number };

  /**
   * Texture rect (for sprite sheets)
   * If specified, only this portion of the texture is rendered
   */
  public rect?: Rect;

  /**
   * Anchor point for the sprite (normalized 0-1)
   * (0.5, 0.5) is center, (0, 0) is top-left
   */
  public anchor: Vector2;

  /**
   * Texture handle (optional, can use default white texture)
   */
  public texture?: Handle<any>;

  constructor(options?: {
    color?: Color;
    flipX?: boolean;
    flipY?: boolean;
    customSize?: { width: number; height: number };
    rect?: Rect;
    anchor?: Vector2;
    texture?: Handle<any>;
  }) {
    this.color = options?.color ?? Color.white();
    this.flipX = options?.flipX ?? false;
    this.flipY = options?.flipY ?? false;
    this.customSize = options?.customSize;
    this.rect = options?.rect;
    this.anchor = options?.anchor ?? new Vector2(0.5, 0.5);
    this.texture = options?.texture;
  }

  /**
   * Create a sprite with a texture
   */
  public static withTexture(texture: Handle<any>): Sprite2D {
    return new Sprite2D({ texture });
  }

  /**
   * Create a sprite with a color (no texture)
   */
  public static withColor(color: Color): Sprite2D {
    return new Sprite2D({ color });
  }
}
