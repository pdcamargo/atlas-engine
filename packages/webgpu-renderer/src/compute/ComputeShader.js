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
export class ComputeShader {
    _shaderModule;
    _device;
    /**
     * Optional: Return common shader code to prepend to the main shader
     * Useful for shared structs, constants, and utility functions
     */
    commonCode() {
        return "";
    }
    /**
     * Get the entry point name for the compute shader
     * Defaults to "main" but can be overridden
     */
    entryPoint() {
        return "main";
    }
    /**
     * Get or create the shader module for this compute shader
     * Modules are cached per device
     */
    getShaderModule(device) {
        // Create new module if device changed or module doesn't exist
        if (!this._shaderModule || this._device !== device) {
            this._device = device;
            const commonCode = this.commonCode();
            const shaderCode = this.shader();
            const fullCode = commonCode ? `${commonCode}\n\n${shaderCode}` : shaderCode;
            this._shaderModule = device.createShaderModule({
                label: `${this.constructor.name} Compute Shader`,
                code: fullCode,
            });
        }
        return this._shaderModule;
    }
    /**
     * Check shader compilation for errors (useful for debugging)
     */
    async checkCompilation(device) {
        const module = this.getShaderModule(device);
        const compilationInfo = await module.getCompilationInfo();
        return compilationInfo.messages;
    }
}
