import fs from "node:fs";

const packagePath = "package.json";
if (!fs.existsSync(packagePath)) {
  throw new Error("Run this script from the Diwali project root.");
}

const pkg = JSON.parse(fs.readFileSync(packagePath, "utf8"));
pkg.dependencies ||= {};
delete pkg.dependencies.three;
delete pkg.dependencies["@react-three/fiber"];
delete pkg.dependencies["@react-three/postprocessing"];
delete pkg.dependencies["grand-fireworks-js"];
pkg.packageManager = "pnpm@9.15.9";
pkg.engines = { ...(pkg.engines || {}), node: ">=20 <25" };
pkg.scripts ||= {};
pkg.scripts.build = "pnpm run build:client";
pkg.scripts["build:client"] = "vite build --config client/vite.config.js";
pkg.scripts.start = "node server.js";
pkg.scripts.check = "node --check server.js";
pkg.scripts.dev = 'concurrently "pnpm run dev:server" "pnpm run dev:client"';
pkg.scripts["dev:server"] ||= "node --watch server.js";
pkg.scripts["dev:client"] ||= "vite --host 0.0.0.0";
fs.writeFileSync(packagePath, JSON.stringify(pkg, null, 2) + "\n");

// The new experience uses one Canvas 2D renderer; remove the old WebGL scene.
const legacyScene = "client/src/SceneExperience.jsx";
if (fs.existsSync(legacyScene)) fs.rmSync(legacyScene);

// Avoid Three.js-specific manual chunks after removing the WebGL dependencies.
const viteConfig = `import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  root: path.resolve(process.cwd(), "client"),
  plugins: [react()],
  build: {
    outDir: "dist",
    emptyOutDir: true,
    sourcemap: false,
    minify: "esbuild",
  },
  server: {
    host: "0.0.0.0",
    port: 5173,
    strictPort: true,
  },
});
`;
fs.writeFileSync("client/vite.config.js", viteConfig);

// Refresh document metadata and leave all app behaviour in React.
const htmlPath = "client/index.html";
if (fs.existsSync(htmlPath)) {
  let html = fs.readFileSync(htmlPath, "utf8");
  html = html.replace(/<meta name="theme-color" content="[^"]*"\s*\/?\s*>/i, '<meta name="theme-color" content="#101221" />');
  html = html.replace(/<meta name="description" content="[^"]*"\s*\/?\s*>/i, '<meta name="description" content="A smooth animated Deepavali celebration with glowing diyas, lanterns and fireworks." />');
  html = html.replace(/<title>.*?<\/title>/i, "<title>Diwali Sky — Wishing You a Happy Deepavali</title>");
  fs.writeFileSync(htmlPath, html);
}

console.log("Applied the smooth, lightweight Deepavali experience.");
console.log("Removed sender, recipient, custom wish, share and WebGL/Three.js dependencies.");
console.log("The experience now uses a single capped-DPR Canvas 2D animation loop.");
console.log("Next: pnpm install, pnpm run check, pnpm build.");
