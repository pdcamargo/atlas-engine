import {
  CustomSerializer,
  DeserializationContext,
  MapSerializer,
  SerializationContext,
} from "@atlas/core";
import { Material } from "../materials";

/**
 * Serializer for Material class
 * Handles the Material class with its private fields through public getters
 */
export class MaterialSerializer implements CustomSerializer<Material> {
  name = "material";

  private mapSerializer = new MapSerializer();

  canSerialize(value: any): boolean {
    return value instanceof Material;
  }

  serialize(value: Material, context: SerializationContext): any {
    return {
      __type: "Material",
      id: value.id,
      shader: value.shader,
      properties: this.mapSerializer.serialize(value.properties, context),
      blendMode: value.blendMode,
    };
  }

  deserialize(data: any, context: DeserializationContext): Material {
    return new Material(
      data.shader,
      this.mapSerializer.deserialize(data.properties, context)
    );
  }
}
