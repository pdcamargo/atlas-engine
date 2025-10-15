struct Uniforms {
  mvpMatrix: mat4x4<f32>,
  frame: vec4f, // x, y, width, height (normalized UV coordinates)
  tint: vec4f,  // r, g, b, a
};

@group(0) @binding(0) var<uniform> uniforms: Uniforms;
@group(0) @binding(1) var textureSampler: sampler;
@group(0) @binding(2) var textureData: texture_2d<f32>;

struct VertexInput {
  @location(0) position: vec2f,
  @location(1) normal: vec3f,
  @location(2) texcoord: vec2f,
};

struct VertexOutput {
  @builtin(position) position: vec4f,
  @location(0) texcoord: vec2f,
};

@vertex
fn vertexMain(input: VertexInput) -> VertexOutput {
  var output: VertexOutput;
  // Convert 2D position to 4D (add z=0, w=1)
  output.position = uniforms.mvpMatrix * vec4f(input.position, 0.0, 1.0);
  
  // Transform UV coordinates based on frame
  // input.texcoord is 0-1, we need to map it to the frame region
  output.texcoord = uniforms.frame.xy + input.texcoord * uniforms.frame.zw;
  
  return output;
}

@fragment
fn fragmentMain(input: VertexOutput) -> @location(0) vec4f {
  let textureColor = textureSample(textureData, textureSampler, input.texcoord);
  return textureColor * uniforms.tint;
}