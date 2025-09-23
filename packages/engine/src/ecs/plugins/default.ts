import { EcsPlugin, EcsPluginGroup } from "../../plugin";
import { TimePlugin } from "./time";
import { AssetsPlugin } from "./assets";
import { InputPlugin } from "./input";
import { ViewportPlugin } from "./viewport";
import { UiPlugin } from "./ui";
import { Renderer2DPlugin } from "./renderer2d";

export type DefaultPluginOptions = {
  container?: HTMLElement | null;
  canvas?: HTMLCanvasElement | null;
};

export class DefaultPlugin implements EcsPluginGroup {
  constructor(public readonly options?: DefaultPluginOptions) {}

  plugins(): EcsPlugin[] {
    return [
      new ViewportPlugin({
        container: this.options?.container,
        canvas: this.options?.canvas,
      }),
      new InputPlugin(),
      new TimePlugin(),
      new AssetsPlugin(),
      new Renderer2DPlugin(),
      new UiPlugin(),
    ];
  }
}
