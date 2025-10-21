import { mat4 } from "gl-matrix";
import { Color } from "@atlas/core";
import { Effect } from "./Effect";
import { Shader } from "../materials/Shader";
import distortionShaderCode from "../renderer/shaders/effects/distortion.wgsl?raw";
/**
 * Distortion types
 */
export var DistortionType;
(function (DistortionType) {
    DistortionType[DistortionType["Horizontal"] = 0] = "Horizontal";
    DistortionType[DistortionType["Vertical"] = 1] = "Vertical";
    DistortionType[DistortionType["Radial"] = 2] = "Radial";
})(DistortionType || (DistortionType = {}));
/**
 * Distortion effect shader (singleton)
 */
const DISTORTION_SHADER = new Shader({
    name: "Distortion",
    vertexCode: distortionShaderCode,
    fragmentCode: distortionShaderCode,
    uniforms: [
        { name: "mvpMatrix", type: "mat4x4f", size: 64, offset: 0 },
        { name: "frame", type: "vec4f", size: 16, offset: 64 },
        { name: "tint", type: "vec4f", size: 16, offset: 80 },
        { name: "waveFrequency", type: "f32", size: 4, offset: 96 },
        { name: "waveAmplitude", type: "f32", size: 4, offset: 100 },
        { name: "time", type: "f32", size: 4, offset: 104 },
        { name: "distortionType", type: "f32", size: 4, offset: 108 },
    ],
});
/**
 * DistortionEffect - Applies wave distortion to sprites
 * Distorts the sprite's UVs to create wave effects
 */
export class DistortionEffect extends Effect {
    pipeline;
    bindGroupLayout;
    uniformBuffer;
    textureViewCache = new Map();
    waveFrequency;
    waveAmplitude;
    time = 0;
    distortionType;
    tint;
    constructor(config = {}) {
        super(config.order ?? 0); // Default: render at same level as sprite
        this.waveFrequency = config.frequency ?? 10.0;
        this.waveAmplitude = config.amplitude ?? 0.02;
        this.distortionType = config.type ?? DistortionType.Horizontal;
        this.tint = config.tint || Color.white();
        // Store in properties
        this.setProperty("waveFrequency", this.waveFrequency);
        this.setProperty("waveAmplitude", this.waveAmplitude);
        this.setProperty("time", this.time);
        this.setProperty("distortionType", this.distortionType);
        this.setProperty("tint", this.tint);
    }
    /**
     * Get or create the render pipeline
     */
    getPipeline(device, format, bufferLayouts) {
        if (!this.pipeline) {
            const vertexModule = DISTORTION_SHADER.getVertexModule(device);
            const fragmentModule = DISTORTION_SHADER.getFragmentModule(device);
            this.pipeline = device.createRenderPipeline({
                label: "Distortion Effect Pipeline",
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
     * Get or create texture view
     */
    getOrCreateTextureView(texture) {
        if (!this.textureViewCache.has(texture.id)) {
            this.textureViewCache.set(texture.id, texture.gpuTexture.createView());
        }
        return this.textureViewCache.get(texture.id);
    }
    /**
     * Render the distortion effect for a sprite
     */
    render(sprite, context) {
        const texture = sprite.getTexture();
        if (!texture)
            return;
        // Get or create pipeline
        const pipeline = this.getPipeline(context.device, context.format, context.quadBuffers.bufferLayouts);
        // Update property references
        this.waveFrequency = this.getProperty("waveFrequency") ?? this.waveFrequency;
        this.waveAmplitude = this.getProperty("waveAmplitude") ?? this.waveAmplitude;
        this.time = this.getProperty("time") ?? this.time;
        this.distortionType = this.getProperty("distortionType") ?? this.distortionType;
        this.tint = this.getProperty("tint") || this.tint;
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
        const uniformData = new Float32Array(28); // 112 bytes / 4
        uniformData.set(mvpMatrix, 0); // 0-15: mvpMatrix
        uniformData.set(sprite.frame.data, 16); // 16-19: frame
        uniformData.set(this.tint.data, 20); // 20-23: tint
        uniformData[24] = this.waveFrequency; // params.x
        uniformData[25] = this.waveAmplitude; // params.y
        uniformData[26] = this.time; // params.z
        uniformData[27] = this.distortionType; // params.w
        // Create or update uniform buffer
        if (!this.uniformBuffer) {
            this.uniformBuffer = context.device.createBuffer({
                size: 112,
                usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
                label: "Distortion Effect Uniforms",
            });
        }
        context.device.queue.writeBuffer(this.uniformBuffer, 0, uniformData.buffer);
        // Create bind group
        const bindGroup = context.device.createBindGroup({
            layout: this.bindGroupLayout,
            entries: [
                { binding: 0, resource: { buffer: this.uniformBuffer, size: 112 } },
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
            context.renderPass.setIndexBuffer(context.quadBuffers.indexBuffer, context.quadBuffers.indexFormat);
            context.renderPass.drawIndexed(context.quadBuffers.numElements);
        }
        else {
            context.renderPass.draw(context.quadBuffers.numElements);
        }
    }
}
