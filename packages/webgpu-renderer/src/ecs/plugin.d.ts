import { type App, type EcsPlugin } from "@atlas/core";
export type WebgpuRendererPluginOptions = {
    canvas?: HTMLCanvasElement;
};
export declare class WebgpuRendererPlugin implements EcsPlugin {
    private readonly options?;
    constructor(options?: WebgpuRendererPluginOptions | undefined);
    build(app: App): Promise<void>;
    ready(app: App): boolean;
}
//# sourceMappingURL=plugin.d.ts.map