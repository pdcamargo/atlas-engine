import {
  Commands,
  createSet,
  SerializationRegistry,
  SystemType,
  type App,
  type EcsPlugin,
} from "@atlas/core";

import { GpuRenderDevice } from "./resources/render-device";
import { GpuPresentationFormat } from "./resources/presentation-format";
import { GpuCanvasContext } from "./resources/canvas-context";
import { LightingSystem } from "./resources/lighting-system";
import { WebgpuRenderer } from "../renderer/Renderer";
import { resize } from "./systems/resize";
import { render } from "./systems/render";
import { textureLoadingSystem } from "./systems/texture-loading";
import { tileSetLoadingSystem } from "./systems/tileset-loading";
import { animationUpdateSystem } from "./systems/animation-update";
import { tileMapAnimationUpdateSystem } from "./systems/tilemap-animation-update";
import { particleUpdateSystem } from "./systems/particle-update";
import { lightingUpdateSystem } from "./systems/lighting-update";
import { TextureCache } from "./resources/texture-cache";
import { MaterialSerializer } from "../serialization";
import { Material } from "../materials";
import { Sprite } from "../renderer/Sprite";
import { SceneGraph } from "../renderer/SceneGraph";
import { SceneNode } from "../renderer/SceneNode";
import { AnimatedSprite } from "../renderer/AnimatedSprite";
import { TileMap } from "../renderer/tilemap";
import { InstancedSprite } from "../renderer/InstancedSprite";

const ResizeSystem = Symbol("WebgpuRenderer::PreUpdate");
const LoadingSystem = Symbol("WebgpuRenderer::TextureLoading");
const AnimationSystem = Symbol("WebgpuRenderer::Animation");
const LightingSystem_Symbol = Symbol("WebgpuRenderer::LightingUpdate");
const RenderSystem = Symbol("WebgpuRenderer::Render");

export type WebgpuRendererPluginOptions = {
  canvas?: HTMLCanvasElement;
};

const addToSceneGraph = (node: SceneNode, commands: Commands) => {
  commands.getResource(SceneGraph).addChild(node);
};

export class WebgpuRendererPlugin implements EcsPlugin {
  constructor(private readonly options?: WebgpuRendererPluginOptions) {}

  public async build(app: App) {
    const materialSerializer = new MaterialSerializer();
    SerializationRegistry.registerSerializer(materialSerializer);
    SerializationRegistry.registerTypeSerializer(Material, materialSerializer);

    const renderer = new WebgpuRenderer({
      canvas: this.options?.canvas,
    });

    await renderer.initialize();

    // Create lighting system and link it to renderer
    const lightingSystem = new LightingSystem();
    renderer.lightingSystem = lightingSystem;

    app
      .setResource(renderer)
      .setResource(lightingSystem)
      .setResource(new TextureCache())
      .setResource(new GpuRenderDevice(renderer.gpu.device))
      .setResource(new GpuPresentationFormat(renderer.gpu.format))
      .setResource(new GpuCanvasContext(renderer.gpu.context))
      .setResource(new SceneGraph())
      .addSystems(SystemType.PreUpdate, createSet(ResizeSystem, resize))
      .addSystems(
        SystemType.PreUpdate,
        createSet(LoadingSystem, textureLoadingSystem, tileSetLoadingSystem)
      )
      .addSystems(
        SystemType.Update,
        createSet(
          AnimationSystem,
          animationUpdateSystem,
          tileMapAnimationUpdateSystem,
          particleUpdateSystem
        )
      )
      .addSystems(
        SystemType.Update,
        createSet(LightingSystem_Symbol, lightingUpdateSystem)
      )
      .addSystems(SystemType.Render, createSet(RenderSystem, render))
      .addObserver(Sprite, "onAdded", ({ trigger, commands }) => {
        for (const [sprite] of trigger.events()) {
          addToSceneGraph(sprite, commands);
        }
      })
      .addObserver(AnimatedSprite, "onAdded", ({ trigger, commands }) => {
        for (const [animatedSprite] of trigger.events()) {
          addToSceneGraph(animatedSprite, commands);
        }
      })
      .addObserver(TileMap, "onAdded", ({ trigger, commands }) => {
        for (const [tileMap] of trigger.events()) {
          addToSceneGraph(tileMap, commands);
        }
      })
      .addObserver(InstancedSprite, "onAdded", ({ trigger, commands }) => {
        for (const [instancedSprite] of trigger.events()) {
          addToSceneGraph(instancedSprite, commands);
        }
      });
  }

  public ready(app: App) {
    return (
      app.hasResource(WebgpuRenderer) &&
      app.getResource(WebgpuRenderer).isInitialized() &&
      app.hasResource(GpuRenderDevice) &&
      app.hasResource(GpuPresentationFormat) &&
      app.hasResource(GpuCanvasContext)
    );
  }
}
