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
export class TextureFilter {
    /** Minification filter mode */
    minFilter;
    /** Magnification filter mode */
    magFilter;
    /** Whether to generate mipmaps */
    mips;
    /** Whether to flip Y axis when uploading */
    flipY;
    /** Address mode for U coordinate */
    addressModeU;
    /** Address mode for V coordinate */
    addressModeV;
    constructor(options = {}) {
        this.minFilter = options.minFilter;
        this.magFilter = options.magFilter;
        this.mips = options.mips;
        this.flipY = options.flipY;
        this.addressModeU = options.addressModeU;
        this.addressModeV = options.addressModeV;
    }
}
