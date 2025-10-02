import {
  AssetServer,
  AnimatedSprite,
  QueryBuilder,
  Sprite,
  TileMap,
  Transform,
  sys,
  Renderable,
} from "@repo/engine";
import { BuildRequests, FloorTileId } from "../resources/build-requests";
import { WorldGrid } from "../resources/world-grid";
import { FactoryTileMap } from "../components/factory-tilemap";
import { ObjectsType, objectsConfig, tilesConfig } from "../data/tiles";

const tilemapQuery = new QueryBuilder(TileMap, FactoryTileMap, Renderable);

export const applyBuildRequests = sys(({ commands }) => {
  const requests = commands.getResource(BuildRequests);
  const grid = commands.getResource(WorldGrid);
  const assetServer = commands.getResource(AssetServer);

  const tilemapTuple = commands.query(tilemapQuery).tryFind();
  if (!tilemapTuple) return;
  const [, tilemap, tag] = tilemapTuple as unknown as [
    unknown,
    TileMap,
    FactoryTileMap,
  ];

  const drained = requests.drain();
  if (drained.length === 0) return;

  for (const req of drained) {
    if (req.type === "floor") {
      const tileId = req.tile as FloorTileId;
      const tileConf = tilesConfig[tileId];
      if (!tileConf) continue;

      // Update logical grid
      const blocks = (
        "blocksCollision" in tileConf
          ? (tileConf as { blocksCollision: boolean }).blocksCollision
          : false
      ) as boolean;
      const meta = (
        "meta" in tileConf
          ? (tileConf as { meta?: Record<string, unknown> }).meta
          : undefined
      ) as Record<string, unknown> | undefined;

      grid.setFloor(req.x, req.y, req.tile, {
        blocks,
        meta,
      });

      // Render to tilemap using correct atlas index
      const px = req.x * grid.tileSize;
      const py = req.y * grid.tileSize;
      const atlasIndex = tag.getAtlasIndex(tileConf.texture) ?? 0;

      tilemap.addTile(atlasIndex, tileConf.tile.x, tileConf.tile.y, {
        x: px,
        y: py,
        tileWidth: tileConf.tile.width,
        tileHeight: tileConf.tile.height,
      });
    } else if (req.type === "object") {
      const objConf = objectsConfig[req.object as ObjectsType];
      console.log(objConf);
      if (!objConf) continue;

      // Try place in logical grid first (ensures collision rules)
      const width = req.width ?? grid.tileSize;
      const height = req.height ?? grid.tileSize;
      const blocks = req.blocks ?? true;

      if (!grid.canAddTile(req.x, req.y, width, height, { blocks })) {
        console.log("Cannot add object", req.x, req.y, width, height, blocks);
        // skip invalid placements
        continue;
      }

      grid.placeObject({
        x: req.x,
        y: req.y,
        width,
        height,
        blocksCollision: blocks,
        meta: req.meta,
      });

      // Spawn a sprite/animated-sprite entity at correct world position
      const px = req.x * grid.tileSize;
      const py = req.y * grid.tileSize;

      if ("animations" in objConf) {
        // Animated via AnimatedSprite
        commands.spawn(
          new AnimatedSprite({
            texture: assetServer.loadTexture(objConf.texture)[0],
            animations: objConf.animations,
          }),
          Transform.fromPosition({ x: px, y: py }),
          ...(req.components ?? [])
        );
      } else if ("frame" in objConf) {
        // Static sprite
        const [texture] = assetServer.loadTexture(objConf.texture);
        commands.spawn(
          new Sprite(texture, objConf.frame),
          Transform.fromPosition({ x: px, y: py }),
          ...(req.components ?? [])
        );
      } else {
        throw new Error("Invalid object configuration");
      }

      // Optionally cache the tilemap layer after changes
      // tilemap.cache();
    }
  }
}).label("ApplyBuildRequests");
