import type { App } from "./index";

export interface EcsPlugin {
  build(app: App): void | Promise<void>;
  ready?(app: App): boolean | Promise<boolean>;
  finish?(app: App): void | Promise<void>;
  cleanup?(app: App): void | Promise<void>;
  name?(): string;
  isUnique?(): boolean; // default true
  dependsOn?(): (string | (new (...args: unknown[]) => unknown))[]; // classes or names
}

export interface EcsPluginGroup {
  plugins(): EcsPlugin[];
  name?(): string;
}
