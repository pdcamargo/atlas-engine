import { FileSystemAdapter } from "@atlas/engine";

import * as fs from "@tauri-apps/plugin-fs";

export class TauriFileSystemAdapter implements FileSystemAdapter {
  async readJson<T = Record<string, unknown>>(path: string): Promise<T> {
    const file = await fs.readTextFile(path);

    try {
      return JSON.parse(file);
    } catch (error) {
      throw new Error(`Failed to parse JSON file: ${path}`, { cause: error });
    }
  }

  async readFile(path: string): Promise<string> {
    return fs.readTextFile(path);
  }

  async readFileBlob(path: string): Promise<Uint8Array<ArrayBuffer>> {
    return fs.readFile(path);
  }

  async writeFile(
    path: string,
    data: Uint8Array | ReadableStream<Uint8Array> | string
  ): Promise<void> {
    if (typeof data === "string") {
      return fs.writeTextFile(path, data);
    }

    return fs.writeFile(path, data);
  }

  exists(path: string): Promise<boolean> {
    return fs.exists(path);
  }

  async readDirectory(path: string): Promise<string[]> {
    const entries = await fs.readDir(path);

    return entries.map((entry) => entry.name);
  }

  createDirectory(path: string): Promise<void> {
    return fs.mkdir(path);
  }

  async deleteFile(path: string): Promise<void> {
    const entry = await fs.stat(path);

    if (!entry.isFile) {
      throw new Error(`Path is not a file: ${path}`);
    }

    return fs.remove(path);
  }

  async deleteDirectory(path: string): Promise<void> {
    const entry = await fs.stat(path);

    if (!entry.isDirectory) {
      throw new Error(`Path is not a directory: ${path}`);
    }

    return fs.remove(path);
  }
}
