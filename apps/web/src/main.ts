import { BoidGamePlugin } from "./games/boid/boid";
import { GameOfLifePlugin } from "./games/game-of-life";
import { AnimatorDemoPlugin } from "./games/animator-demo/animator-demo";
import { UiDemoPlugin } from "./games/ui-demo";
import "./style.css";

import { App, DebugPlugin, DefaultPlugin, EcsPlugin } from "@atlas/engine";
import { SlayGamePlugin } from "./games/slay";
import { SerializationDemoPlugin } from "./games/serialization-demo/serialization-demo";
import { TiledGamePlugin } from "./games/tiled";
import { ObserverDemoPlugin } from "./games/observer-demo";

const GAME = "tiled";

async function main() {
  const gamePlugins: Record<string, () => EcsPlugin> = {
    boid: () => new BoidGamePlugin(),
    "game-of-life": () => new GameOfLifePlugin(),
    "animator-demo": () => new AnimatorDemoPlugin(),
    "ui-demo": () => new UiDemoPlugin(),
    slay: () => new SlayGamePlugin(),
    "serialization-demo": () => new SerializationDemoPlugin(),
    tiled: () => new TiledGamePlugin(),
    "observer-demo": () => new ObserverDemoPlugin(),
  };

  const gamePlugin = (gamePlugins[GAME] ?? gamePlugins["slay"])();

  await App.create()
    .addPlugins(
      new DefaultPlugin({
        canvas: document.querySelector<HTMLCanvasElement>("canvas"),
      }),
      gamePlugin,
      new DebugPlugin()
    )
    .run();

  console.log("App finished");
}

void main();
