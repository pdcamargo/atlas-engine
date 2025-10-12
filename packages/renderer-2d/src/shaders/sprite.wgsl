// Vertex input for the quad mesh
struct VertexInput {
    @location(0) position: vec3<f32>,
    @location(1) uv: vec2<f32>,
}

// Instance input (per-sprite data)
struct InstanceInput {
    @location(2) model_matrix_0: vec4<f32>,
    @location(3) model_matrix_1: vec4<f32>,
    @location(4) model_matrix_2: vec4<f32>,
    @location(5) model_matrix_3: vec4<f32>,
    @location(6) color: vec4<f32>,
    @location(7) uv_offset_scale: vec4<f32>, // xy = offset, zw = scale
}

// Vertex output
struct VertexOutput {
    @builtin(position) position: vec4<f32>,
    @location(0) uv: vec2<f32>,
    @location(1) color: vec4<f32>,
}

// Camera uniform
struct CameraUniform {
    view_proj: mat4x4<f32>,
}

// Bind group 0: Camera
@group(0) @binding(0) var<uniform> camera: CameraUniform;

// Bind group 1: Texture and sampler
@group(1) @binding(0) var sprite_texture: texture_2d<f32>;
@group(1) @binding(1) var sprite_sampler: sampler;

@vertex
fn vs_main(
    vertex: VertexInput,
    instance: InstanceInput,
) -> VertexOutput {
    var out: VertexOutput;

    // Reconstruct model matrix from instance data
    let model_matrix = mat4x4<f32>(
        instance.model_matrix_0,
        instance.model_matrix_1,
        instance.model_matrix_2,
        instance.model_matrix_3,
    );

    // Transform position
    out.position = camera.view_proj * model_matrix * vec4<f32>(vertex.position, 1.0);

    // Apply UV offset and scale for sprite sheets
    out.uv = vertex.uv * instance.uv_offset_scale.zw + instance.uv_offset_scale.xy;

    // Pass color to fragment shader
    out.color = instance.color;

    return out;
}

@fragment
fn fs_main(in: VertexOutput) -> @location(0) vec4<f32> {
    // Sample texture
    let tex_color = textureSample(sprite_texture, sprite_sampler, in.uv);

    // Multiply by vertex color (tint)
    return tex_color * in.color;
}

