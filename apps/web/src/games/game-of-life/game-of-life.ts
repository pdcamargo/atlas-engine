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

export class GameOfLifePlugin implements EcsPlugin {
  private gridWidth = 128; // Grid width in cells
  private gridHeight = 128; // Grid height in cells
  private cellSize = 0.03; // Visual size of each cell
  private updateInterval = 100; // Milliseconds between generations
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
        const assetServer = commands.getResource(AssetServer);

        // Load a simple texture for cells
        const cellTexture = assetServer.load<ImageAsset>(
          "/sprites/character/sprites/RUN/run_down.png"
        );

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

        for (let y = 0; y < this.gridHeight; y++) {
          for (let x = 0; x < this.gridWidth; x++) {
            const sprite = new Sprite(cellTexture, this.cellSize, this.cellSize);

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

        console.log(`✅ Game of Life initialized (${this.gridWidth}x${this.gridHeight} grid)`);
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

        // Handle keyboard input
        this.handleInput(simulation);

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
        if (currentTime - this.lastUpdate < this.updateInterval && !simulation.stepMode) {
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

            for (let i = 0; i < cellData.length; i++) {
              const sprite = simulation.sprites[i];
              sprite.setTint(cellData[i] === 1 ? aliveColor : deadColor);
            }

            // Increment generation counter
            simulation.generation++;

            if (simulation.generation % 10 === 0) {
              console.log(`Generation ${simulation.generation}: ${aliveCount} alive cells`);
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
  private handleInput(simulation: GameOfLifeSimulation) {
    // Note: This is a simple keyboard check - you'd want to use proper input system
    // For now, we'll use DOM events
    if (!this.keyboardSetup) {
      this.setupKeyboard(simulation);
    }
  }

  private keyboardSetup = false;
  private keysPressed = new Set<string>();

  private setupKeyboard(simulation: GameOfLifeSimulation) {
    this.keyboardSetup = true;

    window.addEventListener("keydown", (e) => {
      if (this.keysPressed.has(e.key.toLowerCase())) return;
      this.keysPressed.add(e.key.toLowerCase());

      switch (e.key.toLowerCase()) {
        case " ": // Space - Pause/Resume
          simulation.isPaused = !simulation.isPaused;
          console.log(simulation.isPaused ? "⏸️ Paused" : "▶️ Resumed");
          break;

        case "s": // S - Single step
          if (simulation.isPaused) {
            simulation.stepMode = true;
            console.log("⏭️ Step forward");
          }
          break;

        case "r": // R - Random
          this.loadPattern(simulation, "random");
          break;

        case "g": // G - Glider
          this.loadPattern(simulation, "glider");
          break;

        case "p": // P - Pulsar
          this.loadPattern(simulation, "pulsar");
          break;

        case "l": // L - LWSS
          this.loadPattern(simulation, "lwss");
          break;

        case "w": // W - Gosper Glider Gun
          this.loadPattern(simulation, "gun");
          break;

        case "c": // C - Clear
          this.loadPattern(simulation, "clear");
          break;
      }
    });

    window.addEventListener("keyup", (e) => {
      this.keysPressed.delete(e.key.toLowerCase());
    });
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
        newState = GameOfLifePatterns.gosperGliderGun(w, h, centerX - 18, centerY - 5);
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
