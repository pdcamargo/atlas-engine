import { TilesType } from "../resources/world-grid";

export enum ObjectsType {
  GridIndicator = "grid-indicator",
  Conveyor = "conveyor",
  Tree = "tree-1",
}

export const tilesConfig = {
  [TilesType.Grass]: {
    id: TilesType.Grass,
    name: "Grass",
    texture: "/sprites/Assets.png",
    tile: {
      x: 0,
      y: 5,
      width: 16,
      height: 16,
    },
    blocksCollision: false,
    meta: {},
  },
  [TilesType.Rock]: {
    id: TilesType.Rock,
    name: "Rock",
    texture: "/sprites/Assets.png",
    tile: {
      x: 0,
      y: 12,
      width: 16,
      height: 16,
    },
    blocksCollision: false,
    meta: {},
  },
  [TilesType.Sand]: {
    id: TilesType.Sand,
    name: "Sand",
    texture: "/sprites/Assets.png",
    tile: {
      x: 0,
      y: 20,
      width: 16,
      height: 16,
    },
  },
} as const;

export const objectsConfig = {
  [ObjectsType.GridIndicator]: {
    id: ObjectsType.GridIndicator,
    name: "Grid Indicator",
    texture: "/sprites/Assets.png",
    frame: {
      x: 12,
      y: 0,
      width: 16,
      height: 16,
    },
    components: [],
  },
  [ObjectsType.Conveyor]: {
    id: ObjectsType.Conveyor,
    name: "Conveyor",
    texture: "/sprites/Other/Conveyor.png",
    blocksCollision: true,
    animations: [
      {
        id: "default",
        frames: Array.from({ length: 16 }, (_, i) => ({
          x: i,
          y: 0,
          width: 16,
          height: 16,
          duration: 32,
        })),
      },
    ],
  },
  [ObjectsType.Tree]: {
    id: ObjectsType.Tree,
    name: "Tree",
    texture: "/sprites/Trees/Trees & vegetation Tileset1.png",
    frame: {
      x: 32,
      y: 96,
      width: 32,
      height: 16 * 5,
    },
  },
} as const;

export const allTextures = Object.values(tilesConfig).map(
  (tile) => tile.texture
);

export const allObjectsTextures = Object.values(objectsConfig).map(
  (object) => object.texture
);
