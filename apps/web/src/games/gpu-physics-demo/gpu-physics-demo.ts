/**
 * GPU Physics Demo
 *
 * Demonstrates the GPU-accelerated 2D physics engine with:
 * - Falling boxes affected by gravity
 * - Static ground platform
 * - Interactive spawning (will be added later)
 */

import {
  App,
  EcsPlugin,
  Sprite,
  Color,
  OrthographicCamera,
  MainCamera,
  GpuRenderDevice,
  TextureFilter,
  Texture,
  Transform,
  Input,
  GpuPhysics2DPlugin,
  PhysicsSettings,
  RigidBody,
  Collider,
  CircleShape,
  RectShape,
  Velocity,
  sys,
  KeyCode,
  PixelsPerUnit,
} from "@atlas/engine";

// Helper to create a colored square texture
function createColoredSquare(size: number, color: Color): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Failed to get canvas context");

  ctx.fillStyle = color.toHex();
  ctx.fillRect(0, 0, size, size);

  // Border
  ctx.strokeStyle = new Color(0, 0, 0).toHex();
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, size - 2, size - 2);

  return canvas;
}

// Helper to create a colored circle texture
function createColoredCircle(radius: number, color: Color): HTMLCanvasElement {
  const size = radius * 2;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Failed to get canvas context");

  ctx.fillStyle = color.toHex();
  ctx.beginPath();
  ctx.arc(radius, radius, radius - 2, 0, 2 * Math.PI);
  ctx.fill();

  // Border
  ctx.strokeStyle = new Color(0, 0, 0).toHex();
  ctx.lineWidth = 2;
  ctx.stroke();

  return canvas;
}

export class GpuPhysicsDemoPlugin implements EcsPlugin {
  build(app: App) {
    // Configure physics settings
    const physicsSettings = new PhysicsSettings();
    physicsSettings.gravity = { x: 0, y: -980 }; // pixels/s² (≈ 9.8 m/s² at 100 PPU)
    physicsSettings.pixelsPerUnit = 1;

    // Add physics plugin
    app.addPlugins(new GpuPhysics2DPlugin(physicsSettings));

    app
      .addStartupSystems(({ commands }) => {
        PixelsPerUnit.setGlobal(1);

        commands.spawn(new Transform({ x: 0, y: 0 }));
        console.log("🎮 Initializing GPU Physics Demo...");

        const device = commands.getResource(GpuRenderDevice).get();

        // Create textures
        const boxTexture = Texture.fromSource(
          device,
          createColoredSquare(50, new Color(0.2, 0.6, 1.0)) // Blue boxes
        );
        const ballTexture = Texture.fromSource(
          device,
          createColoredCircle(25, new Color(1.0, 0.3, 0.3)) // Red balls
        );

        const nearestFilter = new TextureFilter({
          minFilter: "nearest",
          magFilter: "nearest",
          mips: false,
        });

        // Create ground (static platform)
        const groundWidth = 800;
        const groundHeight = 40;
        const groundY = -300;

        const groundSprite = new Sprite(boxTexture, groundWidth, groundHeight);
        groundSprite.setTint(new Color(0.3, 0.3, 0.3));

        commands.spawn(
          new Transform({ x: 0, y: groundY }),
          new RigidBody("static"),
          new Collider(new RectShape(groundWidth, groundHeight), {
            friction: 0.5,
            restitution: 0.2,
          }),
          groundSprite,
          nearestFilter
        );

        // Spawn falling boxes
        for (let i = 0; i < 10; i++) {
          const x = Math.random() - 0.5;
          const y = Math.random() - 0.5;
          const size = 40;

          const sprite = new Sprite(boxTexture, size, size);
          sprite.setTint(
            new Color(
              0.2 + Math.random() * 0.3,
              0.4 + Math.random() * 0.3,
              0.8 + Math.random() * 0.2
            )
          );
          sprite.setPosition({ x, y });

          commands.spawn(
            new Transform({ x, y }),
            new RigidBody("dynamic", {
              linearDamping: 0.01,
              angularDamping: 0.05,
            }),
            new Collider(new RectShape(size, size), {
              density: 1.0,
              friction: 0.5,
              restitution: 0.3,
            }),
            new Velocity(),
            sprite,
            nearestFilter
          );
        }

        // Spawn falling circles
        for (let i = 0; i < 10; i++) {
          const x = (Math.random() - 0.5) * 400;
          const y = 200 + i * 50;
          const radius = 20;

          const sprite = new Sprite(ballTexture, radius * 2, radius * 2);
          sprite.setTint(
            new Color(
              0.8 + Math.random() * 0.2,
              0.2 + Math.random() * 0.3,
              0.2 + Math.random() * 0.3
            )
          );

          commands.spawn(
            new Transform({ x, y }),
            new RigidBody("dynamic", {
              linearDamping: 0.01,
              angularDamping: 0.05,
            }),
            new Collider(new CircleShape(radius), {
              density: 1.0,
              friction: 0.3,
              restitution: 0.6,
            }),
            new Velocity(),
            sprite,
            nearestFilter
          );
        }

        // Create camera
        const viewHeight = 600;
        const camera = new OrthographicCamera(viewHeight / 2, 0.1, 1000);
        camera.position.set(0, 0, 5);

        commands.spawn(camera, new MainCamera());

        console.log("✅ GPU Physics Demo initialized");
        console.log("🎮 Controls:");
        console.log("  - Click to spawn a ball (coming soon)");
        console.log("  - Watch boxes fall with gravity!");
      })
      .addUpdateSystems(
        sys(({ commands }) => {
          const input = commands.getResource(Input);

          // Spawn ball on mouse click (for future interaction)
          if (input.justPressed(KeyCode.MouseLeft)) {
            // TODO: Get mouse world position and spawn ball
            console.log("Click detected - spawning not implemented yet");
          }
        })
          .label("HandleInput")
          .build()
      );
  }
}
