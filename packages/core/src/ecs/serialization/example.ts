/**
 * Example demonstrating the serialization system
 * This shows how to use decorators, custom serializers, and scenes
 */

import { World } from "../world";
import { Transform } from "../components/transform";
import { Parent, Children } from "../components/parent";
import {
  Serializable,
  SerializeProperty,
  registerBuiltInSerializers,
} from "./index";
import { SceneSerializer } from "../scene/scene-serializer";
import { extendWorldWithScenes } from "../scene/spawner";
import type { Handle } from "../assets/handle";

// Example 1: Simple serializable component
@Serializable()
class Health {
  @SerializeProperty()
  public current: number;

  @SerializeProperty()
  public max: number;

  constructor(current: number = 100, max: number = 100) {
    this.current = current;
    this.max = max;
  }
}

// Example 2: Component with nullable Handle reference
@Serializable()
class Sprite {
  @SerializeProperty({ serializer: "handle", optional: true })
  public texture: Handle<any> | null;

  @SerializeProperty()
  public width: number;

  @SerializeProperty()
  public height: number;

  constructor(
    texture: Handle<any> | null = null,
    width: number = 32,
    height: number = 32
  ) {
    this.texture = texture;
    this.width = width;
    this.height = height;
  }
}

// Example 3: Nested component with default values
@Serializable()
class Weapon {
  @SerializeProperty()
  public damage: number;

  @SerializeProperty({ defaultValue: 1.0 })
  public fireRate: number;

  constructor(damage: number = 10, fireRate: number = 1.0) {
    this.damage = damage;
    this.fireRate = fireRate;
  }
}

@Serializable()
class Inventory {
  @SerializeProperty({ type: () => Weapon, optional: true })
  public weapon: Weapon | null;

  @SerializeProperty()
  public gold: number;

  constructor(weapon: Weapon | null = null, gold: number = 0) {
    this.weapon = weapon;
    this.gold = gold;
  }
}

/**
 * Example usage function
 */
export function exampleSerializationUsage() {
  // Step 1: Register built-in serializers
  registerBuiltInSerializers();

  // Step 2: Extend World with scene support
  extendWorldWithScenes();

  // Step 3: Create a world and entities
  const world = new World();

  // Create a player entity
  const player = world.createEntity();
  world.addComponents(player, {
    transform: new Transform({ x: 100, y: 200 }),
    health: new Health(80, 100),
    inventory: new Inventory(new Weapon(25, 2.0), 150),
  });

  // Create a child entity (weapon sprite)
  const weaponSprite = world.createEntity();
  world.addComponents(weaponSprite, {
    transform: new Transform({ x: 10, y: 5 }),
    sprite: new Sprite(null, 16, 16),
    parent: new Parent(player),
  });

  // Update player with children
  world.addComponents(player, {
    children: new Children([weaponSprite]),
  });

  // Create another entity
  const enemy = world.createEntity();
  world.addComponents(enemy, {
    transform: new Transform({ x: 300, y: 150 }),
    health: new Health(50, 50),
  });

  // Step 4: Save the scene
  const scene = world.saveScene([player, weaponSprite, enemy], {
    name: "Level1",
    version: "1.0.0",
  });

  // Step 5: Serialize to JSON
  const json = SceneSerializer.toJSON(scene, true);
  console.log("Serialized Scene:");
  console.log(json);

  // Step 6: Deserialize from JSON
  const loadedScene = SceneSerializer.fromJSON(json);

  // Step 7: Spawn the scene into a new world
  const newWorld = new World();
  const sceneInstance = newWorld.spawnScene(loadedScene);

  console.log("\nSpawned Scene:");
  console.log(`- Root entities: ${sceneInstance.rootEntities.length}`);
  console.log(`- Total entities: ${sceneInstance.getAllEntities().length}`);

  // Step 8: Verify the loaded data
  for (const entity of sceneInstance.getAllEntities()) {
    const transform = newWorld.getComponent(entity, Transform);
    const health = newWorld.getComponent(entity, Health);

    console.log(`\nEntity ${entity}:`);
    if (transform) {
      console.log(
        `  Position: (${transform.position.x}, ${transform.position.y})`
      );
    }
    if (health) {
      console.log(`  Health: ${health.current}/${health.max}`);
    }
  }

  return { world, scene, newWorld, sceneInstance };
}

/**
 * Example: Custom serializer for a special type
 */
import type {
  CustomSerializer,
  SerializationContext,
  DeserializationContext,
} from "./types";
import { SerializationRegistry } from "./registry";

class Color {
  constructor(
    public r: number,
    public g: number,
    public b: number,
    public a: number = 1.0
  ) {}
}

class ColorSerializer implements CustomSerializer<Color> {
  name = "color";

  canSerialize(value: any): boolean {
    return value instanceof Color;
  }

  serialize(value: Color, context: SerializationContext): any {
    // Serialize as hex string
    const r = Math.round(value.r * 255)
      .toString(16)
      .padStart(2, "0");
    const g = Math.round(value.g * 255)
      .toString(16)
      .padStart(2, "0");
    const b = Math.round(value.b * 255)
      .toString(16)
      .padStart(2, "0");
    const a = Math.round(value.a * 255)
      .toString(16)
      .padStart(2, "0");
    return `#${r}${g}${b}${a}`;
  }

  deserialize(data: any, context: DeserializationContext): Color {
    // Deserialize from hex string
    const hex = data.replace("#", "");
    const r = parseInt(hex.substring(0, 2), 16) / 255;
    const g = parseInt(hex.substring(2, 4), 16) / 255;
    const b = parseInt(hex.substring(4, 6), 16) / 255;
    const a = hex.length === 8 ? parseInt(hex.substring(6, 8), 16) / 255 : 1.0;
    return new Color(r, g, b, a);
  }
}

export function exampleCustomSerializer() {
  // Register the custom serializer
  const colorSerializer = new ColorSerializer();
  SerializationRegistry.registerSerializer(colorSerializer);
  SerializationRegistry.registerTypeSerializer(Color, colorSerializer);

  @Serializable()
  class ColoredSprite {
    @SerializeProperty()
    public tint: Color;

    constructor(tint: Color = new Color(1, 1, 1, 1)) {
      this.tint = tint;
    }
  }

  const sprite = new ColoredSprite(new Color(1.0, 0.5, 0.25, 0.8));

  const serialized = JSON.stringify(
    require("./serializer").Serializer.serialize(sprite)
  );
  console.log("Serialized:", serialized);
  // Output: {"__type":"ColoredSprite","tint":"#ff8040cc"}

  const deserialized = require("./serializer").Serializer.deserialize(
    JSON.parse(serialized)
  );
  console.log("Deserialized:", deserialized);
  // Output: ColoredSprite { tint: Color { r: 1, g: 0.5, b: 0.25, a: 0.8 } }
}
