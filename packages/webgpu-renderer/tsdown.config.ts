import { defineConfig } from "tsdown";

export default defineConfig({
  clean: true,
  format: "esm",
  dts: {
    resolve: ["@webgpu/types", "@atlas/core", /^@types\//],
  },
  outDir: "dist",
  sourcemap: true,
  // WGSL files are now bundled directly via the text loader
  // copy: [
  //   {
  //     from: "./src/**/*.wgsl",
  //     to: "dist",
  //   },
  // ],
  noExternal: ["@atlas/core"],
  loader: {
    ".wgsl": "text",
    ".wasm": "binary",
  },
});
