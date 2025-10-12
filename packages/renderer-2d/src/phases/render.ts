import { sys } from "@atlas/core";
import { RenderDevice, RenderQueue } from "../render_device";
import { RenderWorld } from "../render_world";
import { Camera2D } from "../components/camera2d";
import { UniformBuffer } from "../resources/uniform_buffer";
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
    return;
  }

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

  // Create camera bind group
  const cameraBindGroup = device.createBindGroup({
    label: "camera_bind_group",
    layout: cameraBindGroupLayout,
    entries: [
      {
        binding: 0,
        resource: {
          buffer: cameraUniform.buffer,
        },
      },
    ],
  });

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
    if (batch.texture) {
      const cacheKey = batch.texture.id.toString();
      gpuTexture = textureCache.get(cacheKey);
    }

    if (!gpuTexture) {
      // Use default white texture
      gpuTexture = textureCache.getDefaultWhiteTexture(device);
    }

    // Create texture bind group for this batch
    const textureBindGroup = device.createBindGroup({
      label: "texture_bind_group",
      layout: textureBindGroupLayout,
      entries: [
        {
          binding: 0,
          resource: gpuTexture.view,
        },
        {
          binding: 1,
          resource: gpuTexture.sampler,
        },
      ],
    });

    renderPass.setBindGroup(1, textureBindGroup);

    // Draw instances
    const instanceCount = batch.instances.length;
    if (quadMesh.indexBuffer && quadMesh.indexCount) {
      renderPass.drawIndexed(
        quadMesh.indexCount,
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
