// import { AssetServer, sys } from "@atlas/engine";
// import { TileMap } from "@atlas/renderer-2d";
// import { FactoryTileMap } from "../components/factory-tilemap";
// import { allTextures } from "../data/tiles";

// export const initTileMap = sys(({ commands }) => {
//   const assetServer = commands.getResource(AssetServer);

//   const textures = allTextures.map((url) => assetServer.loadTexture(url)[0]);
//   const tileMap = new TileMap(textures, { tileWidth: 16, tileHeight: 16 });
//   const tag = new FactoryTileMap();
//   allTextures.forEach((url, index) => tag.setAtlasIndex(url, index));
//   commands.spawn(tileMap, tag);
// }).label("InitTileMap");
