import { TiledTilesetRef } from "../../tileset/TilesetRef";
import { TiledBaseMapObject } from "./BaseMapObject";

/** External map object template. */
export interface TiledObjectTemplate {
  type: "template";

  /** Optional external tileset used byt the template. */
  tileset?: TiledTilesetRef;

  /** The object instantiated by this template. */
  object: TiledBaseMapObject;
}
