struct Uniforms {
  mvpMatrix: mat4x4<f32>,
  color: vec4f,
};

@group(0) @binding(0) var<uniform> uniforms: Uniforms;

struct VertexInput {
  @location(0) position: vec2f,
  @location(1) normal: vec3f,
  @location(2) texcoord: vec2f,
};

struct VertexOutput {
  @builtin(position) position: vec4f,
};

@vertex
fn vertexMain(input: VertexInput) -> VertexOutput {
  var output: VertexOutput;
  // Convert 2D position to 4D for matrix multiply (add z=0, w=1)
  output.position = uniforms.mvpMatrix * vec4f(input.position, 0.0, 1.0);
  return output;
}

@fragment
fn fragmentMain() -> @location(0) vec4f {
  return uniforms.color;
}