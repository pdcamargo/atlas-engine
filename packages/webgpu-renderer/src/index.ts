// Renderer exports
export { WebgpuRenderer } from "./renderer/Renderer";
export { PerspectiveCamera, OrthographicCamera } from "./renderer/Camera";
export { SceneNode } from "./renderer/SceneNode";
export { SceneGraph } from "./renderer/SceneGraph";
export { Container } from "./renderer/Container";
export { Sprite } from "./renderer/Sprite";
export { Primitive, Square } from "./renderer/Primitive";
export { Texture } from "./renderer/Texture";

// Tilemap exports
export { Tile } from "./renderer/tilemap/Tile";
export { TileSet, type TileSetOptions } from "./renderer/tilemap/TileSet";
export {
  TileMapLayer,
  type TileData,
  type LayerBounds,
} from "./renderer/tilemap/TileMapLayer";
export { TileMap, type TileMapOptions } from "./renderer/tilemap/TileMap";
export { TileMapBatch } from "./renderer/tilemap/TileMapBatch";
export {
  TileMapChunk,
  type ChunkBounds,
} from "./renderer/tilemap/TileMapChunk";

// Batching exports
export { RenderBatch } from "./batching";

export { WebgpuRendererPlugin } from "./ecs/plugin";

export { GpuRenderDevice } from "./ecs/resources/render-device";
export { GpuPresentationFormat } from "./ecs/resources/presentation-format";
export { GpuCanvasContext } from "./ecs/resources/canvas-context";

export * from "./ecs/components";
