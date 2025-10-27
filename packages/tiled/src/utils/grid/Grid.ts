import { GridOrientation } from "./GridOrientation";

/** Common grid properties for tiles in a tileset. */
export interface TiledGrid {
  /** The cell height of the tile grid. */
  height: number;

  /** The grid orientation. */
  orientation: GridOrientation;

  /** The cell width of the tile grid. */
  width: number;
}
