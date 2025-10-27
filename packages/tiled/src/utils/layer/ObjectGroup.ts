import { type TiledMapObject } from "../../object/MapObject";
import { type TiledDrawOrder } from "./DrawOrder";
import { type TiledLayer } from "./Layer";

/** Object group. */
export interface TiledObjectGroup extends TiledLayer<"objectgroup"> {
  /** The object group draw order */
  draworder: TiledDrawOrder;

  /** Array of map objects. */
  objects: TiledMapObject[];
}
