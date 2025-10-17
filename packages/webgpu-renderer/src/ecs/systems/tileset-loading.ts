import {
  sys,
  AssetServer,
  LoadState,
  QueryBuilder,
  ImageAsset,
} from "@atlas/core";
import { TileMap } from "../../renderer/tilemap/TileMap";
import { Texture } from "../../renderer/Texture";
import { TextureFilter } from "../components/texture-filter";
import { TileMapTextureSynced } from "../components/tilemap-texture-synced";
import { GpuRenderDevice } from "../resources";
import { TextureCache } from "../resources/texture-cache";

// Cache the marker instance to reuse across all entities
const tileMapTextureSyncedMarker = new TileMapTextureSynced();
const unsynced = new QueryBuilder(TileMap).without(TileMapTextureSynced);
/**
 * System that automatically creates Textures from loaded ImageAsset handles in TileSets
 *
 * This runs before rendering and converts Handle<ImageAsset> to Texture when loaded.
 * Once synced, entities are marked with TileMapTextureSynced to avoid re-checking every frame.
 */
export const tileSetLoadingSystem = sys(({ commands }) => {
  const assetServer = commands.getResource(AssetServer);
  const device = commands.getResource(GpuRenderDevice).get();
  const textureCache = commands.getResource(TextureCache);

  for (const [entity, tileMap] of commands.query(unsynced).all()) {
    let allTileSetsLoaded = true;

    // Get all unique tilesets (from placed tiles, pending tiles, and pending grids)
    const allTileSets = tileMap.getAllTileSets();

    for (const tileSet of allTileSets) {
      // Check if tileset has pending grids (needs to be loaded)
      const hasPendingGrids = tileSet.getPendingTileGridCount() > 0;
      if (hasPendingGrids) {
        // This tileset is needed but might not be loaded yet
        allTileSetsLoaded = false;
      }

      // Skip if already a loaded Texture
      if (tileSet.texture instanceof Texture) {
        continue;
      }

      // At this point, tileSet.texture is a Handle<ImageAsset>
      const handle = tileSet.getHandle();
      if (!handle) {
        continue;
      }

      // Check if the asset is loaded
      const loadState = assetServer.getLoadState(handle);
      if (loadState !== LoadState.Loaded) {
        // Not loaded yet, mark that not all tilesets are ready
        allTileSetsLoaded = false;
        continue;
      }

      // Get the loaded asset
      const imageAsset = assetServer.getAsset<ImageAsset>(handle);
      if (!imageAsset || !imageAsset.image) {
        console.warn(
          `[TileSetLoading] ImageAsset loaded but has no image data`
        );
        allTileSetsLoaded = false;
        continue;
      }

      // Check for TextureFilter component to customize texture creation
      const textureFilter = commands.tryGetComponent(entity, TextureFilter);

      const cachedTexture = textureCache.get(handle);
      if (cachedTexture) {
        tileSet.texture = cachedTexture;
      } else {
        const texture = Texture.fromSource(device, imageAsset.image, {
          minFilter: textureFilter?.minFilter ?? "linear",
          magFilter: textureFilter?.magFilter ?? "linear",
          mips: textureFilter?.mips ?? true,
          flipY: textureFilter?.flipY ?? true,
          addressModeU: textureFilter?.addressModeU ?? "repeat",
          addressModeV: textureFilter?.addressModeV ?? "repeat",
          sourceHandle: handle, // Keep handle for hot-reload support
        });
        textureCache.set(handle, texture);
        tileSet.texture = texture;
      }

      // Sync any pending tile grids that were deferred
      const syncedGrids = tileSet.syncPendingTileGrids();
      if (syncedGrids > 0) {
        console.log(
          `[TileSetLoading] Created ${syncedGrids} pending tile grid(s) for tileset ${tileSet.id}`
        );
      }

      // Sync any pending tiles that were waiting for this texture
      const syncedCount = tileMap.syncPendingTiles();
      if (syncedCount > 0) {
        console.log(
          `[TileSetLoading] Synced ${syncedCount} pending tiles for tileset ${tileSet.id}`
        );
      }

      tileMap.markDirty();
    }

    // Only mark as synced if all tilesets are loaded
    // This way we keep checking until everything is ready
    if (allTileSetsLoaded) {
      commands.addComponent(entity, tileMapTextureSyncedMarker);

      console.log("TileMap synced");
    }
  }
}).label("WebgpuRenderer::TileSetLoading");
