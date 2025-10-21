/**
 * Conway's Game of Life - Compute Shader Implementation
 *
 * A cellular automaton where cells live or die based on their neighbors:
 * - Any live cell with 2-3 live neighbors survives
 * - Any dead cell with exactly 3 live neighbors becomes alive
 * - All other cells die or stay dead
 */

import {
  ComputeShader,
  ComputeWorker,
  ComputeWorkerBuilder,
  type ComputeWorkerInstance,
} from "@atlas/engine";

/**
 * Game of Life compute shader
 */
export class GameOfLifeShader extends ComputeShader {
  shader() {
    return `
      struct Settings {
        width: u32,
        height: u32,
      }

      @binding(0) @group(0) var<uniform> settings: Settings;
      @binding(1) @group(0) var<storage, read> current: array<u32>;
      @binding(2) @group(0) var<storage, read_write> next: array<u32>;

      const blockSize = 8u;

      fn getIndex(x: u32, y: u32) -> u32 {
        let h = settings.height;
        let w = settings.width;
        return (y % h) * w + (x % w);
      }

      fn getCell(x: u32, y: u32) -> u32 {
        return current[getIndex(x, y)];
      }

      fn countNeighbors(x: u32, y: u32) -> u32 {
        return getCell(x - 1u, y - 1u) + getCell(x, y - 1u) + getCell(x + 1u, y - 1u) +
               getCell(x - 1u, y)     +                       getCell(x + 1u, y) +
               getCell(x - 1u, y + 1u) + getCell(x, y + 1u) + getCell(x + 1u, y + 1u);
      }

      @compute @workgroup_size(blockSize, blockSize)
      fn main(@builtin(global_invocation_id) grid: vec3<u32>) {
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
export class GameOfLifeComputeWorker extends ComputeWorker {
  constructor(
    private width: number,
    private height: number,
    private initialState?: Uint32Array
  ) {
    super();
  }

  build(device: GPUDevice): ComputeWorkerInstance<this> {
    const gridSize = this.width * this.height;

    // Create initial state (random if not provided)
    let initialData: Uint32Array;
    if (this.initialState) {
      initialData = this.initialState;
    } else {
      initialData = new Uint32Array(gridSize);
      for (let i = 0; i < gridSize; i++) {
        initialData[i] = Math.random() > 0.7 ? 1 : 0; // 30% alive
      }
    }

    // Settings uniform: grid dimensions
    const settings = new Uint32Array([this.width, this.height]);

    return new ComputeWorkerBuilder(device)
      .addUniform("settings", settings)
      .addStorage("current", initialData)
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
      .build();
  }
}

/**
 * Predefined patterns for Game of Life
 */
export class GameOfLifePatterns {
  /**
   * Create a glider pattern at the specified position
   */
  static glider(
    width: number,
    height: number,
    x: number,
    y: number
  ): Uint32Array {
    const grid = new Uint32Array(width * height);
    const setCell = (cx: number, cy: number) => {
      if (cx >= 0 && cx < width && cy >= 0 && cy < height) {
        grid[cy * width + cx] = 1;
      }
    };

    // Glider pattern:
    //   ·█·
    //   ··█
    //   ███
    setCell(x + 1, y);
    setCell(x + 2, y + 1);
    setCell(x, y + 2);
    setCell(x + 1, y + 2);
    setCell(x + 2, y + 2);

    return grid;
  }

  /**
   * Create a lightweight spaceship (LWSS) pattern
   */
  static lwss(
    width: number,
    height: number,
    x: number,
    y: number
  ): Uint32Array {
    const grid = new Uint32Array(width * height);
    const setCell = (cx: number, cy: number) => {
      if (cx >= 0 && cx < width && cy >= 0 && cy < height) {
        grid[cy * width + cx] = 1;
      }
    };

    // LWSS pattern:
    //   ·███·
    //   █···█
    //   ····█
    //   █··█·
    setCell(x + 1, y);
    setCell(x + 2, y);
    setCell(x + 3, y);
    setCell(x, y + 1);
    setCell(x + 4, y + 1);
    setCell(x + 4, y + 2);
    setCell(x, y + 3);
    setCell(x + 3, y + 3);

    return grid;
  }

  /**
   * Create a Gosper Glider Gun pattern
   */
  static gosperGliderGun(
    width: number,
    height: number,
    x: number,
    y: number
  ): Uint32Array {
    const grid = new Uint32Array(width * height);
    const setCell = (cx: number, cy: number) => {
      if (cx >= 0 && cx < width && cy >= 0 && cy < height) {
        grid[cy * width + cx] = 1;
      }
    };

    // Gosper Glider Gun pattern (36x9)
    const pattern = [
      [24, 0],
      [22, 1],
      [24, 1],
      [12, 2],
      [13, 2],
      [20, 2],
      [21, 2],
      [34, 2],
      [35, 2],
      [11, 3],
      [15, 3],
      [20, 3],
      [21, 3],
      [34, 3],
      [35, 3],
      [0, 4],
      [1, 4],
      [10, 4],
      [16, 4],
      [20, 4],
      [21, 4],
      [0, 5],
      [1, 5],
      [10, 5],
      [14, 5],
      [16, 5],
      [17, 5],
      [22, 5],
      [24, 5],
      [10, 6],
      [16, 6],
      [24, 6],
      [11, 7],
      [15, 7],
      [12, 8],
      [13, 8],
    ];

    for (const [px, py] of pattern) {
      setCell(x + px, y + py);
    }

    return grid;
  }

  /**
   * Create a random pattern with specified density
   */
  static random(
    width: number,
    height: number,
    density: number = 0.3
  ): Uint32Array {
    const grid = new Uint32Array(width * height);
    for (let i = 0; i < width * height; i++) {
      grid[i] = Math.random() < density ? 1 : 0;
    }
    return grid;
  }

  /**
   * Create a pulsar pattern (period-3 oscillator)
   */
  static pulsar(
    width: number,
    height: number,
    x: number,
    y: number
  ): Uint32Array {
    const grid = new Uint32Array(width * height);
    const setCell = (cx: number, cy: number) => {
      if (cx >= 0 && cx < width && cy >= 0 && cy < height) {
        grid[cy * width + cx] = 1;
      }
    };

    // Pulsar pattern (13x13)
    const offsets = [
      [2, 0],
      [3, 0],
      [4, 0],
      [8, 0],
      [9, 0],
      [10, 0],
      [0, 2],
      [5, 2],
      [7, 2],
      [12, 2],
      [0, 3],
      [5, 3],
      [7, 3],
      [12, 3],
      [0, 4],
      [5, 4],
      [7, 4],
      [12, 4],
      [2, 5],
      [3, 5],
      [4, 5],
      [8, 5],
      [9, 5],
      [10, 5],
      [2, 7],
      [3, 7],
      [4, 7],
      [8, 7],
      [9, 7],
      [10, 7],
      [0, 8],
      [5, 8],
      [7, 8],
      [12, 8],
      [0, 9],
      [5, 9],
      [7, 9],
      [12, 9],
      [0, 10],
      [5, 10],
      [7, 10],
      [12, 10],
      [2, 12],
      [3, 12],
      [4, 12],
      [8, 12],
      [9, 12],
      [10, 12],
    ];

    for (const [px, py] of offsets) {
      setCell(x + px, y + py);
    }

    return grid;
  }

  /**
   * Create an empty grid
   */
  static empty(width: number, height: number): Uint32Array {
    return new Uint32Array(width * height);
  }
}
