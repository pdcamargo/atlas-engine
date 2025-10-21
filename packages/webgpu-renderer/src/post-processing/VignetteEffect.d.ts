import { PostProcessEffect } from "./PostProcessEffect";
/**
 * Vignette effect - darkens the corners of the screen
 */
export declare class VignetteEffect extends PostProcessEffect {
    private pipeline?;
    private bindGroupLayout?;
    private uniformBuffer?;
    private sampler?;
    private fullscreenQuad?;
    intensity: number;
    smoothness: number;
    constructor(config?: {
        intensity?: number;
        smoothness?: number;
        order?: number;
    });
    initialize(device: GPUDevice, format: GPUTextureFormat): void;
    apply(device: GPUDevice, commandEncoder: GPUCommandEncoder, sourceTexture: GPUTexture, destinationTexture: GPUTexture, width: number, height: number): void;
    destroy(): void;
}
//# sourceMappingURL=VignetteEffect.d.ts.map