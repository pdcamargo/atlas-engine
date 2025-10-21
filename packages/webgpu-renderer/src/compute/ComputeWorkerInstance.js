import { readBuffer, toTypedArray, writeBuffer } from "./utils/buffer-helpers";
/**
 * Runtime instance of a compute worker
 * Similar to Bevy's AppComputeWorker<T>
 *
 * Manages GPU resources, executes compute passes, and provides CPU data access
 */
export class ComputeWorkerInstance {
    device;
    buffers;
    passes;
    isOneShot;
    executionPending = false;
    lastExecution;
    constructor(device, buffers, passes, isOneShot = false) {
        this.device = device;
        this.buffers = buffers;
        this.passes = passes;
        this.isOneShot = isOneShot;
    }
    /**
     * Execute all compute passes
     * For one-shot workers, this must be called manually
     * For continuous workers, this is called automatically every frame
     */
    async execute() {
        if (this.passes.length === 0) {
            return;
        }
        // Create command encoder for all passes
        const commandEncoder = this.device.createCommandEncoder({
            label: "Compute Worker Command Encoder",
        });
        // Execute each pass sequentially
        for (const pass of this.passes) {
            if (!pass.pipeline || !pass.bindGroup) {
                console.warn("Compute pass not fully initialized, skipping");
                continue;
            }
            const computePass = commandEncoder.beginComputePass({
                label: `Compute Pass: ${pass.shader.constructor.name}`,
            });
            computePass.setPipeline(pass.pipeline);
            computePass.setBindGroup(0, pass.bindGroup);
            const [x, y, z] = pass.workgroups;
            computePass.dispatchWorkgroups(x, y, z);
            computePass.end();
        }
        // Submit all commands
        this.device.queue.submit([commandEncoder.finish()]);
        // Store execution promise for ready() checks
        this.lastExecution = this.device.queue.onSubmittedWorkDone();
        this.executionPending = true;
        // Wait for completion
        await this.lastExecution;
        this.executionPending = false;
    }
    /**
     * Check if the worker is ready for CPU reads
     * Returns false while compute passes are executing
     */
    ready() {
        return !this.executionPending;
    }
    /**
     * Read data from a staging buffer as raw ArrayBuffer
     * Only works with staging buffers
     */
    async read(name) {
        const bufferDef = this.buffers.get(name);
        if (!bufferDef) {
            throw new Error(`Buffer "${name}" not found`);
        }
        if (!bufferDef.readbackBuffer) {
            throw new Error(`Buffer "${name}" is not a staging buffer. Only staging buffers can be read.`);
        }
        return await readBuffer(this.device, bufferDef.buffer, bufferDef.readbackBuffer, bufferDef.size);
    }
    /**
     * Read data from a staging buffer as a typed array
     * Automatically determines the array type based on the template parameter
     */
    async readVec(name) {
        const arrayBuffer = await this.read(name);
        // Default to Float32Array for numeric data
        const float32Array = new Float32Array(arrayBuffer);
        return Array.from(float32Array);
    }
    /**
     * Read data as a specific typed array type
     */
    async readTypedArray(name, ArrayType) {
        const arrayBuffer = await this.read(name);
        return new ArrayType(arrayBuffer);
    }
    /**
     * Write data to a buffer (uniform, storage, or staging)
     * The buffer will be updated on the GPU
     */
    write(name, data) {
        const bufferDef = this.buffers.get(name);
        if (!bufferDef) {
            throw new Error(`Buffer "${name}" not found`);
        }
        writeBuffer(this.device, bufferDef.buffer, data);
    }
    /**
     * Write a slice of data to a buffer at a specific offset
     */
    writeSlice(name, data, offset = 0) {
        const bufferDef = this.buffers.get(name);
        if (!bufferDef) {
            throw new Error(`Buffer "${name}" not found`);
        }
        const typedArray = toTypedArray(data);
        this.device.queue.writeBuffer(bufferDef.buffer, offset, typedArray);
    }
    /**
     * Get the size of a buffer in bytes
     */
    getBufferSize(name) {
        const bufferDef = this.buffers.get(name);
        if (!bufferDef) {
            throw new Error(`Buffer "${name}" not found`);
        }
        return bufferDef.size;
    }
    /**
     * Check if a buffer exists
     */
    hasBuffer(name) {
        return this.buffers.has(name);
    }
    /**
     * Get all buffer names
     */
    getBufferNames() {
        return Array.from(this.buffers.keys());
    }
    /**
     * Destroy all GPU resources
     * Should be called when the worker is no longer needed
     */
    destroy() {
        for (const bufferDef of this.buffers.values()) {
            bufferDef.buffer.destroy();
            bufferDef.readbackBuffer?.destroy();
        }
        this.buffers.clear();
        this.passes = [];
    }
    /**
     * Check if this is a one-shot worker
     */
    isOneShotWorker() {
        return this.isOneShot;
    }
}
