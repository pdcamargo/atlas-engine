// Bloom Bright Pass - Extract bright pixels above threshold
// This is the first pass of bloom effect

struct Uniforms {
  params: vec4f,    // x = threshold, y = intensity, zw unused
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

// Calculate luminance using perceptual weights
fn luminance(color: vec3f) -> f32 {
  return dot(color, vec3f(0.2126, 0.7152, 0.0722));
}

@fragment
fn fragmentMain(input: VertexOutput) -> @location(0) vec4f {
  let color = textureSample(sourceTexture, textureSampler, input.uv);
  let lum = luminance(color.rgb);

  // Only keep pixels above threshold
  if (lum > uniforms.params.x) {
    let brightColor = color.rgb * uniforms.params.y * (lum - uniforms.params.x);
    return vec4f(brightColor, color.a);
  }

  return vec4f(0.0, 0.0, 0.0, color.a);
}
