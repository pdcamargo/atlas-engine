// Chromatic Aberration post-processing effect
// Splits RGB channels for a retro/glitch effect

struct Uniforms {
  params: vec4f,     // x = offset, yzw unused
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
  // Calculate offset from center
  let center = vec2f(0.5, 0.5);
  let toCenter = input.uv - center;
  let offsetDirection = normalize(toCenter);

  // Sample RGB channels at different positions
  let rOffset = offsetDirection * uniforms.params.x;
  let bOffset = -offsetDirection * uniforms.params.x;

  let r = textureSample(sourceTexture, textureSampler, input.uv + rOffset).r;
  let g = textureSample(sourceTexture, textureSampler, input.uv).g;
  let b = textureSample(sourceTexture, textureSampler, input.uv + bOffset).b;
  let a = textureSample(sourceTexture, textureSampler, input.uv).a;

  return vec4f(r, g, b, a);
}
