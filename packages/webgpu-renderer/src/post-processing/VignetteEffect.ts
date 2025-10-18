import { PostProcessEffect } from "./PostProcessEffect";
import { FullscreenQuad } from "./FullscreenQuad";
import vignetteShader from "../renderer/shaders/post-processing/vignette.wgsl?raw";

/**
 * Vignette effect - darkens the corners of the screen
 */
export class VignetteEffect extends PostProcessEffect {
  private pipeline?: GPURenderPipeline;
  private bindGroupLayout?: GPUBindGroupLayout;
  private uniformBuffer?: GPUBuffer;
  private sampler?: GPUSampler;
  private fullscreenQuad?: FullscreenQuad;

  public intensity: number; // 0 = none, 1 = black corners
  public smoothness: number; // Higher = smoother falloff

  constructor(config: { intensity?: number; smoothness?: number; order?: number } = {}) {
    super(config.order ?? 0);

    this.intensity = config.intensity ?? 0.5;
    this.smoothness = config.smoothness ?? 0.5;

    this.setProperty("intensity", this.intensity);
    this.setProperty("smoothness", this.smoothness);
  }

  initialize(device: GPUDevice, format: GPUTextureFormat): void {
    // Create fullscreen quad
    this.fullscreenQuad = new FullscreenQuad(device);

    // Create sampler
    this.sampler = device.createSampler({
      magFilter: "linear",
      minFilter: "linear",
    });

    // Create shader module
    const shaderModule = device.createShaderModule({
      label: "Vignette Shader",
      code: vignetteShader,
    });

    // Create pipeline
    this.pipeline = device.createRenderPipeline({
      label: "Vignette Pipeline",
      layout: "auto",
      vertex: {
        module: shaderModule,
        entryPoint: "vertexMain",
        buffers: [FullscreenQuad.getVertexBufferLayout()],
      },
      fragment: {
        module: shaderModule,
        entryPoint: "fragmentMain",
        targets: [{ format }],
      },
      primitive: {
        topology: "triangle-list",
      },
    });

    this.bindGroupLayout = this.pipeline.getBindGroupLayout(0);

    // Create uniform buffer
    this.uniformBuffer = device.createBuffer({
      size: 16, // vec4f
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
      label: "Vignette Uniforms",
    });
  }

  apply(
    device: GPUDevice,
    commandEncoder: GPUCommandEncoder,
    sourceTexture: GPUTexture,
    destinationTexture: GPUTexture,
    width: number,
    height: number
  ): void {
    if (!this.pipeline || !this.uniformBuffer || !this.fullscreenQuad || !this.sampler) {
      throw new Error("VignetteEffect not initialized");
    }

    // Update properties
    this.intensity = this.getProperty("intensity") ?? this.intensity;
    this.smoothness = this.getProperty("smoothness") ?? this.smoothness;

    // Update uniforms
    const uniformData = new Float32Array(4);
    uniformData[0] = this.intensity;
    uniformData[1] = this.smoothness;
    uniformData[2] = 0; // padding
    uniformData[3] = 0; // padding
    device.queue.writeBuffer(this.uniformBuffer, 0, uniformData);

    // Create bind group
    const bindGroup = device.createBindGroup({
      layout: this.bindGroupLayout!,
      entries: [
        { binding: 0, resource: { buffer: this.uniformBuffer } },
        { binding: 1, resource: this.sampler },
        { binding: 2, resource: sourceTexture.createView() },
      ],
    });

    // Render pass
    const renderPass = commandEncoder.beginRenderPass({
      colorAttachments: [
        {
          view: destinationTexture.createView(),
          loadOp: "clear",
          storeOp: "store",
          clearValue: { r: 0, g: 0, b: 0, a: 1 },
        },
      ],
    });

    renderPass.setPipeline(this.pipeline);
    renderPass.setBindGroup(0, bindGroup);
    this.fullscreenQuad.draw(renderPass);
    renderPass.end();
  }

  destroy(): void {
    this.uniformBuffer?.destroy();
    this.fullscreenQuad?.destroy();
  }
}
