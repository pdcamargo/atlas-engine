export type RigidBody2DType =
  | "dynamic"
  | "kinematicPosition"
  | "kinematicVelocity"
  | "fixed";

export class RigidBody2D {
  #type: RigidBody2DType;

  constructor(options?: { type?: RigidBody2DType }) {
    this.#type = options?.type ?? "dynamic";
  }

  public get type(): RigidBody2DType {
    return this.#type;
  }

  public static dynamic(
    options?: Omit<ConstructorParameters<typeof RigidBody2D>[0], "type">
  ) {
    return new RigidBody2D({ ...options, type: "dynamic" });
  }

  public static kinematicPosition(
    options?: Omit<ConstructorParameters<typeof RigidBody2D>[0], "type">
  ) {
    return new RigidBody2D({ ...options, type: "kinematicPosition" });
  }

  public static kinematicVelocity(
    options?: Omit<ConstructorParameters<typeof RigidBody2D>[0], "type">
  ) {
    return new RigidBody2D({ ...options, type: "kinematicVelocity" });
  }

  public static fixed(
    options?: Omit<ConstructorParameters<typeof RigidBody2D>[0], "type">
  ) {
    return new RigidBody2D({ ...options, type: "fixed" });
  }
}

export class Damping {
  #linearDamping?: number;
  #angularDamping?: number;

  public isDirty = true;

  constructor(options?: { linearDamping?: number; angularDamping?: number }) {
    this.#linearDamping = options?.linearDamping;
    this.#angularDamping = options?.angularDamping;
    this.isDirty = true;
  }

  public get linearDamping(): number | undefined {
    return this.#linearDamping;
  }

  public get angularDamping(): number | undefined {
    return this.#angularDamping;
  }

  public set linearDamping(damping: number) {
    this.#linearDamping = damping;
    this.isDirty = true;
  }

  public set angularDamping(damping: number) {
    this.#angularDamping = damping;
    this.isDirty = true;
  }

  public static fromValues(linearDamping: number, angularDamping: number) {
    return new Damping({ linearDamping, angularDamping });
  }

  public static zero() {
    return Damping.fromValues(0, 0);
  }
}
export class GravityScale {
  #gravityScale: number;

  public isDirty = true;

  constructor(gravityScale = 1) {
    this.#gravityScale = gravityScale;
    this.isDirty = true;
  }

  public get gravityScale(): number {
    return this.#gravityScale;
  }

  public set gravityScale(gravityScale: number) {
    this.#gravityScale = gravityScale;
    this.isDirty = true;
  }
}

/**
 * This will only be present on the entities that have a rigid body that was already processed and created
 */
export class RigidBody2DHandle {
  constructor(public readonly handle: number) {}
}

export class Velocity {
  #linvel: { x: number; y: number };
  #angvel: number;

  public isDirty = true;

  constructor(initialVelocity?: { x?: number; y?: number; ang?: number }) {
    this.#linvel = { x: initialVelocity?.x ?? 0, y: initialVelocity?.y ?? 0 };
    this.#angvel = initialVelocity?.ang ?? 0;
    this.isDirty = true;
  }

  public get linvel() {
    return this.#linvel;
  }

  public set linvel(v: { x: number; y: number }) {
    this.#linvel = v;
    this.isDirty = true;
  }

  public get angvel() {
    return this.#angvel;
  }

  public set angvel(v: number) {
    this.#angvel = v;
    this.isDirty = true;
  }

  public static zero() {
    return new Velocity({ x: 0, y: 0, ang: 0 });
  }
}

export type Collider2DShape =
  | { kind: "circle"; radius: number }
  | { kind: "rect"; width: number; height: number }
  | { kind: "polygon"; points: { x: number; y: number }[] };

export class Collider2D {
  #shape: Collider2DShape;
  #density?: number;
  #friction?: number;
  #restitution?: number;

  constructor(
    shape: Collider2DShape,
    options?: {
      density?: number;
      friction?: number;
      restitution?: number;
    }
  ) {
    this.#shape = shape;
    this.#density = options?.density;
    this.#friction = options?.friction;
    this.#restitution = options?.restitution;
  }

  public get shape(): Collider2DShape {
    return this.#shape;
  }

  public get density(): number | undefined {
    return this.#density;
  }

  public get friction(): number | undefined {
    return this.#friction;
  }

  public get restitution(): number | undefined {
    return this.#restitution;
  }

  public static circle(
    radius: number,
    options?: { density?: number; friction?: number; restitution?: number }
  ) {
    return new Collider2D({ kind: "circle", radius }, options);
  }

  public static rect(
    width: number,
    height: number,
    options?: { density?: number; friction?: number; restitution?: number }
  ) {
    return new Collider2D({ kind: "rect", width, height }, options);
  }

  public static polygon(
    points: { x: number; y: number }[],
    options?: { density?: number; friction?: number; restitution?: number }
  ) {
    return new Collider2D({ kind: "polygon", points }, options);
  }
}
