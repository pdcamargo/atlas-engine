// Instanced sprite shader - renders multiple sprites in one draw call
// Each sprite's data is stored in a storage buffer and accessed via instance_index
// MVP matrix is computed on GPU for better performance

struct SpriteInstance {
  // World position (x, y) in world space (8 bytes)
  position: vec2<f32>,
  // Size (width, height) in world units (8 bytes)
  size: vec2<f32>,
  // Texture frame (x, y, width, height) in normalized coordinates (16 bytes)
  frame: vec4<f32>,
  // Tint color (r, g, b, a) (16 bytes)
  tint: vec4<f32>,
  // Total: 48 bytes (was 96 bytes)
}

// View-Projection matrix (shared across all instances)
@group(0) @binding(0) var<uniform> viewProjectionMatrix: mat4x4<f32>;
@group(0) @binding(1) var<storage, read> instances: array<SpriteInstance>;
@group(0) @binding(2) var textureSampler: sampler;
@group(0) @binding(3) var spriteTexture: texture_2d<f32>;

struct VertexInput {
  @location(0) position: vec2f,
  @location(1) normal: vec3f,
  @location(2) texcoord: vec2f,
}

struct VertexOutput {
  @builtin(position) position: vec4<f32>,
  @location(0) texcoord: vec2<f32>,
  @location(1) tint: vec4<f32>,
}

@vertex
fn vertexMain(
  input: VertexInput,
  @builtin(instance_index) instanceIndex: u32
) -> VertexOutput {
  var output: VertexOutput;

  // Get this instance's data
  let instance = instances[instanceIndex];

  // Compute world position on GPU
  // input.position is quad vertex in [0,1] range
  // Scale by instance size and translate to instance position
  let worldPos = instance.position + input.position * instance.size;

  // Apply view-projection matrix
  output.position = viewProjectionMatrix * vec4f(worldPos, 0.0, 1.0);

  // Map UV coordinates to the sprite's frame
  // input.texcoord is 0-1, we need to map it to the frame region
  output.texcoord = instance.frame.xy + input.texcoord * instance.frame.zw;

  // Pass tint color to fragment shader
  output.tint = instance.tint;

  return output;
}

@fragment
fn fragmentMain(input: VertexOutput) -> @location(0) vec4<f32> {
  // Sample texture at the UV coordinate
  let textureColor = textureSample(spriteTexture, textureSampler, input.texcoord);
  
  // Apply tint
  return textureColor * input.tint;
}

