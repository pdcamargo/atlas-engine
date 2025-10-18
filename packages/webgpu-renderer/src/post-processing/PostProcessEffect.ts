/**
 * Base class for post-processing effects
 * Post-processing effects operate on the entire rendered scene
 * and can be chained together in multiple passes
 */
export abstract class PostProcessEffect {
  private static _nextId = 0;

  public readonly id: string;
  public enabled: boolean = true;
  public order: number = 0; // Lower = earlier in post-process chain

  // Effect properties that can be animated/changed
  protected properties: Map<string, any> = new Map();

  constructor(order: number = 0) {
    this.id = `postprocess_${PostProcessEffect._nextId++}`;
    this.order = order;
  }

  /**
   * Set an effect property
   */
  setProperty(name: string, value: any): void {
    this.properties.set(name, value);
  }

  /**
   * Get an effect property
   */
  getProperty<T = any>(name: string): T | undefined {
    return this.properties.get(name);
  }

  /**
   * Check if effect has a property
   */
  hasProperty(name: string): boolean {
    return this.properties.has(name);
  }

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
  abstract apply(
    device: GPUDevice,
    commandEncoder: GPUCommandEncoder,
    sourceTexture: GPUTexture,
    destinationTexture: GPUTexture,
    width: number,
    height: number
  ): void;

  /**
   * Optional: Called when effect is removed or renderer is destroyed
   */
  destroy?(): void;
}
