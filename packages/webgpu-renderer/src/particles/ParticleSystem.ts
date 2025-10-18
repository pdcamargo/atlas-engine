import { Texture } from "../renderer/Texture";
import type { GPUEmitterConfig, ParticleBlendMode } from "./ParticleConfig";

// Import shaders
import particleCommonShader from "./shaders/particle-common.wgsl?raw";
import particleUpdateShader from "./shaders/particle-update.wgsl?raw";
import particleEmitShader from "./shaders/particle-emit.wgsl?raw";
import particleRenderShader from "./shaders/particle-render.wgsl?raw";

/**
 * Manages GPU resources for a particle emitter
 * Handles compute pipelines, render pipeline, and buffers
 */
export class ParticleSystem {
  private device: GPUDevice;
  private format: GPUTextureFormat;

  // Particle capacity
  public readonly maxParticles: number;

  // GPU Buffers
  private particleBuffer?: GPUBuffer;
  private emitterConfigBuffer?: GPUBuffer;
  private simulationUniformBuffer?: GPUBuffer;

  // Compute Pipelines
  private updatePipeline?: GPUComputePipeline;
  private emitPipeline?: GPUComputePipeline;

  // Render Pipeline
  private renderPipeline?: GPURenderPipeline;

  // Bind Groups
  private updateBindGroup?: GPUBindGroup;
  private emitBindGroup?: GPUBindGroup;
  private renderBindGroup0?: GPUBindGroup;
  private renderBindGroup1?: GPUBindGroup;

  // VP Matrix buffer (updated per frame)
  private vpMatrixBuffer?: GPUBuffer;

  // Texture for rendering
  private texture?: Texture;
  private defaultTexture?: GPUTexture;
  private sampler?: GPUSampler;

  // Blend mode
  private blendMode: ParticleBlendMode;

  // Simulation state
  private emissionAccumulator: number = 0;
  private totalTime: number = 0;

  constructor(
    device: GPUDevice,
    format: GPUTextureFormat,
    maxParticles: number,
    texture?: Texture,
    blendMode: ParticleBlendMode = "normal" as ParticleBlendMode
  ) {
    this.device = device;
    this.format = format;
    this.maxParticles = maxParticles;
    this.texture = texture;
    this.blendMode = blendMode;
  }

  /**
   * Initialize GPU resources
   */
  async initialize(): Promise<void> {
    // Create particle buffer (128 bytes per particle)
    const particleSize = 128; // Must match WGSL Particle struct size
    this.particleBuffer = this.device.createBuffer({
      size: particleSize * this.maxParticles,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
      label: "Particle Buffer",
    });

    // Initialize particles as dead
    const initialData = new Float32Array(particleSize / 4 * this.maxParticles);
    for (let i = 0; i < this.maxParticles; i++) {
      const offset = (particleSize / 4) * i;
      initialData[offset + 24] = 0.0; // alive = 0.0 (dead)
    }
    this.device.queue.writeBuffer(this.particleBuffer, 0, initialData);

    // Create emitter config buffer (must match EmitterConfig struct)
    this.emitterConfigBuffer = this.device.createBuffer({
      size: 256, // Generous size for all config data
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
      label: "Emitter Config Buffer",
    });

    // Create simulation uniform buffer
    this.simulationUniformBuffer = this.device.createBuffer({
      size: 16, // 4 floats/uints (deltaTime, time, particleCount, emitCount)
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
      label: "Simulation Uniform Buffer",
    });

    // Create default white texture if no texture provided
    if (!this.texture) {
      this.defaultTexture = this.device.createTexture({
        size: { width: 1, height: 1 },
        format: "rgba8unorm",
        usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST,
      });
      const whitePixel = new Uint8Array([255, 255, 255, 255]);
      this.device.queue.writeTexture(
        { texture: this.defaultTexture },
        whitePixel,
        { bytesPerRow: 4 },
        { width: 1, height: 1 }
      );
    }

    // Create sampler
    this.sampler = this.device.createSampler({
      magFilter: "linear",
      minFilter: "linear",
    });

    // Create compute pipelines
    try {
      await this.createComputePipelines();
    } catch (error) {
      console.error("Failed to create particle compute pipelines:", error);
      throw error;
    }

    // Create render pipeline
    try {
      await this.createRenderPipeline();
    } catch (error) {
      console.error("Failed to create particle render pipeline:", error);
      throw error;
    }

    // Create bind groups
    try {
      this.createBindGroups();
    } catch (error) {
      console.error("Failed to create particle bind groups:", error);
      throw error;
    }
  }

  /**
   * Create compute pipelines for update and emit
   */
  private async createComputePipelines(): Promise<void> {
    // Combine common code with update shader
    const updateShaderCode = particleCommonShader + "\n" + particleUpdateShader;
    const updateModule = this.device.createShaderModule({
      label: "Particle Update Shader",
      code: updateShaderCode,
    });

    // Check for shader compilation errors
    const updateCompilationInfo = await updateModule.getCompilationInfo();
    for (const message of updateCompilationInfo.messages) {
      if (message.type === "error") {
        console.error("Particle update shader error:", message);
      }
    }

    this.updatePipeline = this.device.createComputePipeline({
      label: "Particle Update Pipeline",
      layout: "auto",
      compute: {
        module: updateModule,
        entryPoint: "main",
      },
    });

    // Combine common code with emit shader
    const emitShaderCode = particleCommonShader + "\n" + particleEmitShader;
    const emitModule = this.device.createShaderModule({
      label: "Particle Emit Shader",
      code: emitShaderCode,
    });

    // Check for shader compilation errors
    const emitCompilationInfo = await emitModule.getCompilationInfo();
    for (const message of emitCompilationInfo.messages) {
      if (message.type === "error") {
        console.error("Particle emit shader error:", message);
      }
    }

    this.emitPipeline = this.device.createComputePipeline({
      label: "Particle Emit Pipeline",
      layout: "auto",
      compute: {
        module: emitModule,
        entryPoint: "main",
      },
    });
  }

  /**
   * Create render pipeline for particle rendering
   */
  private async createRenderPipeline(): Promise<void> {
    // Combine common code with render shader (same as compute shaders!)
    const renderShaderCode = particleCommonShader + "\n" + particleRenderShader;
    const shaderModule = this.device.createShaderModule({
      label: "Particle Render Shader",
      code: renderShaderCode,
    });

    // Check for shader compilation errors
    const compilationInfo = await shaderModule.getCompilationInfo();
    for (const message of compilationInfo.messages) {
      if (message.type === "error") {
        console.error("Particle render shader error:", message);
      }
    }

    // Determine blend mode
    let blend: GPUBlendState | undefined;
    switch (this.blendMode) {
      case "additive":
        blend = {
          color: {
            srcFactor: "src-alpha",
            dstFactor: "one",
            operation: "add",
          },
          alpha: {
            srcFactor: "one",
            dstFactor: "one",
            operation: "add",
          },
        };
        break;
      case "multiply":
        blend = {
          color: {
            srcFactor: "dst-color",
            dstFactor: "zero",
            operation: "add",
          },
          alpha: {
            srcFactor: "one",
            dstFactor: "one-minus-src-alpha",
            operation: "add",
          },
        };
        break;
      default: // normal
        blend = {
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

    this.renderPipeline = this.device.createRenderPipeline({
      label: "Particle Render Pipeline",
      layout: "auto",
      vertex: {
        module: shaderModule,
        entryPoint: "vertexMain",
      },
      fragment: {
        module: shaderModule,
        entryPoint: "fragmentMain",
        targets: [
          {
            format: this.format,
            blend,
          },
        ],
      },
      primitive: {
        topology: "triangle-list",
      },
    });
  }

  /**
   * Create bind groups for all pipelines
   */
  private createBindGroups(): void {
    if (!this.updatePipeline || !this.emitPipeline || !this.renderPipeline) {
      throw new Error("Pipelines not created");
    }

    // Bind group for update and emit (same layout)
    this.updateBindGroup = this.device.createBindGroup({
      layout: this.updatePipeline.getBindGroupLayout(0),
      entries: [
        { binding: 0, resource: { buffer: this.particleBuffer! } },
        { binding: 1, resource: { buffer: this.emitterConfigBuffer! } },
        { binding: 2, resource: { buffer: this.simulationUniformBuffer! } },
      ],
    });

    this.emitBindGroup = this.device.createBindGroup({
      layout: this.emitPipeline.getBindGroupLayout(0),
      entries: [
        { binding: 0, resource: { buffer: this.particleBuffer! } },
        { binding: 1, resource: { buffer: this.emitterConfigBuffer! } },
        { binding: 2, resource: { buffer: this.simulationUniformBuffer! } },
      ],
    });

    // Create VP matrix buffer
    this.vpMatrixBuffer = this.device.createBuffer({
      size: 64, // mat4x4<f32>
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
      label: "Particle VP Matrix",
    });

    // Bind group 0 for render (particle buffer + VP matrix)
    this.renderBindGroup0 = this.device.createBindGroup({
      layout: this.renderPipeline.getBindGroupLayout(0),
      entries: [
        { binding: 0, resource: { buffer: this.particleBuffer! } },
        { binding: 1, resource: { buffer: this.vpMatrixBuffer } },
      ],
    });

    // Bind group 1 for render (texture + sampler)
    const textureView = this.texture
      ? this.texture.view!
      : this.defaultTexture!.createView();

    this.renderBindGroup1 = this.device.createBindGroup({
      layout: this.renderPipeline.getBindGroupLayout(1),
      entries: [
        { binding: 0, resource: textureView },
        { binding: 1, resource: this.sampler! },
      ],
    });
  }


  /**
   * Update emitter configuration
   */
  updateEmitterConfig(config: GPUEmitterConfig): void {
    if (!this.emitterConfigBuffer) return;

    // Pack config into Float32Array (must match WGSL struct layout)
    const data = new Float32Array(64); // 256 bytes / 4
    let offset = 0;

    // position (vec3f) + emissionRate (f32) = 4 floats
    data.set(config.position, offset);
    data[offset + 3] = config.emissionRate;
    offset += 4;

    // gravity (vec3f) + drag (f32) = 4 floats
    data.set(config.gravity, offset);
    data[offset + 3] = config.drag;
    offset += 4;

    // windForce (vec3f) + padding = 4 floats
    data.set(config.windForce, offset);
    offset += 4;

    // lifetimeMin, lifetimeMax, padding, padding = 4 floats
    data[offset] = config.lifetimeMin;
    data[offset + 1] = config.lifetimeMax;
    offset += 4;

    // velocityMin (vec3f) + padding = 4 floats
    data.set(config.velocityMin, offset);
    offset += 4;

    // velocityMax (vec3f) + padding = 4 floats
    data.set(config.velocityMax, offset);
    offset += 4;

    // startSizeMin, startSizeMax, endSizeMin, endSizeMax = 4 floats
    data[offset] = config.startSizeMin;
    data[offset + 1] = config.startSizeMax;
    data[offset + 2] = config.endSizeMin;
    data[offset + 3] = config.endSizeMax;
    offset += 4;

    // rotationSpeedMin, rotationSpeedMax, padding, padding = 4 floats
    data[offset] = config.rotationSpeedMin;
    data[offset + 1] = config.rotationSpeedMax;
    offset += 4;

    // startColorMin (vec4f) = 4 floats
    data.set(config.startColorMin, offset);
    offset += 4;

    // startColorMax (vec4f) = 4 floats
    data.set(config.startColorMax, offset);
    offset += 4;

    // endColorMin (vec4f) = 4 floats
    data.set(config.endColorMin, offset);
    offset += 4;

    // endColorMax (vec4f) = 4 floats
    data.set(config.endColorMax, offset);
    offset += 4;

    this.device.queue.writeBuffer(this.emitterConfigBuffer, 0, data);
  }

  /**
   * Update particle system (dispatch compute shaders)
   */
  update(deltaTime: number, emissionRate: number, enabled: boolean): void {
    if (!this.updatePipeline || !this.emitPipeline) return;

    this.totalTime += deltaTime;

    // Calculate particles to emit this frame
    let emitCount = 0;
    if (enabled) {
      this.emissionAccumulator += emissionRate * deltaTime;
      emitCount = Math.floor(this.emissionAccumulator);
      this.emissionAccumulator -= emitCount;
      emitCount = Math.min(emitCount, this.maxParticles); // Cap at max
    }

    // Update simulation uniforms
    const simData = new Float32Array(4);
    simData[0] = deltaTime;
    simData[1] = this.totalTime;
    simData[2] = this.maxParticles;
    simData[3] = emitCount;
    this.device.queue.writeBuffer(this.simulationUniformBuffer!, 0, simData);

    // Create command encoder
    const commandEncoder = this.device.createCommandEncoder();

    // Dispatch update compute shader
    const updatePass = commandEncoder.beginComputePass();
    updatePass.setPipeline(this.updatePipeline);
    updatePass.setBindGroup(0, this.updateBindGroup!);
    const workgroupsUpdate = Math.ceil(this.maxParticles / 64);
    updatePass.dispatchWorkgroups(workgroupsUpdate);
    updatePass.end();

    // Dispatch emit compute shader (if emitting)
    if (emitCount > 0) {
      const emitPass = commandEncoder.beginComputePass();
      emitPass.setPipeline(this.emitPipeline);
      emitPass.setBindGroup(0, this.emitBindGroup!);
      const workgroupsEmit = Math.ceil(this.maxParticles / 64);
      emitPass.dispatchWorkgroups(workgroupsEmit);
      emitPass.end();
    }

    // Submit commands
    this.device.queue.submit([commandEncoder.finish()]);
  }

  /**
   * Render particles
   */
  render(renderPass: GPURenderPassEncoder, vpMatrix: Float32Array): void {
    if (!this.renderPipeline || !this.renderBindGroup0 || !this.renderBindGroup1 || !this.vpMatrixBuffer) {
      return;
    }

    // Update VP matrix buffer
    this.device.queue.writeBuffer(this.vpMatrixBuffer, 0, vpMatrix);

    // Set pipeline and bind groups
    renderPass.setPipeline(this.renderPipeline);
    renderPass.setBindGroup(0, this.renderBindGroup0);
    renderPass.setBindGroup(1, this.renderBindGroup1);

    // Draw all particles (6 vertices per quad, maxParticles instances)
    renderPass.draw(6, this.maxParticles, 0, 0);
  }

  /**
   * Destroy GPU resources
   */
  destroy(): void {
    this.particleBuffer?.destroy();
    this.emitterConfigBuffer?.destroy();
    this.simulationUniformBuffer?.destroy();
    this.vpMatrixBuffer?.destroy();
    this.defaultTexture?.destroy();
  }
}
