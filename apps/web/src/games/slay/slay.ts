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
  RootContainer,
  FlexContainer,
  UiContainer,
  QueryBuilder,
  WebgpuRenderer,
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

        commands.spawn(new Flag(textureHandle));
        commands.spawn(new Flag2(textureHandle2));
        commands.spawn(new Flag3(textureHandle3));
        commands.spawn(new Flag4(textureHandle4));
      })
      .addUpdateSystems(({ commands }) => {
        const rootContainer = commands.query(FlexContainer).tryFind();
        const txtC = commands
          .query(new QueryBuilder(UiContainer, RendererDebug))
          .tryFind();

        if (rootContainer && !txtC) {
          const txt = new UiContainer(rootContainer[1]);
          txt.setTextContent("FPS: 0");
          txt.setColor("white");
          txt.setBackgroundColor("black");
          commands.spawn(txt, new RendererDebug());
          console.log("spawned renderer debug");
        } else if (txtC) {
          const stats = commands.getResource(WebgpuRenderer).getStats();
          txtC[1].setInnerHTML(`
            <div>Draw calls: ${stats.drawCalls}</div>
            <div>Rendered sprites: ${stats.renderedSprites}</div>
            <div>Batches: ${stats.batches / stats.totalBatches}</div>
            <div>Total batches: ${stats.totalBatches}</div>
          `);
        }

        if (commands.query(Handled).tryFind()) {
          return;
        }

        const [, flag] = commands.query(Flag).find();
        const [, flag2] = commands.query(Flag2).find();
        const [, flag3] = commands.query(Flag3).find();
        const [, flag4] = commands.query(Flag4).find();
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

        const imageAsset = assetServer.getAsset(flag.handle)!;
        const imageAsset2 = assetServer.getAsset(flag2.handle)!;
        const imageAsset3 = assetServer.getAsset(flag3.handle)!;
        const imageAsset4 = assetServer.getAsset(flag4.handle)!;
        const device = commands.getResource(GpuRenderDevice).get();

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

        for (let i = 0; i < 2050; i++) {
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
        camera.markViewDirty();

        // const square = new Square(1, Color.red());
        // sceneGraph.addRoot(square);

        commands.spawn(camera);
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
      });
  }
}
