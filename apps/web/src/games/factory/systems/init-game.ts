// import {
//   AssetServer,
//   Collider2D,
//   GravityScale,
//   RigidBody2D,
//   sys,
//   Transform,
//   Velocity,
// } from "@atlas/engine";
// import {
//   Sprite,
//   AnimatedSprite,
//   Camera2D,
//   MainCamera2D,
//   Color,
//   Vec2,
//   Rect,
//   Visibility,
// } from "@atlas/renderer-2d";
// import { Character, GridIndicator } from "../components/flags";
// import { getCharacterAnimations } from "../data/player-animation";

// const assetsUrl = "/sprites/Assets.png";

// export const initGame = sys(({ commands }) => {
//   const assetServer = commands.getResource(AssetServer);
//   const [texture] = assetServer.loadTexture(assetsUrl);

//   commands.spawn(
//     new Sprite({
//       texture,
//       rect: new Rect(new Vec2(12, 0), new Vec2(28, 16)),
//       anchor: new Vec2(0.5, 0.5),
//     }),
//     Transform.fromPosition({ x: 0, y: 0 }),
//     new Visibility(false), // Start hidden
//     new GridIndicator()
//   );

//   const characterAnimations = getCharacterAnimations(assetServer);

//   const ct = Transform.fromPosition({ x: 0, y: 100 });
//   commands.spawn(
//     new AnimatedSprite({
//       animations: Object.values(characterAnimations),
//       defaultAnimationId: "idleDown",
//     }),
//     ct,
//     new Character(),
//     RigidBody2D.dynamic({ fixedRotation: true }),
//     new GravityScale(0),
//     new Velocity({ x: 100, y: 0 }),
//     Collider2D.rect(16, 16, { offset: { x: 0, y: 8 }, friction: 0 })
//     // new Sensor()
//   );

//   // commands.spawn(
//   //   new AnimatedSprite({
//   //     texture: assetServer.loadTexture("/sprites/Other/Conveyor.png")[0],
//   //     animations: [
//   //       {
//   //         id: "default",
//   //         frames: conveyorFrames,
//   //       },
//   //     ],
//   //   }),
//   //   Transform.fromPosition({ x: 0, y: 0 })
//   // );

//   commands.spawn(
//     new Camera2D({
//       clearColor: Color.rgb(50, 50, 50),
//       order: 0,
//     }),
//     new MainCamera2D(),
//     new Transform()
//   );
// });
