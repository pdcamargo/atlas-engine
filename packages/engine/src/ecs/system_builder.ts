import type { SystemFn, SystemDescriptor, SystemSetId, RunIf } from "./types";

export class SystemBuilder {
  #desc: SystemDescriptor;

  constructor(fn: SystemFn, target: object | null = null) {
    const id = `${(fn as { name?: string }).name ?? "system"}-${Math.random()
      .toString(36)
      .slice(2, 8)}`;
    this.#desc = {
      id,
      fn,
      target,
      sets: new Set(),
      labels: new Set(),
      before: new Set(),
      after: new Set(),
      beforeSets: new Set(),
      afterSets: new Set(),
      beforeLabels: new Set(),
      afterLabels: new Set(),
    };
  }

  public label(name: string): this {
    this.#desc.labels.add(name);
    return this;
  }

  public runIf(predicate: RunIf): this {
    this.#desc.runIf = predicate;
    return this;
  }

  public inSet(...sets: SystemSetId[]): this {
    for (const s of sets) this.#desc.sets.add(s);
    return this;
  }

  public beforeSet(...sets: SystemSetId[]): this {
    for (const s of sets) this.#desc.beforeSets.add(s);
    return this;
  }

  public afterSet(...sets: SystemSetId[]): this {
    for (const s of sets) this.#desc.afterSets.add(s);
    return this;
  }

  public beforeLabel(...labels: string[]): this {
    for (const l of labels) this.#desc.beforeLabels.add(l);
    return this;
  }

  public afterLabel(...labels: string[]): this {
    for (const l of labels) this.#desc.afterLabels.add(l);
    return this;
  }

  public build(): SystemDescriptor {
    return this.#desc;
  }
}

export function sys(fn: SystemFn, target: object | null = null): SystemBuilder {
  return new SystemBuilder(fn, target);
}

type Buildable =
  | SystemFn
  | [object, SystemFn]
  | SystemBuilder
  | SystemDescriptor;

function toDescriptor(b: Buildable): SystemDescriptor {
  if (b instanceof SystemBuilder) return b.build();
  if (Array.isArray(b)) return new SystemBuilder(b[1], b[0]).build();
  if (typeof b === "function") return new SystemBuilder(b).build();
  return b;
}

export function createSet(
  set: SystemSetId,
  ...items: Buildable[]
): SystemDescriptor[] {
  return items.map((b) => {
    const d = toDescriptor(b);
    d.sets.add(set);
    return d;
  });
}
