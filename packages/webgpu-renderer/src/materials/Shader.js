/**
 * Shader class defines the WGSL code and interface for rendering
 * Supports both standard and instanced rendering variants
 */
export class Shader {
    name;
    vertexCode;
    fragmentCode;
    instancedVertexCode;
    instancedFragmentCode;
    uniforms;
    // Cached shader modules (created lazily)
    _vertexModule;
    _fragmentModule;
    _instancedVertexModule;
    _instancedFragmentModule;
    constructor(config) {
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
    getVertexModule(device) {
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
    getFragmentModule(device) {
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
    getInstancedVertexModule(device) {
        if (!this.instancedVertexCode)
            return undefined;
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
    getInstancedFragmentModule(device) {
        if (!this.instancedFragmentCode)
            return undefined;
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
    supportsInstancing() {
        return !!(this.instancedVertexCode && this.instancedFragmentCode);
    }
    /**
     * Calculate total size needed for uniform buffer
     */
    getUniformBufferSize() {
        if (this.uniforms.length === 0)
            return 0;
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
