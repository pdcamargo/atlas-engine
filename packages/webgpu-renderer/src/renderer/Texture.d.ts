import type { Handle, ImageAsset } from "@atlas/core";
/**
 * Texture wrapper for WebGPU textures
 */
export declare class Texture {
    id: string;
    gpuTexture: GPUTexture;
    sampler: GPUSampler;
    width: number;
    height: number;
    /** Optional handle to source asset for hot-reload support */
    sourceHandle?: Handle<ImageAsset>;
    private constructor();
    /**
     * Create a texture from a URL
     */
    static fromURL(device: GPUDevice, url: string, options?: {
        mips?: boolean;
        flipY?: boolean;
        addressModeU?: GPUAddressMode;
        addressModeV?: GPUAddressMode;
        magFilter?: GPUFilterMode;
        minFilter?: GPUFilterMode;
    }): Promise<Texture>;
    /**
     * Create a texture from an ImageBitmap, HTMLImageElement, HTMLCanvasElement, or HTMLVideoElement
     */
    static fromSource(device: GPUDevice, source: ImageBitmap | HTMLImageElement | HTMLCanvasElement | HTMLVideoElement, options?: {
        mips?: boolean;
        flipY?: boolean;
        addressModeU?: GPUAddressMode;
        addressModeV?: GPUAddressMode;
        magFilter?: GPUFilterMode;
        minFilter?: GPUFilterMode;
        sourceHandle?: Handle<ImageAsset>;
    }): Texture;
    /**
     * Destroy the texture
     */
    destroy(): void;
}
//# sourceMappingURL=Texture.d.ts.map