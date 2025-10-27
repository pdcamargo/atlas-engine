import { TiledAnyLayer } from "./AnyLayer";
import { type TiledLayer } from "./Layer";

/** Group layer. */
export interface TiledGroup extends TiledLayer<"group"> {
  /** Array of layers. */
  layers: TiledAnyLayer[];
}
