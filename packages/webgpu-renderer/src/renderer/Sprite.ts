import { SceneNode } from "./SceneNode";
import { Texture } from "./Texture";
import { Rect, Color, Handle, ImageAsset } from "@atlas/core";
import { Material } from "../materials/Material";
import { DEFAULT_SPRITE_MATERIAL } from "../materials/SpriteMaterial";
import { Effect } from "../effects/Effect";

/**
 * Sprite class for rendering textured quads
 * Supports both pre-loaded Textures and lazy-loaded Handles
 * Now supports custom materials and visual effects
 */
export class Sprite extends SceneNode {
  public texture: Texture | Handle<ImageAsset> | null = null;
  public width: number;
  public height: number;
  public frame: Rect;
  public tint: Color;

  // Material system
  public material: Material = DEFAULT_SPRITE_MATERIAL;

  // Effects system
  private _effects: Effect[] = [];

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

  getTint(): Color {
    return this.tint;
  }

  /**
   * Set the tint color for this sprite
   */
  setTint(tint: Color): void {
    this.tint = tint;
    this.markDirty(); // Mark sprite as dirty to trigger re-render
  }

  /**
   * Set the material for this sprite
   */
  setMaterial(material: Material): void {
    this.material = material;
  }

  /**
   * Get the material for this sprite
   */
  getMaterial(): Material {
    return this.material;
  }

  /**
   * Add an effect to this sprite
   * Effects are automatically sorted by order
   */
  addEffect(effect: Effect): void {
    this._effects.push(effect);
    this._effects.sort((a, b) => a.order - b.order);
  }

  /**
   * Remove an effect from this sprite
   */
  removeEffect(effect: Effect): void {
    const index = this._effects.indexOf(effect);
    if (index !== -1) {
      this._effects.splice(index, 1);
    }
  }

  /**
   * Remove all effects from this sprite
   */
  clearEffects(): void {
    this._effects = [];
  }

  /**
   * Get all effects attached to this sprite
   */
  getEffects(): readonly Effect[] {
    return this._effects;
  }

  /**
   * Check if this sprite has any effects
   */
  hasEffects(): boolean {
    return this._effects.length > 0;
  }

  /**
   * Get enabled effects only
   */
  getEnabledEffects(): Effect[] {
    return this._effects.filter((effect) => effect.enabled);
  }
}
