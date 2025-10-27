import { TiledEncodedTileLayer } from "./EncodedTileLayer";
import { TiledEncoding } from "./Encoding";
import { type TiledGroup } from "./Group";
import { type TiledImageLayer } from "./ImageLayer";
import { type TiledObjectGroup } from "./ObjectGroup";
import { TiledUnencodedTileLayer } from "./UnencodedTileLayer";

/** Union of all tile layer types. */
export type TiledAnyTileLayer = TiledEncodedTileLayer | TiledUnencodedTileLayer;

/** Union of all layer types. */
export type TiledAnyLayer =
  | TiledAnyTileLayer
  | TiledObjectGroup
  | TiledImageLayer
  | TiledGroup;

/**
 * Checks if given layer is a tile layer.
 *
 * @param layer - The layer to check.
 * @returns True if layer is a tile layer, false if not.
 */
export function isTileLayer(
  layer: TiledAnyLayer
): layer is TiledEncodedTileLayer | TiledUnencodedTileLayer {
  return layer.type === "tilelayer";
}

/**
 * Checks if given layer is an encoded tile layer.
 *
 * @param layer - The layer to check.
 * @returns True if layer is an encoded tile layer, false if not.
 */
export function isEncodedTileLayer(
  layer: TiledAnyLayer
): layer is TiledEncodedTileLayer {
  return layer.type === "tilelayer" && layer.encoding !== TiledEncoding.CSV;
}

/**
 * Checks if given layer is an encoded tile layer.
 *
 * @param layer - The layer to check.
 * @returns True if layer is an unencoded tile layer, false if not.
 */
export function isUnencodedTileLayer(
  layer: TiledAnyLayer
): layer is TiledUnencodedTileLayer {
  return (
    layer.type === "tilelayer" &&
    (layer.encoding == null || layer.encoding === TiledEncoding.CSV)
  );
}

/**
 * Checks if given layer is an object group.
 *
 * @param layer - The layer to check.
 * @returns True if layer is an object group, false if not.
 */
export function isObjectGroup(layer: TiledAnyLayer): layer is TiledObjectGroup {
  return layer.type === "objectgroup";
}

/**
 * Checks if given layer is an image layer.
 *
 * @param layer - The layer to check.
 * @returns True if layer is an image layer, false if not.
 */
export function isImageLayer(layer: TiledAnyLayer): layer is TiledImageLayer {
  return layer.type === "imagelayer";
}

/**
 * Checks if given layer is a group.
 *
 * @param layer - The layer to check.
 * @returns True if layer is a group, false if not.
 */
export function isGroup(layer: TiledAnyLayer): layer is TiledGroup {
  return layer.type === "group";
}
