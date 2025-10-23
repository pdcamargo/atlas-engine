# Atlas ECS Serialization System

A decorator-based serialization system for the Atlas ECS, inspired by Godot's scene system. This allows you to save and load entity hierarchies with full support for components, entity references, and asset handles.

## Features

- **Decorator-based metadata**: Use `@Serializable()` and `@SerializeProperty()` decorators
- **Type-safe**: Full TypeScript support with generics
- **Extensible**: Register custom serializers for any type
- **Handle support**: Automatically serialize `Handle<T>` and `WeakHandle<T>`
- **Entity references**: Properly map entity IDs during save/load
- **Scene system**: Godot-like scene management for reusable entity hierarchies
- **Nested scenes**: Support for spawning scenes within scenes

## Quick Start

### 1. Register Built-in Serializers

Call this once during app initialization:

```typescript
import { registerBuiltInSerializers } from "@atlas/core";

registerBuiltInSerializers();
```

### 2. Mark Components as Serializable

```typescript
import { Serializable, SerializeProperty } from "@atlas/core";

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
```

### 3. Save and Load Scenes

```typescript
import { World } from "@atlas/core";
import { extendWorldWithScenes, SceneSerializer } from "@atlas/core";

// Enable scene support
extendWorldWithScenes();

const world = new World();

// Create entities
const player = world.createEntity();
world.addComponents(player, {
  transform: new Transform({ x: 100, y: 200 }),
  health: new Health(100, 100),
});

// Save to scene
const scene = world.saveScene([player], { name: "Player" });

// Serialize to JSON
const json = SceneSerializer.toJSON(scene, true);

// Save to file (Node.js)
import fs from "fs";
fs.writeFileSync("player.scene", json);

// Load from file
const loadedJson = fs.readFileSync("player.scene", "utf-8");
const loadedScene = SceneSerializer.fromJSON(loadedJson);

// Spawn into world
const newWorld = new World();
const sceneInstance = newWorld.spawnScene(loadedScene);
```

## Decorator Reference

### `@Serializable(options?)`

Class decorator to mark a class as serializable.

**Options:**
- `name?: string` - Custom name for this class in serialized data (defaults to constructor.name)
- `factory?: () => any` - Custom factory function to create instances (defaults to calling constructor with no args)

**Example:**
```typescript
@Serializable({ name: "CustomPlayer" })
class Player {
  // ...
}
```

### `@SerializeProperty(options?)`

Property decorator to mark a property as serializable.

**Options:**
- `type?: () => Constructor` - Factory function to get the type (useful for nullable types)
- `serializer?: string` - Name of a custom serializer to use
- `defaultValue?: any` - Default value when deserializing if property is missing
- `optional?: boolean` - Skip if undefined during serialization
- `key?: string` - Custom key in serialized JSON (defaults to property name)

**Examples:**

```typescript
@Serializable()
class Player {
  // Basic property
  @SerializeProperty()
  public health: number = 100;

  // Nullable type (need to specify type)
  @SerializeProperty({ type: () => Weapon })
  public weapon: Weapon | null = null;

  // Optional property
  @SerializeProperty({ optional: true })
  public nickname?: string;

  // With default value
  @SerializeProperty({ defaultValue: 0 })
  public score: number = 0;

  // Handle reference
  @SerializeProperty({ serializer: "handle" })
  public sprite: Handle<Texture> | null = null;

  // Entity reference
  @SerializeProperty({ serializer: "entity" })
  public target: Entity | null = null;
}
```

## Built-in Serializers

### HandleSerializer

Serializes `Handle<T>` and `WeakHandle<T>` types.

**Usage:**
```typescript
@Serializable()
class Sprite {
  @SerializeProperty({ serializer: "handle" })
  public texture: Handle<Texture> | null = null;
}
```

### EntityRefSerializer

Serializes entity references with scene-local ID mapping.

**Usage:**
```typescript
@Serializable()
class Parent {
  @SerializeProperty({ serializer: "entity" })
  public parentId: Entity;
}
```

### PointSerializer

Serializes the `Point` class used by `Transform`.

Automatically registered for `Point` type.

### ChildrenSerializer

Serializes the `Children` component with entity reference arrays.

Automatically registered for `Children` type.

## Custom Serializers

You can create custom serializers for any type:

```typescript
import type { CustomSerializer, SerializationContext, DeserializationContext } from "@atlas/core";
import { SerializationRegistry } from "@atlas/core";

class Color {
  constructor(public r: number, public g: number, public b: number) {}
}

class ColorSerializer implements CustomSerializer<Color> {
  name = "color";

  canSerialize(value: any): boolean {
    return value instanceof Color;
  }

  serialize(value: Color, context: SerializationContext): any {
    return `#${Math.round(value.r * 255).toString(16)}${Math.round(value.g * 255).toString(16)}${Math.round(value.b * 255).toString(16)}`;
  }

  deserialize(data: any, context: DeserializationContext): Color {
    const hex = data.replace("#", "");
    return new Color(
      parseInt(hex.substring(0, 2), 16) / 255,
      parseInt(hex.substring(2, 4), 16) / 255,
      parseInt(hex.substring(4, 6), 16) / 255
    );
  }
}

// Register the serializer
const colorSerializer = new ColorSerializer();
SerializationRegistry.registerSerializer(colorSerializer);
SerializationRegistry.registerTypeSerializer(Color, colorSerializer);
```

## Scene System

### Creating Scenes

```typescript
import { Scene, SceneSerializer } from "@atlas/core";

// From world entities
const scene = world.saveScene([entity1, entity2, entity3], {
  name: "MyScene",
  version: "1.0.0",
});

// Save to JSON
const json = SceneSerializer.toJSON(scene, true);
```

### Loading Scenes

```typescript
// Load from JSON
const scene = SceneSerializer.fromJSON(json);

// Spawn into world
const sceneInstance = world.spawnScene(scene);

// Access spawned entities
const rootEntities = sceneInstance.rootEntities;
const allEntities = sceneInstance.getAllEntities();

// Map scene-local ID to world entity
const worldEntity = sceneInstance.getEntity(sceneLocalId);
```

### Scene Hierarchy

The scene system automatically preserves parent-child relationships:

```typescript
const parent = world.createEntity();
world.addComponents(parent, {
  transform: new Transform(),
});

const child = world.createEntity();
world.addComponents(child, {
  transform: new Transform(),
  parent: new Parent(parent),
});

world.addComponents(parent, {
  children: new Children([child]),
});

// Save both entities
const scene = world.saveScene([parent, child]);

// On load, parent-child relationships are preserved
const newWorld = new World();
const instance = newWorld.spawnScene(scene);
```

## Advanced Usage

### Manual Serialization

You can use the `Serializer` class directly:

```typescript
import { Serializer } from "@atlas/core";

// Serialize any object
const data = Serializer.serialize(myObject);
const json = JSON.stringify(data);

// Deserialize
const obj = Serializer.deserialize(JSON.parse(json));
```

### Serialization Context

For advanced use cases, you can provide context:

```typescript
const entityIdMap = new Map<Entity, number>();
entityIdMap.set(player, 0);
entityIdMap.set(enemy, 1);

const data = Serializer.serialize(component, {
  entityIdMap,
  customData: new Map([["key", "value"]]),
});
```

### Without Decorators

If you can't use decorators, use `makeSerializable`:

```typescript
import { makeSerializable } from "@atlas/core";

class LegacyComponent {
  public health: number = 100;
}

makeSerializable(LegacyComponent, {
  properties: {
    health: {},
  },
});
```

## Best Practices

1. **Always register serializers first**: Call `registerBuiltInSerializers()` before any serialization
2. **Mark nullable types**: Use `type` option for nullable/polymorphic properties
3. **Use custom serializers for complex types**: Don't rely on automatic serialization for special types
4. **Test save/load**: Always test your scenes can be saved and loaded correctly
5. **Version your scenes**: Use metadata to track scene versions for migration
6. **Handle missing data**: Use `defaultValue` or `optional` for backward compatibility

## Troubleshooting

### "No serialization metadata for type X"

Solution: Add `@Serializable()` decorator to the class.

### "Component type X not registered"

Solution: The component class needs to be imported and have `@Serializable()` decorator.

### Handle references are null after load

Solution: Make sure the assets are loaded before spawning the scene, or use a loading system.

### Entity references are broken

Solution: Ensure all referenced entities are included in the scene when calling `saveScene()`.

## Examples

See [example.ts](./example.ts) for comprehensive examples including:
- Basic component serialization
- Handle references
- Nested components
- Custom serializers
- Scene save/load workflow
