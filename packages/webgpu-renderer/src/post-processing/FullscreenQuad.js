/**
 * Helper class for rendering full-screen quads in post-processing
 * Creates a simple quad that covers the entire screen
 */
export class FullscreenQuad {
    vertexBuffer;
    indexBuffer;
    constructor(device) {
        // Full-screen quad vertices (2 triangles)
        // Positions in NDC space (-1 to 1) and UVs (0 to 1)
        const vertices = new Float32Array([
            // Position (x, y)  UV (u, v)
            -1.0, -1.0, 0.0, 1.0, // Bottom-left
            1.0, -1.0, 1.0, 1.0, // Bottom-right
            1.0, 1.0, 1.0, 0.0, // Top-right
            -1.0, 1.0, 0.0, 0.0, // Top-left
        ]);
        const indices = new Uint16Array([
            0, 1, 2, // First triangle
            0, 2, 3, // Second triangle
        ]);
        // Create vertex buffer
        this.vertexBuffer = device.createBuffer({
            size: vertices.byteLength,
            usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
            label: "Fullscreen Quad Vertex Buffer",
        });
        device.queue.writeBuffer(this.vertexBuffer, 0, vertices);
        // Create index buffer
        this.indexBuffer = device.createBuffer({
            size: indices.byteLength,
            usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
            label: "Fullscreen Quad Index Buffer",
        });
        device.queue.writeBuffer(this.indexBuffer, 0, indices);
    }
    /**
     * Get vertex buffer layout for the fullscreen quad
     */
    static getVertexBufferLayout() {
        return {
            arrayStride: 16, // 4 floats * 4 bytes
            attributes: [
                {
                    // Position
                    shaderLocation: 0,
                    offset: 0,
                    format: "float32x2",
                },
                {
                    // UV
                    shaderLocation: 1,
                    offset: 8,
                    format: "float32x2",
                },
            ],
        };
    }
    /**
     * Draw the fullscreen quad
     */
    draw(renderPass) {
        renderPass.setVertexBuffer(0, this.vertexBuffer);
        renderPass.setIndexBuffer(this.indexBuffer, "uint16");
        renderPass.drawIndexed(6); // 6 indices (2 triangles)
    }
    /**
     * Clean up GPU resources
     */
    destroy() {
        this.vertexBuffer.destroy();
        this.indexBuffer.destroy();
    }
}
