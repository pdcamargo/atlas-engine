import {
  AnimatedSprite,
  AssetServer,
  Camera2D,
  GravityScale,
  RigidBody2D,
  Sprite,
  sys,
  Transform,
  Velocity,
  Viewport,
} from "@repo/engine";
import { Character, GridIndicator } from "../components/flags";
import { getCharacterAnimations } from "../data/player-animation";

const assetsUrl = "/sprites/Assets.png";

export const initGame = sys(({ commands }) => {
  const assetServer = commands.getResource(AssetServer);
  const [texture] = assetServer.loadTexture(assetsUrl);

  commands.spawn(
    new Sprite(
      texture,
      {
        x: 12,
        y: 0,
        width: 16,
        height: 16,
      },
      1
    ),
    Transform.fromPosition({ x: 0, y: 0 }),
    new GridIndicator()
  );

  const characterAnimations = getCharacterAnimations(assetServer);

  commands.spawn(
    new AnimatedSprite({
      animations: Object.values(characterAnimations),
      defaultAnimationId: "idleDown",
      layer: 1,
    }),
    Transform.fromPosition({ x: 0, y: 100 }),
    new Character(),
    RigidBody2D.dynamic(),
    new GravityScale(0),
    new Velocity({ x: 100, y: 0 })
  );

  // commands.spawn(
  //   new AnimatedSprite({
  //     texture: assetServer.loadTexture("/sprites/Other/Conveyor.png")[0],
  //     animations: [
  //       {
  //         id: "default",
  //         frames: conveyorFrames,
  //       },
  //     ],
  //   }),
  //   Transform.fromPosition({ x: 0, y: 0 })
  // );

  const cam = new Camera2D(commands.getResource(Viewport));
  cam.zoom = 2.1;
  commands.spawn(cam);
  cam.transform.setPosition({ x: 100, y: 100 });
});
