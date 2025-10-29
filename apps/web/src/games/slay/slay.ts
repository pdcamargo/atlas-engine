import {
  App,
  EcsPlugin,
  AssetServer,
  ImageAsset,
  Sprite,
  Color,
  PerspectiveCamera,
  Rect,
  WebgpuRenderer,
  TileMap,
  TileSet,
  AudioClip,
  AudioSource,
  AudioListener,
  MainCamera,
  Input,
  KeyCode,
  Time,
  TextureFilter,
  AnimatedSprite,
  AnimatedSpriteAnimation,
  OutlineEffect,
  ShadowEffect,
  VignetteEffect,
  ChromaticAberrationEffect,
  BloomEffect,
  ParticlePresets,
  PointLight,
  PixelsPerUnit,
} from "@atlas/engine";

export class SlayGamePlugin implements EcsPlugin {
  build(app: App) {
    app
      .addStartupSystems(({ commands }) => {
        // Set global pixels-per-unit: 16 pixels = 1 world unit
        // This ensures sprites and tiles with same pixel size render at same size
        PixelsPerUnit.setGlobal(100);

        // Get the asset server
        const assetServer = commands.getResource(AssetServer);

        // Load texture handles
        const textureHandle = assetServer.load<ImageAsset>(
          "/sprites/character/sprites/RUN/run_down.png"
        );
        const textureHandle2 = assetServer.load<ImageAsset>(
          "/sprites/character/sprites/RUN/run_up.png"
        );
        const textureHandle3 = assetServer.load<ImageAsset>(
          "/sprites/character/sprites/RUN/run_left.png"
        );
        const textureHandle4 = assetServer.load<ImageAsset>(
          "/sprites/character/sprites/RUN/run_right.png"
        );
        const tilemapHandle = assetServer.load<ImageAsset>(
          "/sprites/Assets.png"
        );

        const frames = 8;
        const frameWidth = 1 / frames;

        const nearestFilter = new TextureFilter({
          minFilter: "nearest",
          magFilter: "nearest",
          mips: false,
        });

        // Create TileMap with 16x16 pixel tiles
        // With PPU=16, these become 1x1 world unit tiles
        const tilemap = new TileMap({
          tileWidth: 16,
          tileHeight: 16,
        });

        // TileSet must use the same pixel dimensions (16x16) to match the TileMap
        const tileSet = new TileSet(tilemapHandle, 16, 16);

        tileSet.addTilesFromGrid(13, 21);

        // Add an animated tile (e.g., water animation)
        // This creates an animated tile from a horizontal sequence in the grid
        // Tile ID 1000 will be the animated water tile
        tileSet.addAnimatedTileFromGrid(
          333, // tile ID
          0, // start column
          3, // start row
          4, // 4 frames
          200, // 200ms per frame
          true, // horizontal sequence
          true, // loop
          1.0 // normal speed
        );

        // Background layer - farthest from camera
        // Use z=-100 to give plenty of room for Y-sorted sprites above it
        tilemap.setPosition({ x: -1, y: -1, z: -0.1 });

        const layer = tilemap.addLayer("default");

        for (let i = 0; i < 100; i++) {
          for (let j = 0; j < 100; j++) {
            layer.setTileById(i, j, tileSet, 0);
          }
        }

        for (let i = 101; i < 110; i++) {
          for (let j = 101; j < 110; j++) {
            layer.setTileById(i, j, tileSet, 333);
          }
        }

        // // Add tiles - they won't render until texture loads, but that's okay!
        // // We need to wait for texture to load before calling addTilesFromGrid
        // // For now, let's add a simple update system to handle this

        commands.spawn(tilemap, nearestFilter);

        for (let i = 0; i < 0; i++) {
          const sprite = new Sprite(textureHandle);
          sprite.setTint(
            new Color(Math.random(), Math.random(), Math.random())
          );
          const frameIndex = 1;
          sprite.setFrame(new Rect(frameIndex * frameWidth, 0, frameWidth, 1));
          commands.spawn(sprite, nearestFilter);
          sprite.setPosition({
            x: Math.random() * 10,
            y: Math.random() * 10,
          });
        }

        const getX = (index: number) => index * frameWidth;

        const frames2 = [
          {
            frame: new Rect(getX(0), 0, frameWidth, 1),
            duration: 100,
          },
          {
            frame: new Rect(getX(1), 0, frameWidth, 1),
            duration: 100,
          },
          {
            frame: new Rect(getX(2), 0, frameWidth, 1),
            duration: 100,
          },
          {
            frame: new Rect(getX(3), 0, frameWidth, 1),
            duration: 100,
          },
          {
            frame: new Rect(getX(4), 0, frameWidth, 1),
            duration: 100,
          },
          {
            frame: new Rect(getX(5), 0, frameWidth, 1),
            duration: 100,
          },
          {
            frame: new Rect(getX(6), 0, frameWidth, 1),
            duration: 100,
          },
          {
            frame: new Rect(getX(7), 0, frameWidth, 1),
            duration: 100,
          },
        ];

        const runDownAnimation = new AnimatedSpriteAnimation({
          frames: frames2,
          loop: true,
          texture: textureHandle,
        });

        const runUpAnimation = new AnimatedSpriteAnimation({
          frames: frames2,
          loop: true,
          texture: textureHandle2,
        });

        const runRightAnimation = new AnimatedSpriteAnimation({
          frames: frames2,
          loop: true,
          texture: textureHandle4,
        });

        const runLeftAnimation = new AnimatedSpriteAnimation({
          frames: frames2,
          loop: true,
          texture: textureHandle3,
        });

        for (let i = 0; i < 256; i++) {
          // Character sprites are 64x64 pixels (8 frames × 64px in 512px texture)
          const animatedSprite = new AnimatedSprite(null, 64, 64);

          animatedSprite.addAnimation("runDown", runDownAnimation);
          animatedSprite.addAnimation("runUp", runUpAnimation);
          animatedSprite.addAnimation("runRight", runRightAnimation);
          animatedSprite.addAnimation("runLeft", runLeftAnimation);

          const index = ["runDown", "runUp", "runRight", "runLeft"][
            Math.floor(Math.random() * 4)
          ];

          animatedSprite.play(index);

          // Add shadow to all sprites
          const shadowEffect = new ShadowEffect({
            color: new Color(0, 0, 0, 0.3), // Semi-transparent black
            distance: 0, // Random height for variety
            offset: { x: 0, y: 0 }, // Centered at bottom of sprite
            pixelation: 12,
            order: -10, // Render well before sprite,
            scale: { x: 0.2, y: 0.2 },
          });
          animatedSprite.addEffect(shadowEffect);

          // Add effects to some sprites for testing
          if (i % 3 === 0) {
            // Every 3rd sprite gets an outline effect
            const outlineEffect = new OutlineEffect({
              color: new Color(1, 0, 0, 1), // Red outline
              thickness: 0.02,
              order: -1, // Render before sprite
            });
            outlineEffect.enabled = false;
            animatedSprite.addEffect(outlineEffect);
          }

          commands.spawn(animatedSprite, nearestFilter);

          const pos = {
            x: Math.random() * 5 - 2.5,
            y: Math.random() * 5 - 2.5,
            z: 0, // Will be calculated below with Y-sorting
          };

          // Y-sorting: sprites with lower Y (farther up the screen) render behind
          // Base Z for characters: -50 (well above the tilemap at -100)
          // Y factor: 0.1 (adds depth based on Y position for clear separation)
          // This creates proper depth layering for top-down/isometric views
          // With Y range of -2.5 to 2.5, Z will range from -50.25 to -49.75

          animatedSprite.setPosition(pos);

          commands.spawn(PointLight.torch(pos.x, pos.y, 1));

          // commands.spawn(
          //   new PointLight(
          //     {
          //       x: pos.x,
          //       y: pos.y,
          //       z: 1,
          //     },
          //     Color.white(),
          //     1.05,
          //     3,
          //     1
          //   )
          // );
        }

        const camera = new PerspectiveCamera(Math.PI / 4, 1, 0.1, 1000); // size = 1 (half-height)
        // Camera must be in front of all objects (higher Z than sprites)
        // Sprites are at Z=-50, tilemap at Z=-100, so camera at Z=0 looks down at them
        camera.position.set(0, 0, 5);

        commands.spawn(camera, new MainCamera());

        // Load audio clip
        const clipHandle = assetServer.load<AudioClip>("/level-up.mp3");

        // Spawn entity with AudioSource component
        commands.spawn(
          new AudioSource({
            clip: clipHandle,
            bus: "master",
            playing: false,
            loop: false,
            volume: 1.0,
            position: undefined,
            spatialBlend: 0,
          })
        );

        commands.spawn(new AudioListener());

        // Add particle effects
        // const fireEffect = ParticlePresets.fire({ intensity: 0.1 });
        // fireEffect.setPosition({ x: 0, y: 0, z: 0 });
        // sceneGraph.addChild(fireEffect);
        // commands.spawn(fireEffect);

        // const smokeEffect = ParticlePresets.smoke({ intensity: 0.15 });
        // smokeEffect.setPosition({ x: 0, y: 0, z: 0 });
        // sceneGraph.addChild(smokeEffect);
        // commands.spawn(smokeEffect);

        // const sparklesEffect = ParticlePresets.sparkles({ intensity: 1.0 });
        // sparklesEffect.setPosition({ x: 0, y: 0, z: 0 });
        // sceneGraph.addChild(sparklesEffect);
        // commands.spawn(sparklesEffect);

        const magicEffect = ParticlePresets.magic({ intensity: 0.17 });
        magicEffect.setPosition({ x: 0, y: 0, z: 0 });
        // sceneGraph.addChild(magicEffect);
        commands.spawn(magicEffect);

        // Add post-processing effects to renderer
        const renderer = commands.getResource(WebgpuRenderer);

        // Add vignette effect (darkens corners)
        const vignetteEffect = new VignetteEffect({
          intensity: 0.5,
          smoothness: 0.3,
          order: 0,
        });
        vignetteEffect.enabled = false;
        renderer.addPostProcessEffect(vignetteEffect);

        // Add chromatic aberration (RGB split for retro look)
        const chromaticAberrationEffect = new ChromaticAberrationEffect({
          offset: 0.006,
          order: 1,
        });
        chromaticAberrationEffect.enabled = false;
        renderer.addPostProcessEffect(chromaticAberrationEffect);

        // Add bloom effect (makes bright areas glow)
        const bloomEffect = new BloomEffect({
          threshold: 0.5,
          intensity: 1.5,
          bloomStrength: 0.8,
          blurPasses: 2,
          order: 2,
        });
        renderer.addPostProcessEffect(bloomEffect);
      })
      .addUpdateSystems(({ commands }) => {
        const [, camera] = commands
          // .query(OrthographicCamera, MainCamera)
          .query(PerspectiveCamera, MainCamera)
          .find();
        const input = commands.getResource(Input);
        const time = commands.getResource(Time);

        const cameraSpeed = 5;

        const cameraMove = cameraSpeed * time.deltaTime;

        if (input.pressed(KeyCode.ArrowLeft)) {
          camera.position.x -= cameraMove;
          camera.markViewDirty();
        }
        if (input.pressed(KeyCode.ArrowRight)) {
          camera.position.x += cameraMove;
          camera.markViewDirty();
        }
        if (input.pressed(KeyCode.ArrowUp)) {
          camera.position.y += cameraMove;
          camera.markViewDirty();
        }
        if (input.pressed(KeyCode.ArrowDown)) {
          camera.position.y -= cameraMove;
          camera.markViewDirty();
        }

        // Note: Distortion effect update removed since we're not using it anymore
      });
  }
}
