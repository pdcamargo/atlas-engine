import { sys } from "@atlas/core";
import { mat4 } from "gl-matrix";
import { RenderWorld } from "../render_world";
import { Sprite } from "../components/sprite";
import { GlobalTransform } from "../components/transform";
import { BatchManager, type RenderEntity } from "../batching/batch_manager";
import { InstanceBuffer, type InstanceData } from "../batching/instance_buffer";
import { RenderDevice } from "../render_device";
import { TextureCache } from "../assets/texture";
import { Color } from "../utils/color";

/**
 * Queue sprites: build batches and instance buffers
 */
export const queueSprites = sys(({ commands }) => {
  const renderWorld = commands.getResource(RenderWorld);
  const device = commands.getResource(RenderDevice);
  const textureCache = commands.getResource(TextureCache);
  const batchManager = new BatchManager();

  // Collect all sprites from render world
  const sprites = renderWorld.world.query(Sprite, GlobalTransform);
  const spriteList = Array.from(sprites);

  const renderEntities: RenderEntity[] = [];

  for (const query of spriteList) {
    const sprite = query.components[0] as Sprite;
    const transform = query.components[1] as GlobalTransform;

    // Skip if texture isn't loaded yet
    let gpuTexture;
    if (sprite.texture) {
      const cacheKey = sprite.texture.id.toString();
      gpuTexture = textureCache.get(cacheKey);
      if (!gpuTexture) {
        continue; // Texture not ready yet
      }
    } else {
      // Use default white texture
      gpuTexture = textureCache.getDefaultWhiteTexture(device);
    }

    // Calculate sprite size
    // Use custom_size if provided, otherwise use texture size
    // Handle both GPUExtent3D formats (object or array)
    const textureWidth = Array.isArray(gpuTexture.size)
      ? gpuTexture.size[0]
      : (gpuTexture.size as { width: number }).width || 1;
    const textureHeight = Array.isArray(gpuTexture.size)
      ? gpuTexture.size[1]
      : (gpuTexture.size as { height: number }).height || 1;

    // Calculate UV offset and scale for sprite rect (for sprite sheets)
    let uvOffsetX = 0;
    let uvOffsetY = 0;
    let uvScaleX = 1;
    let uvScaleY = 1;
    let rectWidth = textureWidth;
    let rectHeight = textureHeight;

    if (sprite.rect) {
      // Convert pixel rect to UV coordinates (0-1 range)
      rectWidth = sprite.rect.width;
      rectHeight = sprite.rect.height;
      uvOffsetX = sprite.rect.min.x / textureWidth;
      uvOffsetY = sprite.rect.min.y / textureHeight;
      uvScaleX = rectWidth / textureWidth;
      uvScaleY = rectHeight / textureHeight;
    }

    // Determine final sprite size
    const spriteWidth = sprite.customSize?.width ?? rectWidth;
    const spriteHeight = sprite.customSize?.height ?? rectHeight;

    // Create a model matrix that scales the 1x1 quad to sprite size, then applies transform
    // The base quad is 1x1 unit, we need to scale it to the sprite's pixel size first
    const scaleMatrix = mat4.create();
    mat4.scale(scaleMatrix, scaleMatrix, [spriteWidth, spriteHeight, 1]);

    // Multiply transform.matrix * scaleMatrix to get final model matrix
    const finalMatrix = mat4.create();
    mat4.multiply(finalMatrix, transform.matrix, scaleMatrix);

    // Create instance data
    const instanceData: InstanceData = {
      modelMatrix: finalMatrix,
      color: sprite.color,
      uvOffsetScale: [uvOffsetX, uvOffsetY, uvScaleX, uvScaleY],
    };

    renderEntities.push({
      material:
        sprite.texture ?? ({ id: { toString: () => "default" } } as any),
      texture: sprite.texture ?? null,
      instanceData,
      zIndex: 0, // TODO: Add z-index support
    });
  }

  // Batch sprites
  const batches = batchManager.batch(renderEntities);

  // Create or update instance buffer
  let instanceBuffer = commands.tryGetResource(InstanceBuffer);
  const maxInstances = Math.max(renderEntities.length, 1);

  if (!instanceBuffer || instanceBuffer.capacity < maxInstances) {
    instanceBuffer?.destroy();
    instanceBuffer = new InstanceBuffer(
      device,
      maxInstances * 2,
      "sprite_instances"
    );
    commands.setResource(instanceBuffer);
  }

  // Store batches for render phase
  commands.setResource(batches);

  // Write all instances to buffer
  const allInstances = batches.flatMap((b) => b.instances);
  if (allInstances.length > 0) {
    instanceBuffer.writeInstances(allInstances);
  }
}).label("queue-sprites");
