import "reflect-metadata";
import {
  SystemType,
  type SystemFn,
  type SystemDescriptor,
  type SystemBuilderInput,
  type SystemId,
  type SystemSetId,
} from "./types";
import { Commands } from "./commands";
import type { Events, EventsApi } from "./events";

type ScheduledSystem = SystemDescriptor & { type: SystemType };

export class Scheduler {
  #systems: ScheduledSystem[] = [];
  #setRunIfByPhase: Map<string, Map<SystemSetId, import("./types").RunIfFn[]>> =
    new Map();
  #setBeforeSetsByPhase: Map<string, Map<SystemSetId, Set<SystemSetId>>> =
    new Map();
  #setAfterSetsByPhase: Map<string, Map<SystemSetId, Set<SystemSetId>>> =
    new Map();
  #setBeforeLabelsByPhase: Map<string, Map<SystemSetId, Set<string>>> =
    new Map();
  #setAfterLabelsByPhase: Map<string, Map<SystemSetId, Set<string>>> =
    new Map();

  #commands?: Commands;
  #events?: Events;

  public addSystem(type: SystemType, input: SystemBuilderInput): this {
    const desc = this.#normalize(input);
    this.#systems.push({ type, ...desc });
    return this;
  }

  public async run(
    type: SystemType,
    app: import("../index").App
  ): Promise<void> {
    const systems = this.#systems.filter((s) => s.type === type);
    const ordered = this.#order(type, systems);
    for (const s of ordered) {
      // runIf gate (system-level and set-level, AND semantics)
      const preds: import("./types").RunIfFn[] = [];
      const runIfVal = s.runIf;
      if (Array.isArray(runIfVal)) preds.push(...runIfVal);
      else if (runIfVal)
        preds.push(runIfVal as unknown as import("./types").RunIfFn);
      for (const setId of s.sets) {
        const arrAll = this.#getSetRunIf("*", setId);
        const arrPhase = this.#getSetRunIf(type, setId);
        if (arrAll) preds.push(...arrAll);
        if (arrPhase) preds.push(...arrPhase);
      }
      if (preds.length > 0) {
        const ctx = {
          commands: this.#commands ?? new Commands(app),
          events: (this.#events ??
            app.events) as unknown as import("./events").EventsApi,
        } as const;
        let ok = true;
        for (const p of preds) {
          if (!(await p(ctx))) {
            ok = false;
            break;
          }
        }
        if (!ok) continue;
      }
      await this.#invokeSystem(s, app);
    }
  }

  async #invokeSystem(
    s: ScheduledSystem,
    app: import("../index").App
  ): Promise<void> {
    const target = s.target ?? null;
    const fn = s.fn;

    if (!this.#commands) {
      this.#commands = new Commands(app);
    }
    if (!this.#events) {
      this.#events = app.events;
    }

    const commands = this.#commands;
    const eventsApi: EventsApi = {
      writer: <T>(cls: new (...args: any[]) => T) => this.#events!.writer(cls),
      reader: <T>(cls: new (...args: any[]) => T) =>
        this.#events!.reader(cls, target ?? fn),
    };
    const ctx = { commands, events: eventsApi } as const;
    if (target) {
      await (fn as SystemFn).call(target, ctx);
    } else {
      await (fn as SystemFn)(ctx);
    }
  }

  public hasTickSystems(): boolean {
    return this.#systems.some((s) =>
      [
        SystemType.Update,
        SystemType.PreUpdate,
        SystemType.PostUpdate,
        SystemType.FixedUpdate,
        SystemType.PreFixedUpdate,
        SystemType.PostFixedUpdate,
        SystemType.Render,
        SystemType.PreRender,
        SystemType.PostRender,
      ].includes(s.type)
    );
  }

  public addSetRunIf(
    setId: SystemSetId,
    predicates: import("./types").RunIfFn[],
    type?: SystemType
  ): this {
    const key = this.#phaseKey(type);
    const map = this.#ensureMap(this.#setRunIfByPhase, key);
    const arr = map.get(setId) ?? [];
    arr.push(...predicates);
    map.set(setId, arr);
    return this;
  }

  public addSetBeforeSet(
    setId: SystemSetId,
    before: SystemSetId[],
    type?: SystemType
  ): this {
    const key = this.#phaseKey(type);
    const map = this.#ensureMap(this.#setBeforeSetsByPhase, key);
    const set = map.get(setId) ?? new Set<SystemSetId>();
    for (const b of before) set.add(b);
    map.set(setId, set);
    return this;
  }

  public addSetAfterSet(
    setId: SystemSetId,
    after: SystemSetId[],
    type?: SystemType
  ): this {
    const key = this.#phaseKey(type);
    const map = this.#ensureMap(this.#setAfterSetsByPhase, key);
    const set = map.get(setId) ?? new Set<SystemSetId>();
    for (const a of after) set.add(a);
    map.set(setId, set);
    return this;
  }

  public addSetBeforeLabel(
    setId: SystemSetId,
    beforeLabels: string[],
    type?: SystemType
  ): this {
    const key = this.#phaseKey(type);
    const map = this.#ensureMap(this.#setBeforeLabelsByPhase, key);
    const set = map.get(setId) ?? new Set<string>();
    for (const l of beforeLabels) set.add(l);
    map.set(setId, set);
    return this;
  }

  public addSetAfterLabel(
    setId: SystemSetId,
    afterLabels: string[],
    type?: SystemType
  ): this {
    const key = this.#phaseKey(type);
    const map = this.#ensureMap(this.#setAfterLabelsByPhase, key);
    const set = map.get(setId) ?? new Set<string>();
    for (const l of afterLabels) set.add(l);
    map.set(setId, set);
    return this;
  }

  public configureSet(
    setId: SystemSetId,
    type: SystemType,
    config: {
      predicates?: import("./types").RunIfFn[];
      beforeSets?: SystemSetId[];
      afterSets?: SystemSetId[];
      beforeLabels?: string[];
      afterLabels?: string[];
    }
  ): this {
    if (config.beforeSets) {
      this.addSetBeforeSet(setId, config.beforeSets, type);
    }
    if (config.afterSets) {
      this.addSetAfterSet(setId, config.afterSets, type);
    }
    if (config.beforeLabels) {
      this.addSetBeforeLabel(setId, config.beforeLabels, type);
    }
    if (config.afterLabels) {
      this.addSetAfterLabel(setId, config.afterLabels, type);
    }
    if (config.predicates) {
      this.addSetRunIf(setId, config.predicates, type);
    }
    return this;
  }

  #normalize(input: SystemBuilderInput): SystemDescriptor {
    if (typeof input === "function") {
      return {
        id: this.#makeId(input),
        fn: input,
        target: null,
        sets: new Set(),
        labels: new Set(),
        before: new Set(),
        after: new Set(),
        beforeSets: new Set(),
        afterSets: new Set(),
        beforeLabels: new Set(),
        afterLabels: new Set(),
      } as SystemDescriptor;
    }
    if (Array.isArray(input)) {
      const [target, fn] = input;
      return {
        id: this.#makeId(fn),
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
      } as SystemDescriptor;
    }
    return input;
  }

  #makeId(fn: SystemFn): SystemId {
    const name = (fn as { name?: string }).name ?? "system";
    const suffix = Math.random().toString(36).slice(2, 8);
    return `${name}-${suffix}`;
  }

  #order(type: SystemType, systems: ScheduledSystem[]): ScheduledSystem[] {
    // Build graph with constraints (after/before, set based too)
    const byId = new Map<SystemId, ScheduledSystem>();
    for (const s of systems) byId.set(s.id, s);

    const setMembers = new Map<SystemSetId, Set<SystemId>>();
    for (const s of systems) {
      for (const setId of s.sets) {
        if (!setMembers.has(setId)) setMembers.set(setId, new Set());
        setMembers.get(setId)!.add(s.id);
      }
    }

    const edges = new Map<SystemId, Set<SystemId>>();
    const addEdge = (a: SystemId, b: SystemId) => {
      if (!edges.has(a)) edges.set(a, new Set());
      edges.get(a)!.add(b);
    };

    for (const s of systems) {
      // direct system ordering
      for (const beforeId of s.before) addEdge(s.id, beforeId);
      for (const afterId of s.after) addEdge(afterId, s.id);

      // set-based ordering
      for (const beforeSet of s.beforeSets) {
        for (const member of setMembers.get(beforeSet) ?? [])
          addEdge(s.id, member);
      }
      for (const afterSet of s.afterSets) {
        for (const member of setMembers.get(afterSet) ?? [])
          addEdge(member, s.id);
      }

      // set-level constraints applied to members
      for (const setId of s.sets) {
        const beforeSets = this.#getSetBeforeSets("*", setId);
        const beforeSetsPhase = this.#getSetBeforeSets(type, setId);
        for (const bs of beforeSets ?? [])
          for (const member of setMembers.get(bs) ?? []) addEdge(s.id, member);
        for (const bs of beforeSetsPhase ?? [])
          for (const member of setMembers.get(bs) ?? []) addEdge(s.id, member);

        const afterSets = this.#getSetAfterSets("*", setId);
        const afterSetsPhase = this.#getSetAfterSets(type, setId);
        for (const as of afterSets ?? [])
          for (const member of setMembers.get(as) ?? []) addEdge(member, s.id);
        for (const as of afterSetsPhase ?? [])
          for (const member of setMembers.get(as) ?? []) addEdge(member, s.id);

        const beforeLabels = this.#getSetBeforeLabels("*", setId);
        const beforeLabelsPhase = this.#getSetBeforeLabels(type, setId);
        for (const bl of beforeLabels ?? [])
          for (const other of systems)
            if ((other as any).labels?.has?.(bl)) addEdge(s.id, other.id);
        for (const bl of beforeLabelsPhase ?? [])
          for (const other of systems)
            if ((other as any).labels?.has?.(bl)) addEdge(s.id, other.id);

        const afterLabels = this.#getSetAfterLabels("*", setId);
        const afterLabelsPhase = this.#getSetAfterLabels(type, setId);
        for (const al of afterLabels ?? [])
          for (const other of systems)
            if ((other as any).labels?.has?.(al)) addEdge(other.id, s.id);
        for (const al of afterLabelsPhase ?? [])
          for (const other of systems)
            if ((other as any).labels?.has?.(al)) addEdge(other.id, s.id);
      }

      // label-based ordering
      for (const beforeLabel of (s as any).beforeLabels ?? []) {
        for (const other of systems)
          if ((other as any).labels?.has?.(beforeLabel))
            addEdge(s.id, other.id);
      }
      for (const afterLabel of (s as any).afterLabels ?? []) {
        for (const other of systems)
          if ((other as any).labels?.has?.(afterLabel)) addEdge(other.id, s.id);
      }
    }

    // Kahn topo sort (stable-ish): preserve insertion order when possible
    const inDegree = new Map<SystemId, number>();
    for (const s of systems) inDegree.set(s.id, 0);
    for (const [, tos] of edges) {
      for (const b of tos) inDegree.set(b, (inDegree.get(b) ?? 0) + 1);
    }

    const queue: SystemId[] = systems
      .filter((s) => (inDegree.get(s.id) ?? 0) === 0)
      .map((s) => s.id);
    const result: ScheduledSystem[] = [];
    while (queue.length > 0) {
      const id = queue.shift()!;
      const s = byId.get(id);
      if (s) result.push(s);
      for (const b of edges.get(id) ?? []) {
        const deg = (inDegree.get(b) ?? 0) - 1;
        inDegree.set(b, deg);
        if (deg === 0) queue.push(b);
      }
    }

    // If cycle, fallback to original order to avoid deadlock
    if (result.length !== systems.length) return systems;
    return result;
  }

  #phaseKey(type?: SystemType): string {
    return (type as unknown as string) ?? "*";
  }

  #ensureMap<K, V>(m: Map<string, Map<K, V>>, key: string): Map<K, V> {
    const got = m.get(key);
    if (got) return got;
    const inner = new Map<K, V>();
    m.set(key, inner);
    return inner;
  }

  #getSetRunIf(
    type: SystemType | "*",
    setId: SystemSetId
  ): import("./types").RunIfFn[] | undefined {
    const map = this.#setRunIfByPhase.get(type as unknown as string);
    return map?.get(setId);
  }
  #getSetBeforeSets(
    type: SystemType | "*",
    setId: SystemSetId
  ): Set<SystemSetId> | undefined {
    const map = this.#setBeforeSetsByPhase.get(type as unknown as string);
    return map?.get(setId);
  }
  #getSetAfterSets(
    type: SystemType | "*",
    setId: SystemSetId
  ): Set<SystemSetId> | undefined {
    const map = this.#setAfterSetsByPhase.get(type as unknown as string);
    return map?.get(setId);
  }
  #getSetBeforeLabels(
    type: SystemType | "*",
    setId: SystemSetId
  ): Set<string> | undefined {
    const map = this.#setBeforeLabelsByPhase.get(type as unknown as string);
    return map?.get(setId);
  }
  #getSetAfterLabels(
    type: SystemType | "*",
    setId: SystemSetId
  ): Set<string> | undefined {
    const map = this.#setAfterLabelsByPhase.get(type as unknown as string);
    return map?.get(setId);
  }
}
