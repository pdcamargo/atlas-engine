import { Shader } from "./Shader";

/**
 * Blend mode for material rendering
 */
export enum BlendMode {
  Normal = "normal", // Standard alpha blending
  Additive = "additive", // Additive blending (for glows)
  Multiply = "multiply", // Multiply blending
  Screen = "screen", // Screen blending
  None = "none", // No blending (opaque)
}

/**
 * Material defines how a surface should be rendered
 * Combines shader, properties (uniforms), and blend mode
 */
export class Material {
  private static _nextId = 0;

  public readonly id: string;
  public readonly shader: Shader;
  public readonly properties: Map<string, any> = new Map();
  public blendMode: BlendMode = BlendMode.Normal;

  // Cached pipeline per device (lazy creation)
  private _pipelines = new WeakMap<GPUDevice, GPURenderPipeline>();
  private _instancedPipelines = new WeakMap<GPUDevice, GPURenderPipeline>();
  private _bindGroupLayouts = new WeakMap<GPUDevice, GPUBindGroupLayout>();
  private _instancedBindGroupLayouts = new WeakMap<
    GPUDevice,
    GPUBindGroupLayout
  >();

  constructor(shader: Shader, initialProperties?: Record<string, any>) {
    this.id = `material_${Material._nextId++}`;
    this.shader = shader;

    if (initialProperties) {
      for (const [key, value] of Object.entries(initialProperties)) {
        this.properties.set(key, value);
      }
    }
  }

  /**
   * Set a material property (uniform value)
   */
  setProperty(name: string, value: any): void {
    this.properties.set(name, value);
  }

  /**
   * Get a material property
   */
  getProperty(name: string): any {
    return this.properties.get(name);
  }

  /**
   * Check if material has a specific property
   */
  hasProperty(name: string): boolean {
    return this.properties.has(name);
  }

  /**
   * Get or create render pipeline for this material
   */
  getPipeline(
    device: GPUDevice,
    format: GPUTextureFormat,
    bufferLayouts: GPUVertexBufferLayout[]
  ): GPURenderPipeline {
    let pipeline = this._pipelines.get(device);

    if (!pipeline) {
      pipeline = this.createPipeline(device, format, bufferLayouts, false);
      this._pipelines.set(device, pipeline);
    }

    return pipeline;
  }

  /**
   * Get or create instanced render pipeline for this material
   */
  getInstancedPipeline(
    device: GPUDevice,
    format: GPUTextureFormat,
    bufferLayouts: GPUVertexBufferLayout[]
  ): GPURenderPipeline | undefined {
    if (!this.shader.supportsInstancing()) {
      return undefined;
    }

    let pipeline = this._instancedPipelines.get(device);

    if (!pipeline) {
      pipeline = this.createPipeline(device, format, bufferLayouts, true);
      if (pipeline) {
        this._instancedPipelines.set(device, pipeline);
      }
    }

    return pipeline;
  }

  /**
   * Get or create bind group layout for this material
   */
  getBindGroupLayout(
    device: GPUDevice,
    instanced: boolean
  ): GPUBindGroupLayout {
    const cache = instanced
      ? this._instancedBindGroupLayouts
      : this._bindGroupLayouts;
    let layout = cache.get(device);

    if (!layout) {
      // This will be extracted from the pipeline
      // For now, we'll create the pipeline first and extract the layout
      const pipeline = instanced
        ? this.getInstancedPipeline(device, "bgra8unorm", [])
        : this.getPipeline(device, "bgra8unorm", []);

      if (pipeline) {
        layout = pipeline.getBindGroupLayout(0);
        cache.set(device, layout);
      }
    }

    return layout!;
  }

  /**
   * Create render pipeline
   */
  private createPipeline(
    device: GPUDevice,
    format: GPUTextureFormat,
    bufferLayouts: GPUVertexBufferLayout[],
    instanced: boolean
  ): GPURenderPipeline {
    const vertexModule = instanced
      ? this.shader.getInstancedVertexModule(device) ||
        this.shader.getVertexModule(device)
      : this.shader.getVertexModule(device);

    const fragmentModule = instanced
      ? this.shader.getInstancedFragmentModule(device) ||
        this.shader.getFragmentModule(device)
      : this.shader.getFragmentModule(device);

    const blendState = this.getBlendState();

    return device.createRenderPipeline({
      label: `${this.shader.name} Pipeline (${instanced ? "Instanced" : "Standard"})`,
      layout: "auto",
      vertex: {
        module: vertexModule,
        entryPoint: "vertexMain",
        buffers: bufferLayouts,
      },
      fragment: {
        module: fragmentModule,
        entryPoint: "fragmentMain",
        targets: [
          {
            format,
            blend: blendState,
          },
        ],
      },
      primitive: {
        topology: "triangle-list",
        cullMode: instanced ? "back" : "none",
      },
    });
  }

  /**
   * Get blend state based on blend mode
   */
  private getBlendState(): GPUBlendState | undefined {
    switch (this.blendMode) {
      case BlendMode.Normal:
        return {
          color: {
            srcFactor: "src-alpha",
            dstFactor: "one-minus-src-alpha",
            operation: "add",
          },
          alpha: {
            srcFactor: "one",
            dstFactor: "one-minus-src-alpha",
            operation: "add",
          },
        };

      case BlendMode.Additive:
        return {
          color: {
            srcFactor: "src-alpha",
            dstFactor: "one",
            operation: "add",
          },
          alpha: {
            srcFactor: "one",
            dstFactor: "one",
            operation: "add",
          },
        };

      case BlendMode.Multiply:
        // Multiply blend mode
        // Note: WebGPU doesn't have direct multiply blend, using approximation
        // For true multiply, would need custom shader or advanced blending
        return {
          color: {
            srcFactor: "dst-alpha",
            dstFactor: "zero",
            operation: "add",
          },
          alpha: {
            srcFactor: "one",
            dstFactor: "one-minus-src-alpha",
            operation: "add",
          },
        };

      case BlendMode.Screen:
        // Screen blend mode: 1 - (1-src) * (1-dst) ≈ src + dst - src*dst
        // Approximated with additive blending
        return {
          color: {
            srcFactor: "one",
            dstFactor: "one",
            operation: "add",
          },
          alpha: {
            srcFactor: "one",
            dstFactor: "one-minus-src-alpha",
            operation: "add",
          },
        };

      case BlendMode.None:
        return undefined; // No blending

      default:
        return undefined;
    }
  }

  /**
   * Clone this material with optional property overrides
   */
  clone(propertyOverrides?: Record<string, any>): Material {
    const cloned = new Material(this.shader);
    cloned.blendMode = this.blendMode;

    // Copy properties
    for (const [key, value] of this.properties) {
      cloned.properties.set(key, value);
    }

    // Apply overrides
    if (propertyOverrides) {
      for (const [key, value] of Object.entries(propertyOverrides)) {
        cloned.properties.set(key, value);
      }
    }

    return cloned;
  }
}
