import * as PIXI from "pixi.js";
import { Viewport } from "../viewport";
import { Camera2D } from "./components";

export class Renderer2D {
  #renderer: PIXI.WebGLRenderer;
  #isInitialized: boolean;

  constructor(viewport: Viewport) {
    this.#renderer = new PIXI.WebGLRenderer();

    this.#init(viewport);
    this.#isInitialized = false;
  }

  async #init(viewport: Viewport) {
    await this.#renderer.init({
      width: viewport.width,
      height: viewport.height,
      canvas: viewport.canvas,
      backgroundColor: 0x000000,
      antialias: false,
    });

    this.#isInitialized = true;
  }

  public resize(width: number, height: number) {
    this.#renderer.resize(width, height);
  }

  public isInitialized() {
    return this.#isInitialized && this.#renderer !== undefined;
  }

  public clear() {
    this.#renderer.clear();
  }

  public render(sceneGraph: SceneGraph, camera?: Camera2D) {
    camera?.render(sceneGraph);

    this.#renderer.render(sceneGraph.stage);
  }
}

export class SceneGraph {
  #stage: PIXI.Container;
  #root: PIXI.Container;
  #layers: PIXI.IRenderLayer[];

  constructor(root?: PIXI.Container | null) {
    this.#stage = new PIXI.Container();

    this.#root = root ?? new PIXI.Container();

    this.#stage.addChild(this.#root);

    this.#layers = [
      new PIXI.RenderLayer(),
      new PIXI.RenderLayer(),
      new PIXI.RenderLayer(),
      new PIXI.RenderLayer(),
      new PIXI.RenderLayer(),
    ];
    this.#root.addChild(...this.#layers);
  }

  public get root() {
    return this.#root;
  }

  public get stage() {
    return this.#stage;
  }

  public addChild(child: PIXI.Container, layer = 0) {
    this.#root.addChild(child);

    if (layer >= 0 && layer < this.#layers.length) {
      this.#layers[layer].attach(child);
    }
  }
}
