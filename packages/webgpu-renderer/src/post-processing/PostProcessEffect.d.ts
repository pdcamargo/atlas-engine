/**
 * Base class for post-processing effects
 * Post-processing effects operate on the entire rendered scene
 * and can be chained together in multiple passes
 */
export declare abstract class PostProcessEffect {
    private static _nextId;
    readonly id: string;
    enabled: boolean;
    order: number;
    protected properties: Map<string, any>;
    constructor(order?: number);
    /**
     * Set an effect property
     */
    setProperty(name: string, value: any): void;
    /**
     * Get an effect property
     */
    getProperty<T = any>(name: string): T | undefined;
    /**
     * Check if effect has a property
     */
    hasProperty(name: string): boolean;
    /**
     * Initialize GPU resources for this effect
     * Called once when the effect is first added
     */
    abstract initialize(device: GPUDevice, format: GPUTextureFormat): void;
    /**
     * Apply this post-process effect
     * @param device - GPU device
     * @param commandEncoder - Command encoder for the current frame
     * @param sourceTexture - Input texture (scene or previous effect output)
     * @param destinationTexture - Output texture (next effect input or screen)
     * @param width - Viewport width
     * @param height - Viewport height
     */
    abstract apply(device: GPUDevice, commandEncoder: GPUCommandEncoder, sourceTexture: GPUTexture, destinationTexture: GPUTexture, width: number, height: number): void;
    /**
     * Optional: Called when effect is removed or renderer is destroyed
     */
    destroy?(): void;
}
//# sourceMappingURL=PostProcessEffect.d.ts.map