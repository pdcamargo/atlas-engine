import type { App } from "./index";

export type EcsPluginConstructor = new (...args: unknown[]) => EcsPlugin;

export interface EcsPlugin {
  build(app: App): void | Promise<void>;
  ready?(app: App): boolean | Promise<boolean>;
  finish?(app: App): void | Promise<void>;
  cleanup?(app: App): void | Promise<void>;
  name?(): string;
  isUnique?(): boolean; // default true
  dependsOn?(): (string | EcsPluginConstructor)[]; // classes or names
}

export interface EcsPluginGroup {
  plugins(): EcsPlugin[];
  name?(): string;
}
