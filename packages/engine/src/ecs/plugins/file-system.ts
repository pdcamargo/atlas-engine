import { App } from "../..";
import { EcsPlugin } from "../../plugin";

export type FileSystemAdapter = {
  readJson<T = Record<string, unknown>>(path: string): Promise<T>;
  readFile(path: string): Promise<string>;
  readFileBlob(path: string): Promise<Uint8Array<ArrayBuffer>>;
  writeFile(path: string, data: Uint8Array | ReadableStream<Uint8Array> | string): Promise<void>;
  exists(path: string): Promise<boolean>;
  readDirectory(path: string): Promise<string[]>;
  createDirectory(path: string): Promise<void>;
  deleteFile(path: string): Promise<void>;
  deleteDirectory(path: string): Promise<void>;
};

export class FileSystem {
  constructor(private readonly adapter: FileSystemAdapter) {}

  public readJson<T = Record<string, unknown>>(path: string): Promise<T> {
    return this.adapter.readJson(path);
  }

  public readFile(path: string): Promise<string> {
    return this.adapter.readFile(path);
  }

  public readFileBlob(path: string): Promise<Uint8Array<ArrayBuffer>> {
    return this.adapter.readFileBlob(path);
  }

  public writeFile(path: string, data: string): Promise<void> {
    return this.adapter.writeFile(path, data);
  }

  public exists(path: string): Promise<boolean> {
    return this.adapter.exists(path);
  }

  public readDirectory(path: string): Promise<string[]> {
    return this.adapter.readDirectory(path);
  }

  public createDirectory(path: string): Promise<void> {
    return this.adapter.createDirectory(path);
  }

  public deleteFile(path: string): Promise<void> {
    return this.adapter.deleteFile(path);
  }

  public deleteDirectory(path: string): Promise<void> {
    return this.adapter.deleteDirectory(path);
  }
}

const defaultAdapterRoutes = {
  readFile: "/{path}",
  writeFile: "/{path}",
  exists: "/exists/{path}",
  readDirectory: "/readdir/{path}",
  createDirectory: "/mkdir/{path}",
  deleteFile: "/rm/{path}",
  deleteDirectory: "/rmdir/{path}",
  readJson: "/{path}",
  readFileBlob: "/{path}",
};

const generateRoute = (route: string, path: string) => {
  return route.replace("{path}", path);
};

export class FileSystemError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FileSystemError";
    Object.setPrototypeOf(this, FileSystemError.prototype);
  }
}

export class FileSystemEndpointNotImplementedError extends FileSystemError {
  constructor(message: string) {
    super(message);
    this.name = "FileSystemEndpointNotImplementedError";
    Object.setPrototypeOf(
      this,
      FileSystemEndpointNotImplementedError.prototype
    );
  }
}

export class DefaultFileSystemAdapter implements FileSystemAdapter {
  async writeFile(path: string, data: string) {
    const res = await fetch(
      generateRoute(defaultAdapterRoutes.writeFile, path),
      {
        method: "POST",
        body: data,
      }
    );

    // check if route is not implemented and throw meaningful error
    if (res.status === 404) {
      throw new FileSystemEndpointNotImplementedError(
        `Endpoint not implemented: ${generateRoute(defaultAdapterRoutes.writeFile, path)}`
      );
    }

    if (!res.ok) {
      throw new Error(`Failed to write file: ${path}`);
    }
  }
  async exists(path: string): Promise<boolean> {
    const res = await fetch(generateRoute(defaultAdapterRoutes.exists, path));

    // check if route is not implemented and throw meaningful error
    if (res.status === 404) {
      throw new FileSystemEndpointNotImplementedError(
        `Endpoint not implemented: ${generateRoute(defaultAdapterRoutes.exists, path)}`
      );
    }

    return res.status === 200;
  }
  async readDirectory(path: string): Promise<string[]> {
    const res = await fetch(
      generateRoute(defaultAdapterRoutes.readDirectory, path)
    );

    // check if route is not implemented and throw meaningful error
    if (res.status === 404) {
      throw new FileSystemEndpointNotImplementedError(
        `Endpoint not implemented: ${generateRoute(defaultAdapterRoutes.readDirectory, path)}`
      );
    }

    return await res.json();
  }

  async createDirectory(path: string): Promise<void> {
    const res = await fetch(
      generateRoute(defaultAdapterRoutes.createDirectory, path)
    );

    // check if route is not implemented and throw meaningful error
    if (res.status === 404) {
      throw new FileSystemEndpointNotImplementedError(
        `Endpoint not implemented: ${generateRoute(defaultAdapterRoutes.createDirectory, path)}`
      );
    }
  }

  async deleteFile(path: string): Promise<void> {
    const res = await fetch(
      generateRoute(defaultAdapterRoutes.deleteFile, path)
    );

    // check for not found and throw meaningful error
    if (res.status === 404) {
      throw new Error(`File not found: ${path}`);
    }

    if (!res.ok) {
      throw new Error(`Failed to delete file: ${path}`);
    }
  }

  async deleteDirectory(path: string): Promise<void> {
    const res = await fetch(
      generateRoute(defaultAdapterRoutes.deleteDirectory, path)
    );

    // check if route is not implemented and throw meaningful error
    if (res.status === 404) {
      throw new FileSystemEndpointNotImplementedError(
        `Endpoint not implemented: ${generateRoute(defaultAdapterRoutes.deleteDirectory, path)}`
      );
    }
  }
  async readJson<T = Record<string, unknown>>(path: string): Promise<T> {
    const res = await fetch(generateRoute(defaultAdapterRoutes.readJson, path));

    // check if route is not implemented and throw meaningful error
    if (res.status === 404) {
      throw new FileSystemEndpointNotImplementedError(
        `Endpoint not implemented: ${generateRoute(defaultAdapterRoutes.readJson, path)}`
      );
    }

    return res.json();
  }

  async readFile(path: string): Promise<string> {
    const res = await fetch(generateRoute(defaultAdapterRoutes.readFile, path));

    // check if route is not implemented and throw meaningful error
    if (res.status === 404) {
      throw new FileSystemEndpointNotImplementedError(
        `Endpoint not implemented: ${generateRoute(defaultAdapterRoutes.readFile, path)}`
      );
    }

    return res.text();
  }

  async readFileBlob(path: string): Promise<Uint8Array<ArrayBuffer>> {
    const res = await fetch(
      generateRoute(defaultAdapterRoutes.readFileBlob, path)
    );

    // check if route is not implemented and throw meaningful error
    if (res.status === 404) {
      throw new FileSystemEndpointNotImplementedError(
        `Endpoint not implemented: ${generateRoute(defaultAdapterRoutes.readFileBlob, path)}`
      );
    }

    return new Uint8Array(await res.arrayBuffer());
  }
}

export class FileSystemPlugin implements EcsPlugin {
  constructor(
    private readonly adapter: FileSystemAdapter = new DefaultFileSystemAdapter()
  ) {}

  build(app: App) {
    app.setResource(new FileSystem(this.adapter));
  }
}
