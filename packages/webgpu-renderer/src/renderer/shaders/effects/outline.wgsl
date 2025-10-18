// Outline effect shader
// Renders the sprite with outline by drawing a scaled version with only edges

struct Uniforms {
  mvpMatrix: mat4x4<f32>,     // offset 0, size 64
  frame: vec4f,               // offset 64, size 16
  outlineColor: vec4f,        // offset 80, size 16
  params: vec4f,              // offset 96, size 16 (x = thickness, yzw = unused)
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
  @location(1) edgeDistance: f32, // Distance from edge (for outline effect)
};

@vertex
fn vertexMain(input: VertexInput) -> VertexOutput {
  var output: VertexOutput;

  // Expand position slightly to create outline
  // Center the quad at origin, scale, then restore
  let centeredPos = input.position - vec2f(0.5, 0.5);
  let expandedPos = centeredPos * (1.0 + uniforms.params.x * 2.0) + vec2f(0.5, 0.5);

  output.position = uniforms.mvpMatrix * vec4f(expandedPos, 0.0, 1.0);
  output.texcoord = uniforms.frame.xy + input.texcoord * uniforms.frame.zw;

  // Calculate distance from edge (0 at edge, 1 at center)
  let centerDist = abs(input.texcoord - vec2f(0.5, 0.5));
  output.edgeDistance = 1.0 - max(centerDist.x, centerDist.y) * 2.0;

  return output;
}

@fragment
fn fragmentMain(input: VertexOutput) -> @location(0) vec4f {
  let textureColor = textureSample(textureData, textureSampler, input.texcoord);

  // Only render outline where texture has alpha
  // but fade based on distance from edge
  let outlineFactor = smoothstep(0.0, 0.3, 1.0 - input.edgeDistance);

  // Outline only shows on edges
  let alpha = textureColor.a * outlineFactor;

  return vec4f(uniforms.outlineColor.rgb, alpha * uniforms.outlineColor.a);
}
