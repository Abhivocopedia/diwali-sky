# Diwali Sky

A cinematic, interactive Diwali greeting experience built with **React + Vite + Node.js/Express**.

## What is included

- **Grand Fireworks JS 1.10.0** — WebGL 2-first fireworks renderer with Canvas 2D fallback, cinematic shell style, rocket exhaust, persistent trails, bloom, explosion flashes, secondary crackles, and a choreographed grand finale.
- Tap/click anywhere in the sky to launch a rocket toward that point.
- Custom colour palettes, pause/resume, clear sky, and a finale control.
- Custom sky-message fireworks (type a short wish in the settings panel).
- Original procedural ambient music generated with the Web Audio API (tanpura-like drone and bell tones; no external music file or copyrighted track).
- Procedural firework sound effects from the fireworks engine (launch whistles, booms, crackles). Both audio systems start only after a user gesture because browsers block audible autoplay.
- Responsive Diwali-inspired scene with moonlight, stars, temple silhouettes, rangoli, and diyas.
- Express production server, health endpoint, compression, basic security headers, and Render Blueprint.

## Requirements

- Node.js 20+
- npm 10+

## Run locally

```bash
npm install
npm run dev
```

Vite runs at `http://localhost:5173`; Express runs at `http://localhost:10000`.

## Production build

```bash
npm install
npm run build
npm start
```

Open `http://localhost:10000`.

## Deploy to Render

### Blueprint (recommended)

1. Push this project to a GitHub repository.
2. In Render, choose **New + → Blueprint**.
3. Connect the repository and let Render read `render.yaml`.
4. Render installs dependencies, builds the Vite app, and starts Express.

### Manual Web Service

- Runtime: **Node**
- Build command: `npm install && npm run build`
- Start command: `npm start`
- Health check path: `/health`
- Node version: `20` or newer

The server listens on Render's `PORT` environment variable and binds to `0.0.0.0`.

## Audio notes

- Firework sound is generated procedurally by Grand Fireworks JS; no audio assets need to be uploaded.
- Ambient music is an original, lightweight Web Audio composition generated in the browser.
- Sound and music are separate toggles. Use the settings panel volume slider to adjust the master ambience volume; firework sound has its own engine-level volume.
- Browsers require a tap/click before audible playback. This is expected browser behaviour, not a deployment bug.
- The initial show is intentionally not auto-started. Visitors press **LIGHT UP THE SKY** or tap the sky.

## Performance

The fireworks engine uses adaptive rendering and pauses work when the page is hidden/offscreen. The configured DPR cap helps avoid excessive GPU load on high-density mobile displays. If you need a lighter mode for low-end devices, change `performance.preset` from `high` to `medium` in `client/src/App.jsx`.

## Main files

```text
client/
  index.html
  vite.config.js
  src/
    App.jsx
    main.jsx
    styles.css
server.js
render.yaml
package.json
```

## Notes

- No backend database or secrets are required; this is a self-contained celebration microsite.
- Keep the `grand-fireworks-js` version pinned unless you intentionally test a newer release.
- The fireworks package is MIT-licensed. Review its upstream documentation and licence before redistributing modifications.

## References

- Grand Fireworks JS: https://github.com/travisjmac/grand-fireworks-js
- Grand Fireworks documentation: https://travisjmac.github.io/grand-fireworks-js/
- Vite: https://vite.dev/
- Render Node web services: https://render.com/docs/web-services
