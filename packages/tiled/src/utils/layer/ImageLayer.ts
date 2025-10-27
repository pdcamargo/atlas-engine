import { type TiledColor } from "../../common/Color";
import { type TiledLayer } from "./Layer";

/** Image layer. */
export interface TiledImageLayer extends TiledLayer<"imagelayer"> {
  /** Image used by this layer. */
  image: string;

  /** Whether the image drawn by this layer is repeated along the X axis. Default is false. */
  repeatx?: boolean;

  /** Whether the image drawn by this layer is repeated along the Y axis. Default is false. */
  repeaty?: boolean;

  /** Optional transparent color. */
  transparentcolor?: TiledColor;
}
