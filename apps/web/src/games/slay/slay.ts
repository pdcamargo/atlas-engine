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

        tilemap.setScale({ x: 0.005, y: 0.005 });
        tilemap.setPosition({ x: -5, y: 5 });

        const layer = tilemap.addLayer("default");

        // // Add tiles - they won't render until texture loads, but that's okay!
        // // We need to wait for texture to load before calling addTilesFromGrid
        // // For now, let's add a simple update system to handle this

        sceneGraph.addRoot(tilemap);
        commands.spawn(tilemap, nearestFilter);

        for (let i = 0; i < 10; i++) {
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

        const sprite2 = new Sprite(textureHandle2, 0.5, 0.5);
        sprite2.setTint(new Color(Math.random(), Math.random(), Math.random()));
        const frameIndex2 = 1;
        sprite2.setFrame(new Rect(frameIndex2 * frameWidth, 0, frameWidth, 1));
        sprite2.setPosition({
          x: Math.random() - 0.5,
          y: Math.random() - 0.5,
        });
        commands.spawn(sprite2, nearestFilter);
        sceneGraph.addRoot(sprite2);

        const sprite3 = new Sprite(textureHandle3, 0.5, 0.5);
        sprite3.setTint(new Color(Math.random(), Math.random(), Math.random()));
        const frameIndex3 = 1;
        sprite3.setFrame(new Rect(frameIndex3 * frameWidth, 0, frameWidth, 1));
        sprite3.setPosition({
          x: Math.random() - 0.5,
          y: Math.random() - 0.5,
        });
        commands.spawn(sprite3, nearestFilter);
        sceneGraph.addRoot(sprite3);

        const sprite4 = new Sprite(textureHandle4, 0.5, 0.5);
        sprite4.setTint(new Color(Math.random(), Math.random(), Math.random()));
        const frameIndex4 = 1;
        sprite4.setFrame(new Rect(frameIndex4 * frameWidth, 0, frameWidth, 1));
        sprite4.setPosition({
          x: Math.random() - 0.5,
          y: Math.random() - 0.5,
        });
        commands.spawn(sprite4, nearestFilter);
        sceneGraph.addRoot(sprite4);

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
      });
  }
}
