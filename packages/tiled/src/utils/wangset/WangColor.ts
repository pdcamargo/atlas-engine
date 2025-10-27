import { TiledColor } from "../../common/Color";
import { TiledAnyProperty } from "../../property/AnyProperty";

/** Wang color. */
export interface TiledWangColor {
  /** Optional class of the Wang color. */
  class?: string;

  /** The color. */
  color: TiledColor;

  /** The name. */
  name: string;

  /** Probability used when randomizing. */
  probability: number;

  /** Optional custom properties. */
  properties?: TiledAnyProperty[];

  /** Local ID of tile representing the Wang color. */
  tile: number;
}
