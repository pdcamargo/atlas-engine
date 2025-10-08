import {
  App,
  AssetServer,
  DefaultPlugin,
  defineBundle,
  EcsPlugin,
  Sprite,
  Transform,
} from "@repo/engine";
import { TauriFileSystemAdapter } from "../../plugins/file-system";

const TargetBundle = defineBundle({
  transform: Transform,
  sprite: defineBundle.required(Sprite),
});

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
        // commands.spawn(new Camera2D(commands.getResource(Viewport)));
        const assetServer = commands.getResource(AssetServer);
        // ERROR: sprite is required but not provided
        // commands.spawnBundle(TargetBundle);
        const texture = assetServer.loadTexture("/sprites/Target.png")[0];
        commands.spawnBundle(TargetBundle, {
          sprite: [texture],
        });
      });
  }
}
