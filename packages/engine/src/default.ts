import {
  App,
  AssetsPlugin,
  EcsPlugin,
  EcsPluginGroup,
  FileSystemAdapter,
  FileSystemPlugin,
  InputPlugin,
  Time,
  TimePlugin,
  ViewportPlugin,
} from "@atlas/core";
import { WebgpuRenderer, WebgpuRendererPlugin } from "@atlas/webgpu-renderer";
import { AudioPlugin } from "@atlas/audio";
import { Position, Text, TextBundle, UiPlugin, UiRoot } from "@atlas/ui";
import { TiledEcsPlugin } from "@atlas/tiled";

export type DefaultPluginOptions = {
  container?: HTMLElement | null;
  canvas?: HTMLCanvasElement | null;
  fileSystemAdapter?: FileSystemAdapter;
};

export class DefaultPlugin implements EcsPluginGroup {
  constructor(public readonly options?: DefaultPluginOptions) {}

  plugins(): EcsPlugin[] {
    return [
      new ViewportPlugin({
        container: this.options?.container,
        canvas: this.options?.canvas,
      }),
      new FileSystemPlugin(this.options?.fileSystemAdapter),
      new InputPlugin(),
      new TimePlugin(),
      new AssetsPlugin(),
      new WebgpuRendererPlugin({
        canvas: this.options?.canvas ?? undefined,
      }),
      new AudioPlugin(),
      new UiPlugin(),
      new TiledEcsPlugin(),
    ];
  }
}

class FpsMarker {}

export class DebugPlugin implements EcsPlugin {
  constructor() {}

  build(app: App) {
    app
      .addStartupSystems(({ commands }) => {
        commands
          .spawnBundle(TextBundle, {
            text: ["Hello, World!"],
            textStyle: [{ fontSize: 13, fontWeight: "bold" }],
            textColor: [{ color: "white" }],
            textAlign: [{ textAlign: "center" }],
          })
          .insert(
            new Position({
              position: "absolute",
              top: 0,
              right: 0,
            }),
            new UiRoot(),
            new FpsMarker()
          );
      })
      .addUpdateSystems(({ commands }) => {
        const time = commands.getResource(Time);
        const renderer = commands.getResource(WebgpuRenderer);
        const stats = renderer.getStats();

        const [, fpsText] = commands.query(Text, FpsMarker).find();

        if (fpsText) {
          fpsText.content = `
            FPS: ${time.fps.toFixed(2)}
            Draw Calls: ${stats.drawCalls}
            Rendered Sprites: ${stats.renderedSprites}
            Batches: ${stats.batches}
            Total Batches: ${stats.totalBatches}
            Total Tiles: ${stats.totalTiles}
            Rendered Tiles: ${stats.renderedTiles}
            Skipped Tiles: ${stats.skippedTiles}
          `;
        }
      });
  }
}
