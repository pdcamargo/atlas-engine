import { EcsPlugin, EcsPluginGroup } from "../../plugin";
import { TimePlugin } from "./time";
import { ThreePlugin } from "./three";

export class DefaultPlugin implements EcsPluginGroup {
  plugins(): EcsPlugin[] {
    return [new TimePlugin(), new ThreePlugin()];
  }
}
