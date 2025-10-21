import { createTextureFromImage, createTextureFromSource } from "webgpu-utils";
const uuidv4 = () => {
    return crypto.randomUUID();
};
/**
 * Texture wrapper for WebGPU textures
 */
export class Texture {
    id;
    gpuTexture;
    sampler;
    width;
    height;
    /** Optional handle to source asset for hot-reload support */
    sourceHandle;
    constructor(texture, sampler, id, sourceHandle) {
        this.id = id ?? uuidv4();
        this.gpuTexture = texture;
        this.sampler = sampler;
        this.width = texture.width;
        this.height = texture.height;
        this.sourceHandle = sourceHandle;
    }
    /**
     * Create a texture from a URL
     */
    static async fromURL(device, url, options) {
        const { mips = true, flipY = true, addressModeU = "repeat", addressModeV = "repeat", magFilter = "linear", minFilter = "linear", } = options || {};
        const texture = await createTextureFromImage(device, url, {
            mips,
            flipY,
        });
        const sampler = device.createSampler({
            addressModeU,
            addressModeV,
            magFilter,
            minFilter,
            mipmapFilter: mips ? "linear" : "nearest",
        });
        return new Texture(texture, sampler);
    }
    /**
     * Create a texture from an ImageBitmap, HTMLImageElement, HTMLCanvasElement, or HTMLVideoElement
     */
    static fromSource(device, source, options) {
        const { mips = true, flipY = true, addressModeU = "repeat", addressModeV = "repeat", magFilter = "linear", minFilter = "linear", sourceHandle, } = options || {};
        const texture = createTextureFromSource(device, source, {
            mips,
            flipY,
        });
        const sampler = device.createSampler({
            addressModeU,
            addressModeV,
            magFilter,
            minFilter,
            mipmapFilter: mips ? "linear" : "nearest",
        });
        return new Texture(texture, sampler, undefined, sourceHandle);
    }
    /**
     * Destroy the texture
     */
    destroy() {
        this.gpuTexture.destroy();
    }
}
