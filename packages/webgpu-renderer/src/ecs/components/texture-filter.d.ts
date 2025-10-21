/**
 * TextureFilter component for customizing texture creation options per-entity
 *
 * Usage:
 * ```typescript
 * const sprite = new Sprite(textureHandle, 32, 32);
 * const textureFilter = new TextureFilter({
 *   minFilter: "nearest",
 *   magFilter: "nearest",
 *   mips: false,
 * });
 * commands.spawn(sprite, textureFilter);
 * ```
 */
export declare class TextureFilter {
    /** Minification filter mode */
    minFilter?: GPUFilterMode;
    /** Magnification filter mode */
    magFilter?: GPUFilterMode;
    /** Whether to generate mipmaps */
    mips?: boolean;
    /** Whether to flip Y axis when uploading */
    flipY?: boolean;
    /** Address mode for U coordinate */
    addressModeU?: GPUAddressMode;
    /** Address mode for V coordinate */
    addressModeV?: GPUAddressMode;
    constructor(options?: {
        minFilter?: GPUFilterMode;
        magFilter?: GPUFilterMode;
        mips?: boolean;
        flipY?: boolean;
        addressModeU?: GPUAddressMode;
        addressModeV?: GPUAddressMode;
    });
}
//# sourceMappingURL=texture-filter.d.ts.map