// Particle Update Compute Shader
// Updates all particles based on physics and lifetime

// Particle buffer (read/write)
@group(0) @binding(0) var<storage, read_write> particles: array<Particle>;

// Emitter configuration (read-only)
@group(0) @binding(1) var<uniform> emitterConfig: EmitterConfig;

// Simulation uniforms (read-only)
@group(0) @binding(2) var<uniform> simUniforms: SimulationUniforms;

// Workgroup size - process 64 particles per workgroup
@compute @workgroup_size(64)
fn main(@builtin(global_invocation_id) global_id: vec3u) {
  let index = global_id.x;

  // Bounds check
  if (index >= simUniforms.particleCount) {
    return;
  }

  var particle = particles[index];

  // Skip dead particles
  if (particle.alive < 0.5) {
    return;
  }

  // Update lifetime
  particle.lifetime -= simUniforms.deltaTime;

  // Kill particle if lifetime expired
  if (particle.lifetime <= 0.0) {
    particle.alive = 0.0;
    particles[index] = particle;
    return;
  }

  // Calculate interpolation factor (0 = start, 1 = end)
  let lifetimeFactor = 1.0 - (particle.lifetime / particle.maxLifetime);
  let smoothFactor = smoothInterp(lifetimeFactor);

  // Apply physics
  // Gravity
  particle.velocity += emitterConfig.gravity * simUniforms.deltaTime;

  // Wind force
  particle.velocity += emitterConfig.windForce * simUniforms.deltaTime;

  // Drag (air resistance)
  particle.velocity *= (1.0 - emitterConfig.drag * simUniforms.deltaTime);

  // Update position
  particle.position += particle.velocity * simUniforms.deltaTime;

  // Update rotation
  particle.rotation += particle.rotationSpeed * simUniforms.deltaTime;

  // Interpolate size
  particle.size = lerp(particle.startSize, particle.endSize, smoothFactor);

  // Interpolate color
  particle.color = lerpVec4(particle.startColor, particle.endColor, smoothFactor);

  // Write back to buffer
  particles[index] = particle;
}
