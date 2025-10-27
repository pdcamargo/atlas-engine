import { App, EcsPlugin, Assets, AssetServer, createSet } from "@atlas/core";
import { TiledMapAsset } from "./assets/tiled-map-asset";
import { TiledTilesetAsset } from "./assets/tiled-tileset-asset";
import { TiledMapLoader } from "./assets/tiled-map-loader";
import { TiledTilesetLoader } from "./assets/tiled-tileset-loader";
import { tiledTilemapLoaderSystem } from "./systems/tiled-tilemap-loader";

/**
 * Plugin that adds Tiled map support to the Atlas engine
 * Registers asset loaders for .tmj (map) and .tsj (tileset) files
 * Adds systems to load and render Tiled maps
 */
export class TiledEcsPlugin implements EcsPlugin {
  build(app: App) {
    // Register asset storage for Tiled assets
    app.setResource(new Assets<TiledMapAsset>());
    app.setResource(new Assets<TiledTilesetAsset>());

    // Get asset server and register loaders
    const assetServer = app.getResource(AssetServer);
    if (assetServer) {
      assetServer.registerLoader(new TiledMapLoader());
      assetServer.registerLoader(new TiledTilesetLoader());
    }

    // Register systems
    app.addUpdateSystems(createSet("Tiled::update", tiledTilemapLoaderSystem));
  }

  name(): string {
    return "TiledEcsPlugin";
  }
}
