# Diwali Sky — Smooth Deepavali upgrade

This upgrade intentionally simplifies the visitor experience. It removes sender and recipient names, personal messages, share-link controls, the settings panel and the previous WebGL scene.

## Experience

- A close-up diya invites the visitor to tap to begin.
- A single animation timeline lights the diya, pulls the camera back to reveal a decorated courtyard, brings up the house lights, raises three lanterns and launches a short fireworks sequence.
- The closing wish is simply **Wishing You a Happy Deepavali**.
- Replay restarts the scene. A single sound control toggles the original procedural ambient music and effects.

## Rendering changes

- Replaces the WebGL / React Three Fiber scene with one Canvas 2D renderer. This avoids GPU/WebGL setup failures and reduces rendering overhead on mobile devices.
- Uses one `requestAnimationFrame` loop; no React state updates per frame.
- Caps device pixel ratio to 1.15 on narrow screens and 1.35 elsewhere.
- Uses a single drawing surface and batched paths instead of hundreds of independent scene objects/lights.
- Pauses the animation loop while the tab is hidden.
- Camera movement is time-based and eased, so animation duration does not depend on frame rate.

## Apply in the existing WSL project

Extract this archive into the existing project root with `--strip-components=1`, then run:

```bash
node apply-upgrade.mjs
pnpm install
pnpm run check
pnpm build
```

The install step updates `pnpm-lock.yaml` and removes unused Three.js dependencies.

## Local production preview

```bash
pnpm start
```

Open `http://localhost:10000`. Tap the diya and allow the sequence to finish. Audio begins only after the visitor interacts with the page, due to browser autoplay restrictions.

## Deploy

After local testing:

```bash
git add -A
git commit -m "Simplify Diwali Sky with smooth Deepavali animation"
git push origin main
```

Render uses the existing `render.yaml` commands and will redeploy from `main` when auto-deploy is enabled.

## Validation

This archive includes complete replacement source files and the dependency cleanup script. Run the production build in WSL after extraction; no production-build success is claimed until that command passes in the target environment.
