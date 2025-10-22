// Sprite uniforms (same as regular sprite)
struct Uniforms {
  mvpMatrix: mat4x4<f32>,
  frame: vec4f, // x, y, width, height (normalized UV coordinates)
  tint: vec4f,  // r, g, b, a
};

// Lighting uniforms
struct LightingUniforms {
  ambientColor: vec4f,      // RGB + intensity
  sunDirection: vec4f,      // XYZ direction + intensity
  sunColor: vec4f,          // RGB + unused
  numPointLights: u32,
  numSpotLights: u32,
  padding: vec2f,
};

// Point light structure
struct PointLight {
  position: vec3f,
  radius: f32,
  color: vec4f,            // RGB + intensity
  falloff: f32,
  padding: vec3f,
};

// Spot light structure
struct SpotLight {
  position: vec3f,
  radius: f32,
  direction: vec3f,
  coneAngle: f32,
  color: vec4f,            // RGB + intensity
  falloff: f32,
  padding: vec3f,
};

// Bindings
@group(0) @binding(0) var<uniform> uniforms: Uniforms;
@group(0) @binding(1) var textureSampler: sampler;
@group(0) @binding(2) var textureData: texture_2d<f32>;

// Lighting bindings
@group(1) @binding(0) var<uniform> lighting: LightingUniforms;
@group(1) @binding(1) var<storage, read> pointLights: array<PointLight>;
@group(1) @binding(2) var<storage, read> spotLights: array<SpotLight>;

struct VertexInput {
  @location(0) position: vec2f,
  @location(1) normal: vec3f,
  @location(2) texcoord: vec2f,
};

struct VertexOutput {
  @builtin(position) position: vec4f,
  @location(0) texcoord: vec2f,
  @location(1) worldPos: vec3f,     // World position for lighting calculations
  @location(2) normal: vec3f,       // Normal for lighting (in 2D, usually (0, 0, 1))
};

@vertex
fn vertexMain(input: VertexInput) -> VertexOutput {
  var output: VertexOutput;

  // Convert 2D position to 4D (add z=0, w=1)
  let pos4 = vec4f(input.position, 0.0, 1.0);
  output.position = uniforms.mvpMatrix * pos4;

  // Pass world position for lighting calculations
  output.worldPos = vec3f(input.position, 0.0);

  // Transform UV coordinates based on frame
  output.texcoord = uniforms.frame.xy + input.texcoord * uniforms.frame.zw;

  // Pass normal (for 2D sprites, this is typically (0, 0, 1) pointing at camera)
  output.normal = normalize(input.normal);

  return output;
}

// Calculate point light contribution
fn calculatePointLight(light: PointLight, worldPos: vec3f, normal: vec3f) -> vec3f {
  // Direction from surface to light
  let lightDir = light.position - worldPos;
  let distance = length(lightDir);

  // Early out if outside light radius
  if (distance > light.radius) {
    return vec3f(0.0);
  }

  let lightDirNorm = normalize(lightDir);

  // Diffuse lighting (N dot L)
  // For 2D, we assume normals point toward camera, so we can use a simplified calculation
  // In true 2D, we might want to use a different lighting model (like rim lighting or simple distance-based)
  let diffuse = max(dot(normal, lightDirNorm), 0.0);

  // Distance attenuation with falloff
  let attenuation = 1.0 - pow(distance / light.radius, light.falloff);
  let attenuationClamped = max(attenuation, 0.0);

  // Combine: light color * intensity * diffuse * attenuation
  return light.color.rgb * light.color.a * diffuse * attenuationClamped;
}

// Calculate spot light contribution
fn calculateSpotLight(light: SpotLight, worldPos: vec3f, normal: vec3f) -> vec3f {
  // Direction from surface to light
  let lightDir = light.position - worldPos;
  let distance = length(lightDir);

  // Early out if outside light radius
  if (distance > light.radius) {
    return vec3f(0.0);
  }

  let lightDirNorm = normalize(lightDir);

  // Calculate spot cone attenuation
  let spotDir = normalize(light.direction);
  let cosAngle = dot(-lightDirNorm, spotDir);
  let halfConeAngle = light.coneAngle * 0.5;
  let cosHalfCone = cos(halfConeAngle);

  // Smooth falloff at cone edges (15 degree transition zone)
  let transitionZone = 0.26; // ~15 degrees in radians
  let cosTransition = cos(halfConeAngle + transitionZone);
  let spotAttenuation = smoothstep(cosTransition, cosHalfCone, cosAngle);

  // Early out if outside cone
  if (spotAttenuation <= 0.0) {
    return vec3f(0.0);
  }

  // Diffuse lighting
  let diffuse = max(dot(normal, lightDirNorm), 0.0);

  // Distance attenuation
  let attenuation = 1.0 - pow(distance / light.radius, light.falloff);
  let attenuationClamped = max(attenuation, 0.0);

  // Combine: light color * intensity * diffuse * distance attenuation * spot attenuation
  return light.color.rgb * light.color.a * diffuse * attenuationClamped * spotAttenuation;
}

@fragment
fn fragmentMain(input: VertexOutput) -> @location(0) vec4f {
  // Sample base texture
  let textureColor = textureSample(textureData, textureSampler, input.texcoord);

  // Apply tint
  let baseColor = textureColor * uniforms.tint;

  // Early out if fully transparent
  if (baseColor.a < 0.01) {
    discard;
  }

  // Start with ambient lighting
  var totalLight = lighting.ambientColor.rgb * lighting.ambientColor.a;

  // Add sun/directional light
  if (lighting.sunDirection.w > 0.0) {
    let sunDir = normalize(lighting.sunDirection.xyz);
    // For 2D sprites facing camera, we can simplify or use a different model
    // Here we'll use a simple directional influence
    let sunInfluence = max(dot(input.normal, -sunDir), 0.0);
    totalLight += lighting.sunColor.rgb * lighting.sunDirection.w * sunInfluence;
  }

  // Add point lights
  for (var i = 0u; i < lighting.numPointLights; i++) {
    totalLight += calculatePointLight(pointLights[i], input.worldPos, input.normal);
  }

  // Add spot lights
  for (var i = 0u; i < lighting.numSpotLights; i++) {
    totalLight += calculateSpotLight(spotLights[i], input.worldPos, input.normal);
  }

  // Apply lighting to base color
  let litColor = baseColor.rgb * totalLight;

  // Return final color with original alpha
  return vec4f(litColor, baseColor.a);
}
