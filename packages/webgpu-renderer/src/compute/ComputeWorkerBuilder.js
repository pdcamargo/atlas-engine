import { BufferType } from "./types";
import { createUniformBuffer, createStorageBuffer, createStagingBuffer, getBufferSize, } from "./utils/buffer-helpers";
import { ComputeWorkerInstance } from "./ComputeWorkerInstance";
/**
 * Fluent builder for creating compute workers
 * Similar to Bevy's AppComputeWorkerBuilder
 *
 * @example
 * ```typescript
 * const worker = new ComputeWorkerBuilder(device)
 *   .addUniform("multiplier", 2.0)
 *   .addStaging("data", [1, 2, 3, 4])
 *   .addPass(MyShader, [64, 1, 1], ["multiplier", "data"])
 *   .build();
 * ```
 */
export class ComputeWorkerBuilder {
    device;
    buffers = new Map();
    passes = [];
    isOneShot = false;
    constructor(device) {
        this.device = device;
    }
    /**
     * Add a uniform buffer (read-only from GPU, small data)
     * Uniforms are ideal for configuration values that don't change during computation
     *
     * @param name - Unique identifier for this buffer
     * @param data - Initial data (number, array, or typed array)
     */
    addUniform(name, data) {
        if (this.buffers.has(name)) {
            throw new Error(`Buffer "${name}" already exists`);
        }
        const buffer = createUniformBuffer(this.device, data, `Uniform: ${name}`);
        const size = getBufferSize(data);
        this.buffers.set(name, {
            name,
            type: BufferType.Uniform,
            buffer,
            size,
        });
        return this;
    }
    /**
     * Add a storage buffer (read/write from GPU, GPU-only access)
     * Storage buffers are ideal for large arrays that are only accessed on the GPU
     *
     * @param name - Unique identifier for this buffer
     * @param data - Initial data (number, array, or typed array)
     */
    addStorage(name, data) {
        if (this.buffers.has(name)) {
            throw new Error(`Buffer "${name}" already exists`);
        }
        const buffer = createStorageBuffer(this.device, data, `Storage: ${name}`);
        const size = getBufferSize(data);
        this.buffers.set(name, {
            name,
            type: BufferType.Storage,
            buffer,
            size,
        });
        return this;
    }
    /**
     * Add a staging buffer (storage buffer with CPU read/write capability)
     * Staging buffers allow data to be read back to the CPU after computation
     *
     * @param name - Unique identifier for this buffer
     * @param data - Initial data (number, array, or typed array)
     */
    addStaging(name, data) {
        if (this.buffers.has(name)) {
            throw new Error(`Buffer "${name}" already exists`);
        }
        const { buffer, readbackBuffer } = createStagingBuffer(this.device, data, `Staging: ${name}`);
        const size = getBufferSize(data);
        this.buffers.set(name, {
            name,
            type: BufferType.Staging,
            buffer,
            size,
            readbackBuffer,
        });
        return this;
    }
    /**
     * Add a compute pass to the pipeline
     * Passes are executed in the order they are added
     *
     * @param ShaderClass - The compute shader class (must extend ComputeShader)
     * @param workgroups - Workgroup dispatch size [x, y, z]
     * @param bindings - Names of buffers to bind (in binding order)
     */
    addPass(ShaderClass, workgroups, bindings) {
        // Validate that all bindings exist
        for (const bindingName of bindings) {
            if (!this.buffers.has(bindingName)) {
                throw new Error(`Cannot add pass: buffer "${bindingName}" has not been defined yet. ` +
                    `Define buffers before adding passes.`);
            }
        }
        // Create shader instance (using 'as any' to work around TypeScript abstract class limitation)
        const shader = new ShaderClass();
        this.passes.push({
            shader,
            workgroups,
            bindings,
        });
        return this;
    }
    /**
     * Configure this worker to execute only when explicitly triggered
     * By default, workers execute every frame
     */
    oneShot() {
        this.isOneShot = true;
        return this;
    }
    /**
     * Build the compute worker instance
     * This compiles all shaders and creates pipelines and bind groups
     */
    build() {
        // Compile all passes
        for (const pass of this.passes) {
            this.compilePass(pass);
        }
        return new ComputeWorkerInstance(this.device, this.buffers, this.passes, this.isOneShot);
    }
    /**
     * Compile a compute pass: create shader module, pipeline, and bind group
     */
    compilePass(pass) {
        const shader = pass.shader;
        // Get shader module
        const shaderModule = shader.getShaderModule(this.device);
        pass.shaderModule = shaderModule;
        // Create compute pipeline
        const pipeline = this.device.createComputePipeline({
            label: `Compute Pipeline: ${shader.constructor.name}`,
            layout: "auto",
            compute: {
                module: shaderModule,
                entryPoint: shader.entryPoint(),
            },
        });
        pass.pipeline = pipeline;
        // Create bind group
        const entries = [];
        for (let i = 0; i < pass.bindings.length; i++) {
            const bindingName = pass.bindings[i];
            const bufferDef = this.buffers.get(bindingName);
            if (!bufferDef) {
                throw new Error(`Buffer "${bindingName}" not found when creating bind group`);
            }
            entries.push({
                binding: i,
                resource: { buffer: bufferDef.buffer },
            });
        }
        const bindGroup = this.device.createBindGroup({
            label: `Bind Group: ${shader.constructor.name}`,
            layout: pipeline.getBindGroupLayout(0),
            entries,
        });
        pass.bindGroup = bindGroup;
    }
}
