import { sys, Time } from "@atlas/core";
import { ParticleEmitter } from "../../particles/ParticleEmitter";

/**
 * System that updates all ParticleEmitter instances in scene graphs
 * Dispatches compute shaders to update particles on GPU
 */
export const particleUpdateSystem = sys(({ commands }) => {
  const time = commands.getResource(Time);
  const deltaTime = time.deltaTime;

  // Get all scene graphs
  const emitters = commands.query(ParticleEmitter).all();

  // Traverse each scene graph to find ParticleEmitter instances
  for (const [, node] of emitters) {
    if (node.isInitialized()) {
      node.update(deltaTime);
    }
  }
}).label("WebgpuRenderer::ParticleUpdate");
