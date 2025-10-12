import { RenderDevice } from "../render_device";

/**
 * Vertex data for a 2D mesh
 */
export interface MeshVertex {
  position: [number, number, number];
  uv: [number, number];
}

/**
 * GPU mesh representation
 */
export class GpuMesh {
  public vertexBuffer: GPUBuffer;
  public indexBuffer?: GPUBuffer;
  public vertexCount: number;
  public indexCount?: number;

  constructor(
    vertexBuffer: GPUBuffer,
    vertexCount: number,
    indexBuffer?: GPUBuffer,
    indexCount?: number
  ) {
    this.vertexBuffer = vertexBuffer;
    this.vertexCount = vertexCount;
    this.indexBuffer = indexBuffer;
    this.indexCount = indexCount;
  }

  /**
   * Create a mesh from vertex and index data
   */
  public static create(
    device: RenderDevice,
    vertices: MeshVertex[],
    indices?: number[],
    label?: string
  ): GpuMesh {
    // Convert vertices to flat array
    const vertexData = new Float32Array(vertices.length * 5); // 3 for position, 2 for UV
    for (let i = 0; i < vertices.length; i++) {
      const v = vertices[i];
      const offset = i * 5;
      vertexData[offset + 0] = v.position[0];
      vertexData[offset + 1] = v.position[1];
      vertexData[offset + 2] = v.position[2];
      vertexData[offset + 3] = v.uv[0];
      vertexData[offset + 4] = v.uv[1];
    }

    const vertexBuffer = device.createBufferWithData({
      label: label ? `${label}_vertices` : undefined,
      data: vertexData,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });

    let indexBuffer: GPUBuffer | undefined;
    let indexCount: number | undefined;

    if (indices && indices.length > 0) {
      const indexData = new Uint16Array(indices);
      indexBuffer = device.createBufferWithData({
        label: label ? `${label}_indices` : undefined,
        data: indexData,
        usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
      });
      indexCount = indices.length;
    }

    return new GpuMesh(vertexBuffer, vertices.length, indexBuffer, indexCount);
  }

  /**
   * Create a quad mesh (2 triangles)
   */
  public static createQuad(device: RenderDevice): GpuMesh {
    const vertices: MeshVertex[] = [
      { position: [-0.5, -0.5, 0], uv: [0, 1] }, // Bottom-left
      { position: [0.5, -0.5, 0], uv: [1, 1] }, // Bottom-right
      { position: [0.5, 0.5, 0], uv: [1, 0] }, // Top-right
      { position: [-0.5, 0.5, 0], uv: [0, 0] }, // Top-left
    ];

    const indices = [
      0,
      1,
      2, // First triangle
      0,
      2,
      3, // Second triangle
    ];

    return GpuMesh.create(device, vertices, indices, "quad");
  }

  /**
   * Destroy the mesh buffers
   */
  public destroy(): void {
    this.vertexBuffer.destroy();
    if (this.indexBuffer) {
      this.indexBuffer.destroy();
    }
  }
}

/**
 * Mesh allocator for managing GPU meshes
 * Can be used for buffer pooling in the future
 */
export class MeshAllocator {
  #meshes: Map<string, GpuMesh> = new Map();
  #defaultQuadMesh?: GpuMesh;

  /**
   * Get or create the default quad mesh
   */
  public getDefaultQuad(device: RenderDevice): GpuMesh {
    if (!this.#defaultQuadMesh) {
      this.#defaultQuadMesh = GpuMesh.createQuad(device);
    }
    return this.#defaultQuadMesh;
  }

  /**
   * Add a mesh to the allocator
   */
  public add(key: string, mesh: GpuMesh): void {
    this.#meshes.set(key, mesh);
  }

  /**
   * Get a mesh from the allocator
   */
  public get(key: string): GpuMesh | undefined {
    return this.#meshes.get(key);
  }

  /**
   * Check if a mesh exists
   */
  public has(key: string): boolean {
    return this.#meshes.has(key);
  }

  /**
   * Remove a mesh
   */
  public remove(key: string): void {
    const mesh = this.#meshes.get(key);
    if (mesh) {
      mesh.destroy();
      this.#meshes.delete(key);
    }
  }

  /**
   * Clear all meshes
   */
  public clear(): void {
    for (const mesh of this.#meshes.values()) {
      mesh.destroy();
    }
    this.#meshes.clear();
    if (this.#defaultQuadMesh) {
      this.#defaultQuadMesh.destroy();
      this.#defaultQuadMesh = undefined;
    }
  }
}
