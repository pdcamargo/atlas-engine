import { Mat4, mat4 } from "gl-matrix";
import { createBuffersAndAttributesFromArrays, primitives } from "webgpu-utils";
import { Camera } from "./Camera";
import { SceneGraph } from "./SceneGraph";
import { Sprite } from "./Sprite";
import { Square } from "./Primitive";
import { Texture } from "./Texture";

import spriteShaderCode from "./shaders/sprite.wgsl?raw";
import spriteInstancedShaderCode from "./shaders/sprite_instanced.wgsl?raw";
import primitiveShaderCode from "./shaders/primitive.wgsl?raw";
import { ObjectPool } from "@atlas/core";
import { RenderBatch } from "../batching";

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

  // Performance tracking
  private drawCallCount: number = 0;
  private renderedSpriteCount: number = 0;
  private batchCount: number = 0;

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

    // Cache bind group layouts for reuse
    this.spriteBindGroupLayout = this.spritePipeline.getBindGroupLayout(0);
    this.spriteInstancedBindGroupLayout =
      this.spriteInstancedPipeline.getBindGroupLayout(0);
    this.primitiveBindGroupLayout =
      this.primitivePipeline.getBindGroupLayout(0);

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
   */
  private updateBatches(sceneGraph: SceneGraph): void {
    // Track which sprites are currently in the scene
    const currentSprites = new Set<Sprite>();
    const spritesByTexture = new Map<string, Set<Sprite>>();

    // Collect all sprites from scene graph
    sceneGraph.traverse((node) => {
      if (node instanceof Sprite && node.texture) {
        currentSprites.add(node);

        const textureId = node.texture.id;
        if (!spritesByTexture.has(textureId)) {
          spritesByTexture.set(textureId, new Set());
        }
        spritesByTexture.get(textureId)!.add(node);
      }
    });

    // Debug logging (comment out for production)
    // console.log(`[Renderer] Found ${currentSprites.size} sprites in ${spritesByTexture.size} texture groups`);

    // Remove sprites from batches that are no longer in the scene
    for (const [textureId, batch] of this.batches) {
      const spritesForThisTexture = spritesByTexture.get(textureId);

      if (!spritesForThisTexture) {
        // No sprites for this texture anymore, remove batch
        batch.destroy();
        this.batches.delete(textureId);
      } else {
        // Remove sprites that are no longer in scene
        for (const sprite of batch.getAllSprites()) {
          if (!currentSprites.has(sprite)) {
            batch.removeSprite(sprite);
          }
        }
      }
    }

    // Add/update sprites in batches
    for (const [textureId, sprites] of spritesByTexture) {
      let batch = this.batches.get(textureId);

      if (!batch) {
        // Create new batch
        const firstSprite = sprites.values().next().value;
        if (!firstSprite || !firstSprite.texture) continue;

        batch = new RenderBatch(firstSprite.texture);
        batch.initialize(this.device);
        this.batches.set(textureId, batch);
        // console.log(`[Renderer] Created batch for texture ${textureId}`);
      }

      // Add any new sprites to batch
      for (const sprite of sprites) {
        if (!batch.hasSprite(sprite)) {
          batch.addSprite(sprite);
        }
      }

      // Mark batch as dirty each frame since sprites might have moved
      batch.markDirty();
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

    // Update all transforms in the scene graph
    sceneGraph.updateTransforms();

    // Update batches (add/remove sprites as needed)
    this.updateBatches(sceneGraph);

    // Get view-projection matrix
    const vpMatrix = camera.getViewProjectionMatrix();

    // Begin render pass
    const commandEncoder = this.device.createCommandEncoder();
    const textureView = this.context.getCurrentTexture().createView();

    const renderPass = commandEncoder.beginRenderPass({
      colorAttachments: [
        {
          view: textureView,
          clearValue: this.clearColor,
          loadOp: "clear",
          storeOp: "store",
        },
      ],
    });

    // Render batches (sprites grouped by texture)
    for (const batch of this.batches.values()) {
      if (batch.isEmpty()) continue;

      this.batchCount++;

      if (batch.shouldUseInstancing()) {
        this.renderBatchInstanced(renderPass, batch, camera);
      } else {
        this.renderBatchIndividual(renderPass, batch, vpMatrix.data, camera);
      }
    }

    // Render primitives (squares, etc.) - not batched
    sceneGraph.traverseVisible((node) => {
      if (node instanceof Square) {
        this.renderSquare(renderPass, node, vpMatrix.data);
      }
    });

    renderPass.end();
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
    if (!this.spriteInstancedBindGroupLayout) {
      throw new Error("Instanced pipeline not initialized");
    }

    // Update instance data for all sprites in batch
    batch.updateInstanceData(camera);

    const instanceDataInfo = batch.getInstanceData();
    if (instanceDataInfo.count === 0) return;

    // Get or create instance buffer
    const instanceBuffer = batch.getOrCreateInstanceBuffer();

    // Write instance data to GPU
    this.device.queue.writeBuffer(
      instanceBuffer,
      0,
      instanceDataInfo.data.buffer,
      0,
      instanceDataInfo.count * 96 // 96 bytes per instance
    );

    // Create bind group
    const bindGroup = this.device.createBindGroup({
      layout: this.spriteInstancedBindGroupLayout,
      entries: [
        { binding: 0, resource: { buffer: instanceBuffer } },
        { binding: 1, resource: batch.texture.sampler },
        { binding: 2, resource: this.getOrCreateTextureView(batch.texture) },
      ],
    });

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
    if (!sprite.texture) return;

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
}
