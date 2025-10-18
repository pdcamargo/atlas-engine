// Bloom Combine Pass - Blend blurred bright pixels with original scene

struct Uniforms {
  params: vec4f,  // x = bloomStrength, yzw unused
};

@group(0) @binding(0) var<uniform> uniforms: Uniforms;
@group(0) @binding(1) var textureSampler: sampler;
@group(0) @binding(2) var sourceTexture: texture_2d<f32>;   // Original scene
@group(0) @binding(3) var bloomTexture: texture_2d<f32>;    // Blurred bright pixels

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
  let sourceColor = textureSample(sourceTexture, textureSampler, input.uv);
  let bloomColor = textureSample(bloomTexture, textureSampler, input.uv);

  // Additive blend
  let finalColor = sourceColor.rgb + bloomColor.rgb * uniforms.params.x;

  return vec4f(finalColor, sourceColor.a);
}
