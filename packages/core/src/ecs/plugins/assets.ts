import * as THREE from "three";

import {
  App,
  EcsPlugin,
  Assets,
  AssetServer,
  AssetLoader,
  Handle,
  LoadState,
} from "../..";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

import { Howl } from "howler";

/**
 * 2D Texture asset (framework-agnostic)
 * Just holds raw image data that can be used by any renderer
 */
export class Texture2D {
  #image?: HTMLImageElement;
  #promise: Promise<HTMLImageElement>;

  constructor(imagePromise: Promise<HTMLImageElement>) {
    this.#promise = imagePromise;
    imagePromise.then((image) => {
      this.#image = image;
    });
  }

  public isLoaded(): boolean {
    return !!this.#image;
  }

  public get image(): HTMLImageElement | undefined {
    return this.#image;
  }

  public get width(): number {
    return this.#image?.width ?? 0;
  }

  public get height(): number {
    return this.#image?.height ?? 0;
  }

  public async waitForLoad(): Promise<HTMLImageElement> {
    return this.#promise;
  }

  /**
   * Get ImageData from the texture (useful for GPU upload)
   */
  public getImageData(): ImageData | null {
    if (!this.#image) return null;

    const canvas = document.createElement("canvas");
    canvas.width = this.#image.width;
    canvas.height = this.#image.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    ctx.drawImage(this.#image, 0, 0);
    return ctx.getImageData(0, 0, this.#image.width, this.#image.height);
  }
}

/**
 * Asset loader for 2D textures (PNG, JPG, etc.)
 */
export class Texture2DLoader implements AssetLoader<Texture2D> {
  extensions(): string[] {
    return ["png", "jpg", "jpeg", "webp", "gif", "bmp"];
  }

  async load(bytes: Uint8Array, path: string): Promise<Texture2D> {
    const blob = new Blob([bytes as any]);
    const url = URL.createObjectURL(blob);

    const imagePromise = new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";

      // Disable image smoothing for pixel-perfect rendering
      img.style.imageRendering = "pixelated";

      img.onload = () => {
        URL.revokeObjectURL(url);
        resolve(img);
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error(`Failed to load image: ${path}`));
      };
      img.src = url;
    });

    return new Texture2D(imagePromise);
  }
}

/**
 * Sound asset (Howler.js-based)
 */
export class Sound {
  #howl: Howl;

  constructor(howl: Howl) {
    this.#howl = howl;
  }

  public get howl(): Howl {
    return this.#howl;
  }

  public play(): number {
    return this.#howl.play();
  }

  public pause(id?: number): void {
    this.#howl.pause(id);
  }

  public stop(id?: number): void {
    this.#howl.stop(id);
  }

  public isPlaying(id?: number): boolean {
    return this.#howl.playing(id);
  }
}

/**
 * Asset loader for sounds (MP3, WAV, OGG, etc.)
 */
export class SoundLoader implements AssetLoader<Sound> {
  extensions(): string[] {
    return ["mp3", "wav", "ogg", "webm", "m4a"];
  }

  async load(bytes: Uint8Array, path: string): Promise<Sound> {
    const blob = new Blob([bytes as any]);
    const url = URL.createObjectURL(blob);

    return new Promise<Sound>((resolve, reject) => {
      const howl = new Howl({
        src: [url],
        onload: () => {
          URL.revokeObjectURL(url);
          resolve(new Sound(howl));
        },
        onloaderror: (_id, error) => {
          URL.revokeObjectURL(url);
          reject(new Error(`Failed to load sound: ${error}`));
        },
      });
    });
  }
}

/**
 * 3D Model asset (GLTF/GLB)
 */
export class Model3D {
  #mesh: THREE.Mesh;

  constructor(mesh: THREE.Mesh) {
    this.#mesh = mesh;
  }

  public get mesh(): THREE.Mesh {
    return this.#mesh;
  }
}

/**
 * Asset loader for GLTF/GLB models
 */
export class GLTFLoader2 implements AssetLoader<Model3D> {
  #loader = new GLTFLoader();

  extensions(): string[] {
    return ["gltf", "glb"];
  }

  async load(bytes: Uint8Array, path: string): Promise<Model3D> {
    const blob = new Blob([bytes as any]);
    const url = URL.createObjectURL(blob);

    return new Promise<Model3D>((resolve, reject) => {
      this.#loader.load(
        url,
        (gltf) => {
          URL.revokeObjectURL(url);
          const mesh = new THREE.Mesh();
          mesh.add(gltf.scene);
          resolve(new Model3D(mesh));
        },
        undefined,
        (error) => {
          URL.revokeObjectURL(url);
          reject(error);
        }
      );
    });
  }
}

/**
 * Plugin that sets up the asset system with default loaders
 */
export class AssetsPlugin implements EcsPlugin {
  constructor() {}

  public async build(app: App) {
    // Create asset storage for each type
    const texture2DAssets = new Assets<Texture2D>();
    const soundAssets = new Assets<Sound>();
    const model3DAssets = new Assets<Model3D>();

    // Create asset server
    const assetServer = new AssetServer();

    // Register default loaders
    assetServer.registerLoader(new Texture2DLoader());
    assetServer.registerLoader(new SoundLoader());
    assetServer.registerLoader(new GLTFLoader2());

    // Register resources
    app.setResource(assetServer);
    app.setResource(texture2DAssets);
    app.setResource(soundAssets);
    app.setResource(model3DAssets);
  }
}

/**
 * Helper function to load a texture and wait for it
 */
export async function loadTexture2D(
  assetServer: AssetServer,
  assets: Assets<Texture2D>,
  path: string
): Promise<Handle<Texture2D>> {
  const handle = assetServer.load<Texture2D>(path);
  await assetServer.waitForLoad(handle);
  return handle;
}
