import "reflect-metadata";
import { SerializationRegistry } from "./registry";
import type {
  SerializableOptions,
  SerializePropertyOptions,
  Constructor,
} from "./types";

/**
 * Class decorator to mark a class as serializable
 *
 * @example
 * ```typescript
 * @Serializable()
 * class Player {
 *   @SerializeProperty()
 *   health: number = 100;
 * }
 * ```
 */
export function Serializable(
  options: SerializableOptions = {}
): ClassDecorator {
  return function (target: any) {
    SerializationRegistry.registerClass(target as Constructor, options);
  };
}

/**
 * Property decorator to mark a property as serializable
 *
 * @example
 * ```typescript
 * @Serializable()
 * class Player {
 *   @SerializeProperty()
 *   health: number = 100;
 *
 *   @SerializeProperty({ type: () => Weapon })
 *   weapon: Weapon | null = null;
 *
 *   @SerializeProperty({ serializer: 'handle' })
 *   sprite: Handle<Texture> | null = null;
 * }
 * ```
 */
export function SerializeProperty(
  options: SerializePropertyOptions = {}
): PropertyDecorator {
  return function (target: any, propertyKey: string | symbol) {
    const constructor = target.constructor as Constructor;

    // Try to get the design-time type from reflect-metadata
    let designType: Constructor | undefined;
    try {
      designType = Reflect.getMetadata("design:type", target, propertyKey);
    } catch (e) {
      // reflect-metadata not available or failed
    }

    // Use the type from options if provided, otherwise fall back to design type
    const type = options.type ? options.type() : designType;

    SerializationRegistry.registerProperty(constructor, {
      propertyKey,
      type,
      options,
    });
  };
}

/**
 * Helper to create a serializable class without decorators
 * Useful for classes where you can't use decorators
 */
export function makeSerializable(
  constructor: Constructor,
  options: SerializableOptions & {
    properties?: Record<string, SerializePropertyOptions>;
  } = {}
): void {
  const { properties, ...classOptions } = options;

  SerializationRegistry.registerClass(constructor, classOptions);

  if (properties) {
    for (const [propertyKey, propertyOptions] of Object.entries(properties)) {
      SerializationRegistry.registerProperty(constructor, {
        propertyKey,
        type: propertyOptions.type?.(),
        options: propertyOptions,
      });
    }
  }
}
