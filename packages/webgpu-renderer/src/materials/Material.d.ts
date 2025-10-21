import { Shader } from "./Shader";
/**
 * Blend mode for material rendering
 */
export declare enum BlendMode {
    Normal = "normal",// Standard alpha blending
    Additive = "additive",// Additive blending (for glows)
    Multiply = "multiply",// Multiply blending
    Screen = "screen",// Screen blending
    None = "none"
}
/**
 * Material defines how a surface should be rendered
 * Combines shader, properties (uniforms), and blend mode
 */
export declare class Material {
    private static _nextId;
    readonly id: string;
    readonly shader: Shader;
    readonly properties: Map<string, any>;
    blendMode: BlendMode;
    private _pipelines;
    private _instancedPipelines;
    private _bindGroupLayouts;
    private _instancedBindGroupLayouts;
    constructor(shader: Shader, initialProperties?: Record<string, any>);
    /**
     * Set a material property (uniform value)
     */
    setProperty(name: string, value: any): void;
    /**
     * Get a material property
     */
    getProperty(name: string): any;
    /**
     * Check if material has a specific property
     */
    hasProperty(name: string): boolean;
    /**
     * Get or create render pipeline for this material
     */
    getPipeline(device: GPUDevice, format: GPUTextureFormat, bufferLayouts: GPUVertexBufferLayout[]): GPURenderPipeline;
    /**
     * Get or create instanced render pipeline for this material
     */
    getInstancedPipeline(device: GPUDevice, format: GPUTextureFormat, bufferLayouts: GPUVertexBufferLayout[]): GPURenderPipeline | undefined;
    /**
     * Get or create bind group layout for this material
     */
    getBindGroupLayout(device: GPUDevice, instanced: boolean): GPUBindGroupLayout;
    /**
     * Create render pipeline
     */
    private createPipeline;
    /**
     * Get blend state based on blend mode
     */
    private getBlendState;
    /**
     * Clone this material with optional property overrides
     */
    clone(propertyOverrides?: Record<string, any>): Material;
}
//# sourceMappingURL=Material.d.ts.map