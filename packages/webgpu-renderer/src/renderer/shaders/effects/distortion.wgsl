// Distortion effect shader
// Applies wave distortion to sprite UVs

struct Uniforms {
  mvpMatrix: mat4x4<f32>,   // offset 0, size 64
  frame: vec4f,             // offset 64, size 16
  tint: vec4f,              // offset 80, size 16
  params: vec4f,            // offset 96, size 16 (x=frequency, y=amplitude, z=time, w=type)
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
  output.position = uniforms.mvpMatrix * vec4f(input.position, 0.0, 1.0);
  output.texcoord = uniforms.frame.xy + input.texcoord * uniforms.frame.zw;
  return output;
}

@fragment
fn fragmentMain(input: VertexOutput) -> @location(0) vec4f {
  var distortedUV = input.texcoord;

  let frequency = uniforms.params.x;
  let amplitude = uniforms.params.y;
  let time = uniforms.params.z;
  let distortionType = uniforms.params.w;

  // Apply distortion based on type
  if (distortionType < 0.5) {
    // Horizontal wave
    let wave = sin(input.texcoord.y * frequency + time) * amplitude;
    distortedUV.x += wave;
  } else if (distortionType < 1.5) {
    // Vertical wave
    let wave = sin(input.texcoord.x * frequency + time) * amplitude;
    distortedUV.y += wave;
  } else {
    // Radial distortion
    let center = vec2f(0.5, 0.5);
    let toCenter = input.texcoord - center;
    let distance = length(toCenter);
    let angle = atan2(toCenter.y, toCenter.x);

    let wave = sin(distance * frequency + time) * amplitude;
    distortedUV = center + toCenter * (1.0 + wave);
  }

  // Sample texture with distorted UVs
  let textureColor = textureSample(textureData, textureSampler, distortedUV);

  return textureColor * uniforms.tint;
}
