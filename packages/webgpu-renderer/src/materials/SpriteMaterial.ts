import { Shader } from "./Shader";
import { Material, BlendMode } from "./Material";
import spriteShaderCode from "../renderer/shaders/sprite.wgsl?raw";
import spriteInstancedShaderCode from "../renderer/shaders/sprite_instanced.wgsl?raw";

/**
 * Default sprite shader (singleton)
 */
const SPRITE_SHADER = new Shader({
  name: "Sprite",
  vertexCode: spriteShaderCode,
  fragmentCode: spriteShaderCode,
  instancedVertexCode: spriteInstancedShaderCode,
  instancedFragmentCode: spriteInstancedShaderCode,
  uniforms: [
    // For standard rendering:
    // mvpMatrix: mat4x4<f32> = 64 bytes at offset 0
    // frame: vec4<f32> = 16 bytes at offset 64
    // tint: vec4<f32> = 16 bytes at offset 80
    { name: "mvpMatrix", type: "mat4x4f", size: 64, offset: 0 },
    { name: "frame", type: "vec4f", size: 16, offset: 64 },
    { name: "tint", type: "vec4f", size: 16, offset: 80 },
  ],
});

/**
 * SpriteMaterial - Default material for textured sprites
 * Uses the existing sprite shader with texture + tint support
 */
export class SpriteMaterial extends Material {
  constructor() {
    super(SPRITE_SHADER);
    this.blendMode = BlendMode.Normal;
  }

  /**
   * Create a new SpriteMaterial instance
   * (Materials should be instanced per sprite if you want different properties)
   */
  static create(): SpriteMaterial {
    return new SpriteMaterial();
  }
}

/**
 * Singleton default sprite material
 * Shared by all sprites that don't specify a custom material
 */
export const DEFAULT_SPRITE_MATERIAL = new SpriteMaterial();
