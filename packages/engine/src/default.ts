import {
  AssetsPlugin,
  EcsPlugin,
  EcsPluginGroup,
  FileSystemAdapter,
  FileSystemPlugin,
  InputPlugin,
  TimePlugin,
  UiPlugin,
  ViewportPlugin,
} from "@atlas/core";
import { WebgpuRendererPlugin } from "@atlas/webgpu-renderer";
import { AudioPlugin } from "@atlas/audio";

export type DefaultPluginOptions = {
  container?: HTMLElement | null;
  canvas?: HTMLCanvasElement | null;
  fileSystemAdapter?: FileSystemAdapter;
};

export class DefaultPlugin implements EcsPluginGroup {
  constructor(public readonly options?: DefaultPluginOptions) {}

  plugins(): EcsPlugin[] {
    return [
      new ViewportPlugin({
        container: this.options?.container,
        canvas: this.options?.canvas,
      }),
      new FileSystemPlugin(this.options?.fileSystemAdapter),
      new InputPlugin(),
      new TimePlugin(),
      new AssetsPlugin(),
      new UiPlugin(),
      new WebgpuRendererPlugin({
        canvas: this.options?.canvas ?? undefined,
      }),
      new AudioPlugin(),
    ];
  }
}
