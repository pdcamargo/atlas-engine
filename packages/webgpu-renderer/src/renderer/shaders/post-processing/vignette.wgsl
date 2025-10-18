// Vignette post-processing effect
// Darkens the corners of the screen

struct Uniforms {
  params: vec4f,    // x = intensity, y = smoothness, zw unused
};

@group(0) @binding(0) var<uniform> uniforms: Uniforms;
@group(0) @binding(1) var textureSampler: sampler;
@group(0) @binding(2) var sourceTexture: texture_2d<f32>;

struct VertexInput {
  @location(0) position: vec2f,
  @location(1) uv: vec2f,
};

struct VertexOutput {
  @builtin(position) position: vec4f,
  @location(0) uv: vec2f,
};

@vertex
fn vertexMain(input: VertexInput) -> VertexOutput {
  var output: VertexOutput;
  output.position = vec4f(input.position, 0.0, 1.0);
  output.uv = input.uv;
  return output;
}

@fragment
fn fragmentMain(input: VertexOutput) -> @location(0) vec4f {
  // Sample the source texture
  let color = textureSample(sourceTexture, textureSampler, input.uv);

  // Calculate distance from center (0.5, 0.5)
  let center = vec2f(0.5, 0.5);
  let dist = distance(input.uv, center);

  // Create vignette effect
  // Distance from center ranges from 0 (center) to ~0.707 (corners)
  let vignette = 1.0 - smoothstep(0.3, 0.3 + uniforms.params.y, dist) * uniforms.params.x;

  // Apply vignette by darkening
  return vec4f(color.rgb * vignette, color.a);
}
