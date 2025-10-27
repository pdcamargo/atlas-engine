import { TiledColor } from "../../common/Color";
import { TiledPoint } from "../../common/Point";
import { TiledGrid } from "../../grid/Grid";
import { TiledAnyProperty } from "../../property/AnyProperty";
import { TiledTile } from "../../tile/Tile";
import { TiledWangSet } from "../../wangset/WangSet";
import { TiledFillMode } from "./FillMode";
import { TiledObjectAlignment } from "./ObjectAlignment";
import { TiledTileRenderSize } from "./TileRenderSize";
import { TiledTransformation } from "./Transformation";

/** Map tileset. */
export interface TiledTileset {
  /** Optional background color. */
  backgroundcolor?: TiledColor;

  /** Optional class of the tileset. */
  class?: string;

  /** The number of tile columns. */
  columns: number;

  /** The fill mode to use when rendering tiles from this tileset. Default is STRETCH. */
  fillmode?: TiledFillMode;

  /** Optional common grid settings for tiles in this tileset. Default is 32x32 Orthogonal. */
  grid?: TiledGrid;

  /** The image used for tiles in this set. */
  image: string;

  /** Height of the source image in pixels. */
  imageheight: number;

  /** Width of the source image in pixels. */
  imagewidth: number;

  /** Buffer between image edge and first tile in pixels. */
  margin: number;

  /** Name given to this tileset. */
  name: string;

  /** Alignment to use for tile objects. Default is UNSPECIFIED. */
  objectalignment?: TiledObjectAlignment;

  /** Array of custom properties. */
  properties?: TiledAnyProperty[];

  /** Spacing between adjacent tiles in image (pixels). */
  spacing: number;

  /** The number of tiles in this tileset. */
  tilecount: number;

  /** Maximum height of tiles in this set. */
  tileheight: number;

  /** Optional tile drawing offset in pixels. Positive is right and down. */
  tileoffset?: TiledPoint;

  /** Optional size to use when rendering tiles from this tileset on a tile layer. Default is TILE. */
  tilerendersize?: TiledTileRenderSize;

  /** The tiles. */
  tiles?: TiledTile[];

  /** Maximum width of tiles in this set. */
  tilewidth: number;

  /** Optional allowed transformations. */
  transformations?: TiledTransformation;

  /** Optional transparent color. */
  transparentcolor?: TiledColor;

  /** Optional list of Wang sets. */
  wangsets?: TiledWangSet[];
}
