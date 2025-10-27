import { TiledBoolProperty } from "./BoolProperty";
import { TiledClassProperty } from "./ClassProperty";
import { TiledColorProperty } from "./ColorProperty";
import { TiledFileProperty } from "./FileProperty";
import { TiledFloatProperty } from "./FloatProperty";
import { TiledIntProperty } from "./IntProperty";
import { TiledObjectProperty } from "./ObjectProperty";
import { TiledStringProperty } from "./StringProperty";

/** Union of all property types. */
export type TiledAnyProperty =
  | TiledBoolProperty
  | TiledClassProperty
  | TiledColorProperty
  | TiledFileProperty
  | TiledFloatProperty
  | TiledIntProperty
  | TiledObjectProperty
  | TiledStringProperty;
