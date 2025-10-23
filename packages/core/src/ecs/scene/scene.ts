import type { ComponentClass, Entity } from "../types";

/**
 * Represents a serialized component on an entity
 */
export interface SerializedComponent {
  /**
   * Type name of the component
   */
  type: string;

  /**
   * Serialized data for the component
   */
  data: any;
}

/**
 * Represents a serialized entity in a scene
 */
export interface SerializedEntity {
  /**
   * Scene-local ID for this entity (0-indexed)
   */
  id: number;

  /**
   * Optional name/label for the entity (for debugging)
   */
  name?: string;

  /**
   * Components attached to this entity
   */
  components: SerializedComponent[];
}

/**
 * Scene metadata
 */
export interface SceneMetadata {
  /**
   * Scene name
   */
  name?: string;

  /**
   * Scene version (for migration purposes)
   */
  version?: string;

  /**
   * Custom metadata
   */
  [key: string]: any;
}

/**
 * A scene is a collection of entities and their components
 * Can be serialized to/from JSON for saving/loading
 * Similar to Godot's scene system
 */
export class Scene {
  /**
   * Metadata about the scene
   */
  public metadata: SceneMetadata;

  /**
   * Entities in the scene
   */
  public entities: SerializedEntity[];

  /**
   * Root entity IDs (entities without parents)
   */
  public rootEntities: number[];

  constructor(
    metadata: SceneMetadata = {},
    entities: SerializedEntity[] = [],
    rootEntities: number[] = []
  ) {
    this.metadata = metadata;
    this.entities = entities;
    this.rootEntities = rootEntities;
  }

  /**
   * Add an entity to the scene
   */
  addEntity(entity: SerializedEntity): void {
    this.entities.push(entity);
  }

  /**
   * Get an entity by scene-local ID
   */
  getEntity(id: number): SerializedEntity | undefined {
    return this.entities.find((e) => e.id === id);
  }

  /**
   * Get all entities
   */
  getEntities(): SerializedEntity[] {
    return this.entities;
  }

  /**
   * Get root entities (those without parents)
   */
  getRootEntities(): SerializedEntity[] {
    return this.entities.filter((e) => this.rootEntities.includes(e.id));
  }

  /**
   * Mark an entity as a root entity
   */
  addRootEntity(id: number): void {
    if (!this.rootEntities.includes(id)) {
      this.rootEntities.push(id);
    }
  }

  /**
   * Get the number of entities in the scene
   */
  get entityCount(): number {
    return this.entities.length;
  }

  /**
   * Clone this scene
   */
  clone(): Scene {
    return new Scene(
      { ...this.metadata },
      this.entities.map((e) => ({ ...e, components: [...e.components] })),
      [...this.rootEntities]
    );
  }
}

/**
 * Represents an instance of a scene spawned into the world
 */
export class SceneInstance {
  /**
   * The original scene this was instantiated from
   */
  public scene: Scene;

  /**
   * Mapping from scene-local entity IDs to world entity IDs
   */
  public entityMapping: Map<number, Entity>;

  /**
   * Root entities in the world (corresponds to scene.rootEntities)
   */
  public rootEntities: Entity[];

  constructor(
    scene: Scene,
    entityMapping: Map<number, Entity>,
    rootEntities: Entity[]
  ) {
    this.scene = scene;
    this.entityMapping = entityMapping;
    this.rootEntities = rootEntities;
  }

  /**
   * Get the world entity ID for a scene-local ID
   */
  getEntity(sceneLocalId: number): Entity | undefined {
    return this.entityMapping.get(sceneLocalId);
  }

  /**
   * Get all world entity IDs spawned from this scene
   */
  getAllEntities(): Entity[] {
    return Array.from(this.entityMapping.values());
  }
}
