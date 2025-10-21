/**
 * System that automatically creates Textures from loaded ImageAsset handles in Sprites
 *
 * This runs before rendering and converts Handle<ImageAsset> to Texture when loaded.
 * Once synced, entities are marked with TextureSynced to avoid re-checking every frame.
 */
export declare const textureLoadingSystem: import("@atlas/core").SystemBuilder;
//# sourceMappingURL=texture-loading.d.ts.map