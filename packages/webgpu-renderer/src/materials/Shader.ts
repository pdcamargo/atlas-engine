/**
 * Uniform definition for shader parameters
 */
export interface UniformDefinition {
  name: string;
  type: "f32" | "vec2f" | "vec3f" | "vec4f" | "mat4x4f";
  size: number; // Size in bytes
  offset: number; // Offset in uniform buffer
}

/**
 * Shader class defines the WGSL code and interface for rendering
 * Supports both standard and instanced rendering variants
 */
export class Shader {
  public readonly name: string;
  public readonly vertexCode: string;
  public readonly fragmentCode: string;
  public readonly instancedVertexCode?: string;
  public readonly instancedFragmentCode?: string;
  public readonly uniforms: UniformDefinition[];

  // Cached shader modules (created lazily)
  private _vertexModule?: GPUShaderModule;
  private _fragmentModule?: GPUShaderModule;
  private _instancedVertexModule?: GPUShaderModule;
  private _instancedFragmentModule?: GPUShaderModule;

  constructor(config: {
    name: string;
    vertexCode: string;
    fragmentCode: string;
    instancedVertexCode?: string;
    instancedFragmentCode?: string;
    uniforms?: UniformDefinition[];
  }) {
    this.name = config.name;
    this.vertexCode = config.vertexCode;
    this.fragmentCode = config.fragmentCode;
    this.instancedVertexCode = config.instancedVertexCode;
    this.instancedFragmentCode = config.instancedFragmentCode;
    this.uniforms = config.uniforms || [];
  }

  /**
   * Get or create vertex shader module
   */
  getVertexModule(device: GPUDevice): GPUShaderModule {
    if (!this._vertexModule) {
      this._vertexModule = device.createShaderModule({
        label: `${this.name} Vertex Shader`,
        code: this.vertexCode,
      });
    }
    return this._vertexModule;
  }

  /**
   * Get or create fragment shader module
   */
  getFragmentModule(device: GPUDevice): GPUShaderModule {
    if (!this._fragmentModule) {
      this._fragmentModule = device.createShaderModule({
        label: `${this.name} Fragment Shader`,
        code: this.fragmentCode,
      });
    }
    return this._fragmentModule;
  }

  /**
   * Get or create instanced vertex shader module
   */
  getInstancedVertexModule(device: GPUDevice): GPUShaderModule | undefined {
    if (!this.instancedVertexCode) return undefined;

    if (!this._instancedVertexModule) {
      this._instancedVertexModule = device.createShaderModule({
        label: `${this.name} Instanced Vertex Shader`,
        code: this.instancedVertexCode,
      });
    }
    return this._instancedVertexModule;
  }

  /**
   * Get or create instanced fragment shader module
   */
  getInstancedFragmentModule(device: GPUDevice): GPUShaderModule | undefined {
    if (!this.instancedFragmentCode) return undefined;

    if (!this._instancedFragmentModule) {
      this._instancedFragmentModule = device.createShaderModule({
        label: `${this.name} Instanced Fragment Shader`,
        code: this.instancedFragmentCode,
      });
    }
    return this._instancedFragmentModule;
  }

  /**
   * Check if this shader supports instanced rendering
   */
  supportsInstancing(): boolean {
    return !!(this.instancedVertexCode && this.instancedFragmentCode);
  }

  /**
   * Calculate total size needed for uniform buffer
   */
  getUniformBufferSize(): number {
    if (this.uniforms.length === 0) return 0;

    // Find max offset + size
    let maxSize = 0;
    for (const uniform of this.uniforms) {
      const end = uniform.offset + uniform.size;
      if (end > maxSize) {
        maxSize = end;
      }
    }

    // Align to 16 bytes (WebGPU requirement)
    return Math.ceil(maxSize / 16) * 16;
  }
}
