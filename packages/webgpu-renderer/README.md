# Dreampact Engine - WebGPU 2D Renderer

A high-performance WebGPU-based 2D rendering engine with scene graph support, built with TypeScript.

## Features

- **Scene Graph System**: Hierarchical parent-child relationships with automatic transform propagation
- **Camera Support**: Perspective and Orthographic cameras with customizable parameters
- **Primitives**: Square and Circle primitives with solid colors
- **Sprites**: Textured quad rendering with automatic mipmap generation
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
