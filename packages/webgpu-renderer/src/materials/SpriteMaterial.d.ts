import { Material } from "./Material";
/**
 * SpriteMaterial - Default material for textured sprites
 * Uses the existing sprite shader with texture + tint support
 */
export declare class SpriteMaterial extends Material {
    constructor();
    /**
     * Create a new SpriteMaterial instance
     * (Materials should be instanced per sprite if you want different properties)
     */
    static create(): SpriteMaterial;
}
/**
 * Singleton default sprite material
 * Shared by all sprites that don't specify a custom material
 */
export declare const DEFAULT_SPRITE_MATERIAL: SpriteMaterial;
//# sourceMappingURL=SpriteMaterial.d.ts.map