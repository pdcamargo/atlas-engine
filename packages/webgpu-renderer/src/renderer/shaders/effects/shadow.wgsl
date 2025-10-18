// Shadow effect shader
// Renders a pixelated oval shadow beneath sprites

struct Uniforms {
  mvpMatrix: mat4x4<f32>,     // offset 0, size 64
  spriteSize: vec4f,          // offset 64, size 16 (x=width, y=height, zw=unused)
  shadowColor: vec4f,         // offset 80, size 16 (r, g, b, a)
  params: vec4f,              // offset 96, size 16 (x=distance, y=offsetX, z=offsetY, w=pixelation)
  scale: vec4f,               // offset 112, size 16 (x=scaleX, y=scaleY, zw=unused)
};

@group(0) @binding(0) var<uniform> uniforms: Uniforms;

struct VertexInput {
  @location(0) position: vec2f,
  @location(1) normal: vec3f,
  @location(2) texcoord: vec2f,
};

struct VertexOutput {
  @builtin(position) position: vec4f,
  @location(0) uv: vec2f,
};

@vertex
fn vertexMain(input: VertexInput) -> VertexOutput {
  var output: VertexOutput;

  let distance = uniforms.params.x;
  let offsetX = uniforms.params.y;
  let offsetY = uniforms.params.z;

  // Scale shadow based on distance (closer = larger, farther = smaller)
  // distance of 0 = full size, distance of 1 = ~50% size
  let distanceScale = 1.0 - (distance * 0.5);

  // Get scale parameters from uniforms
  let baseScaleX = uniforms.scale.x;
  let baseScaleY = uniforms.scale.y;

  // Apply distance scaling to the base scale
  let ovalScaleX = distanceScale * baseScaleX;
  let ovalScaleY = distanceScale * baseScaleY;

  // Position shadow at bottom center of sprite
  // input.position is the quad vertex (0 to 1 in both x and y)
  // We need to center the oval at (0.5, 0) which is bottom-center

  // First, center the input position around origin
  let centeredPos = input.position - vec2f(2.5, 1.2);

  // Scale to create small oval
  let scaledPos = vec2f(
    centeredPos.x * ovalScaleX,
    centeredPos.y * ovalScaleY
  );

  // Position at bottom-center of sprite quad + offset
  let finalPos = scaledPos + vec2f(0.5 + offsetX, 0.0 + offsetY);

  output.position = uniforms.mvpMatrix * vec4f(finalPos, 0.0, 1.0);
  output.uv = input.texcoord;

  return output;
}

@fragment
fn fragmentMain(input: VertexOutput) -> @location(0) vec4f {
  let distance = uniforms.params.x;
  let pixelation = uniforms.params.w;

  // Pixelate UVs
  var uv = input.uv;
  if (pixelation > 1.0) {
    uv = floor(uv * pixelation) / pixelation;
  }

  // Create oval shape using distance from center
  let center = vec2f(0.5, 0.5);
  let toCenter = uv - center;

  // Oval: make it wider (x stretched) than tall (y compressed)
  // This creates a proper elliptical shadow
  let ovalDist = length(vec2f(toCenter.x * 1.0, toCenter.y * 3.0));

  // Smooth falloff for oval shadow
  let radius = 0.5;
  let softness = 0.2;
  let alpha = 1.0 - smoothstep(radius - softness, radius, ovalDist);

  // Reduce opacity based on distance (farther = more transparent)
  let distanceFade = 1.0 - (distance * 0.7);
  let finalAlpha = alpha * distanceFade * uniforms.shadowColor.a;

  return vec4f(uniforms.shadowColor.rgb, finalAlpha);
}
