import {
  App,
  DefaultPlugin,
  EcsPlugin,
  AssetServer,
  ImageAsset,
  GpuRenderDevice,
  Texture,
  Handle,
  LoadState,
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
} from "@atlas/engine";

import { TauriFileSystemAdapter } from "../../plugins/file-system";

class Flag {
  handle: Handle<ImageAsset>;

  constructor(handle: Handle<ImageAsset>) {
    this.handle = handle;
  }
}

class Flag2 extends Flag {}
class Flag3 extends Flag {}
class Flag4 extends Flag {}
class Flag5 extends Flag {}

class Handled {}

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

        // Load the quad square texture
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

        commands.spawn(new Flag(textureHandle));
        commands.spawn(new Flag2(textureHandle2));
        commands.spawn(new Flag3(textureHandle3));
        commands.spawn(new Flag4(textureHandle4));

        commands.spawn(new Flag5(tilemapHandle));

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
            spatialBlend: 0, // 0 = no spatialization, 1 = full spatial
          })
        );

        commands.spawn(new AudioListener());
      })
      .addUpdateSystems(({ commands }) => {
        const rootContainer = commands
          .query(FlexContainer, RootContainer)
          .tryFind();
        const txtC = commands
          .query(new QueryBuilder(UiContainer, RendererDebug))
          .tryFind();

        if (rootContainer && !txtC) {
          const txt = new UiContainer(rootContainer[1]);
          txt.setTextContent("FPS: 0");
          txt.setColor("white");
          txt.setBackgroundColor("black");
          commands.spawn(txt, new RendererDebug());

          const button = new Button(rootContainer[1]);
          button.setTextContent("Debug");
          button.setColor("white");
          button.setBackgroundColor("black");
          commands.spawn(button);

          button.element.onclick = () => {
            app.world.debug();
          };
        } else if (txtC) {
          const stats = commands.getResource(WebgpuRenderer).getStats();
          txtC[1].setInnerHTML(`
            <div>Draw calls: ${stats.drawCalls}</div>
            <div>Rendered sprites: ${stats.renderedSprites}</div>
            <div>Batches: ${stats.batches} / ${stats.totalBatches}</div>
            <div>Total tiles: ${stats.totalTiles}</div>
            <div>Rendered tiles: ${stats.renderedTiles}</div>
            <div>Skipped tiles: ${stats.skippedTiles}</div>
            <div>Culling efficiency: ${stats.totalTiles > 0 ? ((stats.skippedTiles / stats.totalTiles) * 100).toFixed(1) : 0}%</div>
            <div>Memory usage: ${Math.round(
              (
                performance as unknown as {
                  memory: { usedJSHeapSize: number };
                }
              ).memory.usedJSHeapSize /
                1024 /
                1024
            )} MB</div>
          `);
        }

        if (commands.query(Handled).tryFind()) {
          return;
        }

        const [, flag] = commands.query(Flag).find();
        const [, flag2] = commands.query(Flag2).find();
        const [, flag3] = commands.query(Flag3).find();
        const [, flag4] = commands.query(Flag4).find();
        const [, flag5] = commands.query(Flag5).find();
        const assetServer = commands.getResource(AssetServer);

        if (assetServer.getLoadState(flag.handle) !== LoadState.Loaded) {
          return;
        }

        if (assetServer.getLoadState(flag2.handle) !== LoadState.Loaded) {
          return;
        }

        if (assetServer.getLoadState(flag3.handle) !== LoadState.Loaded) {
          return;
        }

        if (assetServer.getLoadState(flag4.handle) !== LoadState.Loaded) {
          return;
        }

        if (assetServer.getLoadState(flag5.handle) !== LoadState.Loaded) {
          return;
        }

        const imageAsset = assetServer.getAsset(flag.handle)!;
        const imageAsset2 = assetServer.getAsset(flag2.handle)!;
        const imageAsset3 = assetServer.getAsset(flag3.handle)!;
        const imageAsset4 = assetServer.getAsset(flag4.handle)!;
        const imageAsset5 = assetServer.getAsset(flag5.handle)!;

        const device = commands.getResource(GpuRenderDevice).get();

        const texture5 = Texture.fromSource(device, imageAsset5.image!, {
          minFilter: "nearest",
          magFilter: "nearest",
        });

        const texture = Texture.fromSource(device, imageAsset.image!, {
          minFilter: "nearest",
          magFilter: "nearest",
        });

        const texture2 = Texture.fromSource(device, imageAsset2.image!, {
          minFilter: "nearest",
          magFilter: "nearest",
        });

        const texture3 = Texture.fromSource(device, imageAsset3.image!, {
          minFilter: "nearest",
          magFilter: "nearest",
        });

        const texture4 = Texture.fromSource(device, imageAsset4.image!, {
          minFilter: "nearest",
          magFilter: "nearest",
        });

        const sceneGraph = new SceneGraph();

        const frames = 8;
        const frameWidth = 1 / frames;

        const tilemap = new TileMap({
          tileWidth: 16,
          tileHeight: 16,
          chunkSize: 30,
        });

        const tileSet = new TileSet(texture5, 16, 16);
        tileSet.addTilesFromGrid(12, 21);

        tilemap.setScale({ x: 0.005, y: 0.005 });
        tilemap.setPosition({ x: -5, y: 5 });

        const layer = tilemap.addLayer("default");
        const layer2 = tilemap.addLayer("default2");
        const layer3 = tilemap.addLayer("default3");

        for (let i = 0; i < 1024; i++) {
          for (let j = 0; j < 1024; j++) {
            layer.setTile(i, -j, tileSet, tileSet.getTile(0)!);
            layer2.setTile(i, -j, tileSet, tileSet.getTile(207)!);
            layer3.setTile(i, -j, tileSet, tileSet.getTile(111)!);
          }
        }

        sceneGraph.addRoot(tilemap);
        commands.spawn(tilemap);
        // layer.setTile(1, 0, tileSet, tileSet.getTile(1)!);
        // layer.setTile(2, 0, tileSet, tileSet.getTile(2)!);
        // layer.setTile(3, 0, tileSet, tileSet.getTile(3)!);

        for (let i = 0; i < 10; i++) {
          const sprite = new Sprite(texture);
          sprite.setSize(0.5, 0.5);
          sprite.setTint(
            new Color(Math.random(), Math.random(), Math.random())
          );

          // Use normalized UV coordinates: frame 2 (index 1) out of 8 frames
          const frameIndex = 1; // This would be the second frame (0-indexed)
          sprite.setFrame(new Rect(frameIndex * frameWidth, 0, frameWidth, 1));

          sprite.setPosition({
            x: Math.random() - 0.5, // Range: -1 to 1
            y: Math.random() - 0.5, // Range: -1 to 1
          });

          // sprite.isStatic = true;

          sceneGraph.addRoot(sprite);

          commands.spawn(sprite);

          const sprite2 = new Sprite(texture2);
          sprite2.setSize(0.5, 0.5);
          sprite2.setTint(
            new Color(Math.random(), Math.random(), Math.random())
          );
          sprite2.setFrame(new Rect(frameIndex * frameWidth, 0, frameWidth, 1));

          sprite2.setPosition({
            x: Math.random() - 0.75, // Range: -1 to 1
            y: Math.random() - 0.75, // Range: -1 to 1
          });

          // sprite2.isStatic = true;
          sceneGraph.addRoot(sprite2);
          commands.spawn(sprite2);

          const sprite3 = new Sprite(texture3);
          sprite3.setSize(0.5, 0.5);
          sprite3.setTint(
            new Color(Math.random(), Math.random(), Math.random())
          );
          sprite3.setFrame(new Rect(frameIndex * frameWidth, 0, frameWidth, 1));
          sprite3.setPosition({
            x: Math.random() - 0.25, // Range: -1 to 1
            y: Math.random() - 0.25, // Range: -1 to 1
          });
          // sprite3.isStatic = true;
          sceneGraph.addRoot(sprite3);
          commands.spawn(sprite3);

          const sprite4 = new Sprite(texture4);
          sprite4.setSize(0.5, 0.5);
          sprite4.setTint(
            new Color(Math.random(), Math.random(), Math.random())
          );
          sprite4.setFrame(new Rect(frameIndex * frameWidth, 0, frameWidth, 1));
          sprite4.setPosition({
            x: Math.random() + 0.5, // Range: -1 to 1
            y: Math.random() + 0.5, // Range: -1 to 1
          });
          // sprite4.isStatic = true;
          sceneGraph.addRoot(sprite4);
          commands.spawn(sprite4);
        }

        const camera = new OrthographicCamera(-1, 1, -1, 1, 0.1, 100);
        camera.position.set(0, 0, 5);
        camera.target.set(0, 0, 0); // Move target to same X,Y so camera looks straight down
        camera.markViewDirty();

        // const square = new Square(1, Color.red());
        // sceneGraph.addRoot(square);

        commands.spawn(camera, new MainCamera());
        commands.spawn(sceneGraph);

        commands.spawn(new Handled());
      })
      .addUpdateSystems(({ commands }) => {
        // Only run if Handled exists (after setup is complete)
        if (!commands.query(Handled).tryFind()) {
          return;
        }

        // Get the scene graph and update sprites
        const sprites = commands.query(Sprite).all();
        for (const [, sprite] of sprites) {
          sprite.setPosition({
            x: Math.random() * Math.random() - 0.5,
            y: Math.random() * Math.random() - 0.5,
          });
        }

        const [, camera] = commands
          .query(OrthographicCamera, MainCamera)
          .find();

        const cameraSpeed = 5;
        const time = commands.getResource(Time);

        const cameraMove = cameraSpeed * time.deltaTime;

        const input = commands.getResource(Input);
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
      });
  }
}
