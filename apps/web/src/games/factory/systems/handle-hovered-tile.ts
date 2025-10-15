// import { Input, sys, Viewport } from "@atlas/engine";
// import { Camera2D } from "@atlas/renderer-2d";
// import { WorldGrid } from "../resources/world-grid";
// import { UserInteractionState } from "../resources/user-interaction";

// export const handleHoveredTile = sys(({ commands }) => {
//   const grid = commands.getResource(WorldGrid);
//   const input = commands.getResource(Input);
//   const viewport = commands.getResource(Viewport);
//   const userInteraction = commands.getResource(UserInteractionState);

//   const [, cam] = commands.find(Camera2D);

//   const zoom = Math.max(0.0001, cam.zoom);
//   const mouse = input.mousePosition; // screen coords (client space)
//   const cx = cam.transform.position.x;
//   const cy = cam.transform.position.y;

//   // screen -> world
//   const worldX = (mouse.x - viewport.width / 2) / zoom + cx;
//   const worldY = (mouse.y - viewport.height / 2) / zoom + cy;

//   // world -> tile
//   const hovered = {
//     x: Math.floor(worldX / grid.tileSize),
//     y: Math.floor(worldY / grid.tileSize),
//   };

//   const tile = grid.getObjectOrCell(hovered.x, hovered.y);

//   userInteraction.hoveredTile = hovered;

//   if (tile) {
//     userInteraction.hoveredMetadata = tile;
//   } else {
//     userInteraction.hoveredMetadata = null;
//     userInteraction.hoveredTile = null;
//   }
// }).label("HandleHoveredTile");
