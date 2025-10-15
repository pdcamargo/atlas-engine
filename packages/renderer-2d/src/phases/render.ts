import { sys } from "@atlas/core";
import { RenderDevice } from "../render_device";
import { RenderWorld } from "../render_world";
import { Camera2D } from "../components/camera2d";
import { UniformBuffer } from "../resources/uniform_buffer";
import { BindGroupCache } from "../resources/bind_group_cache";
import { MeshAllocator } from "../assets/mesh";
import { TextureCache } from "../assets/texture";
import { InstanceBuffer } from "../batching/instance_buffer";
import type { SpriteBatch } from "../batching/batch_manager";
import { BindGroupLayouts } from "./prepare";

/**
 * Render sprites to screen
 */
export const renderSprites = sys(({ commands }) => {
  const device = commands.getResource(RenderDevice);
  const renderWorld = commands.getResource(RenderWorld);
  const context = commands.getResource(
    GPUCanvasContext as any
  ) as GPUCanvasContext;
  const meshAllocator = commands.getResource(MeshAllocator);
  const textureCache = commands.getResource(TextureCache);
  const cameraUniform = commands.tryGetResource(UniformBuffer);
  const instanceBuffer = commands.tryGetResource(InstanceBuffer);
  const pipeline = commands.tryGetResource(GPURenderPipeline as any) as
    | GPURenderPipeline
    | undefined;
  const bindGroupLayouts = commands.tryGetResource(BindGroupLayouts);
  const cameraBindGroupLayout = bindGroupLayouts?.cameraBindGroupLayout;
  const textureBindGroupLayout = bindGroupLayouts?.textureBindGroupLayout;
  const batches = commands.tryGetResource<SpriteBatch[]>(Array);

  // Get or create bind group cache
  let bindGroupCache = commands.tryGetResource(BindGroupCache);
  if (!bindGroupCache) {
    bindGroupCache = new BindGroupCache();
    commands.setResource(bindGroupCache);
  }

  // Check if we have everything needed to render
  if (
    !pipeline ||
    !cameraUniform ||
    !cameraBindGroupLayout ||
    !textureBindGroupLayout ||
    !instanceBuffer ||
    !batches ||
    batches.length === 0
  ) {
    // Nothing to render or not ready yet
    console.log(
      `🚫 Render skip: pipeline=${!!pipeline} batches=${batches?.length || 0} instanceBuffer=${!!instanceBuffer}`
    );
    return;
  }

  console.log(
    `🎨 Rendering ${batches.length} batches with ${batches.reduce((sum, b) => sum + b.instances.length, 0)} instances`
  );

  // Check if there's an active camera
  const cameras = renderWorld.world.query(Camera2D);
  const cameraList = Array.from(cameras).map(
    (q) => q.components[0] as Camera2D
  );
  const activeCamera = cameraList.find((c) => c.isActive) ?? cameraList[0];

  if (!activeCamera) {
    return;
  }

  // Get current texture from canvas
  const canvasTexture = context.getCurrentTexture();
  const view = canvasTexture.createView();

  // Get or create camera bind group (cached)
  const cameraBindGroup = bindGroupCache.getCameraBindGroup(
    device,
    cameraBindGroupLayout,
    cameraUniform.buffer
  );

  // Get quad mesh
  const quadMesh = meshAllocator.getDefaultQuad(device);

  // Create command encoder
  const encoder = device.createCommandEncoder({
    label: "render_encoder",
  });

  // Begin render pass
  const renderPass = encoder.beginRenderPass({
    label: "main_render_pass",
    colorAttachments: [
      {
        view,
        clearValue: {
          r: activeCamera.clearColor.r,
          g: activeCamera.clearColor.g,
          b: activeCamera.clearColor.b,
          a: activeCamera.clearColor.a,
        },
        loadOp: "clear",
        storeOp: "store",
      },
    ],
  });

  renderPass.setPipeline(pipeline);
  renderPass.setBindGroup(0, cameraBindGroup);
  renderPass.setVertexBuffer(0, quadMesh.vertexBuffer);

  if (quadMesh.indexBuffer) {
    renderPass.setIndexBuffer(quadMesh.indexBuffer, "uint16");
  }

  renderPass.setVertexBuffer(1, instanceBuffer.buffer);

  // Render each batch
  let instanceOffset = 0;

  for (const batch of batches) {
    // Get texture for this batch
    let gpuTexture;
    let textureKey = "default";
    if (batch.texture) {
      textureKey = batch.texture.id.toString();
      gpuTexture = textureCache.get(textureKey);
    }

    if (!gpuTexture) {
      // Use default white texture
      gpuTexture = textureCache.getDefaultWhiteTexture(device);
      textureKey = "default";
    }

    // Get or create texture bind group for this batch (cached)
    const textureBindGroup = bindGroupCache.getTextureBindGroup(
      device,
      textureBindGroupLayout,
      gpuTexture.view,
      gpuTexture.sampler,
      textureKey
    );

    renderPass.setBindGroup(1, textureBindGroup);

    // Draw instances
    const instanceCount = batch.instances.length;

    if (quadMesh.indexBuffer && quadMesh.indexCount) {
      renderPass.drawIndexed(
        batch.indexCount, // Use batch.indexCount (6 for one quad), not quadMesh.indexCount
        instanceCount,
        0,
        0,
        instanceOffset
      );
    } else {
      renderPass.draw(quadMesh.vertexCount, instanceCount, 0, instanceOffset);
    }

    instanceOffset += instanceCount;
  }

  renderPass.end();

  // Submit command buffer
  device.submit([encoder.finish()]);
}).label("render-sprites");
