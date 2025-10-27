# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Atlas Engine** is a TypeScript-based 2D game engine built as a monorepo using pnpm workspaces and Turbo. The engine uses an Entity-Component-System (ECS) architecture with WebGPU for rendering, Rapier2D for physics, and includes systems for animation, audio, and UI.

## Common Commands

### Development
```bash
pnpm dev              # Run dev server for web app (Vite with hot reload)
pnpm build            # Build all packages (uses Turbo pipeline)
pnpm lint             # Lint all packages
pnpm format           # Format code with Prettier
```

### Package-Specific
```bash
cd apps/web && pnpm dev                    # Run web app only
cd apps/web && pnpm build                  # Build web app (tsc + vite build)
cd packages/core && pnpm lint              # Lint specific package
```

### Tauri (Desktop App)
```bash
pnpm tauri dev        # Run desktop app with Tauri
pnpm tauri build      # Build desktop executable
```

## Architecture

### Monorepo Structure

The codebase is organized as a monorepo with two main sections:

- **`/apps`** - Applications (currently just `web`, a Vite-based demo app)
- **`/packages`** - Reusable packages divided into:
  - **Engine packages** (`@atlas/*`) - Core engine functionality
  - **Shared packages** (`@repo/*`) - Build configuration and utilities

### Core Architecture: ECS Pattern

The engine uses Entity-Component-System architecture implemented in `@atlas/core`:

- **Entities**: Unique IDs representing game objects
- **Components**: Data containers (plain classes/objects)
- **Systems**: Functions that process entities with specific components
- **Bundles**: Reusable collections of components (defined with `defineBundle()`)

### System Execution Order

Systems execute in phases during each frame (defined in [packages/core/src/ecs/types.ts:19-30](packages/core/src/ecs/types.ts#L19-L30)):

1. **StartUp** - One-time initialization (runs once before loop)
2. **PreUpdate** / **Update** / **PostUpdate** - Per-frame game logic
3. **PreFixedUpdate** / **FixedUpdate** / **PostFixedUpdate** - Fixed timestep physics (60 FPS)
4. **PreRender** / **Render** / **PostRender** - Rendering phase

The game loop in [packages/core/src/index.ts:147-206](packages/core/src/index.ts#L147-L206) runs update phases every frame, accumulates delta time for fixed updates, and handles rendering.

### Plugin System

Plugins extend engine functionality and manage their own lifecycle ([packages/core/src/plugin.ts:5-13](packages/core/src/plugin.ts#L5-L13)):

```typescript
interface EcsPlugin {
  build(app: App): void | Promise<void>;      // Register systems/resources
  ready?(app: App): boolean | Promise<boolean>; // Check if dependencies ready
  finish?(app: App): void | Promise<void>;    // Initialize after dependencies
  cleanup?(app: App): void | Promise<void>;   // Cleanup on shutdown
  name?(): string;                             // Plugin identifier
  isUnique?(): boolean;                        // Allow multiple instances (default: true)
  dependsOn?(): (string | EcsPluginConstructor)[]; // Plugin dependencies
}
```

**Plugin Loading Order**: Plugins are loaded respecting dependencies via topological sort in [packages/core/src/index.ts:287-328](packages/core/src/index.ts#L287-L328). The `ready()` method allows plugins to wait for async initialization (e.g., WebGPU device creation).

### Key Packages

#### `@atlas/core` - ECS Foundation
- World management and entity storage
- System scheduler and execution
- Plugin system with dependency resolution
- Event system (`Events`, `EventWriter`, `EventReader`)
- Asset management
- Input handling
- Physics 2D plugin (Rapier2D integration)
- Audio plugin (Web Audio API wrapper)
- **Serialization system** (recent addition) - Component/entity serialization for save/load
- Scene management

#### `@atlas/engine` - Unified API
- Re-exports all subsystems from core, renderer, audio, animator, and UI
- Main `App` class ([packages/core/src/index.ts:43-335](packages/core/src/index.ts#L43-L335)) orchestrates the engine
- Default plugin groups for common configurations

#### `@atlas/webgpu-renderer` - Graphics
- WebGPU-based 2D rendering with batching
- Components: `Sprite`, `AnimatedSprite`, `InstancedSprite`
- `Container` for scene hierarchy and transforms
- `SceneGraph` manages render order and culling
- `Tilemap` system with chunking for large maps
- `Camera` system with viewport transforms
- Texture atlas management
- Primitive shape rendering (rectangles, circles, lines)
- **Compute Shader System** - Bevy-inspired framework for GPU compute (see Compute Shader System section below)

#### `@atlas/animator` - Animation System
- Property-based animation with easing functions
- `Animation` component and resources
- Property accessors for flexible targets (component properties, transforms, etc.)
- System-driven updates (runs in Update phase)

#### `@atlas/audio` - Sound Management
- Uses native Web Audio API (AudioContext, AudioBufferSourceNode, GainNode, PannerNode)
- Audio bus system for mixing (master, sfx, music buses)
- Spatial audio support with 3D positioning
- Asset-based audio loading

#### `@atlas/ui` - User Interface
- UI component system integrated with ECS
- UI bundles for common patterns

#### `@atlas/tiled` - Tiled Map Editor Integration
- Complete ECS integration for Tiled Map Editor (.tmj, .tsj files)
- Asset loaders for Tiled maps and tilesets
- Automatic conversion to renderer TileMap/TileSet
- Support for external and embedded tilesets
- Deferred texture loading with progressive rendering
- Object layer conversion to Sprite entities
- Correct coordinate system conversion (Y-down to Y-up)
- Pixel-perfect rendering with nearest-neighbor filtering
- Layer ordering matches Tiled (first layer renders on top)

### App Initialization Pattern

All apps follow this pattern (see [apps/web/src/main.ts:18-35](apps/web/src/main.ts#L18-L35)):

```typescript
await App.create()
  .addPlugins(new MyGamePlugin(), new DebugPlugin())
  .run();
```

**Important**: Plugins are added as **instances**, not classes. The `App.create()` factory automatically registers `EntityAddedEvent` and built-in serializers.

### Writing Systems

Systems are functions that receive `commands` and `events` parameters. Use the `sys()` wrapper for system metadata:

```typescript
import { sys, QueryBuilder, Input, KeyCode } from "@atlas/engine";
import { Position, Velocity } from "./components";

// Define a query to find entities with specific components
const playerQuery = new QueryBuilder(Position, Velocity);

// Create a system with the sys() wrapper
export const movePlayerSystem = sys(({ commands }) => {
  // Access resources
  const input = commands.getResource(Input);

  // Query entities and iterate
  commands.query(playerQuery).forEach((entity, position, velocity) => {
    // Directly mutate component properties
    if (input.pressed(KeyCode.ArrowRight)) {
      velocity.x = 100;
    }
    if (input.pressed(KeyCode.ArrowLeft)) {
      velocity.x = -100;
    }
  });
}).label("Movement");
```

**System Patterns:**
- Systems receive `{ commands, events }` via destructuring
- Use `commands.getResource(ResourceClass)` to access global resources
- Use `commands.query(QueryBuilder)` to find entities with components
- Query results iterate as `(entity, component1, component2, ...)`
- Components are **directly mutated** within the loop
- Use `.label("Name")` for debugging and ordering
- Use `.runIf(() => boolean)` for conditional execution
- Use `createSet("SetName", system1, system2)` to group related systems

### Resources and Dependency Injection

Resources are global singleton objects stored in the App:
- Access via `commands.getResource(MyResource)`
- Register with `app.setResource(new MyResource())`
- Check existence with `app.hasResource(MyResource)`
- Resources are dependency-injected by class name

### Events

Event system provides decoupled communication:
- Register events: `app.addEvent(MyEvent)`
- Write events in systems: `events.send(new MyEvent(data))`
- Read events in systems: `events.read(MyEvent).forEach(event => {...})`
- Events are cleared at frame end

### Entity Spawning

**Spawning with components directly:**
```typescript
// Spawn with 1-4 components (method is overloaded)
const entity = commands.spawn(
  new Position(100, 100),
  new Sprite(textureHandle)
).id();

// Can chain methods for relationships
commands.spawn(new ChildComponent())
  .withParent(parentEntity)
  .id();
```

**Spawning with bundles:**
```typescript
// Define a bundle
const PlayerBundle = defineBundle({
  position: Position,
  sprite: Sprite,
  velocity: Velocity
});

// Spawn bundle with component constructor arguments as arrays
commands.spawnBundle(PlayerBundle, {
  position: [100, 100],           // new Position(100, 100)
  sprite: [textureHandle],        // new Sprite(textureHandle)
  velocity: []                    // new Velocity() - optional if no required args
}).id();

// For required components, use defineBundle.required()
const RequiredBundle = defineBundle({
  position: defineBundle.required(Position),  // Must be provided
  sprite: Sprite                               // Optional
});

commands.spawnBundle(RequiredBundle, {
  position: [100, 100]  // Must provide array of constructor args
});
```

**Key points:**
- `commands.spawn()` takes component **instances** (1-4 components)
- `commands.spawnBundle()` takes a bundle and **overrides object**
- Bundle overrides use **arrays** as constructor arguments: `{ position: [x, y] }`
- Both return an entity command with `.id()`, `.withParent()`, `.withChildren()` methods

### Serialization System

The new serialization system (see `packages/core/src/ecs/serialization`) enables:
- Component serialization/deserialization
- Entity snapshot and restore
- Scene persistence
- Built-in serializers auto-registered on first `App` creation ([packages/core/src/index.ts:58-62](packages/core/src/index.ts#L58-L62))

## Technology Stack

- **Language**: TypeScript 5.5.4
- **Package Manager**: pnpm 10.18.0 (required - uses workspace protocol)
- **Build Tool**: Vite 5.1.4 (for apps), Turbo 2.5.5 (orchestration)
- **Graphics**: WebGPU with `@webgpu/types` for typing
- **Physics**: @dimforge/rapier2d 0.19.0
- **Math**: gl-matrix 4.0.0-beta.2 (vec2, vec3, mat3, mat4)
- **Audio**: Native Web Audio API
- **Desktop**: Tauri 2.8.4 with filesystem plugin

## Development Notes

### TypeScript Configuration
- All packages use `@repo/typescript-config` for consistency
- Exports are source-level (`"./src/index.ts"`) to enable faster iteration
- Decorator support enabled (`experimentalDecorators`, `emitDecoratorMetadata`)
- Reflect metadata required for decorators

### WebGPU Requirements
- Vite config uses `vite-plugin-wasm` and `vite-plugin-top-level-await`
- Rapier2D requires WASM support
- Target modern browsers with WebGPU support (Chrome 113+, Edge 113+)

### Demo Games Location

Example games in `apps/web/src/games/`:
- `boid` - Flocking simulation (compute shaders)
- `game-of-life` - Cellular automata (WebGPU compute)
- `animator-demo` - Animation showcase
- `ui-demo` - UI system demonstration
- `serialization-demo` - Save/load functionality
- `slay` - Full game example
- `factory` - Another game example

Change the `GAME` constant in [apps/web/src/main.ts:16](apps/web/src/main.ts#L16) to switch demos.

### Build Pipeline

Turbo handles build orchestration ([turbo.json](turbo.json)):
- Build task depends on dependencies building first (`^build`)
- Outputs cached in `dist/**`
- Dev tasks never cached (`"cache": false, "persistent": true`)

### Plugin Registration Pattern

Plugins implement the `EcsPlugin` interface and register systems/resources in their `build()` method:

```typescript
export class MyPlugin implements EcsPlugin {
  public async build(app: App): Promise<void> {
    // Register resources
    app.setResource(new MyResource());

    // Register systems with createSet() for grouping
    app.addStartupSystems(
      createSet("MyPlugin::Init", initSystem)
    );

    app.addUpdateSystems(
      createSet("MyPlugin::Update", updateSystem1, updateSystem2)
    );
  }

  public ready(app: App): boolean {
    return app.hasResource(MyResource);
  }

  public name(): string {
    return "MyPlugin";
  }
}

// Usage: Add plugin instance, not class
await App.create()
  .addPlugins(new MyPlugin())
  .run();
```

## Compute Shader System

The WebGPU renderer includes a **Bevy-inspired declarative compute shader framework** that integrates GPU compute operations into the ECS architecture. This system is used in the boid and game-of-life demos.

### Core Architecture

The compute system uses three main abstractions:

1. **ComputeShader** - Abstract base class for WGSL shader code
2. **ComputeWorker** - Abstract base class defining compute pipeline configuration
3. **ComputeWorkerBuilder** - Fluent API for building compute pipelines

### Defining a Compute Shader

```typescript
import { ComputeShader } from "@atlas/webgpu-renderer";

class MyComputeShader extends ComputeShader {
  // Optional: shared code (structs, constants, utilities)
  commonCode() {
    return `
      struct Data {
        value: f32,
        position: vec2f
      }
    `;
  }

  // Required: WGSL compute shader code
  shader() {
    return `
      @group(0) @binding(0) var<uniform> config: f32;
      @group(0) @binding(1) var<storage, read_write> data: array<Data>;

      @compute @workgroup_size(64)
      fn main(@builtin(global_invocation_id) id: vec3<u32>) {
        let index = id.x;
        data[index].value = data[index].value * config;
      }
    `;
  }

  // Optional: customize entry point (defaults to "main")
  entryPoint() {
    return "main";
  }
}
```

### Creating a Compute Worker

```typescript
import { ComputeWorker, ComputeWorkerBuilder } from "@atlas/webgpu-renderer";

class MyComputeWorker extends ComputeWorker {
  build(device: GPUDevice) {
    const initialData = new Float32Array([1, 2, 3, 4]);

    return new ComputeWorkerBuilder(device)
      .addUniform("config", 2.0)              // Small read-only data
      .addStorage("data", initialData)        // Large GPU-only arrays
      .addStaging("output", initialData)      // Bidirectional with CPU readback
      .addPass(MyComputeShader, [64, 1, 1], ["config", "data", "output"])
      .build();
  }
}
```

### Buffer Types

Three buffer types handle different use cases:

| Buffer Type | CPU→GPU | GPU→CPU | Use Case | Method |
|-------------|---------|---------|----------|---------|
| **Uniform** | ✓ | ✗ | Small config data (<64KB), constants | `.addUniform()` |
| **Storage** | ✓ | ✗ | Large GPU-only arrays | `.addStorage()` |
| **Staging** | ✓ | ✓ | Bidirectional with CPU readback | `.addStaging()` |

### Using Compute Workers in ECS

**Pattern 1: Component-based state**
```typescript
class MySimulation {
  constructor(
    public worker: ComputeWorkerInstance,
    public data: Float32Array
  ) {}
}

// Startup system
sys(({ commands }) => {
  const device = commands.getResource(GpuRenderDevice).get();
  const worker = new MyComputeWorker().build(device);

  commands.spawn(new MySimulation(worker, new Float32Array(1000)));
});

// Update system
sys(({ commands }) => {
  const [, simulation] = commands.query(MySimulation).find();

  // Execute compute shader (async, non-blocking)
  simulation.worker.execute().then(() => {
    // Read results from GPU
    return simulation.worker.readTypedArray("output", Float32Array);
  }).then((result) => {
    // Update simulation state
    simulation.data = result;

    // Ping-pong pattern: output becomes next input
    simulation.worker.write("data", result);
  });
});
```

### Data Transfer API

**Writing to GPU:**
```typescript
worker.write("config", 3.14);                    // Update uniform
worker.write("data", new Float32Array([1,2,3])); // Update storage/staging
worker.writeSlice("data", values, offset);       // Partial update
```

**Reading from GPU (staging buffers only):**
```typescript
const buffer = await worker.read("output");                    // ArrayBuffer
const values = await worker.readVec("output");                 // number[] (Float32Array)
const uint32 = await worker.readTypedArray("output", Uint32Array); // Typed array
```

### Multi-Pass Pipelines

Execute multiple shaders sequentially without CPU roundtrip:

```typescript
new ComputeWorkerBuilder(device)
  .addStorage("input", data)
  .addStorage("intermediate", tempData)
  .addStorage("output", outputData)
  .addPass(ShaderA, [64, 1, 1], ["input", "intermediate"])
  .addPass(ShaderB, [64, 1, 1], ["intermediate", "output"])
  .build();
```

### Ping-Pong Buffer Pattern

Used for iterative algorithms (e.g., Game of Life, physics simulations):

```typescript
// Setup: two buffers for double-buffering
builder
  .addStorage("stateSrc", initialState)
  .addStaging("stateDst", initialState)
  .addPass(UpdateShader, workgroups, ["stateSrc", "stateDst"])
  .build();

// Each iteration:
await worker.execute();                        // Read src, write dst
const output = await worker.readTypedArray("stateDst", Float32Array);
worker.write("stateSrc", output);              // Swap: dst → src
```

### Example: Boid Flocking Simulation

The boid demo ([apps/web/src/games/boid](apps/web/src/games/boid)) demonstrates a complete GPU compute integration:

- **5,000 boids** with flocking behavior (separation, alignment, cohesion)
- **Data structure**: `struct Boid { position: vec2f, velocity: vec2f }`
- **Workgroups**: 64 threads per workgroup
- **Integration**: Compute on GPU, render sprites on CPU
- **Performance**: ~60 FPS with full flocking calculations

```typescript
// Boid shader excerpt
@compute @workgroup_size(64)
fn main(@builtin(global_invocation_id) id: vec3<u32>) {
  let index = id.x;
  let boid = boidsSrc[index];

  // Calculate flocking forces from neighbors
  var separation = vec2f(0.0);
  var alignment = vec2f(0.0);
  var cohesion = vec2f(0.0);

  for (var i = 0u; i < arrayLength(&boidsSrc); i++) {
    if (i == index) { continue; }
    let other = boidsSrc[i];
    let dist = distance(boid.position, other.position);

    // Apply Reynolds flocking rules...
  }

  // Update velocity and position
  boidsDst[index] = updatedBoid;
}
```

### Example: Conway's Game of Life

The game-of-life demo ([apps/web/src/games/game-of-life](apps/web/src/games/game-of-life)) shows 2D grid computation:

- **128×128 grid** (16,384 cells)
- **Workgroups**: 8×8 threads (2D dispatch)
- **Neighbor counting**: 8 surrounding cells
- **Rules**: Birth on 3 neighbors, survive on 2-3 neighbors
- **Interactive**: Keyboard controls for patterns (glider, pulsar, Gosper gun)

```typescript
// Game of Life shader excerpt
@compute @workgroup_size(8, 8)
fn main(@builtin(global_invocation_id) grid: vec3<u32>) {
  let x = grid.x;
  let y = grid.y;

  // Count living neighbors (8 directions)
  var neighbors = 0u;
  for (var dy = -1; dy <= 1; dy++) {
    for (var dx = -1; dx <= 1; dx++) {
      if (dx == 0 && dy == 0) { continue; }
      neighbors += getCell(x + dx, y + dy);
    }
  }

  let alive = getCell(x, y) == 1u;

  // Conway's rules
  if (alive) {
    next[getIndex(x, y)] = select(0u, 1u, neighbors == 2u || neighbors == 3u);
  } else {
    next[getIndex(x, y)] = select(0u, 1u, neighbors == 3u);
  }
}
```

### Key Patterns

**One-shot execution** (manual control):
```typescript
builder.oneShot().build();  // Prevent automatic execution
await worker.execute();      // Explicit execution on demand
```

**Resource introspection**:
```typescript
worker.hasBuffer("name")           // Check if buffer exists
worker.getBufferSize("name")       // Get size in bytes
worker.getBufferNames()            // List all buffers
worker.isOneShotWorker()           // Check execution mode
```

**Error handling**:
```typescript
shader.checkCompilation(device);   // Validate shader compilation
// Throws error with WGSL line numbers if compilation fails
```

### Performance Characteristics

- **Zero overhead**: Compiles to identical raw WebGPU operations
- **Shader compilation**: ~10ms (cached per device with WeakMap)
- **Buffer operations**: <0.1ms
- **CPU readback**: ~2ms (staging buffer copy)
- **Memory efficient**: Buffer reuse, automatic cleanup with `worker.destroy()`

### Integration with ECS

The compute system integrates seamlessly with Atlas ECS:

- **GpuRenderDevice resource**: Provides `GPUDevice` for all GPU operations
- **Component storage**: Store worker instances in simulation components
- **Async systems**: Use `.then()` for non-blocking GPU reads
- **Visual updates**: Read compute results, update sprite positions/colors
- **Input handling**: React to keyboard/mouse for interactive simulations

## Tiled Map Editor Integration

The `@atlas/tiled` package provides complete ECS integration with [Tiled Map Editor](https://www.mapeditor.org/), allowing you to load `.tmj` (map) and `.tsj` (tileset) files directly into the engine.

### Architecture Overview

The Tiled integration follows Atlas's ECS architecture pattern:

- **Asset System**: `TiledMapAsset` and `TiledTilesetAsset` for loading map/tileset JSON files
- **Asset Loaders**: `TiledMapLoader` and `TiledTilesetLoader` registered with AssetServer
- **Component**: `TiledTileMap` extends `Container` to hold the loaded map hierarchy
- **System**: `tiledTilemapLoaderSystem` runs every frame to progressively load and sync maps
- **Plugin**: `TiledEcsPlugin` registers all assets, loaders, and systems

### Key Features

1. **Deferred Loading**: Textures load asynchronously without blocking the game loop
2. **Progressive Rendering**: Tiles appear as textures become available
3. **Coordinate Conversion**: Automatically converts Tiled's Y-down coordinates to renderer's Y-up
4. **Texture Settings**: Applies pixel-perfect nearest-neighbor filtering to prevent bleeding artifacts
5. **Layer Ordering**: Respects Tiled's layer ordering (first layer in array renders on top)
6. **Scene Hierarchy**: Creates proper Container hierarchy for tile layers and object layers

### Scene Hierarchy Structure

When a Tiled map is loaded, it creates this hierarchy:

```
TiledTileMap (Container, user-controlled position)
├── TileMap (spawned in ECS, contains all tile layers)
│   ├── TileMapLayer (layer 0 - renders on top)
│   ├── TileMapLayer (layer 1)
│   └── TileMapLayer (layer N - renders at bottom)
└── Container (object layers)
    ├── Container (object layer 0)
    │   ├── Sprite (tile object 1)
    │   └── Sprite (tile object 2)
    └── Container (object layer 1)
```

### Basic Usage

```typescript
import { TiledEcsPlugin, TiledTileMap } from "@atlas/tiled";
import { AssetServer, SceneGraph } from "@atlas/engine";

// 1. Add plugin to app
await App.create()
  .addPlugins(new TiledEcsPlugin())
  .run();

// 2. In a system, load and spawn the map
sys(({ commands }) => {
  const assetServer = commands.getResource(AssetServer);
  const sceneGraph = commands.getResource(SceneGraph);

  // Load the map asset
  const mapHandle = assetServer.load<TiledMapAsset>("/maps/my-map.tmj");

  // Create TiledTileMap component
  const tiledMap = new TiledTileMap(mapHandle);
  tiledMap.setPosition({ x: 0, y: 0, z: 0 });

  // Add to scene graph for rendering
  sceneGraph.addRoot(tiledMap);

  // Spawn into ECS world
  commands.spawn(tiledMap);
});
```

### How It Works Internally

**Initial Load (First Frame):**
1. System checks if `TiledTileMap.loaded === false`
2. Waits for map asset JSON to load via AssetServer
3. Loads external tilesets (`.tsj` files) if referenced
4. Starts loading tileset images (doesn't wait for them)
5. Creates `TileSet` objects with image `Handle<ImageAsset>`
6. Creates `TileMap` and adds tile layers
7. Places tiles using `mapLayer.setTileById()` (deferred if texture not ready)
8. Spawns `TileMap` into ECS world with `TextureFilter` component
9. Marks `TiledTileMap.loaded = true`

**Subsequent Frames (After Load):**
1. System syncs pending tile grids: `tileSet.syncPendingTileGrids()`
2. System syncs pending tiles: `layer.syncPendingTiles()`
3. `tileSetLoadingSystem` (from webgpu-renderer) converts `Handle<ImageAsset>` → `Texture`
4. Tiles progressively appear as textures become ready

### Important Implementation Details

**Coordinate System Conversion:**
- Tiled uses Y-down (origin top-left, row 0 is top)
- Renderer uses Y-up (origin bottom-left, row 0 is bottom)
- Solution: `const rendererY = height - 1 - y` when placing tiles

**Texture Filtering:**
- Default renderer uses `flipY: true, minFilter: "linear", magFilter: "linear"`
- Tiled tilesets need `flipY: false` (Y-down coordinate system)
- Linear filtering causes bleeding artifacts between tiles
- Solution: Apply `TextureFilter` with nearest-neighbor filtering:
  ```typescript
  textureFilter.flipY = false;
  textureFilter.minFilter = "nearest";
  textureFilter.magFilter = "nearest";
  textureFilter.mips = false;
  ```

**Layer Ordering:**
- Tiled renders layers in array order: `layers[0]` on bottom, `layers[n-1]` on top
- Actually, Tiled's UI shows `layers[0]` at top of list and renders it on top
- Solution: Reverse z-index calculation:
  ```typescript
  const layerZIndex = parentZIndex + (layers.length - 1 - i) * 0.01;
  ```

**GID to Local ID Conversion:**
- Tiled uses Global IDs (GIDs) with flip flags in top 3 bits
- Must decode: `localId = (gid & FLIP_FLAGS_MASK) - firstgid`
- Special case: GID 0 is always empty tile

**Deferred Loading Pattern:**
- Don't wait for `assetServer.getLoadState(imageHandle) === LoadState.Loaded`
- Let `TileSet.addTilesFromGrid()` defer if texture not ready
- Let `syncPendingTileGrids()` and `syncPendingTiles()` handle progressive loading
- `tileSetLoadingSystem` converts handles to textures when loaded

### File Structure

```
packages/tiled/src/
├── ecs/
│   ├── assets/
│   │   ├── tiled-map-asset.ts       # Asset type for .tmj files
│   │   ├── tiled-map-loader.ts      # AssetLoader for .tmj
│   │   ├── tiled-tileset-asset.ts   # Asset type for .tsj files
│   │   └── tiled-tileset-loader.ts  # AssetLoader for .tsj
│   ├── components/
│   │   └── tiled-tilemap.ts         # TiledTileMap component
│   ├── systems/
│   │   └── tiled-tilemap-loader.ts  # Main loading system
│   ├── utils/
│   │   ├── gid-utils.ts             # GID decoding and tileset lookup
│   │   └── coordinate-converter.ts  # Tiled→Atlas coordinate conversion
│   └── plugin.ts                    # TiledEcsPlugin
├── utils/                           # Tiled format type definitions
│   ├── layer/                       # Layer types and decoders
│   ├── tileset/                     # Tileset types
│   └── tile/                        # Tile and frame types
└── index.ts                         # Public exports
```

### Common Issues and Solutions

**Issue: Tiles not rendering**
- Check that `TileMap` is spawned into ECS world (`commands.spawn(tileMap)`)
- The `tileSetLoadingSystem` queries for `TileMap` components to load textures
- Solution: System now automatically spawns `TileMap` in Step 7 of loading

**Issue: Line artifacts between tiles**
- Caused by linear texture filtering sampling between adjacent tiles
- Solution: Use nearest-neighbor filtering (automatically applied)

**Issue: Map renders upside down**
- Tiled uses Y-down, renderer uses Y-up
- Solution: Y-coordinate conversion during tile placement (automatically handled)

**Issue: Wrong tiles appear**
- Texture might be flipped vertically due to `flipY: true`
- Solution: Set `flipY: false` for Tiled tilesets (automatically applied)

**Issue: Layers in wrong order**
- Z-index calculation might not match Tiled's rendering order
- Solution: Reverse z-index calculation (automatically handled)

### Supported Features

✓ Tile layers with GID-based tiles
✓ External tilesets (`.tsj` files)
✓ Embedded tilesets
✓ Object layers (tile objects converted to Sprites)
✓ Layer visibility
✓ Layer groups (recursive processing)
✓ Layer tint colors
✓ Deferred texture loading
✓ Coordinate system conversion
✓ Animated tiles (via TileSet.addAnimatedTile)

### Not Yet Supported

✗ Flip flags (horizontal/vertical/diagonal)
✗ Layer opacity (renderer doesn't support it yet)
✗ Image layers
✗ Non-tile objects (rectangles, ellipses, polygons, text)
✗ Tile collision data
✗ Custom properties
✗ Infinite maps
✗ Isometric/hexagonal maps

### Performance Considerations

- Maps load progressively without blocking the game loop
- Texture loading is deferred and handled by the renderer's asset system
- Large maps with many tiles render efficiently via TileMap chunking
- Object layers create individual Sprite entities (may impact performance with many objects)
