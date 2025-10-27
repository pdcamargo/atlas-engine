import { TiledBaseMapObject } from "./BaseMapObject";

/** A map object. */
export interface TiledMapObject extends TiledBaseMapObject {
  /** X coordinate in pixels. */
  x: number;

  /** Y coordinate in pixels. */
  y: number;
}
