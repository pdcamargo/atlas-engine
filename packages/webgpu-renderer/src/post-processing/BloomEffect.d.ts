import { PostProcessEffect } from "./PostProcessEffect";
/**
 * Bloom effect - makes bright areas glow
 * This is a multi-pass effect:
 * 1. Extract bright pixels (bright pass)
 * 2. Blur horizontally
 * 3. Blur vertically
 * 4. Combine with original
 */
export declare class BloomEffect extends PostProcessEffect {
    private brightPassPipeline?;
    private blurPipeline?;
    private combinePipeline?;
    private brightPassLayout?;
    private blurLayout?;
    private combineLayout?;
    private brightPassUniformBuffer?;
    private blurHorizontalUniformBuffer?;
    private blurVerticalUniformBuffer?;
    private combineUniformBuffer?;
    private sampler?;
    private fullscreenQuad?;
    private brightTexture?;
    private blurHorizontalTexture?;
    private blurVerticalTexture?;
    private textureWidth;
    private textureHeight;
    threshold: number;
    intensity: number;
    bloomStrength: number;
    blurPasses: number;
    constructor(config?: {
        threshold?: number;
        intensity?: number;
        bloomStrength?: number;
        blurPasses?: number;
        order?: number;
    });
    initialize(device: GPUDevice, format: GPUTextureFormat): void;
    apply(device: GPUDevice, commandEncoder: GPUCommandEncoder, sourceTexture: GPUTexture, destinationTexture: GPUTexture, width: number, height: number): void;
    destroy(): void;
}
//# sourceMappingURL=BloomEffect.d.ts.map