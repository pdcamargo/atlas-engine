import { Shader } from "./Shader";
import { Material, BlendMode } from "./Material";
import spriteLitShaderCode from "../renderer/shaders/sprite_lit.wgsl?raw";
import spriteLitInstancedShaderCode from "../renderer/shaders/sprite_lit_instanced.wgsl?raw";

/**
 * Lit sprite shader (singleton)
 * Supports ambient, sun, point lights, and spot lights
 */
const LIT_SPRITE_SHADER = new Shader({
  name: "LitSprite",
  vertexCode: spriteLitShaderCode,
  fragmentCode: spriteLitShaderCode,
  instancedVertexCode: spriteLitInstancedShaderCode,
  instancedFragmentCode: spriteLitInstancedShaderCode,
  uniforms: [
    // For standard rendering (same as regular sprite):
    // mvpMatrix: mat4x4<f32> = 64 bytes at offset 0
    // frame: vec4<f32> = 16 bytes at offset 64
    // tint: vec4<f32> = 16 bytes at offset 80
    { name: "mvpMatrix", type: "mat4x4f", size: 64, offset: 0 },
    { name: "frame", type: "vec4f", size: 16, offset: 64 },
    { name: "tint", type: "vec4f", size: 16, offset: 80 },
  ],
});

/**
 * LitSpriteMaterial - Material for textured sprites with lighting support
 *
 * Uses a modified sprite shader that:
 * - Supports ambient lighting
 * - Supports directional lighting (sun/moon)
 * - Supports point lights (torches, lamps)
 * - Supports spot lights (flashlights, spotlights)
 *
 * The lighting is calculated per-fragment for smooth results.
 * Light data is provided via the LightingSystem resource.
 *
 * Usage:
 * ```typescript
 * const sprite = new Sprite(texture, 32, 32);
 * sprite.material = new LitSpriteMaterial();
 * ```
 */
export class LitSpriteMaterial extends Material {
  constructor() {
    super(LIT_SPRITE_SHADER);
    this.blendMode = BlendMode.Normal;
  }

  /**
   * Create a new LitSpriteMaterial instance
   */
  static create(): LitSpriteMaterial {
    return new LitSpriteMaterial();
  }

  /**
   * Create a lit sprite material with additive blending
   * Useful for glowing/emissive sprites
   */
  static createAdditive(): LitSpriteMaterial {
    const material = new LitSpriteMaterial();
    material.blendMode = BlendMode.Additive;
    return material;
  }

  /**
   * Create a lit sprite material with multiply blending
   * Useful for shadow/overlay effects with lighting
   */
  static createMultiply(): LitSpriteMaterial {
    const material = new LitSpriteMaterial();
    material.blendMode = BlendMode.Multiply;
    return material;
  }
}

/**
 * Singleton default lit sprite material
 * Shared by all sprites that want basic lighting without custom materials
 */
export const DEFAULT_LIT_SPRITE_MATERIAL = new LitSpriteMaterial();
