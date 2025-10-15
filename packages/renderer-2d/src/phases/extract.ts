import { sys, Entity, EntityAddedEvent, Transform } from "@atlas/core";
import { RenderWorld } from "../render_world";
import { Sprite2D } from "../components/sprite";
import { Camera2D } from "../components/camera2d";
import { TransformChanged } from "../components/changed";

/**
 * Marker component to track entities that have been extracted to render world
 */
export class Extracted {
  constructor() {}
}

/**
 * Extract sprites from main world to render world
 * Optimized to only extract new or changed entities
 */
export const extractSprites = sys(({ commands, events }) => {
  const renderWorld = commands.getResource(RenderWorld);

  // Listen for newly added entities with sprites
  const addedEvents = events.reader(EntityAddedEvent);
  const added = addedEvents.read();

  for (const event of added) {
    const entity = event.entity;

    // Check if entity has a sprite
    if (commands.hasComponent(entity, Sprite2D)) {
      // Create render entity if it doesn't exist
      renderWorld.getOrCreateRenderEntity(entity);
      // Don't mark as extracted yet - let the query below handle the actual extraction
    }
  }

  // Query sprites that need extraction (not yet extracted)
  const newSprites = commands
    .query(Sprite2D, Transform)
    .without(Extracted)
    .all();

  // Query sprites that have been extracted (need update)
  const existingSprites = commands.query(Sprite2D, Transform, Extracted).all();

  let extractCount = 0;
  let updateCount = 0;

  // Extract new sprites
  for (const [mainEntity, sprite, transform] of newSprites) {
    const renderEntity = renderWorld.getOrCreateRenderEntity(mainEntity);

    // First time extraction - create new components
    const renderSprite = new Sprite2D({
      color: sprite.color.clone(),
      flipX: sprite.flipX,
      flipY: sprite.flipY,
      customSize: sprite.customSize,
      rect: sprite.rect,
      anchor: sprite.anchor.clone(),
      texture: sprite.texture,
    });

    // Add to render world (Sprite is needed for texture preparation)
    const record: Record<string, unknown> = {
      Sprite: renderSprite,
    };
    renderWorld.world.addComponents(renderEntity, record);

    // Mark as extracted in main world and as changed (needs GPU upload)
    commands.addComponent(mainEntity, new Extracted());
    commands.addComponent(mainEntity, new TransformChanged());
    extractCount++;
  }

  // Update existing sprites - only mark as changed if transform is dirty
  let transformChangedCount = 0;

  for (const [mainEntity, sprite, transform, _extracted] of existingSprites) {
    // Check if transform is dirty (changed since last frame)
    if (transform.isDirty) {
      // Mark as changed so queue phase rebuilds instance data
      commands.addComponent(mainEntity, new TransformChanged());
      transformChangedCount++;

      // Clear the dirty flag after processing
      transform.isDirty = false;
    }

    updateCount++;
  }
}).label("extract-sprites");

/**
 * Extract cameras from main world to render world
 */
export const extractCameras = sys(({ commands }) => {
  const renderWorld = commands.getResource(RenderWorld);

  // Extract all cameras (use Transform from @atlas/core)
  const cameras = commands.query(Camera2D, Transform).all();

  for (const [mainEntity, camera, transform] of cameras) {
    const renderEntity = renderWorld.getOrCreateRenderEntity(mainEntity);

    // Clone camera (don't deep clone everything, just refs)
    const renderCamera = new Camera2D({
      viewport: camera.viewport,
      clearColor: camera.clearColor.clone(),
      order: camera.order,
      projection: camera.projection,
      isActive: camera.isActive,
    });

    // Add to render world (only Camera2D, Transform is read from main world)
    const record: Record<string, unknown> = {
      Camera2D: renderCamera,
    };
    renderWorld.world.addComponents(renderEntity, record);
  }
}).label("extract-cameras");
