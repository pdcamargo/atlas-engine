export class GpuRenderDevice {
  constructor(private readonly device: GPUDevice) {}

  public get() {
    return this.device;
  }
}
