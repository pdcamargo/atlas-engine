import { Howl } from "howler";
import { App, AssetServer, AssetsPlugin } from "../..";
import { EcsPlugin, EcsPluginConstructor } from "../../plugin";

export class AudioSink {
  #ready = false;
  #source: Howl;
  #playCount = 0;

  constructor(source: Howl) {
    this.#source = source;

    this.#source.on("load", () => {
      this.#ready = true;
    });
  }

  public play() {
    if (this.#ready) {
      this.#playCount++;
      this.#source.play();
    }
  }

  public isReady() {
    return this.#ready;
  }

  public getPlayCount() {
    return this.#playCount;
  }
}

export class AudioPlugin implements EcsPlugin {
  build(app: App) {
    void app;
  }

  ready(app: App) {
    return app.hasResource(AssetServer);
  }

  dependsOn(): EcsPluginConstructor[] {
    return [AssetsPlugin];
  }
}
