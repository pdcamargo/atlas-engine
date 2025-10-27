import { TiledColor } from "../../common/Color";

/** Property type. */
export enum TiledPropertyType {
  STRING = "string",
  INT = "int",
  FLOAT = "float",
  BOOL = "bool",
  COLOR = "color",
  FILE = "file",
  OBJECT = "object",
  CLASS = "class",
}

/** Type which maps a property type to a property value type. */
export type TiledPropertyValueType<T> = T extends TiledPropertyType.STRING
  ? string
  : T extends TiledPropertyType.INT
    ? number
    : T extends TiledPropertyType.FLOAT
      ? number
      : T extends TiledPropertyType.BOOL
        ? boolean
        : T extends TiledPropertyType.COLOR
          ? TiledColor
          : T extends TiledPropertyType.FILE
            ? string
            : T extends TiledPropertyType.OBJECT
              ? number
              : T extends TiledPropertyType.CLASS
                ? string
                : unknown;
