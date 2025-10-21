/**
 * System that automatically creates Textures from loaded ImageAsset handles in TileSets
 *
 * This runs before rendering and converts Handle<ImageAsset> to Texture when loaded.
 * Once synced, entities are marked with TileMapTextureSynced to avoid re-checking every frame.
 */
export declare const tileSetLoadingSystem: import("@atlas/core").SystemBuilder;
//# sourceMappingURL=tileset-loading.d.ts.map