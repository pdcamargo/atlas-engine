import { sys } from "@atlas/core";
import { WebgpuRenderer } from "../../renderer/Renderer";
import { OrthographicCamera, PerspectiveCamera } from "../../renderer/Camera";
import { SceneGraph } from "../../renderer/SceneGraph";
export const render = sys(({ commands }) => {
    const renderer = commands.getResource(WebgpuRenderer);
    const sceneGraphs = commands.query(SceneGraph).all();
    const orthoCameras = commands.query(OrthographicCamera).all();
    const perspectiveCameras = commands.query(PerspectiveCamera).all();
    if (sceneGraphs.length === 0 &&
        orthoCameras.length === 0 &&
        perspectiveCameras.length === 0) {
        return;
    }
    for (const [, sceneGraph] of sceneGraphs) {
        for (const [, orthoCamera] of orthoCameras) {
            renderer.render(orthoCamera, sceneGraph);
        }
        for (const [, perspectiveCamera] of perspectiveCameras) {
            renderer.render(perspectiveCamera, sceneGraph);
        }
    }
}).label("WebgpuRenderer::Render");
