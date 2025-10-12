import { sys, Assets, AssetServer, LoadState, Texture2D } from "@atlas/core";
import { mat4 } from "gl-matrix";
import { RenderDevice } from "../render_device";
import { RenderWorld } from "../render_world";
import { GpuTexture, TextureCache } from "../assets/texture";
import { GpuMesh, MeshAllocator } from "../assets/mesh";
import { UniformBuffer } from "../resources/uniform_buffer";
import { Camera2D } from "../components/camera2d";
import { Sprite } from "../components/sprite";
import { GlobalTransform } from "../components/transform";

/**
 * Resource to hold bind group layouts
 */
export class BindGroupLayouts {
  constructor(
    public cameraBindGroupLayout: GPUBindGroupLayout,
    public textureBindGroupLayout: GPUBindGroupLayout
  ) {}
}

/**
 * Prepare textures: convert Texture2D to GpuTexture
 */
export const prepareTextures = sys(({ commands }) => {
  const device = commands.getResource(RenderDevice);
  const textureCache = commands.getResource(TextureCache);
  const renderWorld = commands.getResource(RenderWorld);
  const assetServer = commands.getResource(AssetServer);

  // Get all sprites in render world
  const sprites = Array.from(renderWorld.world.query(Sprite)).map(
    (q) => q.components[0] as Sprite
  );

  for (const sprite of sprites) {
    if (!sprite.texture) continue;

    const cacheKey = sprite.texture.id.toString();

    // Skip if already in cache
    if (textureCache.has(cacheKey)) {
      continue;
    }

    // Get the Texture2D asset from AssetServer
    const texture2D = assetServer.getAsset<Texture2D>(sprite.texture);
    if (!texture2D) {
      continue;
    }

    // Check if loaded
    const loadState = assetServer.getLoadState(sprite.texture);

    if (loadState !== LoadState.Loaded || !texture2D.isLoaded()) {
      continue;
    }

    // Get the raw image
    const image = texture2D.image;
    if (!image) continue;

    // Convert to ImageData for GPU upload
    const canvas = document.createElement("canvas");
    canvas.width = image.width;
    canvas.height = image.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) continue;

    // Disable image smoothing for pixel-perfect rendering
    ctx.imageSmoothingEnabled = false;

    ctx.drawImage(image, 0, 0);
    const imageData = ctx.getImageData(0, 0, image.width, image.height);

    // Create GPU texture from image data
    const gpuTexture = GpuTexture.fromImageData(
      device,
      imageData,
      `texture_${cacheKey}`
    );

    textureCache.add(cacheKey, gpuTexture);
  }
}).label("prepare-textures");

/**
 * Prepare meshes: ensure default quad exists
 */
export const prepareMeshes = sys(({ commands }) => {
  const device = commands.getResource(RenderDevice);
  const meshAllocator = commands.getResource(MeshAllocator);

  // Ensure default quad mesh exists
  meshAllocator.getDefaultQuad(device);
}).label("prepare-meshes");

/**
 * Prepare camera uniforms
 */
export const prepareCameraUniforms = sys(({ commands }) => {
  const device = commands.getResource(RenderDevice);
  const renderWorld = commands.getResource(RenderWorld);

  // Get or create camera uniform buffer
  let cameraUniform = commands.tryGetResource(UniformBuffer);
  if (!cameraUniform) {
    // 64 bytes for a 4x4 matrix
    cameraUniform = new UniformBuffer(device, 64, "camera_uniform");
    commands.setResource(cameraUniform);
  }

  // Get the active camera
  const cameras = Array.from(
    renderWorld.world.query(Camera2D, GlobalTransform)
  ).map((q) => ({
    camera: q.components[0] as Camera2D,
    transform: q.components[1] as GlobalTransform,
  }));

  if (cameras.length === 0) return;

  // Use first active camera
  const activeCamera =
    cameras.find(
      (c: { camera: Camera2D; transform: GlobalTransform }) => c.camera.isActive
    ) ?? cameras[0];
  if (!activeCamera) return;

  // Calculate view-projection matrix
  const projection = activeCamera.camera.projection.getProjectionMatrix();

  // Create view matrix (translate by negative camera position)
  const view = mat4.create();
  mat4.translate(view, view, [
    -activeCamera.transform.getPosition().x,
    -activeCamera.transform.getPosition().y,
    0,
  ]);

  // Multiply projection * view
  const viewProj = mat4.create();
  mat4.multiply(viewProj, projection, view);

  // Write to uniform buffer
  cameraUniform.write(viewProj);
}).label("prepare-camera-uniforms");

/**
 * Prepare render pipeline
 */
export const prepareRenderPipeline = sys(({ commands }) => {
  const device = commands.getResource(RenderDevice);

  // Check if pipeline already exists
  if (commands.hasResource(GPURenderPipeline)) {
    return;
  }

  // Load sprite shader
  const shaderCode = `
struct VertexInput {
    @location(0) position: vec3<f32>,
    @location(1) uv: vec2<f32>,
}

struct InstanceInput {
    @location(2) model_matrix_0: vec4<f32>,
    @location(3) model_matrix_1: vec4<f32>,
    @location(4) model_matrix_2: vec4<f32>,
    @location(5) model_matrix_3: vec4<f32>,
    @location(6) color: vec4<f32>,
    @location(7) uv_offset_scale: vec4<f32>,
}

struct VertexOutput {
    @builtin(position) position: vec4<f32>,
    @location(0) uv: vec2<f32>,
    @location(1) color: vec4<f32>,
}

struct CameraUniform {
    view_proj: mat4x4<f32>,
}

@group(0) @binding(0) var<uniform> camera: CameraUniform;
@group(1) @binding(0) var sprite_texture: texture_2d<f32>;
@group(1) @binding(1) var sprite_sampler: sampler;

@vertex
fn vs_main(
    vertex: VertexInput,
    instance: InstanceInput,
) -> VertexOutput {
    var out: VertexOutput;
    let model_matrix = mat4x4<f32>(
        instance.model_matrix_0,
        instance.model_matrix_1,
        instance.model_matrix_2,
        instance.model_matrix_3,
    );
    out.position = camera.view_proj * model_matrix * vec4<f32>(vertex.position, 1.0);
    out.uv = vertex.uv * instance.uv_offset_scale.zw + instance.uv_offset_scale.xy;
    out.color = instance.color;
    return out;
}

@fragment
fn fs_main(in: VertexOutput) -> @location(0) vec4<f32> {
    let tex_color = textureSample(sprite_texture, sprite_sampler, in.uv);
    return tex_color * in.color;
}
`;

  const shaderModule = device.createShaderModule({
    label: "sprite_shader",
    code: shaderCode,
  });

  // Create bind group layouts
  const cameraBindGroupLayout = device.createBindGroupLayout({
    label: "camera_bind_group_layout",
    entries: [
      {
        binding: 0,
        visibility: GPUShaderStage.VERTEX,
        buffer: { type: "uniform" },
      },
    ],
  });

  const textureBindGroupLayout = device.createBindGroupLayout({
    label: "texture_bind_group_layout",
    entries: [
      {
        binding: 0,
        visibility: GPUShaderStage.FRAGMENT,
        texture: { sampleType: "float" },
      },
      {
        binding: 1,
        visibility: GPUShaderStage.FRAGMENT,
        sampler: { type: "filtering" },
      },
    ],
  });

  const pipelineLayout = device.createPipelineLayout({
    label: "sprite_pipeline_layout",
    bindGroupLayouts: [cameraBindGroupLayout, textureBindGroupLayout],
  });

  // Create render pipeline
  const pipeline = device.createRenderPipeline({
    label: "sprite_pipeline",
    layout: pipelineLayout,
    vertex: {
      module: shaderModule,
      entryPoint: "vs_main",
      buffers: [
        // Vertex buffer (position + uv)
        {
          arrayStride: 20, // 3 floats (position) + 2 floats (uv)
          stepMode: "vertex",
          attributes: [
            { shaderLocation: 0, offset: 0, format: "float32x3" }, // position
            { shaderLocation: 1, offset: 12, format: "float32x2" }, // uv
          ],
        },
        // Instance buffer
        {
          arrayStride: 96, // 16 (matrix) + 4 (color) + 4 (uv) floats * 4 bytes
          stepMode: "instance",
          attributes: [
            { shaderLocation: 2, offset: 0, format: "float32x4" }, // matrix row 0
            { shaderLocation: 3, offset: 16, format: "float32x4" }, // matrix row 1
            { shaderLocation: 4, offset: 32, format: "float32x4" }, // matrix row 2
            { shaderLocation: 5, offset: 48, format: "float32x4" }, // matrix row 3
            { shaderLocation: 6, offset: 64, format: "float32x4" }, // color
            { shaderLocation: 7, offset: 80, format: "float32x4" }, // uv offset/scale
          ],
        },
      ],
    },
    fragment: {
      module: shaderModule,
      entryPoint: "fs_main",
      targets: [
        {
          format: navigator.gpu.getPreferredCanvasFormat(),
          blend: {
            color: {
              srcFactor: "src-alpha",
              dstFactor: "one-minus-src-alpha",
              operation: "add",
            },
            alpha: {
              srcFactor: "one",
              dstFactor: "one-minus-src-alpha",
              operation: "add",
            },
          },
        },
      ],
    },
    primitive: {
      topology: "triangle-list",
      cullMode: "none",
    },
    depthStencil: undefined,
  });

  // Store pipeline and layouts as resources
  commands.setResource(pipeline);
  commands.setResource(
    new BindGroupLayouts(cameraBindGroupLayout, textureBindGroupLayout)
  );
}).label("prepare-render-pipeline");
