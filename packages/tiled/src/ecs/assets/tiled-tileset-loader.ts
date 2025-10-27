import { AssetLoader } from "@atlas/core";
import { TiledTilesetAsset } from "./tiled-tileset-asset";
import { TiledTileset } from "../../utils/tileset/Tileset";

/**
 * Asset loader for Tiled tileset files (.tsj)
 * Loads and parses JSON tileset data
 */
export class TiledTilesetLoader implements AssetLoader<TiledTilesetAsset> {
  extensions(): string[] {
    return ["tsj"];
  }

  async load(bytes: Uint8Array, path: string): Promise<TiledTilesetAsset> {
    try {
      // Convert bytes to string and parse JSON
      const text = new TextDecoder().decode(bytes);
      const data = JSON.parse(text) as TiledTileset;

      // Validate required properties
      if (typeof data.tilewidth !== "number" || typeof data.tileheight !== "number") {
        throw new Error(
          "Invalid Tiled tileset: missing tilewidth or tileheight"
        );
      }

      return new TiledTilesetAsset(data, path);
    } catch (error) {
      console.error(`[TiledTilesetLoader] Failed to load tileset: ${path}`, error);
      throw new Error(
        `Failed to load Tiled tileset: ${path}. ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
}
