/**
 * Request a WebGPU adapter and device
 */
async function getRenderDevice(): Promise<GPUDevice> {
  const adapter = await navigator.gpu?.requestAdapter();
  if (!adapter) {
    throw new Error("WebGPU is not supported on this browser");
  }
  return adapter.requestDevice();
}

/**
 * RenderDevice wraps a GPUDevice with helper methods
 */
export class RenderDevice {
  #device: GPUDevice;
  #bindGroupLayoutCache: Map<string, GPUBindGroupLayout> = new Map();
  #shaderModuleCache: Map<string, GPUShaderModule> = new Map();

  constructor(device: GPUDevice) {
    this.#device = device;
  }

  public static async create(): Promise<RenderDevice> {
    const device = await getRenderDevice();
    return new RenderDevice(device);
  }

  public static from(device: GPUDevice): RenderDevice {
    return new RenderDevice(device);
  }

  /**
   * Get the underlying GPUDevice
   */
  public get device(): GPUDevice {
    return this.#device;
  }

  /**
   * Get the device queue
   */
  public get queue(): GPUQueue {
    return this.#device.queue;
  }

  /**
   * Get device features
   */
  public get features(): ReadonlySet<string> {
    return this.#device.features;
  }

  /**
   * Get device limits
   */
  public get limits(): Readonly<GPUSupportedLimits> {
    return this.#device.limits;
  }

  /**
   * Create a buffer with data
   */
  public createBuffer(options: {
    label?: string;
    size: number;
    usage: GPUBufferUsageFlags;
    mappedAtCreation?: boolean;
  }): GPUBuffer {
    return this.#device.createBuffer(options);
  }

  /**
   * Create a buffer with initial data
   */
  public createBufferWithData(options: {
    label?: string;
    data: ArrayBuffer | ArrayBufferView;
    usage: GPUBufferUsageFlags;
  }): GPUBuffer {
    const data =
      options.data instanceof ArrayBuffer
        ? new Uint8Array(options.data)
        : new Uint8Array(
            options.data.buffer,
            options.data.byteOffset,
            options.data.byteLength
          );

    const buffer = this.#device.createBuffer({
      label: options.label,
      size: data.byteLength,
      usage: options.usage,
      mappedAtCreation: true,
    });

    new Uint8Array(buffer.getMappedRange()).set(data);
    buffer.unmap();

    return buffer;
  }

  /**
   * Create a texture
   */
  public createTexture(options: GPUTextureDescriptor): GPUTexture {
    return this.#device.createTexture(options);
  }

  /**
   * Create a sampler
   */
  public createSampler(options: GPUSamplerDescriptor = {}): GPUSampler {
    return this.#device.createSampler(options);
  }

  /**
   * Create a shader module (with caching)
   */
  public createShaderModule(options: {
    label?: string;
    code: string;
  }): GPUShaderModule {
    const cacheKey = `${options.label ?? "shader"}_${options.code}`;
    const cached = this.#shaderModuleCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const module = this.#device.createShaderModule(options);
    this.#shaderModuleCache.set(cacheKey, module);
    return module;
  }

  /**
   * Create a bind group layout (with caching)
   */
  public createBindGroupLayout(options: {
    label?: string;
    entries: GPUBindGroupLayoutEntry[];
  }): GPUBindGroupLayout {
    const cacheKey = `${options.label ?? "bgl"}_${JSON.stringify(options.entries)}`;
    const cached = this.#bindGroupLayoutCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const layout = this.#device.createBindGroupLayout(options);
    this.#bindGroupLayoutCache.set(cacheKey, layout);
    return layout;
  }

  /**
   * Create a bind group
   */
  public createBindGroup(options: GPUBindGroupDescriptor): GPUBindGroup {
    return this.#device.createBindGroup(options);
  }

  /**
   * Create a pipeline layout
   */
  public createPipelineLayout(
    options: GPUPipelineLayoutDescriptor
  ): GPUPipelineLayout {
    return this.#device.createPipelineLayout(options);
  }

  /**
   * Create a render pipeline
   */
  public createRenderPipeline(
    options: GPURenderPipelineDescriptor
  ): GPURenderPipeline {
    return this.#device.createRenderPipeline(options);
  }

  /**
   * Create a command encoder
   */
  public createCommandEncoder(
    options?: GPUCommandEncoderDescriptor
  ): GPUCommandEncoder {
    return this.#device.createCommandEncoder(options);
  }

  /**
   * Submit commands to the queue
   */
  public submit(commandBuffers: GPUCommandBuffer[]): void {
    this.queue.submit(commandBuffers);
  }

  /**
   * Write data to a buffer
   */
  public writeBuffer(
    buffer: GPUBuffer,
    offset: number,
    data: ArrayBuffer | ArrayBufferView
  ): void {
    this.queue.writeBuffer(buffer, offset, data as any);
  }

  /**
   * Write data to a texture
   */
  public writeTexture(
    destination: GPUImageCopyTexture,
    data: ArrayBuffer | ArrayBufferView,
    dataLayout: GPUImageDataLayout,
    size: GPUExtent3D
  ): void {
    this.queue.writeTexture(destination, data as any, dataLayout, size);
  }

  /**
   * Clear the caches
   */
  public clearCaches(): void {
    this.#bindGroupLayoutCache.clear();
    this.#shaderModuleCache.clear();
  }
}

/**
 * RenderQueue resource for managing command submission
 */
export class RenderQueue {
  #pendingCommands: GPUCommandBuffer[] = [];

  public addCommands(commands: GPUCommandBuffer): void {
    this.#pendingCommands.push(commands);
  }

  public submit(device: RenderDevice): void {
    if (this.#pendingCommands.length > 0) {
      device.submit(this.#pendingCommands);
      this.#pendingCommands = [];
    }
  }

  public clear(): void {
    this.#pendingCommands = [];
  }
}
