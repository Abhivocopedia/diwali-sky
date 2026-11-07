# Diwali Sky — 3D courtyard upgrade

This overlay replaces the previous flat fireworks landing page with a WebGL 2 / Three.js experience built on React Three Fiber.

## Experience sequence

1. A dark courtyard opens on one unlit clay diya. The visitor taps it to begin.
2. A flame appears, warm light spreads, and other diyas illuminate in sequence.
3. The camera pulls back to reveal a two-storey heritage courtyard home, lit windows, balcony, festoon lights and trees.
4. A detailed rangoli sits among the lamps. Sky lanterns rise as the camera moves towards the sky.
5. Procedural particle fireworks and synthesized launch/boom/crackle audio build towards the reveal.
6. Golden greeting typography appears with a sender name and editable wish. The visitor can share a personalized URL.

## Visual direction

The scene uses a distinct midnight-plum, peacock-teal, copper and antique-gold palette. Its architecture and layout are original; it takes the interactive storytelling structure from the supplied reference video rather than copying its exact design.

## Apply to existing project

Copy the overlay contents into the existing Diwali project root, then run:

```bash
node apply-upgrade.mjs
pnpm install
pnpm run check
pnpm build
```

The dependency versions are selected for React 19 compatibility: React Three Fiber 9 pairs with React 19. The postprocessing package provides Bloom and Vignette effects.

## Personalised share URLs

The final greeting reads optional query parameters:

- `from` — sender name
- `to` — recipient name
- `wish` — message (up to 100 characters)

Example:

```text
https://your-render-domain.onrender.com/?from=Abhi&to=Friends&wish=May%20your%20days%20be%20bright
```

The personalization panel edits the greeting and the Share button generates a link with the selected values.

## Performance and browser support

- WebGL 2 is required for the interactive 3D scene.
- Device pixel ratio is capped at 1.45 to avoid excessive GPU load on high-density screens.
- Fireworks use batched point particles rather than hundreds of individual mesh objects.
- Fireworks audio and ambient music are synthesized in the browser with the Web Audio API. No copyrighted song or external audio asset is bundled.
- Browsers require a user gesture before audio playback.
- If WebGL 2 is unavailable, a clear fallback message is shown.

## Render

The included `render.yaml` uses Corepack to invoke the pinned pnpm version, installs from the lockfile, builds the Vite app and starts the Express server.
