import { EcsPlugin, EcsPluginGroup } from "../../plugin";
import { TimePlugin } from "./time";
import { AssetsPlugin } from "./assets";
import { InputPlugin } from "./input";
import { ViewportPlugin } from "./viewport";
import { UiPlugin } from "./ui";
import { Renderer2DPlugin } from "./renderer2d";
import { Physics2DPlugin } from "./physics2d";

export type DefaultPluginOptions = {
  container?: HTMLElement | null;
  canvas?: HTMLCanvasElement | null;
  gravity?: {
    x: number;
    y: number;
  };
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
      new Physics2DPlugin({ gravity: this.options?.gravity }),
      new Renderer2DPlugin(),
      new UiPlugin(),
    ];
  }
}
