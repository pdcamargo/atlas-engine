// Common particle system structures and utilities
// Shared between update, emit, and render shaders

// Particle data structure (must match TypeScript)
struct Particle {
  position: vec3f,       // Current position (x, y, z)
  velocity: vec3f,       // Current velocity
  color: vec4f,          // Current color (rgba)
  lifetime: f32,         // Current lifetime remaining
  maxLifetime: f32,      // Total lifetime
  size: f32,             // Current size
  rotation: f32,         // Current rotation (radians)

  // Start/end properties for interpolation
  startColor: vec4f,     // Initial color
  endColor: vec4f,       // Final color
  startSize: f32,        // Initial size
  endSize: f32,          // Final size
  rotationSpeed: f32,    // Rotation velocity (radians/sec)

  // Metadata
  alive: f32,            // 1.0 = alive, 0.0 = dead
  padding: vec2f,        // Align to 16-byte boundary
};

// Emitter configuration (uploaded as uniforms)
struct EmitterConfig {
  // Transform
  position: vec3f,           // Emitter world position
  emissionRate: f32,         // Particles per second

  // Physics
  gravity: vec3f,            // Gravity force
  drag: f32,                 // Air resistance (0-1)

  windForce: vec3f,          // Wind/external force
  padding0: f32,

  // Lifetime
  lifetimeMin: f32,          // Minimum particle lifetime
  lifetimeMax: f32,          // Maximum particle lifetime
  padding1: vec2f,

  // Velocity
  velocityMin: vec3f,        // Minimum initial velocity
  padding2: f32,
  velocityMax: vec3f,        // Maximum initial velocity
  padding3: f32,

  // Size
  startSizeMin: f32,         // Minimum start size
  startSizeMax: f32,         // Maximum start size
  endSizeMin: f32,           // Minimum end size
  endSizeMax: f32,           // Maximum end size

  // Rotation
  rotationSpeedMin: f32,     // Minimum rotation speed
  rotationSpeedMax: f32,     // Maximum rotation speed
  padding4: vec2f,

  // Color (start)
  startColorMin: vec4f,      // Minimum start color
  startColorMax: vec4f,      // Maximum start color

  // Color (end)
  endColorMin: vec4f,        // Minimum end color
  endColorMax: vec4f,        // Maximum end color
};

// Simulation uniforms
struct SimulationUniforms {
  deltaTime: f32,            // Time since last frame
  time: f32,                 // Total elapsed time
  particleCount: u32,        // Total particle count
  emitCount: u32,            // Particles to emit this frame
};

// Random number generation (hash-based)
// Uses a simple hash function for GPU pseudo-random numbers
fn hash(value: u32) -> u32 {
  var state = value;
  state = state ^ 2747636419u;
  state = state * 2654435769u;
  state = state ^ (state >> 16u);
  state = state * 2654435769u;
  state = state ^ (state >> 16u);
  state = state * 2654435769u;
  return state;
}

fn randomFloat(seed: u32) -> f32 {
  return f32(hash(seed)) / 4294967295.0;
}

fn randomRange(seed: u32, minVal: f32, maxVal: f32) -> f32 {
  return minVal + randomFloat(seed) * (maxVal - minVal);
}

fn randomVec3(seed: u32, minVal: vec3f, maxVal: vec3f) -> vec3f {
  return vec3f(
    randomRange(hash(seed), minVal.x, maxVal.x),
    randomRange(hash(seed + 1u), minVal.y, maxVal.y),
    randomRange(hash(seed + 2u), minVal.z, maxVal.z)
  );
}

fn randomVec4(seed: u32, minVal: vec4f, maxVal: vec4f) -> vec4f {
  return vec4f(
    randomRange(hash(seed), minVal.x, maxVal.x),
    randomRange(hash(seed + 1u), minVal.y, maxVal.y),
    randomRange(hash(seed + 2u), minVal.z, maxVal.z),
    randomRange(hash(seed + 3u), minVal.w, maxVal.w)
  );
}

// Interpolation utilities
fn lerp(a: f32, b: f32, t: f32) -> f32 {
  return a + (b - a) * t;
}

fn lerpVec3(a: vec3f, b: vec3f, t: f32) -> vec3f {
  return a + (b - a) * t;
}

fn lerpVec4(a: vec4f, b: vec4f, t: f32) -> vec4f {
  return a + (b - a) * t;
}

// Smooth interpolation (smoothstep)
fn smoothInterp(t: f32) -> f32 {
  return t * t * (3.0 - 2.0 * t);
}
