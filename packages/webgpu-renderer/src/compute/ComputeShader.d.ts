/**
 * Abstract class for defining compute shaders
 * Similar to Bevy's ComputeShader trait
 *
 * Users extend this class and implement the shader() method to provide WGSL code
 *
 * @example
 * ```typescript
 * class MyComputeShader extends ComputeShader {
 *   shader() {
 *     return `
 *       @group(0) @binding(0) var<uniform> value: f32;
 *       @group(0) @binding(1) var<storage, read_write> data: array<f32>;
 *
 *       @compute @workgroup_size(64)
 *       fn main(@builtin(global_invocation_id) id: vec3<u32>) {
 *         data[id.x] = data[id.x] + value;
 *       }
 *     `;
 *   }
 * }
 * ```
 */
export declare abstract class ComputeShader {
    private _shaderModule?;
    private _device?;
    /**
     * Return the WGSL shader code for this compute shader
     * This will be called once when the shader is first compiled
     */
    abstract shader(): string;
    /**
     * Optional: Return common shader code to prepend to the main shader
     * Useful for shared structs, constants, and utility functions
     */
    commonCode(): string;
    /**
     * Get the entry point name for the compute shader
     * Defaults to "main" but can be overridden
     */
    entryPoint(): string;
    /**
     * Get or create the shader module for this compute shader
     * Modules are cached per device
     */
    getShaderModule(device: GPUDevice): GPUShaderModule;
    /**
     * Check shader compilation for errors (useful for debugging)
     */
    checkCompilation(device: GPUDevice): Promise<readonly GPUCompilationMessage[]>;
}
//# sourceMappingURL=ComputeShader.d.ts.map