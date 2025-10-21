import { BoidGamePlugin } from "./games/boid/boid";
import { GameOfLifePlugin } from "./games/game-of-life";
import { AnimatorDemoPlugin } from "./games/animator-demo/animator-demo";
import "./style.css";

import { App, DebugPlugin, EcsPlugin } from "@atlas/engine";

// Select which game to run:
// - "boid" - Flocking simulation (500 boids)
// - "game-of-life" - Conway's Game of Life (128x128 grid)
// - "animator-demo" - Comprehensive animator system demonstration
const GAME: string = "animator-demo";

async function main() {
  const gamePlugins: Record<string, () => EcsPlugin> = {
    boid: () => new BoidGamePlugin(),
    "game-of-life": () => new GameOfLifePlugin(),
    "animator-demo": () => new AnimatorDemoPlugin(),
  };

  const gamePlugin = (gamePlugins[GAME] ?? gamePlugins["animator-demo"])();

  await App.create().addPlugins(gamePlugin, new DebugPlugin()).run();

  console.log("App finished");
}

void main();
