import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  root: path.resolve(process.cwd(), "client"),
  plugins: [react()],
  build: {
    outDir: "dist",
    emptyOutDir: true,
    sourcemap: false,
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("/node_modules/three/")) return "three-vendor";
          if (id.includes("/node_modules/@react-three/") || id.includes("/node_modules/postprocessing/")) return "r3f-vendor";
          if (id.includes("/node_modules/react-dom/") || id.includes("/node_modules/react/")) return "react-vendor";
        },
      },
    },
  },
  server: {
    host: "0.0.0.0",
    port: 5173,
    strictPort: true,
  },
});
