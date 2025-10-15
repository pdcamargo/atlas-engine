export class GpuCanvasContext {
  constructor(private readonly context: GPUCanvasContext) {}

  public get() {
    return this.context;
  }
}
