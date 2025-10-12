import { sys, Entity, EntityAddedEvent, Transform } from "@atlas/core";
import { RenderWorld } from "../render_world";
import { Sprite } from "../components/sprite";
import { Camera2D } from "../components/camera2d";
import { GlobalTransform } from "../components/transform";

/**
 * Extract sprites from main world to render world
 */
export const extractSprites = sys(({ commands, events }) => {
  const renderWorld = commands.getResource(RenderWorld);

  // Listen for newly added entities with sprites
  const addedEvents = events.reader(EntityAddedEvent);
  const added = addedEvents.read();

  for (const event of added) {
    const entity = event.entity;

    // Check if entity has a sprite
    if (commands.hasComponent(entity, Sprite)) {
      // Create render entity if it doesn't exist
      renderWorld.getOrCreateRenderEntity(entity);
    }
  }

  // Extract all sprites from main world (use Transform from @atlas/core)
  const sprites = commands.query(Sprite, Transform).all();

  for (const [mainEntity, sprite, transform] of sprites) {
    const renderEntity = renderWorld.getOrCreateRenderEntity(mainEntity);

    // Copy components to render world
    const renderCommands = {
      world: renderWorld.world,
      hasComponent: (e: Entity, cls: any) =>
        renderWorld.world.hasComponent(e, cls),
      getComponent: (e: Entity, cls: any) =>
        renderWorld.world.getComponent(e, cls),
      addComponents: (e: Entity, ...components: any[]) => {
        const record: Record<string, unknown> = {};
        for (let i = 0; i < components.length; i++) {
          record[i] = components[i];
        }
        renderWorld.world.addComponents(e, record);
      },
    };

    // Clone sprite
    const renderSprite = new Sprite({
      color: sprite.color.clone(),
      flipX: sprite.flipX,
      flipY: sprite.flipY,
      customSize: sprite.customSize,
      rect: sprite.rect,
      anchor: sprite.anchor.clone(),
      texture: sprite.texture,
    });

    // Convert Transform.matrix to GlobalTransform
    const renderTransform = new GlobalTransform(transform.matrix);

    // Add to render world
    renderCommands.addComponents(renderEntity, renderSprite, renderTransform);
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

    // Convert Transform.matrix to GlobalTransform
    const renderTransform = new GlobalTransform(transform.matrix);

    // Add to render world
    const record: Record<string, unknown> = {
      camera: renderCamera,
      transform: renderTransform,
    };
    renderWorld.world.addComponents(renderEntity, record);
  }
}).label("extract-cameras");
