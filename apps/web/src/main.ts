import { BoidGamePlugin } from "./games/boid/boid";
import { GameOfLifePlugin } from "./games/game-of-life";
import "./style.css";

import { App, DebugPlugin } from "@atlas/engine";

// Select which game to run:
// - "boid" - Flocking simulation (500 boids)
// - "game-of-life" - Conway's Game of Life (128x128 grid)
const GAME: string = "game-of-life";

async function main() {
  const gamePlugin =
    GAME === "boid" ? new BoidGamePlugin() : new GameOfLifePlugin();

  await App.create().addPlugins(gamePlugin, new DebugPlugin()).run();

  console.log("App finished");
}

void main();
