import * as RAPIER from "@dimforge/rapier2d";

export type Physics2DWorldOptions = {
  gravity?: {
    x: number;
    y: number;
  };
};

export class Physics2DWorldSettings {
  pixelPerUnit = 100;
}

export class Physics2DWorld {
  #world: RAPIER.World;

  constructor(options?: Physics2DWorldOptions) {
    this.#world = new RAPIER.World({
      x: options?.gravity?.x ?? 0,
      y: options?.gravity?.y ?? 9.81,
    });
  }

  public debugRender() {
    return this.#world.debugRender();
  }

  public step(eventQueue?: RAPIER.EventQueue, hooks?: RAPIER.PhysicsHooks) {
    this.#world.step(eventQueue, hooks);
  }

  public getRigidBody(handle: number): RAPIER.RigidBody | undefined {
    return this.#world.getRigidBody(handle) ?? undefined;
  }

  public createRigidBody(desc: RAPIER.RigidBodyDesc): RAPIER.RigidBody {
    return this.#world.createRigidBody(desc);
  }

  public createCollider(
    desc: RAPIER.ColliderDesc,
    body: RAPIER.RigidBody
  ): RAPIER.Collider {
    return this.#world.createCollider(desc, body);
  }

  public removeRigidBody(handle: number): void {
    const body = this.#world.getRigidBody(handle);
    if (body) {
      this.#world.removeRigidBody(body);
    }
  }

  public setLengthUnit(unitsPerMeter: number): void {
    this.#world.lengthUnit = unitsPerMeter;
  }
}
