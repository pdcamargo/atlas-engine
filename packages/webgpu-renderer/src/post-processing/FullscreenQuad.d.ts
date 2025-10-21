/**
 * Helper class for rendering full-screen quads in post-processing
 * Creates a simple quad that covers the entire screen
 */
export declare class FullscreenQuad {
    private vertexBuffer;
    private indexBuffer;
    constructor(device: GPUDevice);
    /**
     * Get vertex buffer layout for the fullscreen quad
     */
    static getVertexBufferLayout(): GPUVertexBufferLayout;
    /**
     * Draw the fullscreen quad
     */
    draw(renderPass: GPURenderPassEncoder): void;
    /**
     * Clean up GPU resources
     */
    destroy(): void;
}
//# sourceMappingURL=FullscreenQuad.d.ts.map