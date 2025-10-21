/**
 * Uniform definition for shader parameters
 */
export interface UniformDefinition {
    name: string;
    type: "f32" | "vec2f" | "vec3f" | "vec4f" | "mat4x4f";
    size: number;
    offset: number;
}
/**
 * Shader class defines the WGSL code and interface for rendering
 * Supports both standard and instanced rendering variants
 */
export declare class Shader {
    readonly name: string;
    readonly vertexCode: string;
    readonly fragmentCode: string;
    readonly instancedVertexCode?: string;
    readonly instancedFragmentCode?: string;
    readonly uniforms: UniformDefinition[];
    private _vertexModule?;
    private _fragmentModule?;
    private _instancedVertexModule?;
    private _instancedFragmentModule?;
    constructor(config: {
        name: string;
        vertexCode: string;
        fragmentCode: string;
        instancedVertexCode?: string;
        instancedFragmentCode?: string;
        uniforms?: UniformDefinition[];
    });
    /**
     * Get or create vertex shader module
     */
    getVertexModule(device: GPUDevice): GPUShaderModule;
    /**
     * Get or create fragment shader module
     */
    getFragmentModule(device: GPUDevice): GPUShaderModule;
    /**
     * Get or create instanced vertex shader module
     */
    getInstancedVertexModule(device: GPUDevice): GPUShaderModule | undefined;
    /**
     * Get or create instanced fragment shader module
     */
    getInstancedFragmentModule(device: GPUDevice): GPUShaderModule | undefined;
    /**
     * Check if this shader supports instanced rendering
     */
    supportsInstancing(): boolean;
    /**
     * Calculate total size needed for uniform buffer
     */
    getUniformBufferSize(): number;
}
//# sourceMappingURL=Shader.d.ts.map