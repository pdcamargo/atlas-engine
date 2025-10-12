import { EcsPlugin, EcsPluginGroup } from "../../plugin";
import { TimePlugin } from "./time";
import { AssetsPlugin } from "./assets";
import { InputPlugin } from "./input";
import { ViewportPlugin } from "./viewport";
import { UiPlugin } from "./ui";
import { FileSystemAdapter, FileSystemPlugin } from "./file-system";

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
    ];
  }
}
