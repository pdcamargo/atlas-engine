import { mat4 } from "gl-matrix";
import { Color } from "@atlas/core";
import { Effect, EffectContext } from "./Effect";
import { Sprite } from "../renderer/Sprite";
import { Texture } from "../renderer/Texture";
import { Shader } from "../materials/Shader";
import outlineShaderCode from "../renderer/shaders/effects/outline.wgsl?raw";

/**
 * Outline effect shader (singleton)
 */
const OUTLINE_SHADER = new Shader({
  name: "Outline",
  vertexCode: outlineShaderCode,
  fragmentCode: outlineShaderCode,
  uniforms: [
    { name: "mvpMatrix", type: "mat4x4f", size: 64, offset: 0 },
    { name: "frame", type: "vec4f", size: 16, offset: 64 },
    { name: "outlineColor", type: "vec4f", size: 16, offset: 80 },
    { name: "outlineThickness", type: "f32", size: 4, offset: 96 },
    // Padding to align to 16 bytes = 12 bytes
  ],
});

/**
 * OutlineEffect - Renders an outline around sprites
 * The outline renders BEHIND the sprite (use negative order)
 */
export class OutlineEffect extends Effect {
  private pipeline?: GPURenderPipeline;
  private bindGroupLayout?: GPUBindGroupLayout;
  private uniformBuffer?: GPUBuffer;
  private textureViewCache = new Map<string, GPUTextureView>();

  public outlineColor: Color;
  public outlineThickness: number;

  constructor(config: { color?: Color; thickness?: number; order?: number } = {}) {
    super(config.order ?? -1); // Default: render before sprite

    this.outlineColor = config.color || new Color(1, 1, 1, 1);
    this.outlineThickness = config.thickness ?? 0.05;

    // Store in properties for easy access
    this.setProperty("outlineColor", this.outlineColor);
    this.setProperty("outlineThickness", this.outlineThickness);
  }

  /**
   * Get or create the render pipeline
   */
  private getPipeline(device: GPUDevice, format: GPUTextureFormat, bufferLayouts: GPUVertexBufferLayout[]): GPURenderPipeline {
    if (!this.pipeline) {
      const vertexModule = OUTLINE_SHADER.getVertexModule(device);
      const fragmentModule = OUTLINE_SHADER.getFragmentModule(device);

      this.pipeline = device.createRenderPipeline({
        label: "Outline Effect Pipeline",
        layout: "auto",
        vertex: {
          module: vertexModule,
          entryPoint: "vertexMain",
          buffers: bufferLayouts,
        },
        fragment: {
          module: fragmentModule,
          entryPoint: "fragmentMain",
          targets: [
            {
              format,
              blend: {
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
              },
            },
          ],
        },
        primitive: {
          topology: "triangle-list",
        },
      });

      this.bindGroupLayout = this.pipeline.getBindGroupLayout(0);

      // Debug: log the expected buffer size
      console.log('[OutlineEffect] Bind group layout created');
    }

    return this.pipeline;
  }

  /**
   * Get or create texture view
   */
  private getOrCreateTextureView(texture: Texture): GPUTextureView {
    if (!this.textureViewCache.has(texture.id)) {
      this.textureViewCache.set(texture.id, texture.gpuTexture.createView());
    }
    return this.textureViewCache.get(texture.id)!;
  }

  /**
   * Render the outline effect for a sprite
   */
  render(sprite: Sprite, context: EffectContext): void {
    const texture = sprite.getTexture();
    if (!texture) return; // Skip if texture not loaded

    // Get or create pipeline
    const pipeline = this.getPipeline(
      context.device,
      context.format,
      context.quadBuffers.bufferLayouts
    );

    // Update property references
    this.outlineColor = this.getProperty("outlineColor") || this.outlineColor;
    this.outlineThickness = this.getProperty("outlineThickness") ?? this.outlineThickness;

    // Compute MVP matrix
    const modelMatrix = sprite.getWorldMatrix();
    const scaledModel = mat4.create();
    mat4.copy(scaledModel, modelMatrix);
    scaledModel[0] *= sprite.width;
    scaledModel[5] *= sprite.height;

    const mvpMatrix = mat4.create();
    mat4.multiply(mvpMatrix, context.vpMatrix, scaledModel);

    // Prepare uniform data
    // Struct: mat4x4<f32> (64) + vec4f (16) + vec4f (16) + vec4f (16) = 112 bytes
    const uniformData = new Float32Array(28); // 112 bytes / 4 = 28 floats
    uniformData.set(mvpMatrix, 0); // 0-15: mvpMatrix
    uniformData.set(sprite.frame.data, 16); // 16-19: frame
    uniformData.set(this.outlineColor.data, 20); // 20-23: outlineColor
    uniformData[24] = this.outlineThickness; // 24: params.x (thickness)
    uniformData[25] = 0; // params.y (unused)
    uniformData[26] = 0; // params.z (unused)
    uniformData[27] = 0; // params.w (unused)

    // Create or update uniform buffer
    if (!this.uniformBuffer) {
      this.uniformBuffer = context.device.createBuffer({
        size: 112,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        label: "Outline Effect Uniforms",
      });
    }

    context.device.queue.writeBuffer(this.uniformBuffer, 0, uniformData.buffer);

    // Create bind group
    // Note: Not specifying size lets WebGPU use the entire buffer
    const bindGroup = context.device.createBindGroup({
      layout: this.bindGroupLayout!,
      entries: [
        { binding: 0, resource: { buffer: this.uniformBuffer } },
        { binding: 1, resource: texture.sampler },
        { binding: 2, resource: this.getOrCreateTextureView(texture) },
      ],
    });

    // Draw
    context.renderPass.setPipeline(pipeline);
    context.renderPass.setBindGroup(0, bindGroup);

    for (let i = 0; i < context.quadBuffers.bufferLayouts.length; i++) {
      context.renderPass.setVertexBuffer(i, context.quadBuffers.buffers[i]);
    }

    if (context.quadBuffers.indexBuffer) {
      context.renderPass.setIndexBuffer(
        context.quadBuffers.indexBuffer,
        context.quadBuffers.indexFormat!
      );
      context.renderPass.drawIndexed(context.quadBuffers.numElements);
    } else {
      context.renderPass.draw(context.quadBuffers.numElements);
    }
  }
}
