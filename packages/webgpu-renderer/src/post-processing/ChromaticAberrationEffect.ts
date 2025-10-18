import { PostProcessEffect } from "./PostProcessEffect";
import { FullscreenQuad } from "./FullscreenQuad";
import chromaticAberrationShader from "../renderer/shaders/post-processing/chromatic-aberration.wgsl?raw";

/**
 * Chromatic Aberration effect - splits RGB channels for a retro/glitch effect
 */
export class ChromaticAberrationEffect extends PostProcessEffect {
  private pipeline?: GPURenderPipeline;
  private bindGroupLayout?: GPUBindGroupLayout;
  private uniformBuffer?: GPUBuffer;
  private sampler?: GPUSampler;
  private fullscreenQuad?: FullscreenQuad;

  public offset: number; // How much to offset RGB channels

  constructor(config: { offset?: number; order?: number } = {}) {
    super(config.order ?? 0);

    this.offset = config.offset ?? 0.002;

    this.setProperty("offset", this.offset);
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
      label: "Chromatic Aberration Shader",
      code: chromaticAberrationShader,
    });

    // Create pipeline
    this.pipeline = device.createRenderPipeline({
      label: "Chromatic Aberration Pipeline",
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
      label: "Chromatic Aberration Uniforms",
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
      throw new Error("ChromaticAberrationEffect not initialized");
    }

    // Update properties
    this.offset = this.getProperty("offset") ?? this.offset;

    // Update uniforms
    const uniformData = new Float32Array(4);
    uniformData[0] = this.offset;
    uniformData[1] = 0; // padding
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
