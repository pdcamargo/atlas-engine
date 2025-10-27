declare module "*.map.json" {
  const value: import("../map/Map").TiledMap;
  export default value;
}

declare module "*.tileset.json" {
  const value: import("../tileset/ExternalTileset").TiledExternalTileset;
  export default value;
}

declare module "*.template.json" {
  const value: import("../object/ObjectTemplate").TiledObjectTemplate;
  export default value;
}
