// Instanced lit sprite shader - renders multiple lit sprites in one draw call
// Each sprite's data is stored in a storage buffer and accessed via instance_index
// Supports full lighting calculations per-fragment

struct SpriteInstance {
  // World position (x, y) in world space (8 bytes)
  position: vec2<f32>,
  // Size (width, height) in world units (8 bytes)
  size: vec2<f32>,
  // Texture frame (x, y, width, height) in normalized coordinates (16 bytes)
  frame: vec4<f32>,
  // Tint color (r, g, b, a) (16 bytes)
  tint: vec4<f32>,
  // Total: 48 bytes
}

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

// Sprite instance bindings (group 0)
@group(0) @binding(0) var<uniform> viewProjectionMatrix: mat4x4<f32>;
@group(0) @binding(1) var<storage, read> instances: array<SpriteInstance>;
@group(0) @binding(2) var textureSampler: sampler;
@group(0) @binding(3) var spriteTexture: texture_2d<f32>;

// Lighting bindings (group 1)
@group(1) @binding(0) var<uniform> lighting: LightingUniforms;
@group(1) @binding(1) var<storage, read> pointLights: array<PointLight>;
@group(1) @binding(2) var<storage, read> spotLights: array<SpotLight>;

struct VertexInput {
  @location(0) position: vec2f,
  @location(1) normal: vec3f,
  @location(2) texcoord: vec2f,
}

struct VertexOutput {
  @builtin(position) position: vec4<f32>,
  @location(0) texcoord: vec2<f32>,
  @location(1) tint: vec4<f32>,
  @location(2) worldPos: vec3f,     // World position for lighting
  @location(3) normal: vec3f,       // Normal for lighting
}

@vertex
fn vertexMain(
  input: VertexInput,
  @builtin(instance_index) instanceIndex: u32
) -> VertexOutput {
  var output: VertexOutput;

  // Get this instance's data
  let instance = instances[instanceIndex];

  // Compute world position on GPU
  let worldPos2D = instance.position + input.position * instance.size;

  // Apply view-projection matrix
  output.position = viewProjectionMatrix * vec4f(worldPos2D, 0.0, 1.0);

  // Pass world position for lighting (convert to 3D)
  output.worldPos = vec3f(worldPos2D, 0.0);

  // Map UV coordinates to the sprite's frame
  output.texcoord = instance.frame.xy + input.texcoord * instance.frame.zw;

  // Pass tint color to fragment shader
  output.tint = instance.tint;

  // Pass normal for lighting
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

  // Diffuse lighting
  let diffuse = max(dot(normal, lightDirNorm), 0.0);

  // Distance attenuation with falloff
  let attenuation = 1.0 - pow(distance / light.radius, light.falloff);
  let attenuationClamped = max(attenuation, 0.0);

  // Combine
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

  // Smooth falloff at cone edges
  let transitionZone = 0.26; // ~15 degrees
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

  // Combine
  return light.color.rgb * light.color.a * diffuse * attenuationClamped * spotAttenuation;
}

@fragment
fn fragmentMain(input: VertexOutput) -> @location(0) vec4<f32> {
  // Sample texture
  let textureColor = textureSample(spriteTexture, textureSampler, input.texcoord);

  // Apply tint
  let baseColor = textureColor * input.tint;

  // Early out if transparent
  if (baseColor.a < 0.01) {
    discard;
  }

  // Start with ambient lighting
  var totalLight = lighting.ambientColor.rgb * lighting.ambientColor.a;

  // Add sun/directional light
  if (lighting.sunDirection.w > 0.0) {
    let sunDir = normalize(lighting.sunDirection.xyz);
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
