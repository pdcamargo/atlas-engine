import { mat4 } from "gl-matrix";
import { Color, Vector2, Vector2Like } from "@atlas/core";
import { Effect, EffectContext } from "./Effect";
import { Sprite } from "../renderer/Sprite";
import { Shader } from "../materials/Shader";
import shadowShaderCode from "../renderer/shaders/effects/shadow.wgsl?raw";

/**
 * Shadow effect shader (singleton)
 */
const SHADOW_SHADER = new Shader({
  name: "Shadow",
  vertexCode: shadowShaderCode,
  fragmentCode: shadowShaderCode,
  uniforms: [
    { name: "mvpMatrix", type: "mat4x4f", size: 64, offset: 0 },
    { name: "spriteSize", type: "vec4f", size: 16, offset: 64 },
    { name: "shadowColor", type: "vec4f", size: 16, offset: 80 },
    { name: "params", type: "vec4f", size: 16, offset: 96 },
  ],
});

/**
 * ShadowEffect - Renders a pixelated oval shadow beneath sprites
 * Perfect for 2D platformers and top-down games
 */
export class ShadowEffect extends Effect {
  private pipeline?: GPURenderPipeline;
  private bindGroupLayout?: GPUBindGroupLayout;
  private uniformBuffer?: GPUBuffer;

  public shadowColor: Color;
  public distance: number; // 0 = on ground, 1 = high above ground
  public offset: Vector2; // Shadow offset from sprite bottom-center
  public pixelation: number; // Pixelation factor (1 = no pixelation, higher = more pixelated)
  public scale: Vector2; // Shadow scale (x = width scale, y = height scale)

  constructor(
    config: {
      color?: Color;
      distance?: number;
      offset?: Vector2Like;
      pixelation?: number;
      scale?: Vector2Like;
      order?: number;
    } = {}
  ) {
    super(config.order ?? -10); // Default: render well before sprite

    this.shadowColor = config.color || new Color(0, 0, 0, 0.5); // Semi-transparent black
    this.distance = config.distance ?? 0.0; // On the ground by default
    this.offset = new Vector2(config.offset?.x ?? 0, config.offset?.y ?? 0);
    this.pixelation = config.pixelation ?? 8.0; // Pixelated by default
    this.scale = new Vector2(config.scale?.x ?? 0.4, config.scale?.y ?? 0.08); // Default: 40% width, 8% height

    // Store in properties
    this.setProperty("shadowColor", this.shadowColor);
    this.setProperty("distance", this.distance);
    this.setProperty("offset", this.offset);
    this.setProperty("pixelation", this.pixelation);
    this.setProperty("scale", this.scale);
  }

  /**
   * Set shadow distance from ground
   * @param distance 0 = on ground (large, opaque), 1 = high above (small, transparent)
   */
  setDistance(distance: number): void {
    this.distance = Math.max(0, Math.min(1, distance)); // Clamp to [0, 1]
    this.setProperty("distance", this.distance);
  }

  /**
   * Set shadow offset from sprite bottom-center
   */
  setOffset(offset: Vector2Like): void {
    this.offset.copyFrom(offset);
    this.setProperty("offset", this.offset);
  }

  /**
   * Set shadow scale
   * @param scale x = width scale (e.g., 0.4 = 40% of sprite width), y = height scale
   */
  setScale(scale: Vector2Like): void {
    this.scale.copyFrom(scale);
    this.setProperty("scale", this.scale);
  }

  /**
   * Get or create the render pipeline
   */
  private getPipeline(
    device: GPUDevice,
    format: GPUTextureFormat,
    bufferLayouts: GPUVertexBufferLayout[]
  ): GPURenderPipeline {
    if (!this.pipeline) {
      const vertexModule = SHADOW_SHADER.getVertexModule(device);
      const fragmentModule = SHADOW_SHADER.getFragmentModule(device);

      this.pipeline = device.createRenderPipeline({
        label: "Shadow Effect Pipeline",
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
    }

    return this.pipeline;
  }

  /**
   * Render the shadow effect for a sprite
   */
  render(sprite: Sprite, context: EffectContext): void {
    // Get or create pipeline
    const pipeline = this.getPipeline(
      context.device,
      context.format,
      context.quadBuffers.bufferLayouts
    );

    // Update property references
    this.shadowColor = this.getProperty("shadowColor") || this.shadowColor;
    this.distance = this.getProperty("distance") ?? this.distance;
    this.offset = this.getProperty("offset") || this.offset;
    this.pixelation = this.getProperty("pixelation") ?? this.pixelation;
    this.scale = this.getProperty("scale") || this.scale;

    // Compute MVP matrix
    const modelMatrix = sprite.getWorldMatrix();
    const scaledModel = mat4.create();
    mat4.copy(scaledModel, modelMatrix);
    scaledModel[0] *= sprite.width;
    scaledModel[5] *= sprite.height;

    const mvpMatrix = mat4.create();
    mat4.multiply(mvpMatrix, context.vpMatrix, scaledModel);

    // Prepare uniform data
    // Struct: mat4x4<f32> (64) + vec4f (16) + vec4f (16) + vec4f (16) + vec4f (16) = 128 bytes
    const uniformData = new Float32Array(32); // 128 bytes / 4
    uniformData.set(mvpMatrix, 0); // 0-15: mvpMatrix
    uniformData[16] = sprite.width; // spriteSize.x
    uniformData[17] = sprite.height; // spriteSize.y
    uniformData[18] = 0; // spriteSize.z (unused)
    uniformData[19] = 0; // spriteSize.w (unused)
    uniformData.set(this.shadowColor.data, 20); // 20-23: shadowColor
    uniformData[24] = this.distance; // params.x
    uniformData[25] = this.offset.x; // params.y
    uniformData[26] = this.offset.y; // params.z
    uniformData[27] = this.pixelation; // params.w
    uniformData[28] = this.scale.x; // scale.x
    uniformData[29] = this.scale.y; // scale.y
    uniformData[30] = 0; // scale.z (unused)
    uniformData[31] = 0; // scale.w (unused)

    // Create or update uniform buffer
    if (!this.uniformBuffer) {
      this.uniformBuffer = context.device.createBuffer({
        size: 128,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        label: "Shadow Effect Uniforms",
      });
    }

    context.device.queue.writeBuffer(this.uniformBuffer, 0, uniformData.buffer);

    // Create bind group
    const bindGroup = context.device.createBindGroup({
      layout: this.bindGroupLayout!,
      entries: [{ binding: 0, resource: { buffer: this.uniformBuffer } }],
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
