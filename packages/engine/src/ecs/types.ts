import "reflect-metadata";

export type Entity = number;

// Using any[] here allows concrete component constructors (e.g., new (x?: number)) to be assignable
export type ComponentClass<T> = new (...args: any[]) => T;

export type ComponentTuple<T extends readonly ComponentClass<unknown>[]> = {
  [K in keyof T]: T[K] extends ComponentClass<infer U> ? U : never;
};

export const QUERY_METADATA_KEY = Symbol("ecs:query:params");

export type QueryParamMetadata = {
  parameterIndex: number;
  components: readonly ComponentClass<unknown>[];
};

export enum SystemType {
  StartUp = "StartUp",
  PreUpdate = "PreUpdate",
  Update = "Update",
  PostUpdate = "PostUpdate",
  PreFixedUpdate = "PreFixedUpdate",
  FixedUpdate = "FixedUpdate",
  PostFixedUpdate = "PostFixedUpdate",
  PreRender = "PreRender",
  Render = "Render",
  PostRender = "PostRender",
}

export type SystemFn = (args: SystemFnArguments) => any;

export type SystemFnArguments = {
  commands: import("./commands").Commands;
  events: import("./events").EventsApi;
};

export type RunIfFn = (ctx: SystemFnArguments) => boolean | Promise<boolean>;
export type RunIf = RunIfFn | ReadonlyArray<RunIfFn>;

export type SystemId = string;

export type SystemSetId = string | number | symbol;

export type SystemDescriptor = {
  id: SystemId;
  fn: SystemFn;
  target: object | null;
  sets: Set<SystemSetId>;
  runIf?: RunIf;
  labels: Set<string>;
  before: Set<SystemId>;
  after: Set<SystemId>;
  beforeSets: Set<SystemSetId>;
  afterSets: Set<SystemSetId>;
  beforeLabels: Set<string>;
  afterLabels: Set<string>;
};

export type SystemBuilderInput =
  | SystemFn
  | [object, SystemFn]
  | SystemDescriptor;
