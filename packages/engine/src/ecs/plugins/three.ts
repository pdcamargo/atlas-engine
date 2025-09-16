import { sys, createSet } from "../system_builder";
import type { App } from "../../index";
import type { EcsPlugin } from "../../plugin";
import { SystemType } from "../types";

import * as THREE from "three";

export class ThreeViewport {
  #container: HTMLElement;

  constructor(containerSelector?: string | HTMLElement) {
    if (containerSelector) {
      this.#container =
        typeof containerSelector === "string"
          ? (document.querySelector(containerSelector) as HTMLElement)
          : containerSelector;
    } else {
      this.#container = document.createElement("div");
    }
  }

  public get container(): HTMLElement {
    return this.#container;
  }

  public get width(): number {
    return this.#container.clientWidth;
  }

  public get height(): number {
    return this.#container.clientHeight;
  }

  public get aspect(): number {
    return this.width / this.height;
  }
}

export class ThreeRenderer {
  #renderer: THREE.WebGLRenderer;

  constructor(private readonly viewport: ThreeViewport) {
    const canvas = document.createElement("canvas");
    canvas.width = this.viewport.width;
    canvas.height = this.viewport.height;
    this.viewport.container.innerHTML = "";
    this.viewport.container.appendChild(canvas);

    this.#renderer = new THREE.WebGLRenderer({
      antialias: true,
      canvas: canvas,
    });
  }

  public get renderer() {
    return this.#renderer;
  }

  public setSize(width: number, height: number) {
    this.#renderer.setSize(width, height);
  }

  public clear() {
    this.#renderer.clear();
  }
}

export class ThreeSceneManager {
  #scenes: Map<string, THREE.Scene> = new Map();
  #currentScene: string | null = null;

  constructor() {
    this.#scenes.set("default", new THREE.Scene());

    this.#currentScene = "default";
  }

  public getScene(name: string) {
    return this.#scenes.get(name);
  }

  public addScene(name: string, scene: THREE.Scene) {
    this.#scenes.set(name, scene);
  }

  public removeScene(name: string) {
    this.#scenes.delete(name);
  }

  public setCurrentScene(name: string) {
    this.#currentScene = name;
  }

  public getCurrentScene() {
    return this.#currentScene ? this.#scenes.get(this.#currentScene) : null;
  }
}

export * from "three";

export const ThreeSet = Symbol("ThreeSet");

const clearRenderer = sys(({ commands }) => {
  const r = commands.getResource(ThreeRenderer);
  r.clear();
}).label("clear-renderer");

const addMeshesToScene = sys(({ commands }) => {
  const sm = commands.getResource(ThreeSceneManager);
  for (const [mesh] of commands.all(THREE.Mesh)) {
    if (!mesh.parent) {
      sm.getCurrentScene()!.add(mesh);
    }
  }
}).label("add-meshes-to-scene");

const renderScene = sys(({ commands }) => {
  const r = commands.getResource(ThreeRenderer);
  const sm = commands.getResource(ThreeSceneManager);
  const [camera] = commands.tryFind(THREE.PerspectiveCamera) ?? [];
  if (camera) {
    r.renderer.render(sm.getCurrentScene()!, camera);
  }
}).label("render-scene");

export class ThreePlugin implements EcsPlugin {
  constructor(
    private readonly containerSelector: string | HTMLElement = document.body
  ) {}

  public async build(app: App) {
    const vp = new ThreeViewport(this.containerSelector);
    const r = new ThreeRenderer(vp);
    const sm = new ThreeSceneManager();

    r.setSize(vp.width, vp.height);

    app.setResource(vp);
    app.setResource(r);
    app.setResource(sm);

    app.addSystems(
      SystemType.Render,
      createSet(
        ThreeSet,
        renderScene.afterLabel("clear-renderer", "add-meshes-to-scene"),
        clearRenderer,
        addMeshesToScene
      )
    );
  }
}
