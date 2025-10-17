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

// Cache the marker instance to reuse across all entities
const textureSyncedMarker = new TextureSynced();

const unsynced = new QueryBuilder(Sprite).without(TextureSynced);

const textureFilterQuery = new QueryBuilder(Sprite, TextureFilter);
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

  commands.query(unsynced).forEach((entity, sprite) => {
    if (!sprite) {
      return;
    }

    if (sprite.texture instanceof Texture) {
      commands.addComponent(entity, textureSyncedMarker);
      return;
    }

    const handle = sprite.getHandle();
    if (!handle) return;

    const loadState = assetServer.getLoadState(handle);
    if (loadState !== LoadState.Loaded) {
      // Not loaded yet, skip for now (will be checked again next frame)
      return;
    }

    const imageAsset = assetServer.getAsset<ImageAsset>(handle);
    if (!imageAsset || !imageAsset.image) {
      console.warn(`[TextureLoading] ImageAsset loaded but has no image data`);
      return;
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

    commands.addComponent(entity, textureSyncedMarker);
  });

  // for (const [entity, sprite] of commands.query(unsynced).all()) {
  //   // Skip if sprite has no texture or already has a loaded Texture
  //   if (sprite.texture instanceof Texture) {
  //     // Mark as synced if have texture but not synced
  //     commands.addComponent(entity, textureSyncedMarker);
  //     continue;
  //   }

  //   // At this point, sprite.texture is a Handle<ImageAsset>
  //   const handle = sprite.getHandle();
  //   if (!handle) continue;

  //   // Check if the asset is loaded
  //   const loadState = assetServer.getLoadState(handle);
  //   if (loadState !== LoadState.Loaded) {
  //     // Not loaded yet, skip for now (will be checked again next frame)
  //     continue;
  //   }

  //   // Get the loaded asset
  //   const imageAsset = assetServer.getAsset<ImageAsset>(handle);
  //   if (!imageAsset || !imageAsset.image) {
  //     console.warn(`[TextureLoading] ImageAsset loaded but has no image data`);
  //     continue;
  //   }

  //   // Check for TextureFilter component to customize texture creation
  //   const textureFilter = commands.tryGetComponent(entity, TextureFilter);
  //   if (!textureFilter) {
  //     console.warn(`[TextureLoading] TextureFilter component not found`);
  //     continue;
  //   }

  //   // Create Texture from ImageAsset with optional filter settings
  //   const texture = Texture.fromSource(device, imageAsset.image, {
  //     minFilter: textureFilter?.minFilter ?? "linear",
  //     magFilter: textureFilter?.magFilter ?? "linear",
  //     mips: textureFilter?.mips ?? true,
  //     flipY: textureFilter?.flipY ?? true,
  //     addressModeU: textureFilter?.addressModeU ?? "repeat",
  //     addressModeV: textureFilter?.addressModeV ?? "repeat",
  //     sourceHandle: handle, // Keep handle for hot-reload support
  //   });

  //   // Replace handle with loaded texture
  //   sprite.texture = texture;

  //   // Mark as synced to avoid re-checking
  //   commands.addComponent(entity, textureSyncedMarker);
  // }
}).label("WebgpuRenderer::TextureLoading");
