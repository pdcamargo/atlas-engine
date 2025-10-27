import { TiledWangColor } from "./WangColor";
import { TiledWangSetType } from "./WangSetType";
import { TiledWangTile } from "./WangTile";

/** Wang set. */
export interface TiledWangSet {
  /** Optional class of the Wang set. */
  class?: string;

  /** Array of Wang colors. */
  colors: TiledWangColor[];

  /** Name of the Wang set. */
  name: string;

  /** Local ID of tile representing the Wang set. */
  tile: number;

  /** The type of Wang set. */
  type: TiledWangSetType;

  /** Array of Wang tiles. */
  wangtiles: TiledWangTile[];
}
