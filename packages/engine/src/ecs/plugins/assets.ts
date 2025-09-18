import * as THREE from "three";

import { App, EcsPlugin } from "../..";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

import { Howl } from "howler";

export type Handle = number | string | symbol;

export class Assets {
  #assets: Map<Handle, unknown> = new Map();

  public set<T = unknown>(handle: Handle, asset: T): void {
    this.#assets.set(handle, asset);
  }

  public tryGet<T = unknown>(handle: Handle): T | undefined {
    return this.#assets.get(handle) as T | undefined;
  }

  public get<T = unknown>(handle: Handle): T {
    const res = this.#assets.get(handle) as T | undefined;
    if (!res) {
      throw new Error(`Asset not found: ${String(handle)}`);
    }
    return res;
  }

  public has(handle: Handle): boolean {
    return this.#assets.has(handle);
  }
}

export class AssetServer {
  #assets: Assets;

  constructor(assets: Assets) {
    this.#assets = assets;
  }

  public loadSound(url: string) {
    const sound = new Howl({
      src: [url],
    });

    const handle: Handle = Math.random().toString();

    this.#assets.set(handle, sound);

    return [handle, sound] as const;
  }

  public loadGLTF(url: string) {
    const mesh = new THREE.Mesh();

    const fileHandle: Handle = url.split("#")?.[1] ?? Math.random().toString();
    const fileUrl = url.split("#")?.[0] ?? url;
    const loader = new GLTFLoader();

    this.#assets.set(fileHandle, mesh);

    loader.load(
      fileUrl,
      async (gltf) => {
        mesh.add(gltf.scene);
        this.#assets.set(fileHandle, mesh);
      },
      undefined,
      (error) => {
        console.error(error);
      }
    );

    return [fileHandle, mesh] as const;
  }
}

export class AssetsPlugin implements EcsPlugin {
  constructor() {}

  public async build(app: App) {
    const assets = new Assets();
    const assetServer = new AssetServer(assets);

    app.setResource(assets);
    app.setResource(assetServer);
  }
}
