import { BoidGamePlugin } from "./games/boid/boid";
import { GameOfLifePlugin } from "./games/game-of-life";
import { AnimatorDemoPlugin } from "./games/animator-demo/animator-demo";
import { UiDemoPlugin } from "./games/ui-demo";
import "./style.css";

import { App, DebugPlugin, EcsPlugin } from "@atlas/engine";

// Select which game to run:
// - "boid" - Flocking simulation (500 boids)
// - "game-of-life" - Conway's Game of Life (128x128 grid)
// - "animator-demo" - Comprehensive animator system demonstration
// - "ui-demo" - UI system demo with game menu
const GAME: string = "ui-demo";

async function main() {
  const gamePlugins: Record<string, () => EcsPlugin> = {
    boid: () => new BoidGamePlugin(),
    "game-of-life": () => new GameOfLifePlugin(),
    "animator-demo": () => new AnimatorDemoPlugin(),
    "ui-demo": () => new UiDemoPlugin(),
  };

  const gamePlugin = (gamePlugins[GAME] ?? gamePlugins["ui-demo"])();

  await App.create().addPlugins(gamePlugin, new DebugPlugin()).run();

  console.log("App finished");
}

void main();
