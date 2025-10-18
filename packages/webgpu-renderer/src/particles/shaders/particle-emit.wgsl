// Particle Emit Compute Shader
// Spawns new particles by finding dead particles and reinitializing them

// Particle buffer (read/write)
@group(0) @binding(0) var<storage, read_write> particles: array<Particle>;

// Emitter configuration (read-only)
@group(0) @binding(1) var<uniform> emitterConfig: EmitterConfig;

// Simulation uniforms (read-only)
@group(0) @binding(2) var<uniform> simUniforms: SimulationUniforms;

// Atomic counter for particles emitted (shared across workgroup)
var<workgroup> emittedCount: atomic<u32>;

// Workgroup size - process 64 particles per workgroup
@compute @workgroup_size(64)
fn main(
  @builtin(global_invocation_id) global_id: vec3u,
  @builtin(local_invocation_index) local_index: u32
) {
  let index = global_id.x;

  // Initialize shared counter (only first thread)
  if (local_index == 0u) {
    atomicStore(&emittedCount, 0u);
  }
  workgroupBarrier();

  // Bounds check
  if (index >= simUniforms.particleCount) {
    return;
  }

  var particle = particles[index];

  // Only reinitialize dead particles
  if (particle.alive > 0.5) {
    return;
  }

  // Check if we should emit this particle
  let currentEmitted = atomicAdd(&emittedCount, 1u);
  if (currentEmitted >= simUniforms.emitCount) {
    return;
  }

  // Create seed for random number generation
  // Combine time, particle index, and a prime for variation
  let seed = u32(simUniforms.time * 1000.0) + index * 2654435761u;

  // Initialize particle properties
  particle.position = emitterConfig.position;
  particle.velocity = randomVec3(seed, emitterConfig.velocityMin, emitterConfig.velocityMax);

  particle.lifetime = randomRange(seed + 100u, emitterConfig.lifetimeMin, emitterConfig.lifetimeMax);
  particle.maxLifetime = particle.lifetime;

  particle.startSize = randomRange(seed + 200u, emitterConfig.startSizeMin, emitterConfig.startSizeMax);
  particle.endSize = randomRange(seed + 300u, emitterConfig.endSizeMin, emitterConfig.endSizeMax);
  particle.size = particle.startSize;

  particle.rotation = randomRange(seed + 400u, 0.0, 6.28318530718); // 0 to 2*PI
  particle.rotationSpeed = randomRange(seed + 500u, emitterConfig.rotationSpeedMin, emitterConfig.rotationSpeedMax);

  particle.startColor = randomVec4(seed + 600u, emitterConfig.startColorMin, emitterConfig.startColorMax);
  particle.endColor = randomVec4(seed + 700u, emitterConfig.endColorMin, emitterConfig.endColorMax);
  particle.color = particle.startColor;

  particle.alive = 1.0;

  // Write back to buffer
  particles[index] = particle;
}
