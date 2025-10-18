// Particle Render Shader
// Renders particles as billboard quads that always face the camera

// Particle buffer (read-only)
@group(0) @binding(0) var<storage, read> particles: array<Particle>;

// View-projection matrix
@group(0) @binding(1) var<uniform> vpMatrix: mat4x4<f32>;

// Optional texture
@group(1) @binding(0) var particleTexture: texture_2d<f32>;
@group(1) @binding(1) var particleSampler: sampler;

struct VertexInput {
  @builtin(instance_index) instanceIndex: u32,
  @builtin(vertex_index) vertexIndex: u32,
};

struct VertexOutput {
  @builtin(position) position: vec4f,
  @location(0) uv: vec2f,
  @location(1) color: vec4f,
};

// Quad vertices (unit quad centered at origin)
const QUAD_POSITIONS = array<vec2f, 6>(
  vec2f(-0.5, -0.5),  // Bottom-left
  vec2f( 0.5, -0.5),  // Bottom-right
  vec2f( 0.5,  0.5),  // Top-right
  vec2f(-0.5, -0.5),  // Bottom-left
  vec2f( 0.5,  0.5),  // Top-right
  vec2f(-0.5,  0.5),  // Top-left
);

const QUAD_UVS = array<vec2f, 6>(
  vec2f(0.0, 1.0),  // Bottom-left
  vec2f(1.0, 1.0),  // Bottom-right
  vec2f(1.0, 0.0),  // Top-right
  vec2f(0.0, 1.0),  // Bottom-left
  vec2f(1.0, 0.0),  // Top-right
  vec2f(0.0, 0.0),  // Top-left
);

@vertex
fn vertexMain(input: VertexInput) -> VertexOutput {
  var output: VertexOutput;

  // Get particle data
  let particle = particles[input.instanceIndex];

  // Skip dead particles (will be discarded anyway, but saves computation)
  if (particle.alive < 0.5) {
    output.position = vec4f(0.0, 0.0, 0.0, 0.0);
    output.uv = vec2f(0.0, 0.0);
    output.color = vec4f(0.0, 0.0, 0.0, 0.0);
    return output;
  }

  // Get quad vertex position
  let quadPos = QUAD_POSITIONS[input.vertexIndex];
  output.uv = QUAD_UVS[input.vertexIndex];

  // Apply rotation to quad
  let cos_r = cos(particle.rotation);
  let sin_r = sin(particle.rotation);
  let rotatedPos = vec2f(
    quadPos.x * cos_r - quadPos.y * sin_r,
    quadPos.x * sin_r + quadPos.y * cos_r
  );

  // Scale by particle size
  let scaledPos = rotatedPos * particle.size;

  // Billboard - always face camera (no rotation, just translate)
  // In 2D, we can just add the offset to particle position
  let worldPos = vec3f(
    particle.position.x + scaledPos.x,
    particle.position.y + scaledPos.y,
    particle.position.z
  );

  // Transform to clip space
  output.position = vpMatrix * vec4f(worldPos, 1.0);
  output.color = particle.color;

  return output;
}

@fragment
fn fragmentMain(input: VertexOutput) -> @location(0) vec4f {
  // Sample texture if available
  let texColor = textureSample(particleTexture, particleSampler, input.uv);

  // Multiply texture by particle color
  var finalColor = texColor * input.color;

  // Discard fully transparent pixels
  if (finalColor.a < 0.01) {
    discard;
  }

  return finalColor;
}
