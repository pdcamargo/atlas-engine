/**
 * Scene system for Atlas ECS
 * Provides Godot-like scene management with save/load capabilities
 */

export {
  Scene,
  SceneInstance,
  type SerializedEntity,
  type SerializedComponent,
  type SceneMetadata,
} from "./scene";

export { SceneSerializer } from "./scene-serializer";

export { SceneSpawner } from "./spawner";
