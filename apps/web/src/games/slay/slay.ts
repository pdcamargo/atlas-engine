import {
  App,
  DefaultPlugin,
  EcsPlugin,
  Transform,
  AssetServer,
  Texture2D,
} from "@atlas/core";
import {
  Sprite,
  Renderer2DPlugin,
  Camera2D,
  MainCamera2D,
  Color,
  Vec2,
  Rect,
} from "@atlas/renderer-2d";
import { TauriFileSystemAdapter } from "../../plugins/file-system";

export class SlayGamePlugin implements EcsPlugin {
  build(app: App) {
    app
      .addPlugins(
        new DefaultPlugin({
          fileSystemAdapter: new TauriFileSystemAdapter(),
          canvas: document.querySelector<HTMLCanvasElement>("canvas"),
        }),
        new Renderer2DPlugin({
          canvas:
            document.querySelector<HTMLCanvasElement>("canvas") ?? undefined,
        })
      )
      .addStartupSystems(({ commands }) => {
        // Get the asset server
        const assetServer = commands.getResource(AssetServer);

        // Load the quad square texture
        const textureHandle = assetServer.load<Texture2D>(
          "/sprites/character/sprites/IDLE/idle_down.png"
        );

        // Spawn a 2D camera with proper viewport
        commands.spawn(
          new Camera2D({
            clearColor: Color.rgb(50, 50, 50), // Dark gray background
            order: 0,
          }),
          new MainCamera2D(),
          new Transform()
        );

        const framesX = 8;
        const width = 80;
        const height = 80;

        // Spawn sprite entities with the texture
        // The sprite will automatically use the texture's pixel size
        // Scale is used to scale the sprite relative to its natural size
        for (let h = 0; h < 1_000; h++) {
          for (let i = 0; i < framesX; i++) {
            commands.spawn(
              new Sprite({
                color: Color.RED,
                texture: textureHandle,
                anchor: new Vec2(0.5, 0.5),
                rect: new Rect(
                  new Vec2(i * width, 0),
                  new Vec2((i + 1) * width, height)
                ),
              }),
              new Transform({ x: i * width, y: 0 }, 0, { x: 4, y: 4 }) // Scale up 4x to be visible
            );
          }
        }
      });
  }
}
