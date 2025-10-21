/**
 * Conway's Game of Life - Compute Shader Example
 *
 * This example demonstrates a complete Game of Life simulation using compute shaders:
 * - Ping-pong buffer pattern (current state → next state)
 * - 2D grid processing with workgroups
 * - Neighbor counting algorithm
 * - Multi-pass pattern for state swapping
 *
 * Rules of Conway's Game of Life:
 * 1. Any live cell with 2-3 live neighbors survives
 * 2. Any dead cell with exactly 3 live neighbors becomes alive
 * 3. All other cells die or stay dead
 */
/**
 * Example usage - Run multiple generations
 */
export declare function runGameOfLifeExample(device: GPUDevice): Promise<void>;
/**
 * Create a known pattern (glider)
 */
export declare function runGliderExample(device: GPUDevice): Promise<void>;
//# sourceMappingURL=game-of-life.d.ts.map