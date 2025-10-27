// Instanced sprite shader - renders multiple sprites in one draw call
// Each sprite's data is stored in a storage buffer and accessed via instance_index
// MVP matrix is computed on GPU for better performance

struct SpriteInstance {
  // World position (x, y, z) in world space (12 bytes + 4 padding = 16 bytes aligned)
  position: vec3<f32>,
  _padding0: f32, // Padding for alignment
  // Size (width, height) in world units (8 bytes)
  size: vec2<f32>,
  _padding1: vec2<f32>, // Padding to align frame to 16 bytes
  // Texture frame (x, y, width, height) in normalized coordinates (16 bytes)
  frame: vec4<f32>,
  // Tint color (r, g, b, a) (16 bytes)
  tint: vec4<f32>,
  // Total: 64 bytes (properly aligned)
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
  let worldPos2D = instance.position.xy + input.position * instance.size;
  let worldPos = vec3f(worldPos2D, instance.position.z);

  // Apply view-projection matrix
  output.position = viewProjectionMatrix * vec4f(worldPos, 1.0);

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
  let finalColor = textureColor * input.tint;

  // Discard fully transparent pixels to prevent depth buffer writes
  if (finalColor.a < 0.01) {
    discard;
  }

  return finalColor;
}

