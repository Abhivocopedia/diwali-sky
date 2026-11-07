import fs from "node:fs";

const packagePath = "package.json";
if (!fs.existsSync(packagePath)) {
  throw new Error("Run this script from the Diwali project root.");
}

const pkg = JSON.parse(fs.readFileSync(packagePath, "utf8"));
pkg.dependencies ||= {};
delete pkg.dependencies["grand-fireworks-js"];
pkg.dependencies.three = "0.187.0";
pkg.dependencies["@react-three/fiber"] = "9.8.2";
pkg.dependencies["@react-three/postprocessing"] = "3.2.2";
pkg.packageManager = "pnpm@9.15.9";
pkg.engines = { ...(pkg.engines || {}), node: ">=20 <25" };
pkg.scripts ||= {};
pkg.scripts.dev = 'concurrently "pnpm run dev:server" "pnpm run dev:client"';
pkg.scripts["dev:server"] ||= "node --watch server.js";
pkg.scripts["dev:client"] ||= "vite --host 0.0.0.0";
pkg.scripts.build = "pnpm run build:client";
pkg.scripts["build:client"] = "vite build --config client/vite.config.js";
pkg.scripts.start = "node server.js";
pkg.scripts.check = "node --check server.js";

fs.writeFileSync(packagePath, JSON.stringify(pkg, null, 2) + "\n");
console.log("Diwali Sky quality upgrade configured.");
console.log("3D renderer: Three.js 0.187.0 + React Three Fiber 9.8.2");
console.log("The old fireworks package has been removed; the scene now owns rocket and particle simulation.");
console.log("Next: pnpm install, then pnpm build.");
