import { type TiledColor } from "../../common/Color";
import { TiledAnyProperty } from "../../property/AnyProperty";

/** Map layer. */
export interface TiledLayer<T extends string = string> {
  /** The class of the layer. */
  class?: string;

  /** Incremental ID. Unique across all layers. */
  id: number;

  /** Whether layer is locked in the editor. Default is false. */
  locked?: boolean;

  /** The layer's name. */
  name: string;

  /** Optional horizontal layer offset in pixels. Default is 0. */
  offsetx?: number;

  /** Optional vertical layer offset in pixels. Default is 0.  */
  offsety?: number;

  /** Layer opacity between 0 and 1. */
  opacity: number;

  /** Horizontal parallax factor. Default is 1. */
  parallaxx?: number;

  /** Vertical parallax factor. Default is 1. */
  parallaxy?: number;

  /** Array of properties. Empty if not set. */
  properties?: TiledAnyProperty[];

  /** Optional tint color that is multiplied with any graphics drawn by this layer or any child layer. */
  tintcolor?: TiledColor;

  /** The layer type. */
  type: T;

  /** Whether layer is shown or hidden in editor. */
  visible: boolean;

  /** Horizontal layer offset in tiles. Always 0. */
  x: number;

  /** Vertical layer offset in tiles. Always 0. */
  y: number;
}
