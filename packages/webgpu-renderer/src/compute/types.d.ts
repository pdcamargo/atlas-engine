/**
 * Type of buffer for compute shader bindings
 */
export declare enum BufferType {
    /** Uniform buffer - read-only from GPU, small data (<64KB), fast access */
    Uniform = "uniform",
    /** Storage buffer - read/write from GPU, large arrays, GPU-only */
    Storage = "storage",
    /** Staging buffer - storage buffer with CPU read/write capability */
    Staging = "staging"
}
/**
 * Workgroup size for compute shader dispatch
 * Format: [x, y, z] dimensions
 */
export type WorkgroupSize = [number, number, number];
/**
 * Definition of a buffer in the compute pipeline
 */
export interface BufferDefinition {
    /** Unique name for this buffer */
    name: string;
    /** Type of buffer */
    type: BufferType;
    /** GPU buffer instance */
    buffer: GPUBuffer;
    /** Size in bytes */
    size: number;
    /** For staging buffers: the mappable readback buffer */
    readbackBuffer?: GPUBuffer;
}
/**
 * Definition of a compute pass in the pipeline
 */
export interface PassDefinition {
    /** The compute shader class/instance */
    shader: any;
    /** Shader module (created lazily) */
    shaderModule?: GPUShaderModule;
    /** Compute pipeline */
    pipeline?: GPUComputePipeline;
    /** Bind group for this pass */
    bindGroup?: GPUBindGroup;
    /** Workgroup dispatch size [x, y, z] */
    workgroups: WorkgroupSize;
    /** Names of buffers to bind (in binding order) */
    bindings: string[];
}
/**
 * Typed array types supported for buffer data
 */
export type TypedArray = Float32Array | Uint32Array | Int32Array | Uint16Array | Int16Array | Uint8Array | Int8Array;
/**
 * Data that can be written to a buffer
 */
export type BufferData = TypedArray | ArrayBuffer | number | number[];
//# sourceMappingURL=types.d.ts.map