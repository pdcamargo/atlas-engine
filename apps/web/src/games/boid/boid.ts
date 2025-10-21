/**
 * Boids Flocking Simulation
 *
 * A GPU-accelerated demonstration of Craig Reynolds' Boids algorithm,
 * showcasing the compute shader framework with realistic flocking behavior.
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
  PerspectiveCamera,
} from "@atlas/engine";

import { TauriFileSystemAdapter } from "../../plugins/file-system";
import {
  BoidComputeWorker,
  DEFAULT_BOID_PARAMS,
  type BoidSimParams,
} from "./boid-compute";
import type { ComputeWorkerInstance } from "@atlas/engine";

/**
 * Component to mark the boid simulation worker
 */
class BoidSimulation {
  public isReading = false;

  constructor(
    public worker: ComputeWorkerInstance,
    public workerBuilder: BoidComputeWorker,
    public boidCount: number,
    public sprites: Sprite[],
    public params: BoidSimParams
  ) {}
}

function createBoidImageData() {
  const radius = 50;
  const canvas = document.createElement("canvas");
  canvas.width = radius * 2;
  canvas.height = radius * 2;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Failed to get canvas context");
  }
  ctx.fillStyle = "white";
  ctx.beginPath();
  ctx.arc(radius, radius, radius, 0, 2 * Math.PI);
  ctx.fill();

  return canvas;
}

export class BoidGamePlugin implements EcsPlugin {
  private boidCount = 5000; // Number of boids in the simulation
  private boidSize = 0.05; // Visual size of each boid

  build(app: App) {
    app
      .addPlugins(
        new DefaultPlugin({
          fileSystemAdapter: new TauriFileSystemAdapter(),
          canvas: document.querySelector<HTMLCanvasElement>("canvas"),
        })
      )
      .addStartupSystems(async ({ commands }) => {
        console.log("🐦 Initializing Boids Simulation...");

        const imageData = createBoidImageData();

        // Get resources
        const device = commands.getResource(GpuRenderDevice).get();
        // Load a simple texture for boids (or create a colored sprite)
        const boidTexture = Texture.fromSource(device, imageData);

        const nearestFilter = new TextureFilter({
          minFilter: "nearest",
          magFilter: "nearest",
          mips: false,
        });

        // Create scene graph
        const sceneGraph = new SceneGraph();

        // Create compute worker for boid simulation
        const boidWorker = new BoidComputeWorker(
          this.boidCount,
          DEFAULT_BOID_PARAMS
        );
        const worker = boidWorker.build(device);

        // Check for shader compilation errors (async, won't block initialization)
        (async () => {
          const { BoidUpdateShader } = await import("./boid-compute");
          const shader = new BoidUpdateShader();
          const messages = await shader.checkCompilation(device);
          for (const msg of messages) {
            if (msg.type === "error") {
              console.error("❌ Boid shader error:", msg.message);
            } else if (msg.type === "warning") {
              console.warn("⚠️ Boid shader warning:", msg.message);
            }
          }
        })();

        // Create sprites for each boid
        const boidSprites: Sprite[] = [];
        const colors = [
          new Color(0.2, 0.6, 1.0), // Blue
          new Color(0.2, 1.0, 0.6), // Cyan
          new Color(1.0, 0.6, 0.2), // Orange
          new Color(1.0, 0.2, 0.6), // Pink
          new Color(0.6, 0.2, 1.0), // Purple
        ];

        for (let i = 0; i < this.boidCount; i++) {
          const sprite = new Sprite(boidTexture, this.boidSize, this.boidSize);

          // Assign color based on index for visual variety
          const colorIndex = i % colors.length;
          sprite.setTint(colors[colorIndex]);

          commands.spawn(sprite, nearestFilter);
          sceneGraph.addRoot(sprite);
          boidSprites.push(sprite);
        }

        // Store simulation data
        const simulation = new BoidSimulation(
          worker,
          boidWorker,
          this.boidCount,
          boidSprites,
          { ...DEFAULT_BOID_PARAMS }
        );

        commands.spawn(simulation);

        const aspectRatio = 1;
        const near = 0.1;
        const far = 100;
        // Create camera
        const camera = new PerspectiveCamera(undefined, aspectRatio, near, far);
        camera.position.set(0, 0, 5);
        camera.target.set(0, 0, 0);
        camera.markViewDirty();

        commands.spawn(camera, new MainCamera());
        commands.spawn(sceneGraph);

        console.log(
          `✅ Boids simulation initialized with ${this.boidCount} boids`
        );
        console.log("🎮 Controls:");
        console.log("  - Watch the boids flock naturally!");
        console.log("  - Try modifying params in BoidSimulation component");
      })
      .addUpdateSystems(({ commands }) => {
        // Update boid simulation
        const [, simulation] = commands.query(BoidSimulation).find();
        const time = commands.getResource(Time);

        // Skip if still reading from previous frame
        if (simulation.isReading) {
          return;
        }

        // Update deltaTime in simulation params
        simulation.params.deltaTime = time.deltaTime;

        // Update worker params (reuse the existing builder instance)
        simulation.workerBuilder.updateParams(
          simulation.worker,
          simulation.params
        );

        // Execute compute shader (non-blocking)
        simulation.worker.execute();

        // Mark as reading to prevent concurrent reads
        simulation.isReading = true;

        // Read the results asynchronously and update sprites (non-blocking)
        simulation.worker
          .readTypedArray("boidsDst", Float32Array)
          .then((boidData) => {
            // Copy output to input for next frame (ping-pong buffers)
            simulation.worker.write("boidsSrc", boidData);

            // Update sprite positions from boid data
            for (let i = 0; i < simulation.boidCount; i++) {
              const offset = i * 4;
              const x = boidData[offset + 0];
              const y = boidData[offset + 1];
              const vx = boidData[offset + 2];
              const vy = boidData[offset + 3];

              const sprite = simulation.sprites[i];
              sprite.setPosition({ x, y });

              // Rotate sprite to face direction of movement
              const angle = Math.atan2(vy, vx);
              sprite.setRotation(angle);
            }
          })
          .catch((error) => {
            console.error("Failed to read boid data:", error);
          })
          .finally(() => {
            simulation.isReading = false;
          });
      });
  }
}
