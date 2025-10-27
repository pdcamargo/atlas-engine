import { type TiledColor } from "../../common/Color";
import { type TiledAnyLayer } from "../../layer/AnyLayer";
import { TiledAnyProperty } from "../../property/AnyProperty";
import { TiledAnyTileset } from "../../tileset/AnyTileset";
import { type TiledMapOrientation } from "./MapOrientation";
import { type TiledMapRenderOrder } from "./MapRenderOrder";
import { type TiledStaggerAxis } from "./StaggerAxis";
import { type TiledStaggerIndex } from "./StaggerIndex";

/** Tiled map. This is the root type in a Tiled JSON file. */
export interface TiledMap {
  /** Optional background color. */
  backgroundcolor?: TiledColor;

  /** Optional class of the map. */
  class?: string;

  /** The compression level to use for tile layer data. Defaults to -1, which means to use the algorithm default. */
  compressionlevel: number;

  /** Irrelevant editor-specific settings. */
  editorsettings?: unknown;

  /** Number of tile rows. */
  height: number;

  /** Length of the side of a hex tile in pixels. Only set for hexagonal maps. */
  hexsidelength?: number;

  /** Whether the map has infinite dimensions. */
  infinite: boolean;

  /** Array of layers. */
  layers: TiledAnyLayer[];

  /** Auto-increments for each layer. */
  nextlayerid: number;

  /** Auto-increments for each placed object. */
  nextobjectid: number;

  /** The map orientation. */
  orientation: TiledMapOrientation;

  /** X coordinate of the parallax origin in pixels. 0 if not set. */
  parallaxoriginx?: number;

  /** Y coordinate of the parallax origin in pixels. 0 if not set. */
  parallaxoriginy?: number;

  /** Array of properties. Empty if not set. */
  properties?: TiledAnyProperty[];

  /** The map render order. */
  renderorder: TiledMapRenderOrder;

  /** The stagger axis. Only set for staggered / hexagonal maps. */
  staggeraxis?: TiledStaggerAxis;

  /** The stagger index. Only set for staggered / hexagonal maps. */
  staggerindex?: TiledStaggerIndex;

  /** The Tiled version used to save the file. */
  tiledversion: string;

  /** Map grid height. */
  tileheight: number;

  /** Array of tilesets. Empty if not set. */
  tilesets?: TiledAnyTileset[];

  /** Map grid width. */
  tilewidth: number;

  /** Always "map". */
  type: "map";

  /** The JSON format version. */
  version: string;

  /** Number of tile columns. */
  width: number;
}
