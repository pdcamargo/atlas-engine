/**
 * Conway's Game of Life
 *
 * Interactive GPU-accelerated cellular automaton with multiple patterns
 * and real-time controls.
 */

import {
  App,
  DefaultPlugin,
  EcsPlugin,
  SceneGraph,
  Sprite,
  Color,
  OrthographicCamera,
  MainCamera,
  Time,
  GpuRenderDevice,
  AssetServer,
  ImageAsset,
  TextureFilter,
  Texture,
  Input,
  KeyCode,
} from "@atlas/engine";

import { TauriFileSystemAdapter } from "../../plugins/file-system";
import {
  GameOfLifeComputeWorker,
  GameOfLifePatterns,
} from "./game-of-life-compute";
import type { ComputeWorkerInstance } from "@atlas/engine";

/**
 * Game of Life simulation state
 */
class GameOfLifeSimulation {
  public isReading = false;
  public isPaused = false;
  public generation = 0;
  public stepMode = false; // If true, only advance one step at a time

  constructor(
    public worker: ComputeWorkerInstance,
    public workerBuilder: GameOfLifeComputeWorker,
    public width: number,
    public height: number,
    public sprites: Sprite[],
    public cellSize: number
  ) {}
}

function createGOLImage() {
  const size = 100;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Failed to get canvas context");
  }
  const fillStyle = new Color(0.2, 1.0, 0.4);
  const strokeStyle = new Color(0, 0, 0);
  ctx.fillStyle = fillStyle.toHex();
  ctx.strokeStyle = strokeStyle.toHex();
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size / 2, 0, 2 * Math.PI);
  ctx.fill();
  ctx.stroke();
  return canvas;
}

export class GameOfLifePlugin implements EcsPlugin {
  private gridWidth = 32; // Grid width in cells (small for testing)
  private gridHeight = 32; // Grid height in cells
  private cellSize = 0.1; // Visual size of each cell (large for visibility)
  private updateInterval = 200; // Milliseconds between generations (slower for debugging)
  private lastUpdate = 0;

  build(app: App) {
    app
      .addPlugins(
        new DefaultPlugin({
          fileSystemAdapter: new TauriFileSystemAdapter(),
          canvas: document.querySelector<HTMLCanvasElement>("canvas"),
        })
      )
      .addStartupSystems(({ commands }) => {
        console.log("🎮 Initializing Conway's Game of Life...");

        // Get resources
        const device = commands.getResource(GpuRenderDevice).get();

        // Load a simple texture for cells
        const cellTexture = Texture.fromSource(device, createGOLImage());

        const nearestFilter = new TextureFilter({
          minFilter: "nearest",
          magFilter: "nearest",
          mips: false,
        });

        // Create scene graph
        const sceneGraph = new SceneGraph();

        // Create compute worker with random initial state
        const initialState = GameOfLifePatterns.random(
          this.gridWidth,
          this.gridHeight,
          0.3
        );

        const golWorker = new GameOfLifeComputeWorker(
          this.gridWidth,
          this.gridHeight,
          initialState
        );
        const worker = golWorker.build(device);

        // Create sprites for each cell
        const cellSprites: Sprite[] = [];
        const aliveColor = new Color(0.2, 1.0, 0.4); // Green for alive
        const deadColor = new Color(0.1, 0.1, 0.1); // Dark for dead

        console.log(
          `Creating ${this.gridWidth * this.gridHeight} cell sprites...`
        );

        for (let y = 0; y < this.gridHeight; y++) {
          for (let x = 0; x < this.gridWidth; x++) {
            const sprite = new Sprite(
              cellTexture,
              this.cellSize,
              this.cellSize
            );

            // Position in grid (centered at origin)
            const worldX = (x - this.gridWidth / 2) * this.cellSize;
            const worldY = (y - this.gridHeight / 2) * this.cellSize;
            sprite.setPosition({ x: worldX, y: worldY });

            // Initial color based on state
            const index = y * this.gridWidth + x;
            sprite.setTint(initialState[index] === 1 ? aliveColor : deadColor);

            commands.spawn(sprite, nearestFilter);
            sceneGraph.addRoot(sprite);
            cellSprites.push(sprite);
          }
        }

        // Store simulation data
        const simulation = new GameOfLifeSimulation(
          worker,
          golWorker,
          this.gridWidth,
          this.gridHeight,
          cellSprites,
          this.cellSize
        );

        commands.spawn(simulation);

        // Create camera to fit the grid
        const aspect = this.gridWidth / this.gridHeight;
        const viewHeight = this.gridHeight * this.cellSize * 0.6;
        const viewWidth = viewHeight * aspect;

        const camera = new OrthographicCamera(
          -viewWidth / 2,
          viewWidth / 2,
          -viewHeight / 2,
          viewHeight / 2,
          0.1,
          100
        );
        camera.position.set(0, 0, 5);
        camera.target.set(0, 0, 0);
        camera.markViewDirty();

        commands.spawn(camera, new MainCamera());
        commands.spawn(sceneGraph);

        console.log(
          `✅ Game of Life initialized (${this.gridWidth}x${this.gridHeight} grid)`
        );
        console.log("🎮 Controls:");
        console.log("  SPACE - Pause/Resume");
        console.log("  R - Random pattern");
        console.log("  G - Glider");
        console.log("  P - Pulsar");
        console.log("  L - LWSS");
        console.log("  C - Clear");
        console.log("  S - Single step (when paused)");
      })
      .addUpdateSystems(({ commands }) => {
        const [, simulation] = commands.query(GameOfLifeSimulation).find();
        const time = commands.getResource(Time);
        const input = commands.getResource(Input);

        // Handle keyboard input
        this.handleInput(simulation, input);

        // Skip if paused (unless in step mode)
        if (simulation.isPaused && !simulation.stepMode) {
          return;
        }

        // Skip if still reading from previous frame
        if (simulation.isReading) {
          return;
        }

        // Throttle updates to updateInterval
        const currentTime = Date.now();
        if (
          currentTime - this.lastUpdate < this.updateInterval &&
          !simulation.stepMode
        ) {
          return;
        }
        this.lastUpdate = currentTime;

        // Debug: First frame
        if (simulation.generation === 0) {
          console.log("🚀 Starting Game of Life simulation...");
        }

        // Reset step mode
        simulation.stepMode = false;

        // Execute compute shader (non-blocking)
        simulation.worker.execute();

        // Mark as reading to prevent concurrent reads
        simulation.isReading = true;

        // Read the results asynchronously and update sprites
        simulation.worker
          .readTypedArray("next", Uint32Array)
          .then((cellData) => {
            // Count alive cells for debugging
            const aliveCount = cellData.reduce((sum, cell) => sum + cell, 0);

            // Copy output to input for next generation (ping-pong buffers)
            simulation.worker.write("current", cellData);

            // Update sprite colors based on cell state
            const aliveColor = new Color(0.2, 1.0, 0.4);
            const deadColor = new Color(0.1, 0.1, 0.1);

            let updatedCount = 0;
            for (let i = 0; i < cellData.length; i++) {
              const sprite = simulation.sprites[i];
              const newColor = cellData[i] === 1 ? aliveColor : deadColor;
              sprite.setTint(newColor); // Now properly marks sprite as dirty

              if (cellData[i] === 1) updatedCount++;
            }

            // Increment generation counter
            simulation.generation++;

            if (simulation.generation % 10 === 0) {
              console.log(
                `Generation ${simulation.generation}: ${aliveCount} alive cells (updated ${updatedCount} sprites)`
              );

              // Debug: Check first sprite's state
              const firstSprite = simulation.sprites[0];
              console.log(
                `  First sprite tint:`,
                firstSprite.getTint?.() || "no getTint method"
              );
              console.log(`  First cell state: ${cellData[0]}`);
            }
          })
          .catch((error) => {
            console.error("Failed to read Game of Life data:", error);
          })
          .finally(() => {
            simulation.isReading = false;
          });
      });
  }

  /**
   * Handle keyboard input for pattern selection and controls
   */
  private handleInput(simulation: GameOfLifeSimulation, input: Input) {
    // Space - Pause/Resume
    if (input.justPressed(KeyCode.Space)) {
      simulation.isPaused = !simulation.isPaused;
      console.log(simulation.isPaused ? "⏸️ Paused" : "▶️ Resumed");
    }

    // S - Single step (when paused)
    if (input.justPressed(KeyCode.KeyS)) {
      if (simulation.isPaused) {
        simulation.stepMode = true;
        console.log("⏭️ Step forward");
      }
    }

    // R - Random pattern
    if (input.justPressed(KeyCode.KeyR)) {
      this.loadPattern(simulation, "random");
    }

    // G - Glider
    if (input.justPressed(KeyCode.KeyG)) {
      this.loadPattern(simulation, "glider");
    }

    // P - Pulsar
    if (input.justPressed(KeyCode.KeyP)) {
      this.loadPattern(simulation, "pulsar");
    }

    // L - LWSS
    if (input.justPressed(KeyCode.KeyL)) {
      this.loadPattern(simulation, "lwss");
    }

    // W - Gosper Glider Gun
    if (input.justPressed(KeyCode.KeyW)) {
      this.loadPattern(simulation, "gun");
    }

    // C - Clear
    if (input.justPressed(KeyCode.KeyC)) {
      this.loadPattern(simulation, "clear");
    }
  }

  /**
   * Load a pattern into the simulation
   */
  private loadPattern(simulation: GameOfLifeSimulation, pattern: string) {
    const w = simulation.width;
    const h = simulation.height;
    const centerX = Math.floor(w / 2);
    const centerY = Math.floor(h / 2);

    let newState: Uint32Array;

    switch (pattern) {
      case "random":
        newState = GameOfLifePatterns.random(w, h, 0.3);
        console.log("🎲 Loaded random pattern");
        break;

      case "glider":
        newState = GameOfLifePatterns.glider(w, h, centerX - 2, centerY - 2);
        console.log("✈️ Loaded glider pattern");
        break;

      case "pulsar":
        newState = GameOfLifePatterns.pulsar(w, h, centerX - 6, centerY - 6);
        console.log("💫 Loaded pulsar pattern");
        break;

      case "lwss":
        newState = GameOfLifePatterns.lwss(w, h, centerX - 3, centerY - 2);
        console.log("🚀 Loaded LWSS pattern");
        break;

      case "gun":
        newState = GameOfLifePatterns.gosperGliderGun(
          w,
          h,
          centerX - 18,
          centerY - 5
        );
        console.log("🔫 Loaded Gosper Glider Gun");
        break;

      case "clear":
        newState = GameOfLifePatterns.empty(w, h);
        console.log("🧹 Cleared grid");
        break;

      default:
        return;
    }

    // Write new state to buffers
    simulation.worker.write("current", newState);
    simulation.worker.write("next", new Uint32Array(w * h));

    // Update sprites immediately
    const aliveColor = new Color(0.2, 1.0, 0.4);
    const deadColor = new Color(0.1, 0.1, 0.1);

    for (let i = 0; i < newState.length; i++) {
      simulation.sprites[i].setTint(newState[i] === 1 ? aliveColor : deadColor);
    }

    // Reset generation counter
    simulation.generation = 0;
  }
}
