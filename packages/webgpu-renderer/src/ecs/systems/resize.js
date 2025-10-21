import { sys, Viewport } from "@atlas/core";
import { OrthographicCamera, PerspectiveCamera, WebgpuRenderer } from "../..";
export const resize = sys(({ commands }) => {
    const renderer = commands.getResource(WebgpuRenderer);
    const viewport = commands.getResource(Viewport);
    const orthoCameras = commands.query(OrthographicCamera).all();
    const perspectiveCameras = commands.query(PerspectiveCamera).all();
    for (const [, orthoCamera] of orthoCameras) {
        orthoCamera.setAspectRatio(viewport.aspectRatio);
    }
    for (const [, perspectiveCamera] of perspectiveCameras) {
        perspectiveCamera.setAspectRatio(viewport.aspectRatio);
    }
    renderer.resize();
}).label("WebgpuRenderer::resize");
