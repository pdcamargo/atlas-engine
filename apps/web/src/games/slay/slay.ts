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
  FlexContainer,
  UiContainer,
  QueryBuilder,
  WebgpuRenderer,
  TileMap,
  TileSet,
  Button,
  RootContainer,
  AudioClip,
  AudioSource,
  AudioListener,
  MainCamera,
  Input,
  KeyCode,
  Time,
  TextureFilter,
  AnimatedSprite,
  Animation,
} from "@atlas/engine";

import { TauriFileSystemAdapter } from "../../plugins/file-system";

class RendererDebug {}

export class SlayGamePlugin implements EcsPlugin {
  build(app: App) {
    app
      .addPlugins(
        new DefaultPlugin({
          fileSystemAdapter: new TauriFileSystemAdapter(),
          canvas: document.querySelector<HTMLCanvasElement>("canvas"),
        })
      )
      .addStartupSystems(({ commands }) => {
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

        // Create scene graph
        const sceneGraph = new SceneGraph();

        const frames = 8;
        const frameWidth = 1 / frames;

        const nearestFilter = new TextureFilter({
          minFilter: "nearest",
          magFilter: "nearest",
          mips: false,
        });

        // Create TileMap with handle directly - no need to wait!
        const tilemap = new TileMap({
          tileWidth: 16,
          tileHeight: 16,
        });

        const tileSet = new TileSet(tilemapHandle, 16, 16);

        tileSet.addTilesFromGrid(13, 21);

        tilemap.setScale({ x: 0.005, y: 0.005 });
        tilemap.setPosition({ x: -1, y: -1 });

        const layer = tilemap.addLayer("default");

        for (let i = 0; i < 2048; i++) {
          for (let j = 0; j < 2048; j++) {
            layer.setTileById(i, j, tileSet, 0);
          }
        }

        // // Add tiles - they won't render until texture loads, but that's okay!
        // // We need to wait for texture to load before calling addTilesFromGrid
        // // For now, let's add a simple update system to handle this

        sceneGraph.addRoot(tilemap);
        commands.spawn(tilemap, nearestFilter);

        for (let i = 0; i < 0; i++) {
          const sprite = new Sprite(textureHandle, 0.5, 0.5);
          sprite.setTint(
            new Color(Math.random(), Math.random(), Math.random())
          );
          const frameIndex = 1;
          sprite.setFrame(new Rect(frameIndex * frameWidth, 0, frameWidth, 1));
          commands.spawn(sprite, nearestFilter);
          sprite.setPosition({
            x: Math.random() - 0.5,
            y: Math.random() - 0.5,
          });
          sceneGraph.addRoot(sprite);
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

        const runDownAnimation = new Animation({
          frames: frames2,
          loop: true,
          texture: textureHandle,
        });

        const runUpAnimation = new Animation({
          frames: frames2,
          loop: true,
          texture: textureHandle2,
        });

        const runRightAnimation = new Animation({
          frames: frames2,
          loop: true,
          texture: textureHandle4,
        });

        const runLeftAnimation = new Animation({
          frames: frames2,
          loop: true,
          texture: textureHandle3,
        });

        for (let i = 0; i < 100; i++) {
          const animatedSprite = new AnimatedSprite(textureHandle, 0.5, 0.5);

          animatedSprite.addAnimation("runDown", runDownAnimation);
          animatedSprite.addAnimation("runUp", runUpAnimation);
          animatedSprite.addAnimation("runRight", runRightAnimation);
          animatedSprite.addAnimation("runLeft", runLeftAnimation);

          const index = ["runDown", "runUp", "runRight", "runLeft"][
            Math.floor(Math.random() * 4)
          ];

          animatedSprite.play(index);

          commands.spawn(animatedSprite, nearestFilter);
          sceneGraph.addRoot(animatedSprite);

          animatedSprite.setPosition({
            x: Math.random() - 0.5,
            y: Math.random() - 0.5,
          });
        }

        // Create camera
        const camera = new OrthographicCamera(-1, 1, -1, 1, 0.1, 100);
        camera.position.set(0, 0, 5);
        camera.target.set(0, 0, 0);
        camera.markViewDirty();

        commands.spawn(camera, new MainCamera());
        commands.spawn(sceneGraph);

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
      })
      .addUpdateSystems(({ commands }) => {
        const [, camera] = commands
          .query(OrthographicCamera, MainCamera)
          .find();
        const input = commands.getResource(Input);
        const time = commands.getResource(Time);

        const cameraSpeed = 5;

        const cameraMove = cameraSpeed * time.deltaTime;

        if (input.pressed(KeyCode.ArrowLeft)) {
          camera.position.x -= cameraMove;
          camera.target.x -= cameraMove;

          camera.markViewDirty();
        }
        if (input.pressed(KeyCode.ArrowRight)) {
          camera.position.x += cameraMove;
          camera.target.x += cameraMove;

          camera.markViewDirty();
        }
        if (input.pressed(KeyCode.ArrowUp)) {
          camera.position.y += cameraMove;
          camera.target.y += cameraMove;

          camera.markViewDirty();
        }
        if (input.pressed(KeyCode.ArrowDown)) {
          camera.position.y -= cameraMove;
          camera.target.y -= cameraMove;

          camera.markViewDirty();
        }

        camera.markViewDirty();
      });
  }
}
