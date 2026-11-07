# Diwali Sky — Courtyard of Light quality rebuild

This update replaces the earlier under-detailed 3D prototype with a more complete procedural Three.js experience. It retains React 19, Vite, Express, pnpm and Render.

## What has been rebuilt

### Scene and detailing
- Deep two-storey Indian courtyard facade with textured plaster, side returns, plinths, cornices, parapet details and a chhatri-inspired roof crown.
- Arch-framed windows with mullions, warm sequential lighting, carved double doors, brass details, moulded columns, balcony railing, marigold toran, wall sconces and sagging festoon lights.
- Textured stone floor with instanced slabs, perimeter inlays and layered rangoli with petals, powder rings and a central lotus.
- Handmade-looking clay diyas with lathed bowls, brass rims, decorative studs, ghee surface, wick, animated flame and local light.
- Paper sky lanterns with polygonal body, ribs, metal rings, burner glow, lift and gentle drift.

### Story and interactions
- The opening scene is a close-up of one unlit diya. The diya itself is the primary click target.
- Clicking it starts audio and ignites the wick; surrounding diyas, house windows, garlands and facade lights illuminate in a timed sequence.
- Camera choreography: close diya → house reveal → rangoli → rising lanterns → sky tilt → fireworks → particle-formed `HAPPY DIWALI`.
- The final personal greeting appears only after the sky text has formed. Skip and replay are supported.
- Sender, recipient and wish are editable; share links use `from`, `to` and `wish` query parameters with Web Share / clipboard fallback.

### Fireworks and audio
- Fireworks now show an actual rocket ascent and trail before the burst. Particles spread, fall under gravity and fade; the boom and crackle sound plays on the burst.
- Ambient music, sound effects and master volume have separate controls.
- Audio starts after user interaction to respect browser autoplay policies.

### Reliability and performance
- Three.js and React Three Fiber load as a lazy scene instead of inflating the first app entry bundle.
- Vite splits React, Three.js and R3F vendor chunks.
- Mobile portrait camera framing is adjusted separately.
- A WebGL2 check and React error boundary provide a readable fallback rather than a blank page.
- Staggered lamp/window timers account for elapsed story time, including when the visitor uses Skip.
- Fixed a major scene-placement bug: the carved door is attached to the actual facade instead of sitting at the courtyard origin.

## Apply in the existing WSL project

Extract this archive to the existing project root with `--strip-components=1`, then run:

```bash
node apply-upgrade.mjs
pnpm install
pnpm run check
pnpm build
```

Updated files:

```text
client/index.html
client/vite.config.js
client/src/App.jsx
client/src/SceneExperience.jsx
client/src/styles.css
render.yaml
```

## Test locally

```bash
pnpm start
```

Open `http://localhost:10000` and test the entire story. Click the central diya, confirm the flame appears, wait for the house reveal, observe the lights and lantern, then verify rocket ascent, burst particles, particle text, greeting personalization, share and replay. Also test a narrow mobile viewport and sound controls.

## Deploy

After the local build and interaction test pass:

```bash
git add -A
git commit -m "Rebuild Diwali Sky courtyard and 3D interactions"
git push origin main
```

Render uses:
- Build: `corepack pnpm install --frozen-lockfile && corepack pnpm build`
- Start: `corepack pnpm start`
- Health: `/health`

## Validation performed for this archive

- JSX syntax transpilation checked for both React entry components.
- Node syntax checks passed for the upgrade script and Vite configuration.
- Archive contents are checked after packaging.
- A complete Vite production build has **not** been run in the archive-generation environment because its npm registry connection is unavailable; run the WSL build commands above before pushing.

## Honest scope

This is a procedural real-time 3D scene, not a photogrammetry scan or a bespoke sculpted asset pack. It has significantly more architectural and interaction detail than the earlier prototype, but material and lighting fidelity still need visual review on the target device. Sound is synthesized with Web Audio rather than prerecorded environmental audio. Browser audio must begin after a user gesture.
