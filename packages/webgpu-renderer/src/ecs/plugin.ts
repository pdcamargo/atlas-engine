import { createSet, SystemType, type App, type EcsPlugin } from "@atlas/core";

import { GpuRenderDevice } from "./resources/render-device";
import { GpuPresentationFormat } from "./resources/presentation-format";
import { GpuCanvasContext } from "./resources/canvas-context";
import { WebgpuRenderer } from "../renderer/Renderer";
import { resize } from "./systems/resize";
import { render } from "./systems/render";
import { textureLoadingSystem } from "./systems/texture-loading";
import { tileSetLoadingSystem } from "./systems/tileset-loading";
import { animationUpdateSystem } from "./systems/animation-update";
import { tileMapAnimationUpdateSystem } from "./systems/tilemap-animation-update";
import { particleUpdateSystem } from "./systems/particle-update";
import { TextureCache } from "./resources/texture-cache";

const ResizeSystem = Symbol("WebgpuRenderer::PreUpdate");
const LoadingSystem = Symbol("WebgpuRenderer::TextureLoading");
const AnimationSystem = Symbol("WebgpuRenderer::Animation");
const ParticleSystem = Symbol("WebgpuRenderer::ParticleUpdate");
const RenderSystem = Symbol("WebgpuRenderer::Render");

export type WebgpuRendererPluginOptions = {
  canvas?: HTMLCanvasElement;
};

export class WebgpuRendererPlugin implements EcsPlugin {
  constructor(private readonly options?: WebgpuRendererPluginOptions) {}

  public async build(app: App) {
    const renderer = new WebgpuRenderer({
      canvas: this.options?.canvas,
    });

    await renderer.initialize();

    app
      .setResource(renderer)
      .setResource(new TextureCache())
      .setResource(new GpuRenderDevice(renderer.gpu.device))
      .setResource(new GpuPresentationFormat(renderer.gpu.format))
      .setResource(new GpuCanvasContext(renderer.gpu.context))
      .addSystems(SystemType.PreUpdate, createSet(ResizeSystem, resize))
      .addSystems(
        SystemType.PreUpdate,
        createSet(LoadingSystem, textureLoadingSystem, tileSetLoadingSystem)
      )
      .addSystems(
        SystemType.Update,
        createSet(AnimationSystem, animationUpdateSystem, tileMapAnimationUpdateSystem, particleUpdateSystem)
      )
      .addSystems(SystemType.Render, createSet(RenderSystem, render));
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
