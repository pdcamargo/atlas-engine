import {
  sys,
  AssetServer,
  LoadState,
  QueryBuilder,
  ImageAsset,
} from "@atlas/core";
import { Sprite } from "../../renderer/Sprite";
import { Texture } from "../../renderer/Texture";
import { TextureFilter } from "../components/texture-filter";
import { TextureSynced } from "../components/texture-synced";
import { GpuRenderDevice } from "../resources";
import { TextureCache } from "../resources/texture-cache";
import { AnimatedSprite } from "../../renderer/AnimatedSprite";

// Cache the marker instance to reuse across all entities
const textureSyncedMarker = new TextureSynced();

const unsynced = new QueryBuilder(Sprite).without(TextureSynced);
const unsyncedAnimatedSprites = new QueryBuilder(AnimatedSprite).without(
  TextureSynced
);

/**
 * System that automatically creates Textures from loaded ImageAsset handles in Sprites
 *
 * This runs before rendering and converts Handle<ImageAsset> to Texture when loaded.
 * Once synced, entities are marked with TextureSynced to avoid re-checking every frame.
 */
export const textureLoadingSystem = sys(({ commands }) => {
  const assetServer = commands.getResource(AssetServer);
  const device = commands.getResource(GpuRenderDevice).get();
  const textureCache = commands.getResource(TextureCache);

  // Query only sprites that haven't been synced yet (optimization)

  const animated = commands.query(unsyncedAnimatedSprites).all();
  const normal = commands.query(unsynced).all();

  for (const [entity, sprite] of [...animated, ...normal]) {
    if (!sprite) {
      continue;
    }

    // For AnimatedSprite, check if it needs texture sync (texture changed)
    const isAnimated = sprite instanceof AnimatedSprite;
    const needsSync = isAnimated && (sprite as any)._needsTextureSync;

    // Skip if already synced and doesn't need re-sync
    if (!needsSync && commands.tryGetComponent(entity, TextureSynced)) {
      continue;
    }

    const handle = sprite.getHandle();
    if (!handle) continue;

    const loadState = assetServer.getLoadState(handle);
    if (loadState !== LoadState.Loaded) {
      // Not loaded yet, skip for now (will be checked again next frame)
      continue;
    }

    const imageAsset = assetServer.getAsset<ImageAsset>(handle);
    if (!imageAsset || !imageAsset.image) {
      console.warn(`[TextureLoading] ImageAsset loaded but has no image data`);
      continue;
    }

    const textureFilter = commands.tryGetComponent(entity, TextureFilter);

    const minFilter = textureFilter?.minFilter ?? "nearest";
    const magFilter = textureFilter?.magFilter ?? "nearest";
    const mips = textureFilter?.mips ?? false;
    const flipY = textureFilter?.flipY ?? true;
    const addressModeU = textureFilter?.addressModeU ?? "repeat";
    const addressModeV = textureFilter?.addressModeV ?? "repeat";

    const cachedTexture = textureCache.get(handle);

    if (cachedTexture) {
      sprite.texture = cachedTexture;
    } else {
      const texture = Texture.fromSource(device, imageAsset.image, {
        minFilter,
        magFilter,
        mips,
        flipY,
        addressModeU,
        addressModeV,
        sourceHandle: handle,
      });
      textureCache.set(handle, texture);
      sprite.texture = texture;
    }

    // Clear the needs sync flag for AnimatedSprite
    if (isAnimated) {
      (sprite as any)._needsTextureSync = false;
    }

    commands.addComponent(entity, textureSyncedMarker);
  }
}).label("WebgpuRenderer::TextureLoading");
