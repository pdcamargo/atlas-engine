import {
  App,
  DefaultPlugin,
  EcsPlugin,
  AssetServer,
  ImageAsset,
  SceneGraph,
  Sprite,
  Color,
  OrthographicCamera,
  Rect,
  MainCamera,
  Time,
  TextureFilter,
  AnimatorPlugin,
  Animation,
  Timeline,
  AnimationController,
  AnimationManager,
  Easing,
  LoopMode,
  AnimationStartedEvent,
  AnimationCompletedEvent,
  AnimationLoopedEvent,
  TimelineMarkerEvent,
  ControllerStateChangedEvent,
} from "@atlas/engine";

import { TauriFileSystemAdapter } from "../../plugins/file-system";

// Custom event for timeline marker
class ExplosionEvent {
  constructor(
    public entity: number,
    public markerName: string
  ) {}
}

// Resource to store demo state
class AnimatorDemoState {
  public controllerEntity: number | null = null;
  public timelineEntity: number | null = null;
}

/**
 * AnimatorDemoPlugin - Visual demonstration of the animator system
 *
 * This demo creates CLEAR visual examples of animations:
 * 1. Bouncing balls with different easing functions
 * 2. A sprite that follows a complex path (timeline)
 * 3. A character with jump/fall state machine
 * 4. Particle explosions
 * 5. Rotating/scaling objects
 */
export class AnimatorDemoPlugin implements EcsPlugin {
  build(app: App) {
    app
      .addPlugins(
        new DefaultPlugin({
          fileSystemAdapter: new TauriFileSystemAdapter(),
          canvas: document.querySelector<HTMLCanvasElement>("canvas"),
        }),
        new AnimatorPlugin()
      )
      .addEvent(ExplosionEvent)
      .addStartupSystems(({ commands }) => {
        const assetServer = commands.getResource(AssetServer);
        const sceneGraph = new SceneGraph();

        const textureHandle = assetServer.load<ImageAsset>(
          "/sprites/character/sprites/RUN/run_down.png"
        );

        const nearestFilter = new TextureFilter({
          minFilter: "nearest",
          magFilter: "nearest",
          mips: false,
        });

        console.log("=== ANIMATOR DEMO - Watch the animations! ===");

        // ===================================================================
        // DEMO 1: BOUNCING BALLS - Different Easing Functions
        // ===================================================================
        console.log("\n🎾 BOUNCING BALLS (Different Easing)");
        console.log("Watch how each ball bounces differently!");

        const ballsData = [
          {
            x: -2.5,
            easing: Easing.linear,
            color: new Color(1, 0, 0),
            name: "Linear",
          },
          {
            x: -1.5,
            easing: Easing.easeInQuad,
            color: new Color(1, 0.5, 0),
            name: "EaseIn",
          },
          {
            x: -0.5,
            easing: Easing.easeOutQuad,
            color: new Color(1, 1, 0),
            name: "EaseOut",
          },
          {
            x: 0.5,
            easing: Easing.easeInOutQuad,
            color: new Color(0, 1, 0),
            name: "InOut",
          },
          {
            x: 1.5,
            easing: Easing.easeOutBounce,
            color: new Color(0, 1, 1),
            name: "Bounce",
          },
          {
            x: 2.5,
            easing: Easing.easeOutElastic,
            color: new Color(1, 0, 1),
            name: "Elastic",
          },
        ];

        for (const ball of ballsData) {
          const sprite = new Sprite(textureHandle, 0.4, 0.4);
          sprite.setTint(ball.color);
          sprite.setPosition({ x: ball.x, y: 2 });
          sprite.setFrame(new Rect(0, 0, 0.125, 1));

          sceneGraph.addRoot(sprite);
          const entity = commands.spawn(sprite, nearestFilter).id();

          // Bounce up and down - EXAGGERATED movement
          commands.addComponent(
            entity,
            new Animation({
              id: `ball-${ball.name}`,
              target: sprite.position,
              property: "y",
              from: 2,
              to: -1.5, // Big vertical movement!
              duration: 2.0,
              easing: ball.easing,
              loopMode: LoopMode.PingPong,
              autoRemove: false,
            })
          );

          console.log(`  ${ball.name} ball at x=${ball.x}`);
        }

        // ===================================================================
        // DEMO 2: TIMELINE - Sprite Following a Path
        // ===================================================================
        console.log("\n🎯 TIMELINE SEQUENCE");
        console.log("Orange sprite: moves in a square pattern with events!");

        const pathSprite = new Sprite(textureHandle, 0.6, 0.6);
        pathSprite.setTint(new Color(1, 0.5, 0));
        pathSprite.setPosition({ x: -3, y: -2.5 });
        pathSprite.setFrame(new Rect(0, 0, 0.125, 1));

        sceneGraph.addRoot(pathSprite);
        const timelineEntity = commands.spawn(pathSprite, nearestFilter).id();

        // Create a square path with scale changes
        commands.addComponent(
          timelineEntity,
          new Timeline({
            tracks: [
              // Right side
              {
                target: pathSprite.position,
                property: "x",
                from: -3,
                to: 3,
                duration: 2.0,
                delay: 0,
                easing: Easing.easeInOutQuad,
              },
              // Scale up during right movement
              {
                target: pathSprite.scale,
                property: "x",
                from: 0.6,
                to: 1.2,
                duration: 1.0,
                delay: 0,
                easing: Easing.easeOutQuad,
              },
              {
                target: pathSprite.scale,
                property: "y",
                from: 0.6,
                to: 1.2,
                duration: 1.0,
                delay: 0,
                easing: Easing.easeOutQuad,
              },
              // Scale back down
              {
                target: pathSprite.scale,
                property: "x",
                from: 1.2,
                to: 0.6,
                duration: 1.0,
                delay: 1.0,
                easing: Easing.easeInQuad,
              },
              {
                target: pathSprite.scale,
                property: "y",
                from: 1.2,
                to: 0.6,
                duration: 1.0,
                delay: 1.0,
                easing: Easing.easeInQuad,
              },
              // Up side
              {
                target: pathSprite.position,
                property: "y",
                from: -2.5,
                to: 2.5,
                duration: 2.0,
                delay: 2.0,
                easing: Easing.easeInOutQuad,
              },
              // Left side
              {
                target: pathSprite.position,
                property: "x",
                from: 3,
                to: -3,
                duration: 2.0,
                delay: 4.0,
                easing: Easing.easeInOutQuad,
              },
              // Down side
              {
                target: pathSprite.position,
                property: "y",
                from: 2.5,
                to: -2.5,
                duration: 2.0,
                delay: 6.0,
                easing: Easing.easeInOutQuad,
              },
            ],
            markers: [
              {
                time: 1.0,
                name: "quarter",
                eventClass: ExplosionEvent,
              },
              {
                time: 3.0,
                name: "halfway",
                eventClass: ExplosionEvent,
              },
              {
                time: 5.0,
                name: "three_quarters",
                eventClass: ExplosionEvent,
              },
              {
                time: 7.0,
                name: "complete",
                eventClass: ExplosionEvent,
              },
            ],
            loopMode: LoopMode.Loop,
            autoRemove: false,
          })
        );

        console.log("  Moves in a square (8 second loop)");
        console.log("  Watch it scale and rotate!");

        // ===================================================================
        // DEMO 3: STATE MACHINE - Jumping Character
        // ===================================================================
        console.log("\n🤸 CHARACTER STATE MACHINE");
        console.log("Green character: jumps every 3 seconds");

        const characterSprite = new Sprite(textureHandle, 0.8, 0.8);
        characterSprite.setTint(new Color(0.3, 1, 0.3));
        characterSprite.setPosition({ x: 0, y: -2 });
        characterSprite.setFrame(new Rect(0, 0, 0.125, 1));

        sceneGraph.addRoot(characterSprite);
        const controllerEntity = commands
          .spawn(characterSprite, nearestFilter)
          .id();

        const controller = new AnimationController({
          states: [
            {
              name: "idle",
              animation: {
                target: characterSprite.scale,
                property: "x",
                from: 0.8,
                to: 0.9,
                duration: 1.0,
                easing: Easing.easeInOutSine,
                loop: LoopMode.PingPong,
              },
            },
            {
              name: "jump",
              animation: {
                target: characterSprite.position,
                property: "y",
                from: -2,
                to: 0.5, // Jump HIGH!
                duration: 0.5,
                easing: Easing.easeOutQuad,
              },
            },
            {
              name: "fall",
              animation: {
                target: characterSprite.position,
                property: "y",
                from: 0.5,
                to: -2,
                duration: 0.5,
                easing: Easing.easeInQuad,
              },
            },
          ],
          transitions: [
            {
              from: "idle",
              to: "jump",
              condition: (params) => params.get("trigger_jump") === true,
            },
            {
              from: "jump",
              to: "fall",
              condition: (params) => (params.get("jump_elapsed") ?? 0) >= 0.5,
            },
            {
              from: "fall",
              to: "idle",
              condition: (params) => params.get("grounded") === true,
            },
          ],
          initialState: "idle",
        });

        commands.addComponent(controllerEntity, controller);
        console.log("  States: idle (breathing) → jump → fall → idle");

        // Store state
        const demoState = new AnimatorDemoState();
        demoState.controllerEntity = controllerEntity;
        demoState.timelineEntity = timelineEntity;
        commands.setResource(demoState);

        // ===================================================================
        // DEMO 4: ROTATING CIRCLE - Multiple Simultaneous Animations
        // ===================================================================
        console.log("\n⭕ ROTATING CIRCLE");
        console.log("8 sprites rotating and pulsing");

        const numCircleSprites = 8;
        const radius = 2.0;
        const centerY = 0.5;

        for (let i = 0; i < numCircleSprites; i++) {
          const angle = (i / numCircleSprites) * Math.PI * 2;
          const x = Math.cos(angle) * radius;
          const y = Math.sin(angle) * radius + centerY;

          const sprite = new Sprite(textureHandle, 0.3, 0.3);
          const hue = i / numCircleSprites;
          sprite.setTint(
            new Color(
              Math.abs(Math.sin(hue * Math.PI * 2)),
              Math.abs(Math.sin((hue + 0.33) * Math.PI * 2)),
              Math.abs(Math.sin((hue + 0.66) * Math.PI * 2))
            )
          );
          sprite.setPosition({ x, y });
          sprite.setFrame(new Rect(0, 0, 0.125, 1));

          sceneGraph.addRoot(sprite);
          const entity = commands.spawn(sprite, nearestFilter).id();

          // Each sprite orbits around the center
          const orbitSpeed = 3.0 + i * 0.3;

          // Animate position in a circle
          commands.addComponent(
            entity,
            new Animation({
              target: sprite.position,
              property: "x",
              from: x,
              to: x, // Will be updated in system
              duration: orbitSpeed,
              easing: Easing.linear,
              loopMode: LoopMode.Loop,
              autoRemove: false,
            })
          );

          // Scale pulse X
          commands.addComponent(
            entity,
            new Animation({
              target: sprite.scale,
              property: "x",
              from: 0.3,
              to: 0.5,
              duration: 1.0 + i * 0.1,
              easing: Easing.easeInOutSine,
              loopMode: LoopMode.PingPong,
              autoRemove: false,
            })
          );

          // Scale pulse Y
          commands.addComponent(
            entity,
            new Animation({
              target: sprite.scale,
              property: "y",
              from: 0.3,
              to: 0.5,
              duration: 1.0 + i * 0.1,
              easing: Easing.easeInOutSine,
              loopMode: LoopMode.PingPong,
              autoRemove: false,
            })
          );
        }

        console.log("  Each sprite has 2 animations running (scale pulse)!");

        // ===================================================================
        // Camera Setup
        // ===================================================================
        const camera = new OrthographicCamera(-4, 4, -3, 3, 0.1, 100);
        camera.position.set(0, 0, 5);
        camera.target.set(0, 0, 0);
        camera.markViewDirty();

        commands.spawn(camera, new MainCamera());
        commands.spawn(sceneGraph);

        console.log("\n✨ Watch the screen - animations are running!");
        console.log("Check console for animation events...\n");
      })
      .addUpdateSystems(({ commands, events }) => {
        const time = commands.getResource(Time);
        const demoState = commands.getResource(AnimatorDemoState);

        // ===================================================================
        // Update Animation Controller (Character Jump)
        // ===================================================================
        if (demoState?.controllerEntity !== null) {
          const controller = commands.tryGetComponent(
            demoState.controllerEntity!,
            AnimationController
          );

          if (controller) {
            const runtime = controller.getCurrentStateRuntime();
            if (runtime) {
              controller.setFloat("jump_elapsed", runtime.elapsed);
            }

            // Check if grounded (get the sprite to check its Y position)
            const sprite = commands.tryGetComponent(
              demoState.controllerEntity!,
              Sprite
            );
            if (sprite) {
              controller.setBool("grounded", sprite.position.y <= -1.9);
            }

            // Trigger jump every 3 seconds
            const jumpInterval = 3.0;
            const currentCycle = Math.floor(time.elapsed / jumpInterval);
            const previousCycle = Math.floor(
              (time.elapsed - time.deltaTime) / jumpInterval
            );

            if (currentCycle !== previousCycle) {
              controller.setTrigger("trigger_jump");
              console.log("🤸 Character jumps!");
            }
          }
        }

        // ===================================================================
        // Spawn Explosion Particles
        // ===================================================================
        const animManager = commands.getResource(AnimationManager);

        // Spawn particles every 0.3 seconds
        if (
          Math.floor(time.elapsed * 3.33) !==
          Math.floor((time.elapsed - time.deltaTime) * 3.33)
        ) {
          const textureHandle = commands
            .getResource(AssetServer)
            .load<ImageAsset>("/sprites/character/sprites/RUN/run_down.png");

          // Random position
          const particleX = (Math.random() - 0.5) * 6;
          const particleY = (Math.random() - 0.5) * 4;

          const particle = new Sprite(textureHandle, 0.2, 0.2);
          particle.setTint(
            new Color(
              0.5 + Math.random() * 0.5,
              0.5 + Math.random() * 0.5,
              0.5 + Math.random() * 0.5
            )
          );
          particle.setPosition({ x: particleX, y: particleY });
          particle.setFrame(new Rect(0, 0, 0.125, 1));

          const sceneGraphs = commands.query(SceneGraph).all();
          for (const [, sg] of sceneGraphs) {
            sg.addRoot(particle);
            break;
          }

          const nearestFilter = new TextureFilter({
            minFilter: "nearest",
            magFilter: "nearest",
            mips: false,
          });

          commands.spawn(particle, nearestFilter);

          // Animate: expand and fade out
          animManager.createAnimations(commands, [
            {
              target: particle.scale,
              property: "x",
              from: 0.2,
              to: 0.01,
              duration: 1.0,
              easing: Easing.easeOutQuad,
            },
            {
              target: particle.scale,
              property: "y",
              from: 0.2,
              to: 0.01,
              duration: 1.0,
              easing: Easing.easeOutQuad,
            },
            {
              target: particle.tint!,
              property: "a",
              from: 1,
              to: 0,
              duration: 1.0,
              easing: Easing.easeInQuad,
            },
          ]);
        }

        // ===================================================================
        // Event Logging
        // ===================================================================
        const startedReader = events.reader(AnimationStartedEvent);
        for (const event of startedReader.read()) {
          console.log(`🎬 Started: ${event.animationId}`);
        }

        const completedReader = events.reader(AnimationCompletedEvent);
        for (const event of completedReader.read()) {
          console.log(`✅ Completed: ${event.animationId}`);
        }

        const loopedReader = events.reader(AnimationLoopedEvent);
        for (const event of loopedReader.read()) {
          if (event.loopCount % 5 === 0) {
            console.log(
              `🔁 ${event.animationId} looped ${event.loopCount} times`
            );
          }
        }

        const markerReader = events.reader(TimelineMarkerEvent);
        for (const event of markerReader.read()) {
          console.log(
            `📍 Timeline marker: ${event.markerName} at ${event.time.toFixed(1)}s`
          );
        }

        const explosionReader = events.reader(ExplosionEvent);
        for (const event of explosionReader.read()) {
          console.log(`💥 BOOM at ${event.markerName}!`);
        }

        const stateReader = events.reader(ControllerStateChangedEvent);
        for (const event of stateReader.read()) {
          console.log(`🎮 State: ${event.fromState} → ${event.toState}`);
        }

        // Stats every 10 seconds
        if (
          Math.floor(time.elapsed / 10) !==
          Math.floor((time.elapsed - time.deltaTime) / 10)
        ) {
          const stats = animManager.getStats();
          console.log(
            `\n📊 Stats: ${stats.created} created, ${stats.active} active\n`
          );
        }
      });
  }

  name(): string {
    return "AnimatorDemoPlugin";
  }
}
