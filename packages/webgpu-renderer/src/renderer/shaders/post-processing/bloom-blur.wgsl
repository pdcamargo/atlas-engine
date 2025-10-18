// Bloom Blur Pass - Gaussian blur (separable, run twice: horizontal then vertical)

struct Uniforms {
  direction: vec2f,  // (1,0) for horizontal, (0,1) for vertical
  texelSize: vec2f,  // 1.0 / texture dimensions
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

// 9-tap Gaussian blur weights
const weights = array<f32, 5>(0.227027, 0.1945946, 0.1216216, 0.054054, 0.016216);

@fragment
fn fragmentMain(input: VertexOutput) -> @location(0) vec4f {
  let offset = uniforms.direction * uniforms.texelSize;

  // Center sample
  var result = textureSample(sourceTexture, textureSampler, input.uv).rgb * weights[0];

  // Blur in both directions from center
  for (var i = 1; i < 5; i++) {
    let o = offset * f32(i);
    result += textureSample(sourceTexture, textureSampler, input.uv + o).rgb * weights[i];
    result += textureSample(sourceTexture, textureSampler, input.uv - o).rgb * weights[i];
  }

  return vec4f(result, 1.0);
}
