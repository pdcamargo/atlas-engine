export class GpuRenderDevice {
    device;
    constructor(device) {
        this.device = device;
    }
    get() {
        return this.device;
    }
}
