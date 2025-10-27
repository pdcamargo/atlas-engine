import { toByteArray } from "base64-js";
import { decompress } from "fzstd";
import { inflate, ungzip } from "pako";

import { TiledAnyTileLayer, isUnencodedTileLayer } from "./AnyLayer";
import { TiledCompression } from "./Compression";
import { TiledEncoding } from "./Encoding";
import { TiledUnencodedTileLayer } from "./UnencodedTileLayer";

// Decoder implementations
const decoders: Record<
  Exclude<TiledEncoding, TiledEncoding.CSV>,
  (data: string) => Uint8Array
> = {
  [TiledEncoding.BASE64]: toByteArray,
};

// Decompressor implementations
const decompressors: Record<
  TiledCompression,
  (data: Uint8Array) => Uint8Array
> = {
  [TiledCompression.NONE]: (data: Uint8Array) => data,
  [TiledCompression.ZLIB]: inflate,
  [TiledCompression.GZIP]: ungzip,
  [TiledCompression.ZSTD]: decompress,
};

/**
 * Decodes the given tile layer (if necessary) and returns the decoded tile layer.
 *
 * @param layer - The tile layer to decode.
 * @returns The decoded tile layer or the original layer if it was not encoded.
 */
export function decodeTileLayer(
  layer: TiledAnyTileLayer
): TiledUnencodedTileLayer {
  if (isUnencodedTileLayer(layer)) {
    // Nothing to decode
    return layer;
  }

  const decode = decoders[layer.encoding];
  const decompress = decompressors[layer.compression ?? TiledCompression.NONE];
  const toArray = (data: Uint8Array): number[] =>
    Array.from(new Uint32Array(data.buffer, data.byteOffset));

  return {
    ...layer,
    compression: TiledCompression.NONE,
    encoding: TiledEncoding.CSV,
    data:
      layer.data != null ? toArray(decompress(decode(layer.data))) : undefined,
    chunks: layer.chunks?.map((chunk) => ({
      ...chunk,
      data: toArray(decompress(decode(chunk.data))),
    })),
  };
}
