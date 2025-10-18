import { Mat4, mat4 } from "gl-matrix";
import { createBuffersAndAttributesFromArrays, primitives } from "webgpu-utils";
import { Camera, OrthographicCamera, PerspectiveCamera } from "./Camera";
import { SceneGraph } from "./SceneGraph";
import { Sprite } from "./Sprite";
import { Square } from "./Primitive";
import { Texture } from "./Texture";

import spriteShaderCode from "./shaders/sprite.wgsl?raw";
import spriteInstancedShaderCode from "./shaders/sprite_instanced.wgsl?raw";
import primitiveShaderCode from "./shaders/primitive.wgsl?raw";
import { ObjectPool } from "@atlas/core";
import { RenderBatch } from "../batching";
import { TileMap } from "./tilemap/TileMap";
import { TileMapBatch } from "./tilemap/TileMapBatch";
import { LRUCache } from "../utils/LRUCache";
import { PostProcessEffect } from "../post-processing/PostProcessEffect";
import { ParticleEmitter } from "../particles/ParticleEmitter";

interface RendererOptions {
  canvas?: HTMLCanvasElement;
  clearColor?: { r: number; g: number; b: number; a: number };
}

export class WebgpuRenderer {
  private device!: GPUDevice;
  private context!: GPUCanvasContext;
  private format!: GPUTextureFormat;
  private canvas: HTMLCanvasElement;
  private clearColor: { r: number; g: number; b: number; a: number };

  // Pipelines
  private spritePipeline!: GPURenderPipeline;
  private spriteInstancedPipeline!: GPURenderPipeline;
  private primitivePipeline!: GPURenderPipeline;

  private uniformBufferPool?: ObjectPool<GPUBuffer>;
  private squareUniformBufferPool?: ObjectPool<GPUBuffer>;

  private float32Pool = new ObjectPool(
    () => new Float32Array(24),
    (arr) => arr.fill(0), // Optional: zero out
    100
  );

  private matrixPool = new ObjectPool(
    () => mat4.create(),
    (mat) => mat4.identity(mat), // Reset to identity
    50
  );

  // Cache texture views to avoid creating them every frame
  private textureViewCache = new Map<string, GPUTextureView>();

  // Cache bind groups to avoid creating them every frame (LRU eviction)
  private bindGroupCache = new LRUCache<string, GPUBindGroup>(256);

  // Cache bind group layouts (created once, reused)
  private spriteBindGroupLayout?: GPUBindGroupLayout;
  private spriteInstancedBindGroupLayout?: GPUBindGroupLayout;
  private primitiveBindGroupLayout?: GPUBindGroupLayout;

  // Batch management for instanced rendering
  private batches = new Map<string, RenderBatch>(); // textureId -> RenderBatch

  // Shared geometry buffers
  private quadBuffers: {
    buffers: GPUBuffer[];
    bufferLayouts: GPUVertexBufferLayout[];
    numElements: number;
    indexBuffer?: GPUBuffer;
    indexFormat?: GPUIndexFormat;
  };

  // VP matrix uniform buffer for instanced rendering
  private vpMatrixBuffer?: GPUBuffer;

  // Post-processing effects
  private postProcessEffects: PostProcessEffect[] = [];
  private sceneTexture?: GPUTexture;
  private postProcessTextures: GPUTexture[] = [];

  // Performance tracking
  private drawCallCount: number = 0;
  private renderedSpriteCount: number = 0;
  private batchCount: number = 0;
  private totalTiles: number = 0;
  private renderedTiles: number = 0;
  private skippedTiles: number = 0;

  #initialized = false;

  constructor(options: RendererOptions = {}) {
    this.canvas = options.canvas || this.createCanvas();
    this.clearColor = options.clearColor || { r: 0.1, g: 0.1, b: 0.1, a: 1.0 };
    // Quad buffers will be initialized in init()
    this.quadBuffers = {
      buffers: [],
      bufferLayouts: [],
      numElements: 0,
    };
  }

  public get gpu() {
    return {
      device: this.device,
      context: this.context,
      format: this.format,
    };
  }

  public isInitialized() {
    return this.#initialized;
  }

  /**
   * Create a default canvas element
   */
  private createCanvas(): HTMLCanvasElement {
    const canvas =
      document.querySelector("canvas") || document.createElement("canvas");
    if (!document.body.contains(canvas)) {
      document.body.appendChild(canvas);
    }
    return canvas;
  }

  /**
   * Initialize WebGPU device and resources
   */
  async initialize(): Promise<void> {
    if (this.isInitialized()) return;

    // Request WebGPU adapter and device
    if (!navigator.gpu) {
      throw new Error("WebGPU is not supported in this browser.");
    }

    const adapter = await navigator.gpu.requestAdapter();
    if (!adapter) {
      throw new Error("Failed to get GPU adapter.");
    }

    this.device = await adapter.requestDevice();

    // Setup error handling
    this.device.addEventListener("uncapturederror", (event) => {
      console.error("WebGPU uncaptured error:", event.error);
    });

    this.format = navigator.gpu.getPreferredCanvasFormat();

    // Configure canvas
    const dpr = window.devicePixelRatio || 1;
    // Use window dimensions if clientWidth/Height are not set yet
    const width =
      this.canvas.clientWidth > 0 ? this.canvas.clientWidth : window.innerWidth;
    const height =
      this.canvas.clientHeight > 0
        ? this.canvas.clientHeight
        : window.innerHeight;

    this.canvas.width = width * dpr;
    this.canvas.height = height * dpr;

    this.context = this.canvas.getContext("webgpu") as GPUCanvasContext;
    this.context.configure({
      device: this.device,
      format: this.format,
      alphaMode: "premultiplied",
    });

    // Create shared quad geometry
    const arrays = primitives.createXYQuadVertices({ size: 1 });
    this.quadBuffers = createBuffersAndAttributesFromArrays(
      this.device,
      arrays
    );

    // Create pipelines
    await this.createPipelines();

    // Initialize buffer pools
    if (!this.uniformBufferPool) {
      this.uniformBufferPool = new ObjectPool(
        () =>
          this.device.createBuffer({
            size: 96,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
          }),
        undefined, // No reset needed for buffers
        5000 // Max pool size
      );
      this.uniformBufferPool.prewarm(200);
    }

    if (!this.squareUniformBufferPool) {
      this.squareUniformBufferPool = new ObjectPool(
        () =>
          this.device.createBuffer({
            size: 80,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
          }),
        undefined,
        1000
      );
      this.squareUniformBufferPool.prewarm(50);
    }

    // Create VP matrix uniform buffer (64 bytes for mat4x4<f32>)
    this.vpMatrixBuffer = this.device.createBuffer({
      size: 64, // 16 floats * 4 bytes
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
      label: "VP Matrix Uniform Buffer",
    });

    // Clear bind group cache (important when shaders change)
    this.bindGroupCache.clear();

    // Cache bind group layouts for reuse
    this.spriteBindGroupLayout = this.spritePipeline.getBindGroupLayout(0);
    this.spriteInstancedBindGroupLayout =
      this.spriteInstancedPipeline.getBindGroupLayout(0);
    this.primitiveBindGroupLayout =
      this.primitivePipeline.getBindGroupLayout(0);

    // Initialize post-processing effects
    for (const effect of this.postProcessEffects) {
      effect.initialize(this.device, this.format);
    }

    // Create render target textures for post-processing
    this.updateRenderTargets();

    this.#initialized = true;
  }

  /**
   * Create render pipelines for sprites and primitives
   */
  private async createPipelines(): Promise<void> {
    // Sprite pipeline
    const spriteShaderModule = this.device.createShaderModule({
      label: "Sprite Shader",
      code: spriteShaderCode,
    });

    // Check for shader compilation errors
    const spriteCompilationInfo = await spriteShaderModule.getCompilationInfo();
    for (const message of spriteCompilationInfo.messages) {
      if (message.type === "error") {
        console.error(
          `Sprite shader error: ${message.message} at line ${message.lineNum}`
        );
      }
    }

    this.spritePipeline = this.device.createRenderPipeline({
      label: "Sprite Pipeline",
      layout: "auto",
      vertex: {
        module: spriteShaderModule,
        entryPoint: "vertexMain",
        buffers: this.quadBuffers.bufferLayouts,
      },
      fragment: {
        module: spriteShaderModule,
        entryPoint: "fragmentMain",
        targets: [{ format: this.format, blend: this.getAlphaBlendState() }],
      },
      primitive: {
        topology: "triangle-list",
      },
    });

    // Instanced sprite pipeline
    const spriteInstancedShaderModule = this.device.createShaderModule({
      label: "Instanced Sprite Shader",
      code: spriteInstancedShaderCode,
    });

    const spriteInstancedCompilationInfo =
      await spriteInstancedShaderModule.getCompilationInfo();
    for (const message of spriteInstancedCompilationInfo.messages) {
      if (message.type === "error") {
        console.error(
          `Instanced sprite shader error: ${message.message} at line ${message.lineNum}`
        );
      }
    }

    this.spriteInstancedPipeline = this.device.createRenderPipeline({
      label: "Instanced Sprite Pipeline",
      layout: "auto",
      vertex: {
        module: spriteInstancedShaderModule,
        entryPoint: "vertexMain",
        buffers: this.quadBuffers.bufferLayouts,
      },
      fragment: {
        module: spriteInstancedShaderModule,
        entryPoint: "fragmentMain",
        targets: [{ format: this.format, blend: this.getAlphaBlendState() }],
      },
      primitive: {
        topology: "triangle-list",
        cullMode: "back",
      },
    });

    // Primitive pipeline
    const primitiveShaderModule = this.device.createShaderModule({
      label: "Primitive Shader",
      code: primitiveShaderCode,
    });

    // Check for shader compilation errors
    const primitiveCompilationInfo =
      await primitiveShaderModule.getCompilationInfo();
    for (const message of primitiveCompilationInfo.messages) {
      if (message.type === "error") {
        console.error(
          `Primitive shader error: ${message.message} at line ${message.lineNum}`
        );
      }
    }

    this.primitivePipeline = this.device.createRenderPipeline({
      label: "Primitive Pipeline",
      layout: "auto",
      vertex: {
        module: primitiveShaderModule,
        entryPoint: "vertexMain",
        buffers: [this.quadBuffers.bufferLayouts[0]], // Only position buffer
      },
      fragment: {
        module: primitiveShaderModule,
        entryPoint: "fragmentMain",
        targets: [{ format: this.format, blend: this.getAlphaBlendState() }],
      },
      primitive: {
        topology: "triangle-list",
      },
    });
  }

  /**
   * Get alpha blend state for transparency
   */
  private getAlphaBlendState(): GPUBlendState {
    return {
      color: {
        srcFactor: "src-alpha",
        dstFactor: "one-minus-src-alpha",
        operation: "add",
      },
      alpha: {
        srcFactor: "one",
        dstFactor: "one-minus-src-alpha",
        operation: "add",
      },
    };
  }

  /**
   * Get or create a cached texture view for a texture
   */
  private getOrCreateTextureView(texture: Texture): GPUTextureView {
    if (!this.textureViewCache.has(texture.id)) {
      this.textureViewCache.set(texture.id, texture.gpuTexture.createView());
    }
    return this.textureViewCache.get(texture.id)!;
  }

  /**
   * Build/update batches from the scene graph
   * Only marks batches dirty when sprites are added/removed, not every frame
   * Now batches by material + texture instead of just texture
   */
  private updateBatches(sceneGraph: SceneGraph): void {
    // Track which sprites are currently in the scene
    const currentSprites = new Set<Sprite>();
    const spritesByBatch = new Map<string, Set<Sprite>>(); // batchKey -> sprites

    // Collect all sprites from scene graph
    sceneGraph.traverse((node) => {
      if (node instanceof Sprite && node.texture) {
        // Only add sprites with loaded Textures (skip handles that haven't loaded yet)
        const texture = node.getTexture();
        if (!texture) {
          // Texture is still a handle or not loaded, skip for now
          return;
        }

        currentSprites.add(node);

        // Create batch key from material + texture
        const batchKey = `${node.material.id}_${texture.id}`;
        if (!spritesByBatch.has(batchKey)) {
          spritesByBatch.set(batchKey, new Set());
        }
        spritesByBatch.get(batchKey)!.add(node);
      }
    });

    // Remove sprites from batches that are no longer in the scene
    for (const [batchKey, batch] of this.batches) {
      const spritesForThisBatch = spritesByBatch.get(batchKey);

      if (!spritesForThisBatch) {
        // No sprites for this batch anymore, remove it
        batch.destroy();
        this.batches.delete(batchKey);
      } else {
        // Remove sprites that are no longer in scene
        let removedAny = false;
        for (const sprite of batch.getAllSprites()) {
          if (!currentSprites.has(sprite)) {
            batch.removeSprite(sprite);
            removedAny = true;
          }
        }
        // Only mark dirty if we actually removed sprites
        // Individual sprite movement is handled by per-sprite dirty tracking
        if (removedAny) {
          batch.markDirty();
        }
      }
    }

    // Add/update sprites in batches
    for (const [batchKey, sprites] of spritesByBatch) {
      let batch = this.batches.get(batchKey);

      if (!batch) {
        // Create new batch
        const firstSprite = sprites.values().next().value;
        const texture = firstSprite?.getTexture();
        if (!firstSprite || !texture) continue;

        batch = new RenderBatch(texture, firstSprite.material);
        batch.initialize(this.device);
        this.batches.set(batchKey, batch);
      }

      // Add any new sprites to batch (only marks dirty if sprite was added)
      for (const sprite of sprites) {
        if (!batch.hasSprite(sprite)) {
          batch.addSprite(sprite); // This calls markDirty internally
        }
      }

      // Note: We no longer mark all batches dirty every frame
      // Batches are only marked dirty when:
      // 1. Sprites are added (above)
      // 2. Sprites are removed (above)
      // 3. Individual sprites change (handled in RenderBatch.updateInstanceData)
    }
  }

  /**
   * Render the scene graph with the given camera
   */
  render(camera: Camera, sceneGraph: SceneGraph): void {
    if (!this.isInitialized()) {
      throw new Error("Renderer not initialized. Call initialize() first.");
    }

    // Reset performance counters for this frame
    this.drawCallCount = 0;
    this.renderedSpriteCount = 0;
    this.batchCount = 0;
    this.totalTiles = 0;
    this.renderedTiles = 0;
    this.skippedTiles = 0;

    // Update all transforms in the scene graph
    sceneGraph.updateTransforms();

    // Update batches (add/remove sprites as needed)
    this.updateBatches(sceneGraph);

    // Get view-projection matrix
    const vpMatrix = camera.getViewProjectionMatrix();

    // Begin command encoder
    const commandEncoder = this.device.createCommandEncoder();

    // Check if we have enabled post-processing effects
    const enabledPostProcessEffects = this.getEnabledPostProcessEffects();
    const hasPostProcessing = enabledPostProcessEffects.length > 0;

    // Ensure render targets exist if we have post-processing
    // We need both scene texture AND ping-pong textures
    if (hasPostProcessing && (!this.sceneTexture || this.postProcessTextures.length === 0)) {
      this.updateRenderTargets();
    }

    // Render target: either scene texture (if post-processing) or canvas
    const renderTargetView = hasPostProcessing
      ? this.sceneTexture!.createView()
      : this.context.getCurrentTexture().createView();

    // Main scene render pass
    const renderPass = commandEncoder.beginRenderPass({
      colorAttachments: [
        {
          view: renderTargetView,
          clearValue: this.clearColor,
          loadOp: "clear",
          storeOp: "store",
        },
      ],
    });

    sceneGraph.traverseVisible((node) => {
      if (node instanceof TileMap) {
        this.renderTileMap(renderPass, node, vpMatrix.data, camera);
      } else if (node instanceof Square) {
        this.renderSquare(renderPass, node, vpMatrix.data);
      } else if (node instanceof ParticleEmitter) {
        this.renderParticleEmitter(renderPass, node, vpMatrix.data);
      }
    });

    // Render pre-effects (effects with order < 0, render BEFORE base sprite)
    this.renderEffects(renderPass, sceneGraph, camera, vpMatrix.data, true);

    // Render batches (sprites grouped by material + texture)
    for (const batch of this.batches.values()) {
      if (batch.isEmpty()) continue;

      this.batchCount++;

      if (batch.shouldUseInstancing()) {
        this.renderBatchInstanced(renderPass, batch, camera);
      } else {
        this.renderBatchIndividual(renderPass, batch, vpMatrix.data, camera);
      }
    }

    // Render post-effects (effects with order >= 0, render AFTER base sprite)
    this.renderEffects(renderPass, sceneGraph, camera, vpMatrix.data, false);

    renderPass.end();

    // Apply post-processing effects
    if (hasPostProcessing) {
      this.applyPostProcessing(commandEncoder, enabledPostProcessEffects);
    }

    this.device.queue.submit([commandEncoder.finish()]);

    // Release all buffers back to pools after frame is submitted
    if (this.uniformBufferPool) {
      this.uniformBufferPool.releaseAll();
    }
    if (this.squareUniformBufferPool) {
      this.squareUniformBufferPool.releaseAll();
    }
  }

  /**
   * Render a batch using instanced rendering
   */
  private renderBatchInstanced(
    renderPass: GPURenderPassEncoder,
    batch: RenderBatch,
    camera: Camera
  ): void {
    if (!this.spriteInstancedBindGroupLayout || !this.vpMatrixBuffer) {
      throw new Error("Instanced pipeline not initialized");
    }

    // Always update instance data (handles both batch changes and individual sprite movement)
    // The updateInstanceData method is smart enough to only update changed sprites
    batch.updateInstanceData(camera);

    const instanceDataInfo = batch.getInstanceData();
    if (instanceDataInfo.count === 0) return;

    // Upload VP matrix to GPU (once per batch)
    const vpMatrix = camera.getViewProjectionMatrix();
    this.device.queue.writeBuffer(this.vpMatrixBuffer, 0, vpMatrix.data);

    // Get or create instance buffer
    const instanceBuffer = batch.getOrCreateInstanceBuffer();

    // Phase 4: Partial GPU upload - only upload dirty ranges
    const dirtyRanges = batch.getDirtyRanges();

    if (dirtyRanges === null) {
      // Full upload (first frame or >80% dirty)
      const instanceDataToWrite = instanceDataInfo.data.subarray(
        0,
        instanceDataInfo.count * 12
      );
      this.device.queue.writeBuffer(
        instanceBuffer,
        0,
        instanceDataToWrite.buffer,
        instanceDataToWrite.byteOffset,
        instanceDataToWrite.byteLength
      );
    } else if (dirtyRanges.length > 0) {
      // Partial upload - only upload dirty ranges
      const FLOATS_PER_INSTANCE = 12;
      const BYTES_PER_INSTANCE = 48;

      for (const range of dirtyRanges) {
        const startFloat = range.start * FLOATS_PER_INSTANCE;
        const endFloat = range.end * FLOATS_PER_INSTANCE;
        const rangeData = instanceDataInfo.data.subarray(startFloat, endFloat);

        const offsetBytes = range.start * BYTES_PER_INSTANCE;
        this.device.queue.writeBuffer(
          instanceBuffer,
          offsetBytes,
          rangeData.buffer,
          rangeData.byteOffset,
          rangeData.byteLength
        );
      }
    }
    // If dirtyRanges.length === 0, skip upload (nothing changed)

    // Create or get cached bind group (same pattern as tilemap)
    // Cache key: textureId_bufferId (buffer ID changes when buffer is recreated)
    const bufferId = batch.getBufferId();
    const cacheKey = `${batch.texture.id}_${bufferId}`;

    let bindGroup = this.bindGroupCache.get(cacheKey);
    if (!bindGroup) {
      bindGroup = this.device.createBindGroup({
        layout: this.spriteInstancedBindGroupLayout,
        entries: [
          { binding: 0, resource: { buffer: this.vpMatrixBuffer } }, // VP matrix uniform
          { binding: 1, resource: { buffer: instanceBuffer } }, // Instance data storage
          { binding: 2, resource: batch.texture.sampler }, // Texture sampler
          { binding: 3, resource: this.getOrCreateTextureView(batch.texture) }, // Texture view
        ],
      });
      this.bindGroupCache.set(cacheKey, bindGroup);
    }

    // Draw instanced
    renderPass.setPipeline(this.spriteInstancedPipeline);
    renderPass.setBindGroup(0, bindGroup);
    for (let i = 0; i < this.quadBuffers.bufferLayouts.length; i++) {
      renderPass.setVertexBuffer(i, this.quadBuffers.buffers[i]);
    }
    if (this.quadBuffers.indexBuffer) {
      renderPass.setIndexBuffer(
        this.quadBuffers.indexBuffer,
        this.quadBuffers.indexFormat!
      );
      renderPass.drawIndexed(
        this.quadBuffers.numElements,
        instanceDataInfo.count
      );
    } else {
      renderPass.draw(this.quadBuffers.numElements, instanceDataInfo.count);
    }

    // Track stats: 1 draw call for all instances
    this.drawCallCount++;
    this.renderedSpriteCount += instanceDataInfo.count;
  }

  /**
   * Render a batch using individual draw calls
   */
  private renderBatchIndividual(
    renderPass: GPURenderPassEncoder,
    batch: RenderBatch,
    vpMatrix: Mat4,
    camera: Camera
  ): void {
    const sprites = batch.getSpritesForIndividualRendering(camera);

    for (const sprite of sprites) {
      this.renderSprite(renderPass, sprite, vpMatrix);
      this.drawCallCount++;
      this.renderedSpriteCount++;
    }
  }

  /**
   * Render a single sprite (used for small batches)
   */
  private renderSprite(
    renderPass: GPURenderPassEncoder,
    sprite: Sprite,
    vpMatrix: Mat4
  ): void {
    if (!sprite.texture || !(sprite.texture instanceof Texture)) return;

    // Compute MVP matrix using pooled matrices
    const modelMatrix = sprite.getWorldMatrix();

    const scaledModel = this.matrixPool.acquire();
    mat4.copy(scaledModel, modelMatrix);
    scaledModel[0] *= sprite.width;
    scaledModel[5] *= sprite.height;

    const mvpMatrix = this.matrixPool.acquire();
    mat4.multiply(mvpMatrix, vpMatrix, scaledModel);

    // Prepare uniform data using pooled array
    // 16 floats for matrix + 4 floats for frame + 4 floats for tint = 24 floats total
    const uniformData = this.float32Pool.acquire();
    uniformData.set(mvpMatrix, 0);
    uniformData.set(sprite.frame.data, 16); // frame: x, y, width, height
    uniformData.set(sprite.tint.data, 20); // tint: r, g, b, a

    if (!this.uniformBufferPool || !this.spriteBindGroupLayout) {
      throw new Error("Renderer resources not properly initialized.");
    }

    // Get uniform buffer from pool and write data
    const uniformBuffer = this.uniformBufferPool.acquire();
    this.device.queue.writeBuffer(uniformBuffer, 0, uniformData.buffer);

    // Release pooled resources immediately
    this.float32Pool.release(uniformData);
    this.matrixPool.release(scaledModel);
    this.matrixPool.release(mvpMatrix);

    // Create bind group for this draw call
    // Note: Cannot cache bind groups with dynamic uniform buffers
    const bindGroup = this.device.createBindGroup({
      layout: this.spriteBindGroupLayout,
      entries: [
        { binding: 0, resource: { buffer: uniformBuffer, size: 96 } },
        { binding: 1, resource: sprite.texture.sampler },
        { binding: 2, resource: this.getOrCreateTextureView(sprite.texture) },
      ],
    });

    // Draw
    renderPass.setPipeline(this.spritePipeline);
    renderPass.setBindGroup(0, bindGroup);
    for (let i = 0; i < this.quadBuffers.bufferLayouts.length; i++) {
      renderPass.setVertexBuffer(i, this.quadBuffers.buffers[i]);
    }
    if (this.quadBuffers.indexBuffer) {
      renderPass.setIndexBuffer(
        this.quadBuffers.indexBuffer,
        this.quadBuffers.indexFormat!
      );
      renderPass.drawIndexed(this.quadBuffers.numElements);
    } else {
      renderPass.draw(this.quadBuffers.numElements);
    }
  }

  /**
   * Render a square primitive
   */
  private renderSquare(
    renderPass: GPURenderPassEncoder,
    square: Square,
    vpMatrix: Mat4
  ): void {
    // Compute MVP matrix using pooled matrices
    const modelMatrix = square.getWorldMatrix();

    const scaledModel = this.matrixPool.acquire();
    mat4.copy(scaledModel, modelMatrix);
    scaledModel[0] *= square.size;
    scaledModel[5] *= square.size;

    const mvpMatrix = this.matrixPool.acquire();
    mat4.multiply(mvpMatrix, vpMatrix, scaledModel);

    // Prepare uniform data using pooled array (20 floats: 16 for matrix + 4 for color)
    const uniformData = this.float32Pool.acquire();
    uniformData.set(mvpMatrix, 0);
    uniformData.set(square.color.data, 16);

    if (!this.squareUniformBufferPool || !this.primitiveBindGroupLayout) {
      throw new Error("Renderer resources not properly initialized.");
    }

    // Get uniform buffer from pool and write data
    const uniformBuffer = this.squareUniformBufferPool.acquire();
    this.device.queue.writeBuffer(uniformBuffer, 0, uniformData.buffer, 0, 80);

    // Release pooled resources immediately
    this.float32Pool.release(uniformData);
    this.matrixPool.release(scaledModel);
    this.matrixPool.release(mvpMatrix);

    // Create bind group for this draw call
    const bindGroup = this.device.createBindGroup({
      layout: this.primitiveBindGroupLayout,
      entries: [{ binding: 0, resource: { buffer: uniformBuffer, size: 80 } }],
    });

    // Draw
    renderPass.setPipeline(this.primitivePipeline);
    renderPass.setBindGroup(0, bindGroup);
    renderPass.setVertexBuffer(0, this.quadBuffers.buffers[0]);
    if (this.quadBuffers.indexBuffer) {
      renderPass.setIndexBuffer(
        this.quadBuffers.indexBuffer,
        this.quadBuffers.indexFormat!
      );
      renderPass.drawIndexed(this.quadBuffers.numElements);
    } else {
      renderPass.draw(this.quadBuffers.numElements);
    }
  }

  /**
   * Render effects for all sprites that have effects
   * @param preEffects - If true, render only effects with order < 0 (before base sprite)
   *                     If false, render only effects with order >= 0 (after base sprite)
   */
  private renderEffects(
    renderPass: GPURenderPassEncoder,
    sceneGraph: SceneGraph,
    camera: Camera,
    vpMatrix: Mat4,
    preEffects: boolean = false
  ): void {
    // Collect all sprites with effects
    const spritesWithEffects: Sprite[] = [];

    sceneGraph.traverseVisible((node) => {
      if (node instanceof Sprite && node.hasEffects()) {
        spritesWithEffects.push(node);
      }
    });

    if (spritesWithEffects.length === 0) return;

    // Create effect context once for all effects
    const effectContext = {
      device: this.device,
      renderPass,
      vpMatrix,
      camera,
      format: this.format,
      quadBuffers: this.quadBuffers,
    };

    // Render effects based on whether we're doing pre or post effects
    for (const sprite of spritesWithEffects) {
      const effects = sprite.getEnabledEffects();

      // Filter effects based on pre/post pass
      const filteredEffects = effects.filter((effect) =>
        preEffects ? effect.order < 0 : effect.order >= 0
      );

      if (filteredEffects.length === 0) continue;

      for (const effect of filteredEffects) {
        // Call beforeRender if the effect has it
        if (effect.beforeRender) {
          effect.beforeRender(effectContext);
        }

        // Render the effect for this sprite
        effect.render(sprite, effectContext);

        this.drawCallCount++; // Count effect draw calls
      }

      // Call afterRender for cleanup
      for (const effect of filteredEffects) {
        if (effect.afterRender) {
          effect.afterRender(effectContext);
        }
      }
    }
  }

  /**
   * Resize the canvas and update internal dimensions
   */
  resize(): void {
    if (!this.isInitialized()) {
      throw new Error("Renderer not initialized. Call initialize() first.");
    }

    // Canvas is already updated with correct dimensions
    // Just reconfigure the WebGPU context to match the new canvas size
    this.context.configure({
      device: this.device,
      format: this.format,
      alphaMode: "premultiplied",
    });
  }

  setClearColor(r: number, g: number, b: number, a: number = 1): void {
    this.clearColor = { r, g, b, a };
  }

  /**
   * Enable or disable frustum culling for all batches
   * Note: Frustum culling has CPU overhead and may not improve performance
   * for scenes with many small sprites that are mostly visible
   */
  setFrustumCulling(enabled: boolean): void {
    for (const batch of this.batches.values()) {
      batch.enableFrustumCulling = enabled;
    }
  }

  /**
   * Get rendering statistics from the last frame
   */
  getStats() {
    return {
      drawCalls: this.drawCallCount,
      renderedSprites: this.renderedSpriteCount,
      batches: this.batchCount,
      totalBatches: this.batches.size,
      totalTiles: this.totalTiles,
      renderedTiles: this.renderedTiles,
      skippedTiles: this.skippedTiles,
    };
  }

  /**
   * Get the number of draw calls from the last frame
   */
  getDrawCallCount(): number {
    return this.drawCallCount;
  }

  /**
   * Get the number of sprites rendered in the last frame
   */
  getRenderedSpriteCount(): number {
    return this.renderedSpriteCount;
  }

  /**
   * Get the number of batches processed in the last frame
   */
  getBatchCount(): number {
    return this.batchCount;
  }

  /**
   * Compare two matrices for equality
   */
  private matricesEqual(a: Float32Array, b: Float32Array): boolean {
    for (let i = 0; i < 16; i++) {
      if (Math.abs(a[i] - b[i]) > 0.0001) {
        return false;
      }
    }
    return true;
  }

  /**
   * Get view bounds with padding to prevent tile popping
   * @param camera - The camera to get bounds from
   * @param paddingMultiplier - Multiplier for padding (1.5 = 50% extra on each side)
   */
  private getViewBoundsWithPadding(
    camera: Camera,
    paddingMultiplier: number = 1.5
  ): { left: number; right: number; top: number; bottom: number } {
    // For orthographic cameras, we can directly use the camera bounds
    if (camera instanceof OrthographicCamera) {
      const width = camera.right - camera.left;
      const height = camera.top - camera.bottom;
      const padWidth = (width * (paddingMultiplier - 1)) / 2;
      const padHeight = (height * (paddingMultiplier - 1)) / 2;

      return {
        left: camera.target.x + camera.left - padWidth,
        right: camera.target.x + camera.right + padWidth,
        bottom: camera.target.y + camera.bottom - padHeight,
        top: camera.target.y + camera.top + padHeight,
      };
    }

    // For perspective cameras, estimate frustum at target distance
    if (camera instanceof PerspectiveCamera) {
      const distance = Math.sqrt(
        Math.pow(camera.target.x - camera.position.x, 2) +
          Math.pow(camera.target.y - camera.position.y, 2) +
          Math.pow(camera.target.z - camera.position.z, 2)
      );

      const halfFovTan = Math.tan(camera.fov / 2);
      const frustumHeight = 2 * halfFovTan * distance * paddingMultiplier;
      const frustumWidth = frustumHeight * camera.getAspectRatio();

      return {
        left: camera.target.x - frustumWidth / 2,
        right: camera.target.x + frustumWidth / 2,
        bottom: camera.target.y - frustumHeight / 2,
        top: camera.target.y + frustumHeight / 2,
      };
    }

    // Fallback: very large bounds (no culling)
    return {
      left: -Infinity,
      right: Infinity,
      bottom: -Infinity,
      top: Infinity,
    };
  }

  /**
   * Render a tilemap using chunk-based culling
   */
  private renderTileMap(
    renderPass: GPURenderPassEncoder,
    tileMap: TileMap,
    vpMatrix: Mat4,
    camera: Camera
  ): void {
    if (!this.spriteInstancedBindGroupLayout) {
      throw new Error("Instanced pipeline not initialized");
    }

    const needsFullRebuild = tileMap.isDirty();

    if (needsFullRebuild) {
      // Build chunks from tilemap data
      tileMap.buildChunks(this.device);

      // Calculate world bounds for all chunks
      const worldMatrix = tileMap.getWorldMatrix();
      tileMap.updateChunkBounds(worldMatrix);

      tileMap.markClean();
    }

    // Get view bounds (no padding needed - adjacent chunks provide buffer)
    const viewBounds = this.getViewBoundsWithPadding(camera, 1.0);

    // Get visible chunks + adjacent chunks (fast AABB test)
    const visibleChunks = tileMap.getVisibleChunks(viewBounds);

    // Get world matrix for rendering
    const worldMatrix = tileMap.getWorldMatrix();

    // Upload VP matrix to GPU (once per tilemap)
    if (this.vpMatrixBuffer) {
      this.device.queue.writeBuffer(this.vpMatrixBuffer, 0, vpMatrix);
    }

    // Count total tiles
    for (const chunk of tileMap.getChunks().values()) {
      this.totalTiles += chunk.getTileCount();
    }

    // Render only visible chunks
    for (const chunk of visibleChunks) {
      if (chunk.isEmpty()) continue;

      // Render the chunk (handles all batches within the chunk)
      chunk.render(
        renderPass,
        this.device,
        vpMatrix,
        worldMatrix,
        tileMap.tileWidth,
        tileMap.tileHeight,
        this.spriteInstancedPipeline,
        this.spriteInstancedBindGroupLayout,
        this.quadBuffers,
        this.textureViewCache,
        this.bindGroupCache,
        this.vpMatrixBuffer!
      );

      // Track stats
      const chunkTileCount = chunk.getTileCount();
      this.renderedTiles += chunkTileCount;
      this.drawCallCount++; // Each chunk renders its batches
      this.batchCount++;
    }

    // Calculate skipped tiles
    this.skippedTiles = this.totalTiles - this.renderedTiles;
  }

  /**
   * Render a particle emitter
   */
  private renderParticleEmitter(
    renderPass: GPURenderPassEncoder,
    emitter: ParticleEmitter,
    vpMatrix: Float32Array
  ): void {
    // Initialize emitter if not already initialized (fire and forget - will render next frame)
    if (!emitter.isInitialized()) {
      // Start initialization asynchronously
      emitter.initialize(this.device, this.format).catch((error) => {
        console.error("Failed to initialize particle emitter:", error);
      });
      return; // Skip rendering this frame
    }

    // Render particles
    emitter.render(renderPass, vpMatrix);
    this.drawCallCount++;
  }

  /**
   * Add a post-processing effect to the renderer
   */
  addPostProcessEffect(effect: PostProcessEffect): void {
    if (!this.postProcessEffects.includes(effect)) {
      this.postProcessEffects.push(effect);
      this.postProcessEffects.sort((a, b) => a.order - b.order);

      // Initialize effect if renderer is already initialized
      if (this.isInitialized()) {
        effect.initialize(this.device, this.format);
      }
    }
  }

  /**
   * Remove a post-processing effect from the renderer
   */
  removePostProcessEffect(effect: PostProcessEffect): void {
    const index = this.postProcessEffects.indexOf(effect);
    if (index !== -1) {
      this.postProcessEffects.splice(index, 1);
      effect.destroy?.();
    }
  }

  /**
   * Get all post-processing effects
   */
  getPostProcessEffects(): PostProcessEffect[] {
    return [...this.postProcessEffects];
  }

  /**
   * Get enabled post-processing effects
   */
  getEnabledPostProcessEffects(): PostProcessEffect[] {
    return this.postProcessEffects.filter((effect) => effect.enabled);
  }

  /**
   * Clear all post-processing effects
   */
  clearPostProcessEffects(): void {
    for (const effect of this.postProcessEffects) {
      effect.destroy?.();
    }
    this.postProcessEffects = [];
  }

  /**
   * Create or recreate render target textures for post-processing
   */
  private updateRenderTargets(): void {
    const width = this.canvas.width;
    const height = this.canvas.height;

    // Destroy old textures
    this.sceneTexture?.destroy();
    for (const texture of this.postProcessTextures) {
      texture.destroy();
    }
    this.postProcessTextures = [];

    // Create scene texture (where we render the main scene)
    this.sceneTexture = this.device.createTexture({
      size: { width, height },
      format: this.format,
      usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING,
      label: "Scene Render Target",
    });

    // Create ping-pong textures for post-processing chain
    // We need at least 2 textures to ping-pong between effects
    const enabledEffects = this.getEnabledPostProcessEffects();
    if (enabledEffects.length > 0) {
      for (let i = 0; i < 2; i++) {
        this.postProcessTextures.push(
          this.device.createTexture({
            size: { width, height },
            format: this.format,
            usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING,
            label: `Post-Process Texture ${i}`,
          })
        );
      }
    }
  }

  /**
   * Apply post-processing effects chain
   */
  private applyPostProcessing(
    commandEncoder: GPUCommandEncoder,
    effects: PostProcessEffect[]
  ): void {
    if (effects.length === 0) return;

    const width = this.canvas.width;
    const height = this.canvas.height;

    // Validate we have the necessary render targets
    if (!this.sceneTexture) {
      throw new Error("Scene texture not created for post-processing");
    }
    if (effects.length > 1 && this.postProcessTextures.length < 2) {
      throw new Error(`Post-processing requires 2 ping-pong textures, but only ${this.postProcessTextures.length} exist`);
    }

    // Start with scene texture as source
    let sourceTexture = this.sceneTexture;
    let destinationTexture: GPUTexture;

    for (let i = 0; i < effects.length; i++) {
      const effect = effects[i];
      const isLastEffect = i === effects.length - 1;

      // Last effect renders to canvas, others to ping-pong textures
      if (isLastEffect) {
        destinationTexture = this.context.getCurrentTexture();
      } else {
        // Ping-pong between the two post-process textures
        destinationTexture = this.postProcessTextures[i % 2];
      }

      // Apply the effect
      effect.apply(
        this.device,
        commandEncoder,
        sourceTexture,
        destinationTexture,
        width,
        height
      );

      // Next iteration uses this output as input
      sourceTexture = destinationTexture;
    }
  }
}
