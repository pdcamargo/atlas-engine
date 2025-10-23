import type { World } from "../world";
import type { ComponentClass, Entity } from "../types";
import { Serializer } from "../serialization/serializer";
import { SerializationRegistry } from "../serialization/registry";
import {
  Scene,
  type SerializedEntity,
  type SerializedComponent,
} from "./scene";
import { Parent, Children } from "../components/parent";

/**
 * Serializes and deserializes Scene objects to/from JSON
 */
export class SceneSerializer {
  /**
   * Serialize a scene to a JSON-compatible object
   */
  static serialize(scene: Scene): any {
    return {
      metadata: scene.metadata,
      entities: scene.entities,
      rootEntities: scene.rootEntities,
    };
  }

  /**
   * Deserialize a scene from a JSON-compatible object
   */
  static deserialize(data: any): Scene {
    return new Scene(
      data.metadata || {},
      data.entities || [],
      data.rootEntities || []
    );
  }

  /**
   * Create a scene from entities in the world
   * @param world The world to extract entities from
   * @param entities List of entity IDs to include in the scene
   * @param metadata Optional metadata for the scene
   */
  static fromWorld(
    world: World,
    entities: Entity[],
    metadata: any = {}
  ): Scene {
    const scene = new Scene(metadata);

    // Create a mapping from world entity IDs to scene-local IDs
    const entityIdMap = new Map<Entity, number>();
    entities.forEach((entityId, index) => {
      entityIdMap.set(entityId, index);
    });

    // Create serialization context
    const context = {
      root: scene,
      path: [],
      entityIdMap,
      customData: new Map(),
    };

    // Find root entities (those without Parent component or whose parent is not in the scene)
    const rootEntities: number[] = [];

    // Serialize each entity
    for (let i = 0; i < entities.length; i++) {
      const entityId = entities[i];
      const sceneLocalId = i;

      const serializedEntity: SerializedEntity = {
        id: sceneLocalId,
        components: [],
      };

      // Get all components for this entity
      const components = world.getEntityComponents(entityId);

      if (!components || components.size === 0) {
        // Entity has no components, but still add it to the scene
        scene.addEntity(serializedEntity);
        rootEntities.push(sceneLocalId);
        continue;
      }

      let hasParent = false;

      // Serialize each component
      for (const [componentClass, componentInstance] of components) {
        const componentTypeName = SerializationRegistry.getClassName(
          componentClass as any
        );

        // Check if this is a Parent component
        if (componentInstance instanceof Parent) {
          // Only include if parent is in the scene
          if (entityIdMap.has(componentInstance.parentId)) {
            hasParent = true;
          } else {
            // Parent is outside the scene, skip this component
            continue;
          }
        }

        // Check if this is a Children component
        if (componentInstance instanceof Children) {
          // Filter children to only include those in the scene
          const filteredChildren = componentInstance.childrenIds.filter(
            (childId) => entityIdMap.has(childId)
          );
          if (filteredChildren.length === 0) {
            // No children in the scene, skip this component
            continue;
          }
          // Create a filtered Children component
          const filteredChildrenComponent = new Children(filteredChildren);
          const serializedData = Serializer.serialize(
            filteredChildrenComponent,
            context
          );
          serializedEntity.components.push({
            type: componentTypeName,
            data: serializedData,
          });
          continue;
        }

        // Serialize the component
        const serializedData = Serializer.serialize(componentInstance, context);

        // Skip if serialization returned undefined (unregistered class)
        if (serializedData === undefined) {
          console.log(`  Skipping component ${componentTypeName} (serialization returned undefined)`);
          continue;
        }

        serializedEntity.components.push({
          type: componentTypeName,
          data: serializedData,
        });
      }

      scene.addEntity(serializedEntity);

      // Mark as root if it has no parent (or parent is outside scene)
      if (!hasParent) {
        rootEntities.push(sceneLocalId);
      }
    }

    scene.rootEntities = rootEntities;
    return scene;
  }

  /**
   * Convert scene to a JSON string
   */
  static toJSON(scene: Scene, pretty: boolean = false): string {
    const data = this.serialize(scene);
    return pretty ? JSON.stringify(data, null, 2) : JSON.stringify(data);
  }

  /**
   * Parse a scene from a JSON string
   */
  static fromJSON(json: string): Scene {
    const data = JSON.parse(json);
    return this.deserialize(data);
  }
}
