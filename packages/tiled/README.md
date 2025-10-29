# @atlas/tiled

Tiled map editor integration for the Atlas engine. Load and render maps created with [Tiled Map Editor](https://www.mapeditor.org/) directly in your Atlas game.

## Features

- ✅ Load `.tmj` (Tiled Map JSON) files
- ✅ Support for embedded and external `.tsj` (Tileset JSON) files
- ✅ Animated tiles (automatic conversion to renderer AnimatedTile)
- ✅ Multiple layers (tile layers, object layers, groups)
- ✅ Layer tinting and visibility
- ✅ Object layers → Sprite conversion
- ✅ Tile flip transformations (horizontal/vertical)
- ✅ Progressive asset loading (non-blocking)
- ✅ Proper scene graph hierarchy with Containers

## Installation

The package is already part of the Atlas monorepo. Just import it:

```typescript
import { TiledEcsPlugin, TiledTileMap } from "@atlas/tiled";
```

## Quick Start

### 1. Add the Plugin

```typescript
import { App } from "@atlas/core";
import { TiledEcsPlugin } from "@atlas/tiled";

await App.create().addPlugins(new TiledEcsPlugin()).run();
```

### 2. Load a Tiled Map

```typescript
import { sys, AssetServer, SceneGraph } from "@atlas/core";
import { TiledTileMap, TiledMapAsset } from "@atlas/tiled";

const startupSystem = sys(({ commands }) => {
  const assetServer = commands.getResource(AssetServer);
  const sceneGraph = commands.getResource(SceneGraph);

  // Load the map file
  const mapHandle = assetServer.load<TiledMapAsset>("/maps/level1.tmj");

  // Create the tilemap
  const tiledMap = new TiledTileMap(mapHandle);

  // IMPORTANT: Add to scene graph for rendering
  sceneGraph.addChild(tiledMap);

  // Spawn as component for ECS tracking
  commands.spawn(tiledMap);
}).label("LoadTiledMap");

app.addStartupSystems(startupSystem);
```

### 3. Export from Tiled

In Tiled Map Editor:

1. Create your map with tiles and objects
2. **File → Export As...** → Choose **JSON map files (\*.tmj)**
3. Place the exported `.tmj` file in your public assets folder

For external tilesets:

1. Right-click tileset → **Export As...** → Choose **JSON tilesets (\*.tsj)**
2. Ensure paths are relative to the map file

## Scene Hierarchy

The `TiledTileMap` component creates this structure:

```
TiledTileMap (Container)
├── TileMap (renderer tilemap)
│   ├── Layer 1 (tile layer)
│   ├── Layer 2 (tile layer)
│   └── Layer 3 (tile layer)
└── ObjectLayersContainer (Container)
    ├── ObjectLayer1Container (Container)
    │   ├── Sprite (tile object)
    │   └── Sprite (tile object)
    └── ObjectLayer2Container (Container)
        └── Sprite (tile object)
```

## API Reference

### TiledTileMap

Main component for Tiled map instances.

```typescript
class TiledTileMap extends Container {
  // Properties
  mapHandle: Handle<TiledMapAsset>; // Map asset handle
  tileMap: TileMap | null; // Renderer tilemap
  objectLayersContainer: Container | null; // Object layers root
  tilesets: Map<number, TileSet>; // firstgid → TileSet mapping
  loaded: boolean; // Initialization state
  objectLayerContainers: Map<string, Container>; // Name → Container mapping

  // Methods
  constructor(mapHandle: Handle<TiledMapAsset>, id?: string);
  findTilesetForGID(gid: number): { tileset: TileSet; localId: number } | null;
  getObjectLayerContainer(layerName: string): Container | undefined;
}
```

### TiledEcsPlugin

Plugin that registers the Tiled asset system.

```typescript
class TiledEcsPlugin implements EcsPlugin {
  build(app: App): void;
  name(): string;
}
```

### Asset Types

#### TiledMapAsset

```typescript
class TiledMapAsset {
  data: TiledMap; // Parsed Tiled map data
  path: string; // File path

  getBaseDirectory(): string; // Get directory path
  resolvePath(relativePath: string): string; // Resolve relative path
}
```

#### TiledTilesetAsset

```typescript
class TiledTilesetAsset {
  data: TiledTileset; // Parsed tileset data
  path: string; // File path

  getBaseDirectory(): string;
  resolveImagePath(relativePath: string): string;
}
```

## Advanced Usage

### Accessing Object Layers

Object layers are converted to Sprite entities inside Container nodes:

```typescript
const tiledMap = /* your TiledTileMap instance */;

// Get a specific object layer container by name
const enemiesLayer = tiledMap.getObjectLayerContainer("Enemies");

if (enemiesLayer) {
  // Iterate through all sprites in this layer
  for (const child of enemiesLayer.getChildren()) {
    if (child instanceof Sprite) {
      console.log("Enemy sprite:", child.id);
    }
  }
}
```

### Working with Tilesets

Access renderer tilesets from the TiledTileMap:

```typescript
// Iterate through all loaded tilesets
for (const [firstgid, tileSet] of tiledMap.tilesets) {
  console.log(`Tileset with firstgid ${firstgid}:`, tileSet);
  console.log(`  Tile count: ${tileSet.getTileCount()}`);
  console.log(`  Tile size: ${tileSet.tileWidth}x${tileSet.tileHeight}`);
}

// Find which tileset contains a specific GID
const result = tiledMap.findTilesetForGID(42);
if (result) {
  const { tileset, localId } = result;
  const tile = tileset.getTile(localId);
  console.log("Tile:", tile);
}
```

### Animated Tiles

Animated tiles from Tiled are automatically converted to `AnimatedTile` instances:

```typescript
// Animated tiles are handled automatically by the system
// They will update and render with their animation frames

// Access the underlying TileMap to see animated tiles
if (tiledMap.tileMap) {
  for (const layer of tiledMap.tileMap.getLayers()) {
    const animatedTiles = layer.getAnimatedTiles();
    console.log(
      `Layer ${layer.name} has ${animatedTiles.length} animated tiles`
    );
  }
}
```

### Custom Post-Processing

Run custom logic after a map loads:

```typescript
const checkMapLoadedSystem = sys(({ commands }) => {
  for (const [entity, tiledMap] of commands.query(TiledTileMap).all()) {
    if (tiledMap.loaded && !tiledMap.metadata.get("processed")) {
      // Map just finished loading, do custom setup
      console.log("Map loaded!");

      // Access the tile map
      if (tiledMap.tileMap) {
        console.log("Tile layers:", tiledMap.tileMap.getLayers().length);
      }

      // Access object layers
      const spawnsLayer = tiledMap.getObjectLayerContainer("PlayerSpawns");
      if (spawnsLayer) {
        // Spawn player at first spawn point
        const firstSpawn = spawnsLayer.getChildren()[0];
        if (firstSpawn) {
          const pos = firstSpawn.getPosition();
          console.log("Player spawn position:", pos);
        }
      }

      // Mark as processed so we don't run this again
      tiledMap.metadata.set("processed", true);
    }
  }
});
```

## Tiled Map Editor Tips

### Recommended Export Settings

1. **Map Format:** JSON (.tmj)
2. **Tileset Format:** JSON (.tsj) for external, or embed in map
3. **Layer Format:** CSV or Base64 (both supported)
4. **Compression:** None, Zlib, Gzip, or Zstd (all supported)

### Supported Features

| Feature            | Supported  | Notes                             |
| ------------------ | ---------- | --------------------------------- |
| Orthogonal maps    | ✅ Yes     | Fully supported                   |
| Isometric maps     | ⚠️ Partial | Basic support, needs testing      |
| Hexagonal maps     | ⚠️ Partial | Basic support, needs testing      |
| Tile layers        | ✅ Yes     | Full support                      |
| Object layers      | ✅ Yes     | Tile objects converted to Sprites |
| Image layers       | ❌ No      | Not yet implemented               |
| Group layers       | ✅ Yes     | Recursive processing              |
| Animated tiles     | ✅ Yes     | Auto-converted to AnimatedTile    |
| Tile flipping      | ✅ Yes     | Horizontal/vertical via scale     |
| Layer tinting      | ✅ Yes     | Applied to renderer layer         |
| Layer opacity      | ❌ No      | Not supported by renderer yet     |
| Parallax scrolling | ❌ No      | Not yet implemented               |

### Object Layer Recommendations

When using object layers in Tiled:

1. **Tile Objects:** Use the tile object tool to place sprites
   - These will be converted to `Sprite` entities
   - Position, rotation, and flipping are preserved

2. **Named Objects:** Give objects names for easy lookup

   ```typescript
   // Objects with names can be found by iterating children
   const enemiesLayer = tiledMap.getObjectLayerContainer("Enemies");
   for (const sprite of enemiesLayer.getChildren()) {
     if (sprite.id === "boss") {
       // Found the boss sprite
     }
   }
   ```

3. **Custom Properties:** Tiled custom properties are not yet parsed
   - Use object names or layer organization for now
   - Custom properties support coming in future update

### Performance Tips

1. **Use External Tilesets:** Share tilesets across multiple maps
2. **Layer Organization:** Use groups to organize related layers
3. **Limit Animated Tiles:** Too many can impact performance
4. **Chunk Size:** For infinite maps, use reasonable chunk sizes
5. **Compression:** Use Zstd compression for faster loading

## Utilities

### GID Utilities

```typescript
import { decodeGID, findTilesetForGID, isEmptyTile } from "@atlas/tiled";

// Decode a Tiled Global ID
const decoded = decodeGID(0x80000042);
// {
//   tileId: 66,
//   flippedHorizontally: true,
//   flippedVertically: false,
//   flippedDiagonally: false
// }

// Check if a GID is empty (GID 0)
isEmptyTile(0); // true
```

### Coordinate Conversion

```typescript
import {
  tiledPixelsToWorldUnits,
  tileToWorldPosition,
  objectToWorldPosition,
  tiledRotationToRadians,
} from "@atlas/tiled";

// Convert pixels to world units (uses PixelsPerUnit)
const worldX = tiledPixelsToWorldUnits(160); // e.g., 1.6 world units

// Convert tile coordinates to world position
const pos = tileToWorldPosition(10, 5, 16, 16, "orthogonal");
// { x: 1.6, y: 0.8, z: 0 }

// Convert Tiled rotation to radians
const radians = tiledRotationToRadians(45); // 0.785...
```

## Tiled Type Definitions

All Tiled JSON structures are fully typed. Import them from `@atlas/tiled`:

```typescript
import {
  TiledMap,
  TiledTileset,
  TiledAnyLayer,
  TiledTileLayer,
  TiledObjectGroup,
  TiledMapObject,
  isTileLayer,
  isObjectGroup,
  isGroup,
  isEmbeddedTileset,
  isTilesetRef,
} from "@atlas/tiled";
```

See [Tiled documentation](https://doc.mapeditor.org/en/stable/reference/json-map-format/) for complete format reference.

## Examples

Check out the example game in `apps/web/src/games/tiled/` for a complete working example.

## Troubleshooting

### Map doesn't appear

1. **Check asset path:** Ensure the path to `.tmj` file is correct
2. **Check browser console:** Look for loading errors
3. **Verify export format:** Must be JSON (.tmj), not TMX
4. **Check image paths:** Ensure tileset images are accessible

### Tiles are missing

1. **Wait for loading:** The system loads progressively
2. **Check tilesets:** Ensure external `.tsj` files are in correct location
3. **Verify image paths:** Images must be relative to tileset file
4. **Check browser network tab:** Verify all assets are loading

### Object layers are empty

1. **Use tile objects:** Only tile objects (with GID) are converted to sprites
2. **Check visibility:** Invisible objects are still created but hidden
3. **Verify layer name:** Use correct layer name in `getObjectLayerContainer()`

### Animated tiles not animating

1. **Check tile definition:** Ensure animation is defined in Tiled tileset
2. **Verify frame count:** Animation needs at least 2 frames
3. **Check frame duration:** Ensure durations are > 0

## Contributing

This package is part of the Atlas engine monorepo. To contribute:

1. Make changes in `packages/tiled/`
2. Run `pnpm build --filter=@atlas/tiled` to check for errors
3. Test with the example game in `apps/web/src/games/tiled/`
4. Submit a pull request

## License

MIT
