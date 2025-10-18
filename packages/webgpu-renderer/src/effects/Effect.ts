import { Mat4 } from "gl-matrix";
import { Camera } from "../renderer/Camera";
import { Sprite } from "../renderer/Sprite";

/**
 * Context passed to effects during rendering
 * Contains all necessary rendering state
 */
export interface EffectContext {
  device: GPUDevice;
  renderPass: GPURenderPassEncoder;
  vpMatrix: Mat4;
  camera: Camera;
  format: GPUTextureFormat;
  quadBuffers: {
    buffers: GPUBuffer[];
    bufferLayouts: GPUVertexBufferLayout[];
    numElements: number;
    indexBuffer?: GPUBuffer;
    indexFormat?: GPUIndexFormat;
  };
}

/**
 * Base class for visual effects that can be applied to sprites
 * Effects render as additional passes on top of the base sprite
 */
export abstract class Effect {
  private static _nextId = 0;

  public readonly id: string;
  public enabled: boolean = true;
  public order: number = 0; // Lower = render first (negative = before sprite, positive = after)

  // Effect properties that can be animated/changed
  protected properties: Map<string, any> = new Map();

  constructor(order: number = 0) {
    this.id = `effect_${Effect._nextId++}`;
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
   * Render this effect for a sprite
   * Subclasses must implement this to define their rendering behavior
   */
  abstract render(sprite: Sprite, context: EffectContext): void;

  /**
   * Optional: Called once per frame before rendering any sprites
   * Useful for effects that need to set up shared resources
   */
  beforeRender?(context: EffectContext): void;

  /**
   * Optional: Called once per frame after rendering all sprites
   * Useful for cleanup or post-processing
   */
  afterRender?(context: EffectContext): void;
}
