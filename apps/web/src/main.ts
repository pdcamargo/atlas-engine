import { FactoryGamePlugin } from "./games/factory";
import "./style.css";

import {
  App,
  // DefaultPlugin,
  // sys,
  // AssetServer,
  // SystemFnArguments,
  // TileMap,
  // Renderable,
  // FlexContainer,
  // Button,
  // UiContainer,
  // Time,
  // Sprite,
  // Transform,
  // Point,
  // AnimatedSprite,
  // Camera2D,
  // Viewport,
  DebugPlugin,
} from "@repo/engine";

// class GameState {
//   hasBuiltWorld = false;
// }

// class WorldTileMap {}

// class OreTileMap {}

// const tilemapTexture = "/sprites/Ores/Ore Sprites.png";
// const grass = "/sprites/Grass.png";
// const conveyor = "/sprites/Other/Conveyor.png";

export class ResumeGameEvent {}

export class QuitGameEvent {}

export class FpsDisplay {}

// function spawnPlayer({ commands, events }: SystemFnArguments) {
//   const assetServer = commands.getResource(AssetServer);

//   const [texture] = assetServer.loadTexture(grass);
//   const [oreTexture] = assetServer.loadTexture(tilemapTexture);
//   const [conveyorTexture] = assetServer.loadTexture(conveyor);

//   const cam = new Camera2D(commands.getResource(Viewport));

//   cam.zoom = 2.1;

//   commands.spawn(cam);

//   commands.spawn(
//     new TileMap([texture], {
//       tileWidth: 16,
//       tileHeight: 16,
//     }),
//     new WorldTileMap()
//   );

//   commands.spawn(
//     new TileMap([oreTexture], {
//       tileWidth: 16,
//       tileHeight: 16,
//     }),
//     new OreTileMap()
//   );

//   const cols = 16;

//   // commands.spawn(
//   //   new Sprite(conveyorTexture, {
//   //     x: 0,
//   //     y: 0,
//   //     width: 16,
//   //     height: 16,
//   //   }),
//   //   Transform.fromPosition(new Point(50, 50))
//   // );

//   for (let i = 0; i < cols; i++) {
//     commands.spawn(
//       new Sprite(conveyorTexture, {
//         x: i,
//         y: 0,
//         width: 16,
//         height: 16,
//       }),
//       Transform.fromPosition(new Point(50 + i * 16, 50))
//     );
//   }

//   const frames = Array.from({ length: cols }, (_, i) => ({
//     x: i,
//     y: 0,
//     width: 16,
//     height: 16,
//     duration: 32,
//   }));

//   const t = Transform.fromPosition(new Point(50 + 16, 50 + 16));

//   t.rotation = 90;

//   commands.spawn(
//     new AnimatedSprite({
//       texture: conveyorTexture,
//       frames,
//       useFrameEndEvents: true,
//     }),
//     t
//   );
//   commands.spawn(
//     new AnimatedSprite({ texture: conveyorTexture, frames }),
//     Transform.fromPosition(new Point(50 + 16, 50 + 32))
//   );
//   commands.spawn(
//     new AnimatedSprite({ texture: conveyorTexture, frames }),
//     Transform.fromPosition(new Point(50 + 16, 50 + 48))
//   );
//   commands.spawn(
//     new AnimatedSprite({ texture: conveyorTexture, frames }),
//     Transform.fromPosition(new Point(50 + 16, 50 + 64))
//   );

//   cam.transform.position.copyFrom(t.position);

//   cam.target = t;

//   const root = new FlexContainer();

//   root
//     .setPosition("absolute")
//     .setRight(0)
//     .setTop(0)
//     .setPadding(12)
//     .setGap(12)
//     .setDirection("column");

//   const fps = new UiContainer(root);
//   fps.setTextContent("FPS: 0").setColor("white");

//   const button = new Button(root);
//   const button2 = new Button(root);

//   const resumeEvent = events.writer(ResumeGameEvent);
//   const quitEvent = events.writer(QuitGameEvent);

//   button.element.onclick = () => {
//     resumeEvent.send(new ResumeGameEvent());
//   };

//   button2.element.onclick = () => {
//     quitEvent.send(new QuitGameEvent());
//   };

//   button.setTextContent("Resume");
//   button2.setTextContent("Quit");

//   commands.spawn(FpsDisplay, fps);
// }

// const buildWorld = sys(({ commands }) => {
//   const [, tilemap] = commands.tryFind(TileMap, WorldTileMap, Renderable) || [];
//   const [, oreTilemap] =
//     commands.tryFind(TileMap, OreTileMap, Renderable) || [];

//   if (!tilemap || !oreTilemap) {
//     return;
//   }

//   const gameState = commands.getResource(GameState);
//   gameState.hasBuiltWorld = true;

//   tilemap.clear();
//   oreTilemap.clear();

//   const tileSize = 16;

//   const chunkWidth = 32;
//   const chunkHeight = 32;

//   const offsetX = 50;
//   const offsetY = 50;

//   // [x, y]
//   const floors = [
//     [0, 5],
//     [1, 5],
//     [2, 5],
//     [0, 6],
//     [1, 6],
//     [2, 6],
//     [3, 6],
//     [4, 6],
//     [5, 6],
//     [1, 1],
//     [1, 1],
//     [1, 1],
//     [1, 1],
//   ];

//   for (let x = 0; x < chunkWidth; x++) {
//     for (let y = 0; y < chunkHeight; y++) {
//       const floor = floors[Math.floor(Math.random() * floors.length)];

//       tilemap.addTile(0, floor[0], floor[1], {
//         x: x * tileSize + offsetX,
//         y: y * tileSize + offsetY,
//       });
//     }
//   }

//   oreTilemap.addTile(0, 1, 0, {
//     x: offsetX,
//     y: offsetY,
//     tileHeight: 32,
//     // tileWidth: 16,
//   });

//   tilemap.cache();
// })
//   .runIf(({ commands }) => !commands.getResource(GameState).hasBuiltWorld)
//   .build();

async function main() {
  await App.create()
    // .addEvent(ResumeGameEvent)
    // .addEvent(QuitGameEvent)
    // .setResource(new GameState())
    .addPlugins(new FactoryGamePlugin(), new DebugPlugin())
    // .addStartupSystems(spawnPlayer)
    // .addUpdateSystems(buildWorld, resumeGame, updateFps)
    .run();

  console.log("App finished");
}

void main();
