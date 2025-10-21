# Compute Shader Framework

A **Bevy-inspired** framework for declarative GPU compute operations in WebGPU. This framework provides a type-safe, ergonomic API for creating and executing compute shaders without the boilerplate of manual buffer management, pipeline creation, and bind group setup.

## Features

✨ **Declarative API** - Define what you want, not how to wire it
🔒 **Type-Safe** - Full TypeScript type inference for buffer data
🔄 **Multi-Pass Support** - Chain compute operations without CPU roundtrips
📦 **Buffer Management** - Automatic uniform, storage, and staging buffer creation
🎯 **One-Shot Execution** - On-demand compute for user-triggered operations
🧩 **Composable** - Reusable shaders and workers
🚀 **Performance** - Zero-overhead abstractions over WebGPU

## Quick Start

### 1. Define a Compute Shader

```typescript
import { ComputeShader } from '@atlas/webgpu-renderer';

class MultiplyShader extends ComputeShader {
  shader() {
    return `
      @group(0) @binding(0) var<uniform> multiplier: f32;
      @group(0) @binding(1) var<storage, read_write> data: array<f32>;

      @compute @workgroup_size(64)
      fn main(@builtin(global_invocation_id) id: vec3<u32>) {
        if (id.x < arrayLength(&data)) {
          data[id.x] = data[id.x] * multiplier;
        }
      }
    `;
  }
}
```

### 2. Define a Compute Worker

```typescript
import { ComputeWorker, ComputeWorkerBuilder } from '@atlas/webgpu-renderer';

class MultiplyWorker extends ComputeWorker {
  build(device: GPUDevice) {
    return new ComputeWorkerBuilder(device)
      .addUniform("multiplier", 2.0)
      .addStaging("data", [1, 2, 3, 4])
      .addPass(MultiplyShader, [64, 1, 1], ["multiplier", "data"])
      .build();
  }
}
```

### 3. Execute and Read Results

```typescript
const worker = new MultiplyWorker().build(device);
await worker.execute();
const result = await worker.readVec("data"); // [2, 4, 6, 8]

// Update and run again
worker.write("multiplier", 3.0);
await worker.execute();
const result2 = await worker.readVec("data"); // [6, 12, 18, 24]
```

## Core Concepts

### Buffer Types

The framework supports three types of buffers:

#### Uniform Buffers
- **Usage**: Read-only configuration data
- **Size**: Small (< 64KB recommended)
- **Access**: Fast random access from GPU
- **Example**: Configuration parameters, constants

```typescript
.addUniform("config", { threshold: 0.5, scale: 2.0 })
```

#### Storage Buffers
- **Usage**: Large arrays, GPU-only read/write
- **Size**: Large (limited by GPU memory)
- **Access**: GPU read/write, no CPU read access
- **Example**: Intermediate computation results

```typescript
.addStorage("tempData", new Float32Array(1000000))
```

#### Staging Buffers
- **Usage**: Bidirectional CPU ↔ GPU data transfer
- **Size**: Any size
- **Access**: GPU read/write + CPU read/write
- **Example**: Input data, output results

```typescript
.addStaging("output", new Float32Array(1000))
```

### Multi-Pass Pipelines

Chain multiple compute shaders to create complex processing pipelines:

```typescript
new ComputeWorkerBuilder(device)
  .addUniform("value", 3.0)
  .addStorage("input", [1, 2, 3, 4])
  .addStaging("output", [0, 0, 0, 0])
  // Pass 1: Add value to input → output
  .addPass(FirstPass, [4, 1, 1], ["value", "input", "output"])
  // Pass 2: Square each element in output
  .addPass(SecondPass, [4, 1, 1], ["output"])
  .build();
```

**Result**: `[16, 25, 36, 49]` = `[(1+3)², (2+3)², (3+3)², (4+3)²]`

### One-Shot Execution

Configure workers to execute only when explicitly triggered:

```typescript
new ComputeWorkerBuilder(device)
  .addStaging("data", [1, 2, 3, 4])
  .addPass(MyShader, [64, 1, 1], ["data"])
  .oneShot() // Only executes when worker.execute() is called
  .build();
```

Perfect for:
- User-triggered operations
- Batch processing
- Conditional execution based on game state

## API Reference

### ComputeShader

Abstract class for defining compute shaders.

```typescript
class MyShader extends ComputeShader {
  shader(): string {
    // Return WGSL shader code
  }

  commonCode(): string {
    // Optional: shared code prepended to shader
  }

  entryPoint(): string {
    // Optional: entry point name (default: "main")
  }
}
```

### ComputeWorker

Abstract class for defining compute workers.

```typescript
class MyWorker extends ComputeWorker {
  build(device: GPUDevice): ComputeWorkerInstance<this> {
    return new ComputeWorkerBuilder(device)
      // ... configure pipeline
      .build();
  }
}
```

### ComputeWorkerBuilder

Fluent builder for creating compute pipelines.

#### Methods

- **`addUniform(name, data)`** - Add uniform buffer
- **`addStorage(name, data)`** - Add storage buffer
- **`addStaging(name, data)`** - Add staging buffer
- **`addPass(Shader, workgroups, bindings)`** - Add compute pass
- **`oneShot()`** - Configure for manual execution
- **`build()`** - Create worker instance

```typescript
new ComputeWorkerBuilder(device)
  .addUniform("config", uniformData)
  .addStorage("intermediate", storageData)
  .addStaging("output", outputData)
  .addPass(ShaderClass, [x, y, z], ["config", "intermediate", "output"])
  .oneShot()
  .build();
```

### ComputeWorkerInstance

Runtime instance managing GPU resources.

#### Methods

- **`execute()`** - Run all compute passes
- **`ready()`** - Check if ready for CPU reads
- **`read(name)`** - Read staging buffer as ArrayBuffer
- **`readVec(name)`** - Read staging buffer as number array
- **`readTypedArray(name, Type)`** - Read as specific typed array
- **`write(name, data)`** - Write to any buffer
- **`writeSlice(name, data, offset)`** - Partial buffer write
- **`destroy()`** - Clean up GPU resources
- **`getBufferSize(name)`** - Get buffer size in bytes
- **`hasBuffer(name)`** - Check if buffer exists
- **`getBufferNames()`** - List all buffer names

## Examples

### Simple Compute

Add a value to each array element.

```typescript
class AddShader extends ComputeShader {
  shader() {
    return `
      @group(0) @binding(0) var<uniform> addValue: f32;
      @group(0) @binding(1) var<storage, read_write> data: array<f32>;

      @compute @workgroup_size(64)
      fn main(@builtin(global_invocation_id) id: vec3<u32>) {
        if (id.x < arrayLength(&data)) {
          data[id.x] = data[id.x] + addValue;
        }
      }
    `;
  }
}

const worker = new ComputeWorkerBuilder(device)
  .addUniform("addValue", 5.0)
  .addStaging("data", [1, 2, 3, 4])
  .addPass(AddShader, [1, 1, 1], ["addValue", "data"])
  .build();

await worker.execute();
const result = await worker.readVec("data"); // [6, 7, 8, 9]
```

### Particle Simulation

Physics-based particle update.

```typescript
class ParticleUpdateShader extends ComputeShader {
  shader() {
    return `
      struct Particle {
        position: vec2f,
        velocity: vec2f,
      }

      @group(0) @binding(0) var<uniform> deltaTime: f32;
      @group(0) @binding(1) var<storage, read_write> particles: array<Particle>;

      @compute @workgroup_size(64)
      fn main(@builtin(global_invocation_id) id: vec3<u32>) {
        if (id.x >= arrayLength(&particles)) { return; }

        var particle = particles[id.x];
        particle.position += particle.velocity * deltaTime;
        particles[id.x] = particle;
      }
    `;
  }
}
```

### Image Processing

Gaussian blur filter.

```typescript
class GaussianBlurShader extends ComputeShader {
  shader() {
    return `
      @group(0) @binding(0) var<storage> input: array<vec4f>;
      @group(0) @binding(1) var<storage, read_write> output: array<vec4f>;
      @group(0) @binding(2) var<uniform> width: u32;

      @compute @workgroup_size(8, 8)
      fn main(@builtin(global_invocation_id) id: vec3<u32>) {
        // 3x3 Gaussian kernel blur implementation
        // ...
      }
    `;
  }
}
```

### Game of Life

Conway's Game of Life cellular automaton.

See [examples/game-of-life.ts](./examples/game-of-life.ts) for a complete implementation.

## Workgroup Sizing

Workgroups determine how compute threads are organized. Choose based on your data:

### 1D Data (Arrays)
```typescript
const elementCount = 1000;
.addPass(Shader, [Math.ceil(elementCount / 64), 1, 1], [...])
```

### 2D Data (Images, Grids)
```typescript
const width = 512, height = 512;
.addPass(Shader, [
  Math.ceil(width / 8),
  Math.ceil(height / 8),
  1
], [...])
```

### 3D Data (Volumes)
```typescript
const depth = 64, height = 64, width = 64;
.addPass(Shader, [
  Math.ceil(width / 4),
  Math.ceil(height / 4),
  Math.ceil(depth / 4)
], [...])
```

**Tip**: Match workgroup size in shader (`@workgroup_size(x, y, z)`) to your dispatch pattern.

## Performance Tips

1. **Minimize CPU ↔ GPU transfers** - Use storage buffers for intermediate results
2. **Batch operations** - Process large arrays in single dispatches
3. **Align buffer sizes** - Uniforms need 16-byte alignment
4. **Reuse workers** - Create once, execute multiple times
5. **Use appropriate buffer types** - Don't use staging if you don't need CPU access
6. **Optimize workgroup size** - Match GPU architecture (typically 64 or 256 threads)

## Integration with ECS

The compute framework integrates seamlessly with the ECS system:

```typescript
import { GpuRenderDevice } from '@atlas/webgpu-renderer';

class MySystem extends EcsSystem {
  static queries = {
    device: [GpuRenderDevice],
  };

  private worker?: ComputeWorkerInstance;

  update(deltaTime: number) {
    const device = this.getResource(GpuRenderDevice).get();

    if (!this.worker) {
      this.worker = new MyWorker().build(device);
    }

    this.worker.write("deltaTime", deltaTime);
    this.worker.execute(); // Non-blocking for one-shot workers
  }
}
```

## Advanced Patterns

### Ping-Pong Buffers

Alternate between two buffers for iterative algorithms:

```typescript
const current = new Float32Array(size);
const next = new Float32Array(size);

for (let i = 0; i < iterations; i++) {
  worker.write("current", i % 2 === 0 ? current : next);
  worker.write("next", i % 2 === 0 ? next : current);
  await worker.execute();
}
```

### Shared Shader Code

Extract common code for reuse:

```typescript
const commonStructs = `
  struct Particle {
    position: vec3f,
    velocity: vec3f,
  }
`;

class UpdateShader extends ComputeShader {
  commonCode() { return commonStructs; }
  shader() { /* use Particle struct */ }
}
```

### Dynamic Workgroup Calculation

Calculate optimal workgroup size at runtime:

```typescript
const WORKGROUP_SIZE = 64;
const elementCount = data.length;
const workgroups = Math.ceil(elementCount / WORKGROUP_SIZE);

.addPass(Shader, [workgroups, 1, 1], [...])
```

## Troubleshooting

### Buffer Size Errors

**Problem**: "Buffer size exceeds limit"
**Solution**: Check GPU limits via `device.limits.maxStorageBufferBindingSize`

### Validation Errors

**Problem**: "Binding not found"
**Solution**: Ensure buffer names in `addPass()` match shader bindings

### Shader Compilation Errors

**Problem**: WGSL syntax errors
**Solution**: Use `await shader.checkCompilation(device)` to get detailed errors

```typescript
const messages = await shader.checkCompilation(device);
for (const msg of messages) {
  if (msg.type === 'error') {
    console.error(msg.message);
  }
}
```

## Examples

Complete working examples are available in the [examples/](./examples/) directory:

- **[simple.ts](./examples/simple.ts)** - Basic compute shader usage
- **[multi-pass.ts](./examples/multi-pass.ts)** - Multi-pass pipeline
- **[one-shot.ts](./examples/one-shot.ts)** - On-demand execution
- **[game-of-life.ts](./examples/game-of-life.ts)** - Conway's Game of Life

Run all examples:

```typescript
import { runAllExamples } from '@atlas/webgpu-renderer';

const adapter = await navigator.gpu.requestAdapter();
const device = await adapter.requestDevice();

await runAllExamples(device);
```

## Comparison to Raw WebGPU

### Before (Raw WebGPU)

```typescript
// Create buffers manually
const uniformBuffer = device.createBuffer({ /* ... */ });
const storageBuffer = device.createBuffer({ /* ... */ });

// Create shader module
const shaderModule = device.createShaderModule({ code: wgsl });

// Create pipeline
const pipeline = device.createComputePipeline({ /* ... */ });

// Create bind group layout
const bindGroupLayout = pipeline.getBindGroupLayout(0);

// Create bind group
const bindGroup = device.createBindGroup({
  layout: bindGroupLayout,
  entries: [/* ... */]
});

// Encode commands
const encoder = device.createCommandEncoder();
const pass = encoder.beginComputePass();
pass.setPipeline(pipeline);
pass.setBindGroup(0, bindGroup);
pass.dispatchWorkgroups(64);
pass.end();
device.queue.submit([encoder.finish()]);

// Read results (complex readback logic)
// ...
```

### After (Compute Framework)

```typescript
const worker = new ComputeWorkerBuilder(device)
  .addUniform("config", uniformData)
  .addStaging("output", storageData)
  .addPass(MyShader, [64, 1, 1], ["config", "output"])
  .build();

await worker.execute();
const result = await worker.readVec("output");
```

**~100 lines → ~10 lines** while maintaining full type safety and performance.

## License

MIT - Part of the Atlas WebGPU Renderer
