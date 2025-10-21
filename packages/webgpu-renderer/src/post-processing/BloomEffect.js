import { PostProcessEffect } from "./PostProcessEffect";
import { FullscreenQuad } from "./FullscreenQuad";
import bloomBrightPassShader from "../renderer/shaders/post-processing/bloom-bright-pass.wgsl?raw";
import bloomBlurShader from "../renderer/shaders/post-processing/bloom-blur.wgsl?raw";
import bloomCombineShader from "../renderer/shaders/post-processing/bloom-combine.wgsl?raw";
/**
 * Bloom effect - makes bright areas glow
 * This is a multi-pass effect:
 * 1. Extract bright pixels (bright pass)
 * 2. Blur horizontally
 * 3. Blur vertically
 * 4. Combine with original
 */
export class BloomEffect extends PostProcessEffect {
    // Pipelines for each pass
    brightPassPipeline;
    blurPipeline;
    combinePipeline;
    // Bind group layouts
    brightPassLayout;
    blurLayout;
    combineLayout;
    // Uniform buffers
    brightPassUniformBuffer;
    blurHorizontalUniformBuffer;
    blurVerticalUniformBuffer;
    combineUniformBuffer;
    // Shared resources
    sampler;
    fullscreenQuad;
    // Intermediate textures (reused across frames)
    brightTexture;
    blurHorizontalTexture;
    blurVerticalTexture;
    // Track texture dimensions to detect size changes
    textureWidth = 0;
    textureHeight = 0;
    // Effect parameters
    threshold; // Luminance threshold (0-1)
    intensity; // Bright pixel intensity multiplier
    bloomStrength; // Final bloom mix strength
    blurPasses; // Number of blur iterations (1-3 recommended)
    constructor(config = {}) {
        super(config.order ?? 0);
        this.threshold = config.threshold ?? 0.8;
        this.intensity = config.intensity ?? 1.5;
        this.bloomStrength = config.bloomStrength ?? 1.0;
        this.blurPasses = config.blurPasses ?? 2;
        this.setProperty("threshold", this.threshold);
        this.setProperty("intensity", this.intensity);
        this.setProperty("bloomStrength", this.bloomStrength);
        this.setProperty("blurPasses", this.blurPasses);
    }
    initialize(device, format) {
        // Create fullscreen quad
        this.fullscreenQuad = new FullscreenQuad(device);
        // Create sampler
        this.sampler = device.createSampler({
            magFilter: "linear",
            minFilter: "linear",
        });
        // Create shader modules
        const brightPassModule = device.createShaderModule({
            label: "Bloom Bright Pass Shader",
            code: bloomBrightPassShader,
        });
        const blurModule = device.createShaderModule({
            label: "Bloom Blur Shader",
            code: bloomBlurShader,
        });
        const combineModule = device.createShaderModule({
            label: "Bloom Combine Shader",
            code: bloomCombineShader,
        });
        // Create pipelines
        this.brightPassPipeline = device.createRenderPipeline({
            label: "Bloom Bright Pass Pipeline",
            layout: "auto",
            vertex: {
                module: brightPassModule,
                entryPoint: "vertexMain",
                buffers: [FullscreenQuad.getVertexBufferLayout()],
            },
            fragment: {
                module: brightPassModule,
                entryPoint: "fragmentMain",
                targets: [{ format }],
            },
            primitive: {
                topology: "triangle-list",
            },
        });
        this.blurPipeline = device.createRenderPipeline({
            label: "Bloom Blur Pipeline",
            layout: "auto",
            vertex: {
                module: blurModule,
                entryPoint: "vertexMain",
                buffers: [FullscreenQuad.getVertexBufferLayout()],
            },
            fragment: {
                module: blurModule,
                entryPoint: "fragmentMain",
                targets: [{ format }],
            },
            primitive: {
                topology: "triangle-list",
            },
        });
        this.combinePipeline = device.createRenderPipeline({
            label: "Bloom Combine Pipeline",
            layout: "auto",
            vertex: {
                module: combineModule,
                entryPoint: "vertexMain",
                buffers: [FullscreenQuad.getVertexBufferLayout()],
            },
            fragment: {
                module: combineModule,
                entryPoint: "fragmentMain",
                targets: [{ format }],
            },
            primitive: {
                topology: "triangle-list",
            },
        });
        // Get bind group layouts
        this.brightPassLayout = this.brightPassPipeline.getBindGroupLayout(0);
        this.blurLayout = this.blurPipeline.getBindGroupLayout(0);
        this.combineLayout = this.combinePipeline.getBindGroupLayout(0);
        // Create uniform buffers
        this.brightPassUniformBuffer = device.createBuffer({
            size: 16, // vec4f (threshold, intensity, padding)
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
            label: "Bloom Bright Pass Uniforms",
        });
        this.blurHorizontalUniformBuffer = device.createBuffer({
            size: 16, // vec4f (direction.xy, texelSize.xy)
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
            label: "Bloom Blur Horizontal Uniforms",
        });
        this.blurVerticalUniformBuffer = device.createBuffer({
            size: 16, // vec4f (direction.xy, texelSize.xy)
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
            label: "Bloom Blur Vertical Uniforms",
        });
        this.combineUniformBuffer = device.createBuffer({
            size: 16, // vec4f (bloomStrength, padding)
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
            label: "Bloom Combine Uniforms",
        });
    }
    apply(device, commandEncoder, sourceTexture, destinationTexture, width, height) {
        if (!this.brightPassPipeline ||
            !this.blurPipeline ||
            !this.combinePipeline ||
            !this.brightPassUniformBuffer ||
            !this.blurHorizontalUniformBuffer ||
            !this.blurVerticalUniformBuffer ||
            !this.combineUniformBuffer ||
            !this.fullscreenQuad ||
            !this.sampler) {
            throw new Error("BloomEffect not initialized");
        }
        // Update properties
        this.threshold = this.getProperty("threshold") ?? this.threshold;
        this.intensity = this.getProperty("intensity") ?? this.intensity;
        this.bloomStrength = this.getProperty("bloomStrength") ?? this.bloomStrength;
        this.blurPasses = this.getProperty("blurPasses") ?? this.blurPasses;
        // Create or recreate intermediate textures if size changed
        if (this.textureWidth !== width || this.textureHeight !== height) {
            // Destroy old textures
            this.brightTexture?.destroy();
            this.blurHorizontalTexture?.destroy();
            this.blurVerticalTexture?.destroy();
            // Create new textures with current size
            this.brightTexture = device.createTexture({
                size: { width, height },
                format: sourceTexture.format,
                usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING,
                label: "Bloom Bright Texture",
            });
            this.blurHorizontalTexture = device.createTexture({
                size: { width, height },
                format: sourceTexture.format,
                usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING,
                label: "Bloom Blur Horizontal Texture",
            });
            this.blurVerticalTexture = device.createTexture({
                size: { width, height },
                format: sourceTexture.format,
                usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING,
                label: "Bloom Blur Vertical Texture",
            });
            this.textureWidth = width;
            this.textureHeight = height;
        }
        // Validate textures exist
        if (!this.brightTexture || !this.blurHorizontalTexture || !this.blurVerticalTexture) {
            throw new Error("Bloom intermediate textures not created");
        }
        // === PASS 1: Extract bright pixels ===
        const brightPassUniforms = new Float32Array(4);
        brightPassUniforms[0] = this.threshold;
        brightPassUniforms[1] = this.intensity;
        device.queue.writeBuffer(this.brightPassUniformBuffer, 0, brightPassUniforms);
        const brightPassBindGroup = device.createBindGroup({
            layout: this.brightPassLayout,
            entries: [
                { binding: 0, resource: { buffer: this.brightPassUniformBuffer } },
                { binding: 1, resource: this.sampler },
                { binding: 2, resource: sourceTexture.createView() },
            ],
        });
        const brightPass = commandEncoder.beginRenderPass({
            colorAttachments: [
                {
                    view: this.brightTexture.createView(),
                    loadOp: "clear",
                    storeOp: "store",
                    clearValue: { r: 0, g: 0, b: 0, a: 1 },
                },
            ],
        });
        brightPass.setPipeline(this.brightPassPipeline);
        brightPass.setBindGroup(0, brightPassBindGroup);
        this.fullscreenQuad.draw(brightPass);
        brightPass.end();
        // === PASS 2 & 3: Blur passes (repeated based on blurPasses) ===
        let blurInput = this.brightTexture;
        let blurOutput = this.blurHorizontalTexture;
        for (let i = 0; i < this.blurPasses; i++) {
            // Horizontal blur
            const blurHorizontalUniforms = new Float32Array(4);
            blurHorizontalUniforms[0] = 1.0; // direction.x
            blurHorizontalUniforms[1] = 0.0; // direction.y
            blurHorizontalUniforms[2] = 1.0 / width; // texelSize.x
            blurHorizontalUniforms[3] = 1.0 / height; // texelSize.y
            device.queue.writeBuffer(this.blurHorizontalUniformBuffer, 0, blurHorizontalUniforms);
            const blurHorizontalBindGroup = device.createBindGroup({
                layout: this.blurLayout,
                entries: [
                    { binding: 0, resource: { buffer: this.blurHorizontalUniformBuffer } },
                    { binding: 1, resource: this.sampler },
                    { binding: 2, resource: blurInput.createView() },
                ],
            });
            const blurHorizontalPass = commandEncoder.beginRenderPass({
                colorAttachments: [
                    {
                        view: blurOutput.createView(),
                        loadOp: "clear",
                        storeOp: "store",
                        clearValue: { r: 0, g: 0, b: 0, a: 1 },
                    },
                ],
            });
            blurHorizontalPass.setPipeline(this.blurPipeline);
            blurHorizontalPass.setBindGroup(0, blurHorizontalBindGroup);
            this.fullscreenQuad.draw(blurHorizontalPass);
            blurHorizontalPass.end();
            // Vertical blur
            const blurVerticalUniforms = new Float32Array(4);
            blurVerticalUniforms[0] = 0.0; // direction.x
            blurVerticalUniforms[1] = 1.0; // direction.y
            blurVerticalUniforms[2] = 1.0 / width; // texelSize.x
            blurVerticalUniforms[3] = 1.0 / height; // texelSize.y
            device.queue.writeBuffer(this.blurVerticalUniformBuffer, 0, blurVerticalUniforms);
            const blurVerticalBindGroup = device.createBindGroup({
                layout: this.blurLayout,
                entries: [
                    { binding: 0, resource: { buffer: this.blurVerticalUniformBuffer } },
                    { binding: 1, resource: this.sampler },
                    { binding: 2, resource: blurOutput.createView() },
                ],
            });
            const blurVerticalPass = commandEncoder.beginRenderPass({
                colorAttachments: [
                    {
                        view: this.blurVerticalTexture.createView(),
                        loadOp: "clear",
                        storeOp: "store",
                        clearValue: { r: 0, g: 0, b: 0, a: 1 },
                    },
                ],
            });
            blurVerticalPass.setPipeline(this.blurPipeline);
            blurVerticalPass.setBindGroup(0, blurVerticalBindGroup);
            this.fullscreenQuad.draw(blurVerticalPass);
            blurVerticalPass.end();
            // For next iteration, use vertical output as input
            blurInput = this.blurVerticalTexture;
            blurOutput = this.blurHorizontalTexture;
        }
        // === PASS 4: Combine with original ===
        const combineUniforms = new Float32Array(4);
        combineUniforms[0] = this.bloomStrength;
        device.queue.writeBuffer(this.combineUniformBuffer, 0, combineUniforms);
        const combineBindGroup = device.createBindGroup({
            layout: this.combineLayout,
            entries: [
                { binding: 0, resource: { buffer: this.combineUniformBuffer } },
                { binding: 1, resource: this.sampler },
                { binding: 2, resource: sourceTexture.createView() },
                { binding: 3, resource: this.blurVerticalTexture.createView() },
            ],
        });
        const combinePass = commandEncoder.beginRenderPass({
            colorAttachments: [
                {
                    view: destinationTexture.createView(),
                    loadOp: "clear",
                    storeOp: "store",
                    clearValue: { r: 0, g: 0, b: 0, a: 1 },
                },
            ],
        });
        combinePass.setPipeline(this.combinePipeline);
        combinePass.setBindGroup(0, combineBindGroup);
        this.fullscreenQuad.draw(combinePass);
        combinePass.end();
        // Don't destroy textures - we reuse them across frames!
    }
    destroy() {
        this.brightPassUniformBuffer?.destroy();
        this.blurHorizontalUniformBuffer?.destroy();
        this.blurVerticalUniformBuffer?.destroy();
        this.combineUniformBuffer?.destroy();
        this.fullscreenQuad?.destroy();
        // Clean up intermediate textures
        this.brightTexture?.destroy();
        this.blurHorizontalTexture?.destroy();
        this.blurVerticalTexture?.destroy();
    }
}
