/**
 * Conway's Game of Life - Compute Shader Example
 *
 * This example demonstrates a complete Game of Life simulation using compute shaders:
 * - Ping-pong buffer pattern (current state → next state)
 * - 2D grid processing with workgroups
 * - Neighbor counting algorithm
 * - Multi-pass pattern for state swapping
 *
 * Rules of Conway's Game of Life:
 * 1. Any live cell with 2-3 live neighbors survives
 * 2. Any dead cell with exactly 3 live neighbors becomes alive
 * 3. All other cells die or stay dead
 */

import {
  ComputeShader,
  ComputeWorker,
  ComputeWorkerBuilder,
  type ComputeWorkerInstance,
} from "../index";

/**
 * Game of Life compute shader
 */
class GameOfLifeShader extends ComputeShader {
  shader() {
    return `
      struct Settings {
        width: u32,
        height: u32,
      }

      @binding(0) @group(0) var<uniform> settings: Settings;
      @binding(1) @group(0) var<storage, read> current: array<u32>;
      @binding(2) @group(0) var<storage, read_write> next: array<u32>;

      const blockSize = 8;

      fn getIndex(x: u32, y: u32) -> u32 {
        let h = settings.height;
        let w = settings.width;
        return (y % h) * w + (x % w);
      }

      fn getCell(x: u32, y: u32) -> u32 {
        return current[getIndex(x, y)];
      }

      fn countNeighbors(x: u32, y: u32) -> u32 {
        return getCell(x - 1, y - 1) + getCell(x, y - 1) + getCell(x + 1, y - 1) +
               getCell(x - 1, y)     +                     getCell(x + 1, y) +
               getCell(x - 1, y + 1) + getCell(x, y + 1) + getCell(x + 1, y + 1);
      }

      @compute @workgroup_size(blockSize, blockSize)
      fn main(@builtin(global_invocation_id) grid: vec3u) {
        let x = grid.x;
        let y = grid.y;

        if (x >= settings.width || y >= settings.height) {
          return;
        }

        let n = countNeighbors(x, y);
        let cellState = getCell(x, y);

        // Conway's Game of Life rules:
        // - Live cell with 2-3 neighbors: stays alive
        // - Dead cell with 3 neighbors: becomes alive
        // - All others: die or stay dead
        next[getIndex(x, y)] = select(u32(n == 3u), u32(n == 2u || n == 3u), cellState == 1u);
      }
    `;
  }
}

/**
 * Game of Life compute worker
 */
class GameOfLifeWorker extends ComputeWorker {
  private width: number;
  private height: number;

  constructor(width: number = 32, height: number = 32) {
    super();
    this.width = width;
    this.height = height;
  }

  build(device: GPUDevice): ComputeWorkerInstance<this> {
    const gridSize = this.width * this.height;

    // Create initial random state
    const initialState = new Uint32Array(gridSize);
    for (let i = 0; i < gridSize; i++) {
      initialState[i] = Math.random() > 0.7 ? 1 : 0; // 30% alive
    }

    // Settings uniform: grid dimensions
    const settings = new Uint32Array([this.width, this.height]);

    return new ComputeWorkerBuilder(device)
      .addUniform("settings", settings)
      .addStorage("current", initialState)
      .addStaging("next", new Uint32Array(gridSize))
      .addPass(
        GameOfLifeShader,
        [
          Math.ceil(this.width / 8), // Workgroups in X
          Math.ceil(this.height / 8), // Workgroups in Y
          1, // Workgroups in Z
        ],
        ["settings", "current", "next"]
      )
      .oneShot() // Execute on demand
      .build();
  }
}

/**
 * Helper to print the grid state
 */
function printGrid(data: number[], width: number, height: number): void {
  let output = "";
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      output += data[y * width + x] === 1 ? "█" : "·";
    }
    output += "\n";
  }
  console.log(output);
}

/**
 * Count alive cells
 */
function countAliveCells(data: number[]): number {
  return data.filter((cell) => cell === 1).length;
}

/**
 * Example usage - Run multiple generations
 */
export async function runGameOfLifeExample(device: GPUDevice): Promise<void> {
  console.log("=== Conway's Game of Life Example ===\n");

  const width = 16;
  const height = 16;
  const worker = new GameOfLifeWorker(width, height).build(device);

  // Get initial state
  console.log("Generation 0 (Initial State):");
  const gen0 = await worker.readVec("next");
  printGrid(gen0, width, height);
  console.log(`Alive cells: ${countAliveCells(gen0)}\n`);

  // Simulate several generations
  for (let gen = 1; gen <= 5; gen++) {
    // Swap buffers: copy next → current
    const previousState = await worker.readTypedArray("next", Uint32Array);
    worker.write("current", previousState);

    // Execute one generation
    await worker.execute();

    // Read new state
    const nextState = await worker.readVec("next");
    console.log(`Generation ${gen}:`);
    printGrid(nextState, width, height);
    console.log(`Alive cells: ${countAliveCells(nextState)}\n`);
  }

  worker.destroy();
  console.log("Game of Life example completed!\n");
}

/**
 * Create a known pattern (glider)
 */
export async function runGliderExample(device: GPUDevice): Promise<void> {
  console.log("=== Game of Life: Glider Pattern ===\n");

  const width = 12;
  const height = 12;
  const worker = new GameOfLifeWorker(width, height).build(device);

  // Create empty grid
  const grid = new Uint32Array(width * height);

  // Place a glider pattern at position (2, 2)
  const setCell = (x: number, y: number) => {
    grid[y * width + x] = 1;
  };

  // Glider pattern:
  //   ·█·
  //   ··█
  //   ███
  setCell(2, 1);
  setCell(3, 2);
  setCell(1, 3);
  setCell(2, 3);
  setCell(3, 3);

  // Set initial state
  worker.write("current", grid);
  worker.write("next", new Uint32Array(width * height));

  console.log("Generation 0 (Glider):");
  await worker.execute();
  const gen0 = await worker.readVec("next");
  printGrid(gen0, width, height);

  // Run 8 generations to see the glider move
  for (let gen = 1; gen <= 8; gen++) {
    const previousState = await worker.readTypedArray("next", Uint32Array);
    worker.write("current", previousState);
    await worker.execute();

    const nextState = await worker.readVec("next");
    console.log(`\nGeneration ${gen}:`);
    printGrid(nextState, width, height);
  }

  worker.destroy();
  console.log("\nGlider example completed! Notice how the pattern moves.\n");
}
