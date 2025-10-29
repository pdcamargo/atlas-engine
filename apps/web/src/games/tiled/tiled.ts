import {
  App,
  EcsPlugin,
  PerspectiveCamera,
  MainCamera,
  Input,
  KeyCode,
  Time,
  PixelsPerUnit,
  AssetServer,
  TiledTileMap,
  TiledMapAsset,
} from "@atlas/engine";

export class TiledGamePlugin implements EcsPlugin {
  build(app: App) {
    app
      .addStartupSystems(({ commands }) => {
        // Set global pixels-per-unit: 100 pixels = 1 world unit
        // With 16px tiles, each tile is 0.16 world units
        PixelsPerUnit.setGlobal(100);

        const camera = new PerspectiveCamera(Math.PI / 4, 1, 0.1, 1000);
        // Position camera looking down at the map
        // Map will be at z=0, camera at z=5
        camera.position.set(2.4, 1.6, 5); // Center on 30x20 tile map (30*16/100 = 4.8 / 2 = 2.4)

        commands.spawn(camera, new MainCamera());

        const assetServer = commands.getResource(AssetServer);
        const mapHandle = assetServer.load<TiledMapAsset>(
          "/tiled/prototype-map.tmj"
        );

        // Create the tilemap
        const tiledMap = new TiledTileMap(mapHandle);
        // Position at origin
        tiledMap.setPosition({ x: 0, y: 0, z: 0 });

        // Spawn as component
        commands.spawn(tiledMap);
      })
      .addUpdateSystems(({ commands }) => {
        const [, camera] = commands.query(PerspectiveCamera, MainCamera).find();
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

        // Zoom with Q/E
        if (input.pressed(KeyCode.KeyQ)) {
          camera.position.z += cameraMove;
          camera.markViewDirty();
        }
        if (input.pressed(KeyCode.KeyE)) {
          camera.position.z -= cameraMove;
          camera.markViewDirty();
        }
      });
  }
}
