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

// Select which game to run:
// - "boid" - Flocking simulation (500 boids)
// - "game-of-life" - Conway's Game of Life (128x128 grid)
// - "animator-demo" - Comprehensive animator system demonstration
// - "ui-demo" - UI system demo with game menu
// - "observer-demo" - Observer system with mine explosion cascade
const GAME = "observer-demo";

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

  const gamePlugin = (gamePlugins[GAME] ?? gamePlugins["ui-demo"])();

  await App.create()
    .addPlugins(new DefaultPlugin(), gamePlugin, new DebugPlugin())
    .run();

  console.log("App finished");
}

void main();
