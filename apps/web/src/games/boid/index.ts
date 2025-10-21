/**
 * Boids Flocking Simulation
 *
 * GPU-accelerated implementation of Craig Reynolds' Boids algorithm
 */

export { BoidGamePlugin } from "./boid";
export {
  BoidComputeWorker,
  BoidUpdateShader,
  DEFAULT_BOID_PARAMS,
  boidStructCode,
  type BoidSimParams,
} from "./boid-compute";
