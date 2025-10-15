export class GpuPresentationFormat {
  constructor(private readonly format: GPUTextureFormat) {}

  public get() {
    return this.format;
  }
}
