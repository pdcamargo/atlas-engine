import { EcsPlugin, EcsPluginGroup } from "../../plugin";
import { TimePlugin } from "./time";
import { ThreePlugin } from "./three";
import { AssetsPlugin } from "./assets";
import { InputPlugin } from "./input";

export class DefaultPlugin implements EcsPluginGroup {
  plugins(): EcsPlugin[] {
    return [
      new AssetsPlugin(),
      new TimePlugin(),
      new ThreePlugin(),
      new InputPlugin(),
    ];
  }
}
