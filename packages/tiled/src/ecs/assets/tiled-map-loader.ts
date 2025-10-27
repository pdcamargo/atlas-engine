import { AssetLoader } from "@atlas/core";
import { TiledMapAsset } from "./tiled-map-asset";
import { TiledMap } from "../../utils/map/Map";

/**
 * Asset loader for Tiled map files (.tmj)
 * Loads and parses JSON map data
 */
export class TiledMapLoader implements AssetLoader<TiledMapAsset> {
  extensions(): string[] {
    return ["tmj", "json"];
  }

  async load(bytes: Uint8Array, path: string): Promise<TiledMapAsset> {
    try {
      // Convert bytes to string and parse JSON
      const text = new TextDecoder().decode(bytes);
      const data = JSON.parse(text) as TiledMap;

      // Validate that this is a map file
      if (data.type !== "map") {
        throw new Error(
          `Invalid Tiled map file: expected type "map", got "${data.type}"`
        );
      }

      return new TiledMapAsset(data, path);
    } catch (error) {
      console.error(`[TiledMapLoader] Failed to load map: ${path}`, error);
      throw new Error(
        `Failed to load Tiled map: ${path}. ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
}
