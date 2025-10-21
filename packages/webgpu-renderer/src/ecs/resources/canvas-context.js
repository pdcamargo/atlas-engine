export class GpuCanvasContext {
    context;
    constructor(context) {
        this.context = context;
    }
    get() {
        return this.context;
    }
}
