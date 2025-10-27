import { TiledPropertyType, TiledPropertyValueType } from "./PropertyType";

/** Base data of a custom property. */
export interface TiledProperty<
  T extends TiledPropertyType = TiledPropertyType,
> {
  /** The name of the property. */
  name: string;

  /** The type of the property. */
  type: T;

  /** The value of the property. */
  value: TiledPropertyValueType<T>;
}
