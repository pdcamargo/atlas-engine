import { sys, Entity, Transform } from "@atlas/core";
import { mat4 } from "gl-matrix";
import { RenderWorld } from "../render_world";
import { Sprite2D } from "../components/sprite";
import { Camera2D } from "../components/camera2d";
import { TransformChanged } from "../components/changed";
import {
  BatchManager,
  type RenderEntity,
  type SpriteBatch,
} from "../batching/batch_manager";
import { InstanceBuffer, type InstanceData } from "../batching/instance_buffer";
import { RenderDevice } from "../render_device";
import { TextureCache } from "../assets/texture";
import { InstanceDataCache } from "../resources/instance_cache";

/**
 * Simple AABB frustum culling check
 * Returns true if the sprite is potentially visible
 */
function isInFrustum(
  spriteX: number,
  spriteY: number,
  spriteWidth: number,
  spriteHeight: number,
  anchorX: number,
  anchorY: number,
  cameraX: number,
  cameraY: number,
  cameraLeft: number,
  cameraRight: number,
  cameraBottom: number,
  cameraTop: number
): boolean {
  // Calculate sprite bounds in world space, accounting for anchor
  // Anchor (0, 0) = top-left, (0.5, 0.5) = center, (1, 1) = bottom-right
  const spriteLeft = spriteX - anchorX * spriteWidth;
  const spriteRight = spriteLeft + spriteWidth;
  const spriteBottom = spriteY - anchorY * spriteHeight;
  const spriteTop = spriteBottom + spriteHeight;

  // Calculate camera frustum bounds in world space
  const frustumLeft = cameraX + cameraLeft;
  const frustumRight = cameraX + cameraRight;
  const frustumBottom = cameraY + cameraBottom;
  const frustumTop = cameraY + cameraTop;

  // AABB intersection test
  return !(
    spriteRight < frustumLeft ||
    spriteLeft > frustumRight ||
    spriteTop < frustumBottom ||
    spriteBottom > frustumTop
  );
}

/**
 * Queue sprites: build batches and instance buffers
 * Optimized to skip matrix rebuilding when no entities have changed
 */
export const queueSprites = sys(({ commands }) => {
  const renderWorld = commands.getResource(RenderWorld);
  const device = commands.getResource(RenderDevice);
  const textureCache = commands.getResource(TextureCache);
  const batchManager = new BatchManager();

  // Check if any entities have changed
  const changedEntities = commands.query(TransformChanged).all();
  const hasChanges = changedEntities.length > 0;

  // If we have cached batches and nothing changed, reuse them!
  if (!hasChanges) {
    const cachedBatches = commands.tryGetResource<SpriteBatch[]>(Array);
    if (cachedBatches && cachedBatches.length > 0) {
      // Remove the changed flags
      for (const [entity] of changedEntities) {
        commands.removeComponent(entity, TransformChanged);
      }
      return; // Skip entire queue phase!
    }
  }

  // Get the active camera for frustum culling from MAIN world
  const cameras = commands
    .query(Camera2D, Transform)
    .all()
    .map(([_, camera, transform]) => ({
      camera,
      transform,
    }));

  const activeCamera = cameras.find((c) => c.camera.isActive) ?? cameras[0];

  // Extract camera frustum bounds if available
  let cameraX = 0;
  let cameraY = 0;
  let cameraLeft = -Infinity;
  let cameraRight = Infinity;
  let cameraBottom = -Infinity;
  let cameraTop = Infinity;
  let enableFrustumCulling = false;

  if (activeCamera) {
    cameraX = activeCamera.transform.position.x;
    cameraY = activeCamera.transform.position.y;
    cameraLeft =
      activeCamera.camera.projection.left *
      activeCamera.camera.projection.scale;
    cameraRight =
      activeCamera.camera.projection.right *
      activeCamera.camera.projection.scale;
    cameraBottom =
      activeCamera.camera.projection.bottom *
      activeCamera.camera.projection.scale;
    cameraTop =
      activeCamera.camera.projection.top * activeCamera.camera.projection.scale;
    enableFrustumCulling = false; // TEMPORARILY DISABLED - FIX CULLING LOGIC FIRST
  }

  // Collect all sprites from MAIN world (not render world)
  // This way we use the original Transform objects directly
  const sprites = commands.query(Sprite2D, Transform).all();
  const spriteList = sprites;

  console.log(`🔍 Found ${spriteList.length} sprites in main world`);

  const renderEntities: RenderEntity[] = [];
  let culledCount = 0;

  for (const [entity, sprite, transform] of spriteList) {
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
      uvOffsetX = sprite.rect.x / textureWidth;
      uvOffsetY = sprite.rect.y / textureHeight;
      uvScaleX = rectWidth / textureWidth;
      uvScaleY = rectHeight / textureHeight;
    }

    // Determine final sprite size (including scale from transform)
    const baseWidth = sprite.customSize?.width ?? rectWidth;
    const baseHeight = sprite.customSize?.height ?? rectHeight;
    const spriteWidth = baseWidth * Math.abs(transform.scale.x);
    const spriteHeight = baseHeight * Math.abs(transform.scale.y);

    // Get sprite position
    const spritePos = transform.position;

    // Frustum culling: skip sprites outside camera view
    if (enableFrustumCulling) {
      if (
        !isInFrustum(
          spritePos.x,
          spritePos.y,
          spriteWidth,
          spriteHeight,
          sprite.anchor.x,
          sprite.anchor.y,
          cameraX,
          cameraY,
          cameraLeft,
          cameraRight,
          cameraBottom,
          cameraTop
        )
      ) {
        culledCount++;
        continue; // Sprite is outside camera frustum
      }
    }

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

  // Debug: Log culling statistics (uncomment to debug)
  if (enableFrustumCulling && culledCount > 0) {
    const frustumLeft = cameraX + cameraLeft;
    const frustumRight = cameraX + cameraRight;
    const frustumBottom = cameraY + cameraBottom;
    const frustumTop = cameraY + cameraTop;
    console.log(
      `Frustum culling: ${culledCount} sprites culled, ${renderEntities.length} rendered, Camera: [${cameraX.toFixed(0)}, ${cameraY.toFixed(0)}], Frustum: L=${frustumLeft.toFixed(0)} R=${frustumRight.toFixed(0)} B=${frustumBottom.toFixed(0)} T=${frustumTop.toFixed(0)}`
    );
  }

  // Batch sprites
  const batches = batchManager.batch(renderEntities);
  console.log(
    `📦 Built ${batches.length} batches with ${renderEntities.length} render entities`
  );

  // Create or update instance buffer with better growth strategy
  let instanceBuffer = commands.tryGetResource(InstanceBuffer);
  const requiredCapacity = Math.max(renderEntities.length, 1);

  // Only recreate if we don't have a buffer or need significantly more capacity
  // Use 1.5x growth factor to reduce reallocations
  if (!instanceBuffer) {
    // Initial allocation: use at least 1000 instances or 2x required
    const initialCapacity = Math.max(1000, requiredCapacity * 2);
    instanceBuffer = new InstanceBuffer(
      device,
      initialCapacity,
      "sprite_instances"
    );
    commands.setResource(instanceBuffer);
  } else if (instanceBuffer.capacity < requiredCapacity) {
    // Need to grow: destroy old and create new with 1.5x the required capacity
    instanceBuffer.destroy();
    const newCapacity = Math.ceil(requiredCapacity * 1.5);
    instanceBuffer = new InstanceBuffer(
      device,
      newCapacity,
      "sprite_instances"
    );
    commands.setResource(instanceBuffer);
  }

  // Store batches for render phase (will be cached for next frame if no changes)
  commands.setResource(batches);

  // Write all instances to buffer
  const allInstances = batches.flatMap((b) => b.instances);
  if (allInstances.length > 0) {
    instanceBuffer.writeInstances(allInstances);
  }

  // Clean up changed flags after processing
  for (const [entity] of changedEntities) {
    commands.removeComponent(entity, TransformChanged);
  }
}).label("queue-sprites");
