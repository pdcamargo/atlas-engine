# Dreampact Engine - WebGPU 2D Renderer

A high-performance WebGPU-based 2D rendering engine with scene graph support, built with TypeScript.

## Features

- **Scene Graph System**: Hierarchical parent-child relationships with automatic transform propagation
- **Camera Support**: Perspective and Orthographic cameras with customizable parameters
- **Primitives**: Square and Circle primitives with solid colors
- **Sprites**: Textured quad rendering with automatic mipmap generation
- **Tilemaps**: High-performance tilemap rendering with multi-tileset and multi-layer support
- **Instanced Rendering**: Automatic batching and instancing for optimal performance
- **ECS-Friendly**: Stateless renderer designed for future ECS integration
- **WebGPU-Powered**: Modern graphics API for high performance
- **Math Library**: Uses gl-matrix for all matrix/vector operations

## Installation

```bash
bun install @dreampact/engine
```

## Quick Start

```typescript
import {
  Renderer,
  SceneGraph,
  OrthographicCamera,
  Square,
  Circle,
  Sprite,
  Texture,
} from "@dreampact/engine";
import { vec3 } from "gl-matrix";

async function main() {
  // Create and initialize renderer
  const renderer = new Renderer({
    clearColor: { r: 0.1, g: 0.1, b: 0.15, a: 1.0 },
  });
  await renderer.initialize();

  // Create scene graph
  const sceneGraph = new SceneGraph();

  // Create camera with correct aspect ratio
  const canvas = renderer.getCanvas();
  const aspect = canvas.width / canvas.height;
  const camera = new OrthographicCamera(-aspect, aspect, -1, 1, 0.1, 100);
  vec3.set(camera.position, 0, 0, 5);
  vec3.set(camera.target, 0, 0, 0);
  camera.markViewDirty();

  // Create a red square
  const square = new Square(1.0);
  square.setColor(1, 0, 0, 1);
  vec3.set(square.position, -1, 0, 0);
  sceneGraph.addRoot(square);

  // Render loop
  function animate() {
    renderer.render(camera, sceneGraph);
    requestAnimationFrame(animate);
  }
  animate();
}

main();
```

## Tilemaps

The WebGPU renderer includes a high-performance tilemap system with support for multiple tilesets, layers, and runtime editing. Tilemaps use instanced rendering for excellent performance even with thousands of tiles.

### Quick Example

```typescript
import {
  WebgpuRenderer,
  SceneGraph,
  OrthographicCamera,
  TileMap,
  TileSet,
  Texture,
} from "@webgpu-renderer";

// Initialize renderer
const renderer = new WebgpuRenderer();
await renderer.initialize();

const sceneGraph = new SceneGraph();

// Create tilemap (16x16 pixel tiles)
const tileMap = new TileMap({ tileWidth: 16, tileHeight: 16 });
sceneGraph.addChild(tileMap);

// Load texture and create tileset
const texture = await Texture.fromURL(renderer.gpu.device, "tileset.png");
const tileSet = new TileSet(texture, 16, 16);

// Auto-generate tiles from an 8x8 grid (64 tiles total)
tileSet.addTilesFromGrid(8, 8);

// Create layers
const groundLayer = tileMap.addLayer("ground");
const decorationLayer = tileMap.addLayer("decorations");

// Set tiles
groundLayer.setTile(0, 0, tileSet, tileSet.getTile(0)!);
groundLayer.setTile(1, 0, tileSet, tileSet.getTile(1)!);
groundLayer.setTile(0, 1, tileSet, tileSet.getTile(8)!);

decorationLayer.setTile(0, 0, tileSet, tileSet.getTile(32)!);

// Render loop
function animate() {
  renderer.render(camera, sceneGraph);
  requestAnimationFrame(animate);
}
animate();
```

### Creating a TileSet

A `TileSet` manages a texture and defines which regions represent tiles:

```typescript
// Create tileset from texture
const tileSet = new TileSet(texture, tileWidth, tileHeight, {
  spacing: 1, // Optional: spacing between tiles in pixels
  margin: 0, // Optional: margin around the tileset in pixels
});

// Auto-generate tiles from a grid (most common approach)
tileSet.addTilesFromGrid(columns, rows, startId);

// Or manually define tiles
tileSet.addTileFromPixels(id, x, y, width, height);

// Get a tile by ID
const tile = tileSet.getTile(5);
```

### Managing Layers

Layers allow you to organize tiles into different rendering groups:

```typescript
// Add layers
const ground = tileMap.addLayer("ground", 0); // zIndex: 0
const decoration = tileMap.addLayer("decorations", 10); // zIndex: 10
const foreground = tileMap.addLayer("foreground", 20); // zIndex: 20

// Get a layer
const layer = tileMap.getLayer("ground");

// Get or create a layer
const layer = tileMap.ensureLayer("ground");

// Set layer properties
layer.visible = true;
layer.setTint(Color.white());
layer.zIndex = 5;

// Remove a layer
tileMap.removeLayer("decorations");
```

### Setting Tiles

```typescript
// Set a tile in a layer
layer.setTile(x, y, tileSet, tile);

// Or use the tilemap convenience method
tileMap.setTile(x, y, "ground", tileSet, tile);

// Set a tile with custom tint
const tint = new Color(1, 0.5, 0.5, 1); // Reddish tint
layer.setTile(x, y, tileSet, tile, tint);

// Remove a tile
layer.removeTile(x, y);

// Check if a tile exists
if (layer.hasTile(x, y)) {
  const tileData = layer.getTile(x, y);
}

// Clear entire layer
layer.clear();
```

### Runtime Editing

Tilemaps use a dirty flag system for efficient runtime updates:

```typescript
// Modify tiles at runtime
groundLayer.setTile(10, 10, tileSet, tileSet.getTile(5)!); // Marks tilemap as dirty
groundLayer.removeTile(5, 5); // Marks tilemap as dirty

// The next render() call will automatically rebuild batches
renderer.render(camera, sceneGraph);
```

### Multiple Tilesets

You can mix different tilesets in the same tilemap:

```typescript
const groundTileSet = new TileSet(groundTexture, 16, 16);
groundTileSet.addTilesFromGrid(8, 8);

const decorTileSet = new TileSet(decorTexture, 16, 16);
decorTileSet.addTilesFromGrid(4, 4);

// Use different tilesets in the same layer
groundLayer.setTile(0, 0, groundTileSet, groundTileSet.getTile(0)!);
groundLayer.setTile(1, 0, decorTileSet, decorTileSet.getTile(5)!);

// The renderer automatically batches by tileset for optimal performance
```

### Performance

The tilemap system is designed for high performance:

- **Instanced Rendering**: All tiles using the same tileset are rendered in a single draw call
- **Dirty Flags**: Instance buffers are only rebuilt when tiles change
- **Sparse Storage**: Only tiles that exist are stored in memory
- **Automatic Batching**: Tiles are grouped by tileset across all layers
- **GPU Buffers**: Instance data is reused and grown as needed

A tilemap with 10,000 tiles using 3 different tilesets will result in only 3 draw calls!

### API Summary

**TileMap**

```typescript
class TileMap extends SceneNode {
  constructor(options: { tileWidth: number; tileHeight: number });
  addLayer(name: string, zIndex?: number): TileMapLayer;
  getLayer(name: string): TileMapLayer | undefined;
  ensureLayer(name: string, zIndex?: number): TileMapLayer;
  removeLayer(name: string): boolean;
  setTile(x, y, layerName, tileSet, tile, tint?): void;
  removeTile(x, y, layerName): boolean;
  clear(): void;
}
```

**TileSet**

```typescript
class TileSet {
  constructor(
    texture: Texture,
    tileWidth: number,
    tileHeight: number,
    options?
  );
  addTile(id, frame, metadata?): Tile;
  addTileFromPixels(id, x, y, width, height, metadata?): Tile;
  addTilesFromGrid(columns, rows, startId?): Tile[];
  getTile(id): Tile | undefined;
  hasTile(id): boolean;
}
```

**TileMapLayer**

```typescript
class TileMapLayer {
  name: string;
  visible: boolean;
  tint: Color;
  zIndex: number;

  setTile(x, y, tileSet, tile, tint?): void;
  removeTile(x, y): boolean;
  getTile(x, y): TileData | undefined;
  hasTile(x, y): boolean;
  clear(): void;
  getBounds(): LayerBounds | null;
}
```

## API Reference

### Renderer

The main renderer class that manages WebGPU resources and renders scene graphs.

```typescript
class Renderer {
  constructor(options?: {
    canvas?: HTMLCanvasElement;
    clearColor?: { r: number; g: number; b: number; a: number };
  });

  // Initialize WebGPU device and resources
  async initialize(): Promise<void>;

  // Render the scene graph with the given camera
  render(camera: Camera, sceneGraph: SceneGraph): void;

  // Resize the canvas
  resize(width?: number, height?: number): void;

  // Get the WebGPU device
  getDevice(): GPUDevice;

  // Get the canvas element
  getCanvas(): HTMLCanvasElement;

  // Set the clear color
  setClearColor(r: number, g: number, b: number, a?: number): void;
}
```

### SceneGraph

Container for scene nodes with traversal support.

```typescript
class SceneGraph {
  // Add a root-level node
  addRoot(node: SceneNode): void;

  // Remove a root-level node
  removeRoot(node: SceneNode): void;

  // Get all root nodes
  getRoots(): ReadonlyArray<SceneNode>;

  // Update all transforms
  updateTransforms(): void;

  // Traverse all nodes
  traverse(callback: (node: SceneNode) => void): void;

  // Clear all roots
  clear(): void;
}
```

### SceneNode

Base class for all renderable objects with hierarchical transform support.

```typescript
class SceneNode {
  position: vec3;
  rotation: quat;
  scale: vec3;
  visible: boolean;

  // Add/remove children
  addChild(child: SceneNode): void;
  removeChild(child: SceneNode): void;
  removeFromParent(): void;

  // Get children/parent
  getChildren(): ReadonlyArray<SceneNode>;
  getParent(): SceneNode | null;

  // Transform management
  markDirty(): void;
  updateWorldMatrix(parentWorldMatrix?: mat4): void;
  getWorldMatrix(): mat4;
  getLocalMatrix(): mat4;

  // Traverse this node and children
  traverse(callback: (node: SceneNode) => void): void;
}
```

### Cameras

#### Camera (Base Class)

```typescript
abstract class Camera {
  position: vec3;
  target: vec3;
  up: vec3;

  markViewDirty(): void;
  markProjectionDirty(): void;

  getViewMatrix(): mat4;
  getProjectionMatrix(): mat4;
  getViewProjectionMatrix(): mat4;
}
```

#### PerspectiveCamera

```typescript
class PerspectiveCamera extends Camera {
  fov: number;
  aspect: number;
  near: number;
  far: number;

  constructor(fov?: number, aspect?: number, near?: number, far?: number);

  setAspect(aspect: number): void;
}
```

#### OrthographicCamera

```typescript
class OrthographicCamera extends Camera {
  left: number;
  right: number;
  bottom: number;
  top: number;
  near: number;
  far: number;

  constructor(
    left?: number,
    right?: number,
    bottom?: number,
    top?: number,
    near?: number,
    far?: number
  );

  setBounds(left: number, right: number, bottom: number, top: number): void;
}
```

### Primitives

#### Square

```typescript
class Square extends Primitive {
  size: number;
  color: vec4;

  constructor(size?: number, color?: vec4);

  setSize(size: number): void;
  setColor(r: number, g: number, b: number, a?: number): void;
}
```

#### Circle

```typescript
class Circle extends Primitive {
  radius: number;
  segments: number;
  color: vec4;

  constructor(radius?: number, segments?: number, color?: vec4);

  setRadius(radius: number): void;
  setSegments(segments: number): void;
  setColor(r: number, g: number, b: number, a?: number): void;
}
```

### Sprite

Textured quad rendering.

```typescript
class Sprite extends SceneNode {
  texture: Texture | null;
  width: number;
  height: number;

  constructor(texture?: Texture | null, width?: number, height?: number);

  setTexture(texture: Texture): void;
  setSize(width: number, height: number): void;
}
```

### Texture

Texture wrapper with automatic mipmap generation.

```typescript
class Texture {
  gpuTexture: GPUTexture;
  sampler: GPUSampler;

  // Load from URL
  static async fromURL(
    device: GPUDevice,
    url: string,
    options?: {
      mips?: boolean;
      flipY?: boolean;
      addressModeU?: GPUAddressMode;
      addressModeV?: GPUAddressMode;
      magFilter?: GPUFilterMode;
      minFilter?: GPUFilterMode;
    }
  ): Promise<Texture>;

  // Load from ImageBitmap/HTMLImageElement/Canvas/Video
  static fromSource(
    device: GPUDevice,
    source:
      | ImageBitmap
      | HTMLImageElement
      | HTMLCanvasElement
      | HTMLVideoElement,
    options?: {
      mips?: boolean;
      flipY?: boolean;
      addressModeU?: GPUAddressMode;
      addressModeV?: GPUAddressMode;
      magFilter?: GPUFilterMode;
      minFilter?: GPUFilterMode;
    }
  ): Texture;

  destroy(): void;
}
```

## Important Notes

### Camera Aspect Ratio

**Always set your orthographic camera bounds to match your canvas aspect ratio!** Otherwise, squares will appear as rectangles.

```typescript
// ✅ CORRECT: Use aspect ratio
const canvas = renderer.getCanvas();
const aspect = canvas.width / canvas.height;
const camera = new OrthographicCamera(-aspect, aspect, -1, 1, 0.1, 100);

// ❌ WRONG: Square bounds on non-square canvas = stretched geometry
const camera = new OrthographicCamera(-2, 2, -2, 2, 0.1, 100);
```

For a 16:9 canvas (aspect ≈ 1.78), the first approach gives you bounds like `(-1.78, 1.78, -1, 1)`, which maintains the correct proportions.

## Examples

### Hierarchical Transforms

```typescript
// Create parent square
const parent = new Square(1.0);
parent.setColor(1, 1, 0, 1);
vec3.set(parent.position, 0, 0, 0);

// Create child circle (will follow parent)
const child = new Circle(0.3, 16);
child.setColor(1, 0, 1, 1);
vec3.set(child.position, 1, 0, 0); // Offset from parent

parent.addChild(child);
sceneGraph.addRoot(parent);

// Rotating parent will also rotate child
parent.rotation[2] = Math.PI / 4;
parent.markDirty();
```

### Loading Textures

```typescript
// From URL
const texture = await Texture.fromURL(
  renderer.getDevice(),
  "/path/to/image.png",
  {
    mips: true, // Automatically generate mipmaps
    flipY: true,
  }
);

// From Image Element
const img = new Image();
img.src = "/path/to/image.png";
await img.decode();
const texture = Texture.fromSource(renderer.getDevice(), img);

// Create sprite with texture
const sprite = new Sprite(texture, 2.0, 2.0);
vec3.set(sprite.position, 0, 0, 0);
sceneGraph.addRoot(sprite);
```

### Animation

```typescript
let time = 0;

function animate() {
  time += 0.016;

  // Rotate square
  square.rotation[2] = time;
  square.markDirty();

  // Scale circle
  const scale = 1 + Math.sin(time * 2) * 0.3;
  vec3.set(circle.scale, scale, scale, 1);
  circle.markDirty();

  renderer.render(camera, sceneGraph);
  requestAnimationFrame(animate);
}

animate();
```

## Future Enhancements

The renderer is designed to support future features:

- **Custom Shaders**: Extensible pipeline system for user-defined shaders
- **Compute Shaders**: Support for GPU compute operations
- **Post-Processing**: Filter system for effects like vignette, bloom, etc.
- **ECS Integration**: Sync system to update scene graph from ECS world
- **Batching & Instancing**: Performance optimizations for rendering many objects

## Browser Support

Requires a browser with WebGPU support:

- Chrome 113+
- Edge 113+
- Safari 18+ (macOS, iOS)

## License

MIT
