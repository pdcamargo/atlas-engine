/** Tile layer encoding. */
export enum TiledEncoding {
  CSV = "csv",
  BASE64 = "base64",
}

export type TiledEncodingDataType<T extends TiledEncoding> =
  T extends TiledEncoding.CSV
    ? number[]
    : T extends TiledEncoding.BASE64
      ? string
      : number[] | string;
