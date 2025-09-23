import { App, createSet, EcsPlugin, Viewport, ViewportPlugin } from "../../..";
import { AnimationFinishedEvent, AnimationFrameChangedEvent } from "./events";
import { Renderer2D, SceneGraph } from "./resources";
import {
  addSpriteToScene,
  addTileMapToScene,
  renderScene,
  updateAnimatedSprites,
  updateTransforms,
} from "./systems";

export const Renderer2DSet = Symbol("Renderer2DSet");

export class Renderer2DPlugin implements EcsPlugin {
  constructor() {}

  public build(app: App) {
    const viewport = app.getResource(Viewport);

    app
      .addEvent(AnimationFrameChangedEvent)
      .addEvent(AnimationFinishedEvent)
      .setResource(new Renderer2D(viewport))
      .setResource(new SceneGraph())
      .addUpdateSystems(
        createSet(
          Renderer2DSet,
          addTileMapToScene,
          addSpriteToScene,
          updateTransforms,
          updateAnimatedSprites
        )
      )
      .addRenderSystems(createSet(Renderer2DSet, renderScene));
  }

  public ready(app: App) {
    const renderer = app.getResource(Renderer2D);

    return (
      app.hasResource(Viewport) &&
      app.hasResource(SceneGraph) &&
      renderer.isInitialized()
    );
  }

  public dependsOn() {
    return [ViewportPlugin];
  }
}
