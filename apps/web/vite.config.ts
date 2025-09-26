import { defineConfig } from "vite";
import wasm from "vite-plugin-wasm";
import topLevelAwait from "vite-plugin-top-level-await";

export default defineConfig({
  plugins: [wasm(), topLevelAwait()],
  // If you are importing a wasm-pack generated package from node_modules,
  // you might need to exclude it from Vite's dependency optimization.
  optimizeDeps: {
    exclude: ["@dimforge/rapier2d"],
  },
});
