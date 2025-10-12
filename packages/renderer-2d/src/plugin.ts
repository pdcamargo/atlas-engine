import {
  App,
  EcsPlugin,
  SystemType,
  Viewport,
  ViewportPlugin,
  createSet,
} from "@atlas/core";
import { RenderDevice, RenderQueue } from "./render_device";
import { RenderWorld } from "./render_world";
import { TextureCache } from "./assets/texture";
import { MeshAllocator } from "./assets/mesh";
import { Camera2D } from "./components/camera2d";
import {
  extractSprites,
  extractCameras,
  prepareTextures,
  prepareMeshes,
  prepareCameraUniforms,
  prepareRenderPipeline,
  queueSprites,
  renderSprites,
} from "./phases";

/**
 * System sets for the renderer
 */
export const ExtractSet = Symbol("ExtractSet");
export const PrepareSet = Symbol("PrepareSet");
export const QueueSet = Symbol("QueueSet");
export const RenderSet = Symbol("RenderSet");

/**
 * WebGPU 2D Renderer Plugin
 * Based on Bevy's rendering architecture
 */
export class Renderer2DPlugin implements EcsPlugin {
  #canvas?: HTMLCanvasElement;
  #context?: GPUCanvasContext;

  constructor(options?: { canvas?: HTMLCanvasElement }) {
    this.#canvas = options?.canvas;
  }

  public async build(app: App): Promise<void> {
    // Create render device
    const device = await RenderDevice.create();

    // Set up canvas context
    if (!this.#canvas) {
      this.#canvas = document.createElement("canvas");
      document.body.appendChild(this.#canvas);
    }

    // Initial canvas size will be synced by the update system with Viewport
    // Just set a reasonable default for now
    const dpr = window.devicePixelRatio || 1;
    const displayWidth = this.#canvas.clientWidth || window.innerWidth;
    const displayHeight = this.#canvas.clientHeight || window.innerHeight;

    this.#canvas.width = Math.floor(displayWidth * dpr);
    this.#canvas.height = Math.floor(displayHeight * dpr);

    const context = this.#canvas.getContext("webgpu");
    if (!context) {
      throw new Error("Failed to get WebGPU context");
    }

    context.configure({
      device: device.device,
      format: navigator.gpu.getPreferredCanvasFormat(),
      alphaMode: "premultiplied",
    });

    this.#context = context;

    // Create render world
    const renderWorld = new RenderWorld();

    // Create render queue
    const renderQueue = new RenderQueue();

    // Create asset caches
    const textureCache = new TextureCache();
    const meshAllocator = new MeshAllocator();

    // Register resources
    app.setResource(device);
    app.setResource(renderWorld);
    app.setResource(renderQueue);
    app.setResource(textureCache);
    app.setResource(meshAllocator);
    app.setResource(this.#canvas);
    app.setResource(context);

    // Add system to sync canvas resolution with viewport (handles DPI and resize)
    app.addUpdateSystems(({ commands }) => {
      const viewport = commands.getResource(Viewport);
      if (!viewport) return;

      // Sync canvas size with viewport (accounts for DPI automatically)
      if (
        viewport.canvas.width !== viewport.width ||
        viewport.canvas.height !== viewport.height
      ) {
        viewport.canvas.width = viewport.width;
        viewport.canvas.height = viewport.height;
      }

      // Update camera projections
      const cameras = commands.query(Camera2D).all();
      for (const [, camera] of cameras) {
        camera.projection.resize(viewport.width, viewport.height);
      }
    });

    // Add render systems

    // Extract phase: runs in PreUpdate
    app.addSystems(
      SystemType.PreUpdate,
      createSet(ExtractSet, extractSprites, extractCameras)
    );

    // Prepare phase: runs in Update
    app.addSystems(
      SystemType.Update,
      createSet(
        PrepareSet,
        prepareRenderPipeline,
        prepareMeshes,
        prepareTextures,
        prepareCameraUniforms
      )
    );

    // Queue phase: runs in PostUpdate
    app.addSystems(SystemType.PostUpdate, createSet(QueueSet, queueSprites));

    // Render phase: runs in Render
    app.addSystems(SystemType.Render, createSet(RenderSet, renderSprites));
  }

  public ready(app: App): boolean {
    return (
      app.hasResource(RenderDevice) &&
      app.hasResource(RenderWorld) &&
      app.hasResource(RenderQueue) &&
      app.hasResource(TextureCache) &&
      app.hasResource(MeshAllocator) &&
      app.hasResource(Viewport)
    );
  }

  dependsOn() {
    return [ViewportPlugin];
  }

  public name(): string {
    return "Renderer2DPlugin";
  }
}
