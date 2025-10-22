import { sys, QueryBuilder } from "@atlas/core";
import { LightingSystem } from "../resources/lighting-system";
import { AmbientLight } from "../components/ambient-light";
import { SunLight } from "../components/sun-light";
import { PointLight } from "../components/point-light";
import { SpotLight } from "../components/spot-light";

// Create query builders
const ambientQuery = new QueryBuilder(AmbientLight);
const sunQuery = new QueryBuilder(SunLight);
const pointLightsQuery = new QueryBuilder(PointLight);
const spotLightsQuery = new QueryBuilder(SpotLight);

/**
 * LightingUpdateSystem
 *
 * Updates the LightingSystem resource with all active lights in the scene.
 * Runs every frame in the Update stage before rendering.
 *
 * Responsibilities:
 * - Query all light components (Ambient, Sun, Point, Spot)
 * - Update the LightingSystem resource with current light data
 * - Handle light culling if needed
 * - Mark the system as dirty when lights change
 */
export const lightingUpdateSystem = sys(({ commands }) => {
  const lighting = commands.getResource(LightingSystem);
  if (!lighting) {
    return;
  }

  // Clear previous frame's lights
  lighting.clearPointLights();
  lighting.clearSpotLights();

  // Update ambient light (use first one found, or keep default)
  const ambientResult = commands.query(ambientQuery).tryFind();
  if (ambientResult) {
    const [, ambient] = ambientResult;
    lighting.updateAmbientLight(ambient);
  }

  // Update sun light (use first one found, or disable)
  const sunResult = commands.query(sunQuery).tryFind();
  if (sunResult) {
    const [, sun] = sunResult;
    lighting.updateSunLight(sun);
  } else {
    // Disable sun if no sun light component exists
    lighting.sunDirection[3] = 0; // Set intensity to 0
  }

  // Add all point lights
  for (const [, pointLight] of commands.query(pointLightsQuery).all()) {
    lighting.addPointLight(pointLight);
  }

  // Add all spot lights
  for (const [, spotLight] of commands.query(spotLightsQuery).all()) {
    lighting.addSpotLight(spotLight);
  }

  // Mark as dirty so renderer updates GPU buffers
  lighting.markDirty();
});
