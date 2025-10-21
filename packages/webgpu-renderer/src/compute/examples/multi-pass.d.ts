/**
 * Multi-Pass Compute Example
 *
 * This example demonstrates chaining multiple compute passes:
 * - First pass: Add a value to each input element
 * - Second pass: Multiply each element by itself (square)
 *
 * The output of the first pass becomes the input of the second pass
 * without copying data back to the CPU in between.
 *
 * Input: [1, 2, 3, 4]
 * After first pass: [1+3, 2+3, 3+3, 4+3] = [4, 5, 6, 7]
 * After second pass: [4*4, 5*5, 6*6, 7*7] = [16, 25, 36, 49]
 */
/**
 * Example usage
 */
export declare function runMultiPassExample(device: GPUDevice): Promise<void>;
//# sourceMappingURL=multi-pass.d.ts.map