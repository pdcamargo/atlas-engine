// Renderer exports
export { WebgpuRenderer } from "./renderer/Renderer";
export { PerspectiveCamera, OrthographicCamera } from "./renderer/Camera";
export { SceneNode } from "./renderer/SceneNode";
export { SceneGraph } from "./renderer/SceneGraph";
export { Container } from "./renderer/Container";
export { Sprite } from "./renderer/Sprite";
export { InstancedSprite } from "./renderer/InstancedSprite";
export {
  AnimatedSprite,
  AnimatedSpriteAnimation,
  AnimationFrame,
  AnimatedSpriteAnimationState,
  type AnimationConfig,
} from "./renderer/AnimatedSprite";
export { Primitive, Square } from "./renderer/Primitive";
export { Texture } from "./renderer/Texture";

// Tilemap exports
export { Tile } from "./renderer/tilemap/Tile";
export {
  AnimatedTile,
  TileAnimationFrame,
  type AnimatedTileConfig,
} from "./renderer/tilemap/AnimatedTile";
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

// Material exports
export {
  Shader,
  type UniformDefinition,
  Material,
  BlendMode,
  SpriteMaterial,
  DEFAULT_SPRITE_MATERIAL,
} from "./materials";

// Effect exports
export {
  Effect,
  type EffectContext,
  OutlineEffect,
  DistortionEffect,
  DistortionType,
  ShadowEffect,
} from "./effects";

// Post-processing exports
export {
  PostProcessEffect,
  VignetteEffect,
  ChromaticAberrationEffect,
  BloomEffect,
} from "./post-processing";

// Particle system exports
export {
  ParticleEmitter,
  ParticleSystem,
  type ParticleEmitterConfig,
  type ParticleBlendMode,
  type EmissionShape,
  ParticlePresets,
} from "./particles";

export { WebgpuRendererPlugin } from "./ecs/plugin";

export { GpuRenderDevice } from "./ecs/resources/render-device";
export { GpuPresentationFormat } from "./ecs/resources/presentation-format";
export { GpuCanvasContext } from "./ecs/resources/canvas-context";

export * from "./ecs/components";

// Compute shader framework exports
export {
  ComputeShader,
  ComputeWorker,
  ComputeWorkerBuilder,
  ComputeWorkerInstance,
  BufferType,
  type BufferDefinition,
  type PassDefinition,
  type WorkgroupSize,
  type BufferData,
  type TypedArray,
  // Utility functions
  createUniformBuffer,
  createStorageBuffer,
  createStagingBuffer,
  writeBuffer,
  readBuffer,
  toTypedArray,
  getBufferSize,
  alignBufferSize,
} from "./compute";
