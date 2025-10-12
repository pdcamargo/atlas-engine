import {
  App,
  createSet,
  EcsPlugin,
  ViewportPlugin,
  SystemType,
} from "../../..";
import {
  Physics2DWorld,
  Physics2DWorldOptions,
  Physics2DWorldSettings,
} from "./resources";
import {
  applyVelocities,
  debugDraw,
  processColliders,
  processRigidBodies,
  stepWorld,
  syncRigidbodiesTransforms,
} from "./systems";

export const Physics2DWorldSet = Symbol("Physics2DWorldSet");

export class Physics2DPlugin implements EcsPlugin {
  constructor(private readonly options?: Physics2DWorldOptions) {}

  public build(app: App) {
    app
      .setResource(new Physics2DWorldSettings())
      .setResource(new Physics2DWorld(this.options))
      // Process creations in PreFixedUpdate so velocities can be applied before stepping
      .addSystems(
        SystemType.PreFixedUpdate,
        createSet(
          Physics2DWorldSet,
          processRigidBodies,
          processColliders,
          applyVelocities
        )
      )
      .addSystems(
        SystemType.FixedUpdate,
        createSet(Physics2DWorldSet, stepWorld)
      )
      .addSystems(
        SystemType.PostFixedUpdate,
        createSet(Physics2DWorldSet, syncRigidbodiesTransforms)
      )
      .addSystems(SystemType.Render, createSet(Physics2DWorldSet, debugDraw));
  }

  public ready(app: App) {
    return (
      app.hasResource(Physics2DWorld) && app.hasResource(Physics2DWorldSettings)
    );
  }

  public dependsOn() {
    return [ViewportPlugin];
  }
}
