/**
 * Type of buffer for compute shader bindings
 */
export var BufferType;
(function (BufferType) {
    /** Uniform buffer - read-only from GPU, small data (<64KB), fast access */
    BufferType["Uniform"] = "uniform";
    /** Storage buffer - read/write from GPU, large arrays, GPU-only */
    BufferType["Storage"] = "storage";
    /** Staging buffer - storage buffer with CPU read/write capability */
    BufferType["Staging"] = "staging";
})(BufferType || (BufferType = {}));
