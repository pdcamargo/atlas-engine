import { World } from "../world";
import type { Entity } from "../types";
import { Serializer } from "../serialization/serializer";
import { Scene, SceneInstance } from "./scene";
import { SceneSerializer } from "./scene-serializer";

/**
 * Handles spawning scenes into the world and extracting scenes from the world
 */
export class SceneSpawner {
  /**
   * Spawn a scene into the world
   * Creates new entities and components from the scene data
   * @param world The world to spawn into
   * @param scene The scene to spawn
   * @returns SceneInstance with entity mappings
   */
  static spawn(world: World, scene: Scene): SceneInstance {
    // Create entity mapping (scene-local ID -> world entity ID)
    const entityIdMap = new Map<number, Entity>();
    const reverseEntityIdMap = new Map<Entity, number>();

    // First pass: Create all entities
    for (const serializedEntity of scene.entities) {
      const worldEntityId = world.createEntity();
      entityIdMap.set(serializedEntity.id, worldEntityId);
      reverseEntityIdMap.set(worldEntityId, serializedEntity.id);
    }

    // Create deserialization context with entity mapping
    const context = {
      root: scene,
      path: [],
      entityIdMap, // Maps scene-local ID -> world entity ID
      customData: new Map(),
    };

    // Second pass: Deserialize and add components
    for (const serializedEntity of scene.entities) {
      const worldEntityId = entityIdMap.get(serializedEntity.id);
      if (!worldEntityId) {
        throw new Error(
          `Entity mapping not found for scene-local ID ${serializedEntity.id}`
        );
      }

      const componentInstances: any[] = [];

      // Deserialize each component
      for (const serializedComponent of serializedEntity.components) {
        // Add the __type to the data if it's not already there
        const dataWithType = serializedComponent.data;
        if (
          typeof dataWithType === "object" &&
          dataWithType !== null &&
          !dataWithType.__type
        ) {
          dataWithType.__type = serializedComponent.type;
        }

        // Try to deserialize using the Serializer (which handles both metadata and custom serializers)
        const componentInstance = Serializer.deserialize(dataWithType, context);

        if (componentInstance) {
          componentInstances.push(componentInstance);
        } else {
          console.warn(
            `Failed to deserialize component type ${serializedComponent.type}`
          );
        }
      }

      // Add all components to the entity
      if (componentInstances.length > 0) {
        const componentsObj: Record<string, any> = {};
        componentInstances.forEach((instance, idx) => {
          componentsObj[`component${idx}`] = instance;
        });
        world.addComponents(worldEntityId, componentsObj);
      }
    }

    // Get root entities in world coordinates
    const rootEntities = scene.rootEntities
      .map((sceneLocalId) => entityIdMap.get(sceneLocalId))
      .filter((e): e is Entity => e !== undefined);

    return new SceneInstance(scene, reverseEntityIdMap, rootEntities);
  }

  /**
   * Save entities from the world into a scene
   * @param world The world to extract from
   * @param entities List of entity IDs to save
   * @param metadata Optional metadata for the scene
   * @returns Scene object
   */
  static save(world: World, entities: Entity[], metadata: any = {}): Scene {
    return SceneSerializer.fromWorld(world, entities, metadata);
  }
}
