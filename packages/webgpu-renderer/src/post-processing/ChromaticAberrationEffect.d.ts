import { PostProcessEffect } from "./PostProcessEffect";
/**
 * Chromatic Aberration effect - splits RGB channels for a retro/glitch effect
 */
export declare class ChromaticAberrationEffect extends PostProcessEffect {
    private pipeline?;
    private bindGroupLayout?;
    private uniformBuffer?;
    private sampler?;
    private fullscreenQuad?;
    offset: number;
    constructor(config?: {
        offset?: number;
        order?: number;
    });
    initialize(device: GPUDevice, format: GPUTextureFormat): void;
    apply(device: GPUDevice, commandEncoder: GPUCommandEncoder, sourceTexture: GPUTexture, destinationTexture: GPUTexture, width: number, height: number): void;
    destroy(): void;
}
//# sourceMappingURL=ChromaticAberrationEffect.d.ts.map