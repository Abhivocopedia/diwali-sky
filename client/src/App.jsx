import React, { useCallback, useEffect, useRef, useState } from "react";
import "./styles.css";

const TAU = Math.PI * 2;
const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = (value) => {
  const t = clamp(value);
  return t * t * (3 - 2 * t);
};
const easeInOut = (value) => {
  const t = clamp(value);
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
};

function gradient(ctx, x0, y0, r0, x1, y1, r1, stops) {
  const g = ctx.createRadialGradient(x0, y0, r0, x1, y1, r1);
  for (const [offset, color] of stops) g.addColorStop(offset, color);
  return g;
}

function glow(ctx, x, y, radius, color, alpha = 1) {
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.globalAlpha = alpha;
  ctx.fillStyle = gradient(ctx, x, y, 0, x, y, radius, [
    [0, color], [0.22, color], [1, "rgba(255,160,70,0)"]
  ]);
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, TAU);
  ctx.fill();
  ctx.restore();
}

function seeded(seed) {
  let value = seed >>> 0;
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 4294967296;
  };
}

const stars = Array.from({ length: 105 }, (_, index) => {
  const random = seeded(index + 47);
  return {
    x: random(), y: random() * 0.62, r: 0.45 + random() * 1.15,
    phase: random() * TAU, speed: 0.5 + random() * 1.1,
    alpha: 0.18 + random() * 0.42
  };
});

const fireworkSpecs = Array.from({ length: 6 }, (_, index) => {
  const random = seeded(910 + index * 71);
  const particles = Array.from({ length: 74 }, () => {
    const angle = random() * TAU;
    const speed = 58 + random() * 152;
    return {
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: 0.75 + random() * 1.8,
      alpha: 0.42 + random() * 0.58,
      delay: random() * 0.12
    };
  });
  return {
    x: 0.16 + random() * 0.68,
    y: 0.16 + random() * 0.17,
    hue: [39, 23, 168, 354, 48, 188][index],
    launchAt: 14.2 + index * 1.42,
    flight: 0.82 + random() * 0.22,
    particles
  };
});

function roundedRect(ctx, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
}

function drawFlame(ctx, x, y, scale, time, strength = 1) {
  const flicker = 1 + Math.sin(time * 12.5 + x * 0.03) * 0.055 + Math.sin(time * 19 + y) * 0.025;
  const width = scale * 0.46 * flicker;
  const height = scale * (1.12 + Math.sin(time * 8.2 + x) * 0.07);
  glow(ctx, x, y - height * 0.4, scale * 3.1, "rgba(255,164,73,0.22)", strength);
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(width, height);
  const outer = ctx.createRadialGradient(0, -0.55, 0.02, 0, -0.4, 0.72);
  outer.addColorStop(0, "#fff7d2");
  outer.addColorStop(0.24, "#ffe09a");
  outer.addColorStop(0.62, "#ff9a3e");
  outer.addColorStop(1, "rgba(231,79,32,0)");
  ctx.fillStyle = outer;
  ctx.beginPath();
  ctx.moveTo(0, 0.42);
  ctx.bezierCurveTo(-0.62, -0.05, -0.2, -0.76, 0.08, -1.25);
  ctx.bezierCurveTo(0.18, -0.76, 0.68, -0.35, 0, 0.42);
  ctx.fill();
  ctx.fillStyle = "rgba(255,249,218,0.88)";
  ctx.beginPath();
  ctx.moveTo(0, 0.3);
  ctx.bezierCurveTo(-0.18, -0.04, -0.1, -0.48, 0.08, -0.72);
  ctx.bezierCurveTo(0.22, -0.36, 0.2, 0.02, 0, 0.3);
  ctx.fill();
  ctx.restore();
}

function drawDiya(ctx, x, y, size, time, lit, hero = false) {
  const flicker = 0.96 + Math.sin(time * 8 + x) * 0.035;
  if (lit) glow(ctx, x, y - size * 0.28, size * (hero ? 4.3 : 2.5), "rgba(255,157,68,0.16)", 1);
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(size / 100, size / 100);
  ctx.shadowColor = lit ? "rgba(255,150,65,0.38)" : "transparent";
  ctx.shadowBlur = lit ? 20 : 0;
  const bowl = ctx.createLinearGradient(0, -7, 0, 31);
  bowl.addColorStop(0, "#e6a35f");
  bowl.addColorStop(0.28, "#b9633e");
  bowl.addColorStop(0.7, "#733b31");
  bowl.addColorStop(1, "#3e2630");
  ctx.fillStyle = bowl;
  ctx.beginPath();
  ctx.moveTo(-48, -7);
  ctx.bezierCurveTo(-38, 9, -22, 30, 0, 31);
  ctx.bezierCurveTo(22, 30, 38, 9, 48, -7);
  ctx.quadraticCurveTo(0, 11, -48, -7);
  ctx.fill();
  ctx.lineWidth = 4.5;
  ctx.strokeStyle = "#f0be79";
  ctx.beginPath();
  ctx.moveTo(-48, -7);
  ctx.quadraticCurveTo(0, 11, 48, -7);
  ctx.stroke();
  ctx.lineWidth = 1.2;
  ctx.strokeStyle = "rgba(255,222,165,0.48)";
  ctx.beginPath();
  ctx.moveTo(-34, -3); ctx.quadraticCurveTo(0, 12, 34, -3);
  ctx.stroke();
  ctx.fillStyle = "#34252b";
  ctx.beginPath();
  ctx.ellipse(0, -5, 34, 7, 0, 0, TAU);
  ctx.fill();
  if (lit) {
    ctx.fillStyle = "#df9c55";
    ctx.beginPath();
    ctx.ellipse(0, -7, 30, 5.4, 0, 0, TAU);
    ctx.fill();
  }
  ctx.strokeStyle = "#2b2029";
  ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(0, -7); ctx.lineTo(2, -21); ctx.stroke();
  ctx.strokeStyle = "#dcb27a";
  ctx.lineWidth = 1.4;
  ctx.beginPath(); ctx.moveTo(-30, 3); ctx.quadraticCurveTo(0, 34, 30, 3); ctx.stroke();
  ctx.restore();
  if (lit) drawFlame(ctx, x + size * 0.018, y - size * 0.26, size * (hero ? 0.38 : 0.24) * flicker, time, hero ? 1 : 0.78);
  else if (hero) {
    const pulse = 0.18 + (Math.sin(time * 2.8) + 1) * 0.06;
    glow(ctx, x, y - size * 0.23, size * 1.5, "rgba(255,196,115,0.22)", pulse);
  }
}

function drawArchWindow(ctx, x, y, width, height, lit, time) {
  const radius = width * 0.5;
  ctx.save();
  ctx.shadowColor = lit ? "rgba(255,177,92,0.58)" : "transparent";
  ctx.shadowBlur = lit ? 25 : 0;
  ctx.fillStyle = "#241b2a";
  ctx.beginPath();
  ctx.moveTo(x - width / 2, y + height);
  ctx.lineTo(x - width / 2, y + radius);
  ctx.arc(x, y + radius, radius, Math.PI, 0);
  ctx.lineTo(x + width / 2, y + height);
  ctx.closePath();
  ctx.fill();
  const glass = ctx.createLinearGradient(x, y, x, y + height);
  glass.addColorStop(0, lit ? "#ffd89a" : "#302537");
  glass.addColorStop(1, lit ? "#a85c39" : "#171521");
  ctx.fillStyle = glass;
  ctx.beginPath();
  ctx.moveTo(x - width * 0.39, y + height * 0.92);
  ctx.lineTo(x - width * 0.39, y + radius);
  ctx.arc(x, y + radius, width * 0.39, Math.PI, 0);
  ctx.lineTo(x + width * 0.39, y + height * 0.92);
  ctx.closePath();
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = "#d9b58b";
  ctx.lineWidth = Math.max(2, width * 0.055);
  ctx.beginPath();
  ctx.moveTo(x - width * 0.47, y + height);
  ctx.lineTo(x - width * 0.47, y + radius);
  ctx.arc(x, y + radius, width * 0.47, Math.PI, 0);
  ctx.lineTo(x + width * 0.47, y + height);
  ctx.stroke();
  ctx.strokeStyle = "rgba(100,60,55,0.9)";
  ctx.lineWidth = Math.max(1, width * 0.018);
  ctx.beginPath(); ctx.moveTo(x, y + radius * 0.15); ctx.lineTo(x, y + height); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x - width * 0.38, y + height * 0.62); ctx.lineTo(x + width * 0.38, y + height * 0.62); ctx.stroke();
  ctx.fillStyle = "#dcb681";
  ctx.fillRect(x - width * 0.57, y + height - 2, width * 1.14, Math.max(4, width * 0.08));
  if (lit) glow(ctx, x, y + height * 0.5, width * 0.82, "rgba(255,174,95,0.13)", 1 + Math.sin(time * 3 + x) * 0.08);
  ctx.restore();
}

function drawHouse(ctx, cx, groundY, s, reveal, time) {
  const width = 690 * s;
  const left = cx - width / 2;
  const top = groundY - 478 * s;
  const height = 385 * s;
  const wall = ctx.createLinearGradient(left, top, left + width, top + height);
  wall.addColorStop(0, "#61404a");
  wall.addColorStop(0.48, "#8b5d58");
  wall.addColorStop(1, "#533846");
  ctx.save();
  ctx.shadowColor = "rgba(7,5,14,0.5)";
  ctx.shadowBlur = 32 * s;
  ctx.fillStyle = wall;
  roundedRect(ctx, left, top + 72 * s, width, height - 70 * s, 8 * s);
  ctx.fill();
  ctx.shadowBlur = 0;
  // Lower plinth and layered cornices.
  ctx.fillStyle = "#382b3b";
  ctx.fillRect(left - 14 * s, groundY - 103 * s, width + 28 * s, 27 * s);
  ctx.fillStyle = "#c28b68";
  ctx.fillRect(left - 21 * s, groundY - 113 * s, width + 42 * s, 9 * s);
  ctx.fillStyle = "#dfbd91";
  ctx.fillRect(left - 14 * s, groundY - 119 * s, width + 28 * s, 5 * s);
  // Upper floor band and roof cornice.
  ctx.fillStyle = "#d0a57d";
  ctx.fillRect(left - 11 * s, top + 206 * s, width + 22 * s, 12 * s);
  ctx.fillStyle = "#4a303d";
  ctx.fillRect(left - 17 * s, top + 216 * s, width + 34 * s, 17 * s);
  ctx.fillStyle = "#d6b28c";
  ctx.fillRect(left - 20 * s, top + 58 * s, width + 40 * s, 14 * s);
  ctx.fillStyle = "#7b514d";
  ctx.fillRect(left - 10 * s, top + 47 * s, width + 20 * s, 11 * s);
  // Carved roof silhouette.
  ctx.fillStyle = "#392a3a";
  ctx.beginPath();
  ctx.moveTo(left - 38 * s, top + 72 * s);
  ctx.lineTo(cx - 250 * s, top + 7 * s);
  ctx.quadraticCurveTo(cx, top - 25 * s, cx + 250 * s, top + 7 * s);
  ctx.lineTo(left + width + 38 * s, top + 72 * s);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "#d4a779";
  ctx.lineWidth = 5 * s;
  ctx.beginPath();
  ctx.moveTo(left - 27 * s, top + 69 * s);
  ctx.quadraticCurveTo(cx, top - 19 * s, left + width + 27 * s, top + 69 * s);
  ctx.stroke();
  ctx.fillStyle = "#bd865e";
  ctx.beginPath();
  ctx.arc(cx, top - 10 * s, 13 * s, 0, TAU);
  ctx.fill();
  ctx.fillRect(cx - 2.5 * s, top - 36 * s, 5 * s, 27 * s);
  ctx.beginPath(); ctx.arc(cx, top - 39 * s, 5 * s, 0, TAU); ctx.fill();
  // Side pilasters and capital details.
  for (const x of [left + 26 * s, left + width - 26 * s]) {
    ctx.fillStyle = "#d2ad87";
    ctx.fillRect(x - 9 * s, top + 80 * s, 18 * s, 275 * s);
    ctx.fillStyle = "#a7735e";
    ctx.fillRect(x - 15 * s, top + 78 * s, 30 * s, 8 * s);
    ctx.fillRect(x - 14 * s, top + 350 * s, 28 * s, 9 * s);
  }
  // Four arched windows; their light comes up with the reveal.
  const windowY = top + 91 * s;
  const windowW = 72 * s;
  const windowH = 104 * s;
  const windowXs = [left + 117 * s, left + 257 * s, left + width - 257 * s, left + width - 117 * s];
  windowXs.forEach((x, index) => drawArchWindow(ctx, x, windowY, windowW, windowH, reveal > 0.23 + index * 0.055, time));
  const lowerY = top + 242 * s;
  [left + 110 * s, left + width - 110 * s].forEach((x, index) => drawArchWindow(ctx, x, lowerY, 84 * s, 112 * s, reveal > 0.46 + index * 0.05, time));
  // Central double door and carved border.
  const doorX = cx - 73 * s;
  const doorY = groundY - 294 * s;
  const doorW = 146 * s;
  const doorH = 187 * s;
  ctx.fillStyle = "#291e2b";
  ctx.fillRect(doorX - 12 * s, doorY - 8 * s, doorW + 24 * s, doorH + 12 * s);
  ctx.fillStyle = "#bd956d";
  ctx.fillRect(doorX - 7 * s, doorY - 5 * s, doorW + 14 * s, doorH + 8 * s);
  const door = ctx.createLinearGradient(doorX, doorY, doorX + doorW, doorY + doorH);
  door.addColorStop(0, "#633b39"); door.addColorStop(0.5, "#8c5640"); door.addColorStop(1, "#4b3039");
  ctx.fillStyle = door;
  ctx.fillRect(doorX, doorY, doorW, doorH);
  ctx.strokeStyle = "#d8ad78";
  ctx.lineWidth = 2.5 * s;
  ctx.strokeRect(doorX + 8 * s, doorY + 9 * s, doorW - 16 * s, doorH - 18 * s);
  ctx.strokeRect(doorX + 17 * s, doorY + 18 * s, doorW - 34 * s, doorH - 36 * s);
  ctx.beginPath(); ctx.moveTo(cx, doorY); ctx.lineTo(cx, doorY + doorH); ctx.stroke();
  for (const x of [doorX + 15 * s, doorX + doorW - 15 * s]) {
    ctx.fillStyle = "#edc27c";
    ctx.beginPath(); ctx.arc(x, doorY + doorH * 0.52, 3.2 * s, 0, TAU); ctx.fill();
  }
  // Balcony rail, upper balusters, and floral toran.
  ctx.fillStyle = "#47303b";
  ctx.fillRect(left + 202 * s, top + 200 * s, width - 404 * s, 9 * s);
  ctx.fillStyle = "#d9b58a";
  ctx.fillRect(left + 202 * s, top + 169 * s, width - 404 * s, 5 * s);
  for (let i = 0; i < 17; i += 1) {
    const x = left + (215 + i * 16.2) * s;
    ctx.fillRect(x, top + 174 * s, 2.2 * s, 30 * s);
    ctx.fillStyle = i % 2 ? "#d7ae79" : "#b98468";
    ctx.beginPath(); ctx.arc(x + s, top + 174 * s, 2.6 * s, 0, TAU); ctx.fill();
    ctx.fillStyle = "#d9b58a";
  }
  ctx.strokeStyle = "#b77a4f";
  ctx.lineWidth = 2.6 * s;
  ctx.beginPath(); ctx.moveTo(cx - 83 * s, doorY + 4 * s); ctx.quadraticCurveTo(cx, doorY + 45 * s, cx + 83 * s, doorY + 4 * s); ctx.stroke();
  for (let i = 0; i < 11; i += 1) {
    const p = i / 10;
    const x = lerp(cx - 83 * s, cx + 83 * s, p);
    const y = doorY + 4 * s + Math.sin(p * Math.PI) * 41 * s;
    ctx.fillStyle = i % 2 ? "#e7a84f" : "#d77d50";
    ctx.beginPath(); ctx.arc(x, y, (3.2 + (i % 3) * 0.6) * s, 0, TAU); ctx.fill();
    ctx.fillStyle = "#496a50";
    ctx.fillRect(x - 1 * s, y - 6 * s, 2 * s, 4 * s);
  }
  // Festoon lights along the roofline.
  ctx.strokeStyle = "rgba(33,24,34,0.8)";
  ctx.lineWidth = 1.5 * s;
  ctx.beginPath();
  ctx.moveTo(left + 18 * s, top + 70 * s);
  ctx.quadraticCurveTo(cx, top + 116 * s, left + width - 18 * s, top + 70 * s);
  ctx.stroke();
  for (let i = 0; i < 29; i += 1) {
    const p = i / 28;
    const x = lerp(left + 18 * s, left + width - 18 * s, p);
    const y = top + 70 * s + Math.sin(p * Math.PI) * 46 * s;
    const pulse = 0.7 + Math.sin(time * 2.5 + i * 0.72) * 0.18;
    ctx.fillStyle = ["#f3c778", "#e98c64", "#7ac1a7"][i % 3];
    ctx.globalAlpha = reveal * pulse;
    ctx.beginPath(); ctx.arc(x, y, 2.2 * s, 0, TAU); ctx.fill();
    glow(ctx, x, y, 12 * s, "rgba(255,188,111,0.22)", reveal * 0.55);
  }
  ctx.globalAlpha = 1;
  ctx.restore();
}

function drawRangoli(ctx, x, y, radius, time) {
  ctx.save();
  ctx.translate(x, y);
  const colors = ["#d68c79", "#d9b46f", "#5e9a8b", "#ebd8b6", "#a87891"];
  ctx.globalAlpha = 0.92;
  ctx.fillStyle = "rgba(24,19,30,0.56)";
  ctx.beginPath(); ctx.arc(0, 0, radius * 1.07, 0, TAU); ctx.fill();
  for (let ring = 0; ring < 5; ring += 1) {
    ctx.strokeStyle = ring % 2 ? "#e2bd7d" : "#76a99b";
    ctx.lineWidth = Math.max(1.2, radius * 0.018);
    ctx.beginPath(); ctx.arc(0, 0, radius * (0.28 + ring * 0.17), 0, TAU); ctx.stroke();
  }
  for (let i = 0; i < 16; i += 1) {
    const angle = (i / 16) * TAU + time * 0.012;
    ctx.save(); ctx.rotate(angle);
    const petalGradient = ctx.createLinearGradient(0, -radius * 0.2, 0, -radius * 0.88);
    petalGradient.addColorStop(0, colors[i % colors.length]);
    petalGradient.addColorStop(1, "#f5dcae");
    ctx.fillStyle = petalGradient;
    ctx.beginPath();
    ctx.moveTo(0, -radius * 0.2);
    ctx.bezierCurveTo(radius * 0.25, -radius * 0.45, radius * 0.18, -radius * 0.78, 0, -radius * 0.91);
    ctx.bezierCurveTo(-radius * 0.18, -radius * 0.78, -radius * 0.25, -radius * 0.45, 0, -radius * 0.2);
    ctx.fill();
    ctx.strokeStyle = "rgba(255,239,204,0.72)"; ctx.lineWidth = Math.max(0.8, radius * 0.009); ctx.stroke();
    ctx.restore();
  }
  for (let i = 0; i < 48; i += 1) {
    const angle = i / 48 * TAU;
    const r = radius * (0.62 + (i % 2) * 0.08);
    ctx.fillStyle = i % 2 ? "#f0cc8b" : "#93c4ac";
    ctx.beginPath(); ctx.arc(Math.cos(angle) * r, Math.sin(angle) * r, Math.max(1, radius * 0.018), 0, TAU); ctx.fill();
  }
  const centre = ctx.createRadialGradient(0, 0, 0, 0, 0, radius * 0.28);
  centre.addColorStop(0, "#fff0c5"); centre.addColorStop(0.42, "#dca45e"); centre.addColorStop(1, "#6d4d56");
  ctx.fillStyle = centre; ctx.beginPath(); ctx.arc(0, 0, radius * 0.22, 0, TAU); ctx.fill();
  ctx.restore();
}

function drawLantern(ctx, x, y, size, time, index, start) {
  const age = time - start;
  if (age < 0 || age > 10) return;
  const rise = easeInOut(clamp(age / 8));
  const bob = Math.sin(time * 1.2 + index * 2.1) * size * 0.025;
  const px = x + Math.sin(time * 0.32 + index) * size * 0.12;
  const py = y - rise * size * 3.6 + bob;
  const fade = Math.min(1, age * 1.1, (10 - age) * 1.2);
  glow(ctx, px, py, size * 1.45, "rgba(255,156,78,0.18)", fade);
  ctx.save(); ctx.globalAlpha = fade; ctx.translate(px, py);
  const body = ctx.createLinearGradient(-size * 0.45, 0, size * 0.45, 0);
  body.addColorStop(0, "#9f4f38"); body.addColorStop(0.24, "#f1ad66"); body.addColorStop(0.52, "#ffda9a"); body.addColorStop(0.78, "#e68a50"); body.addColorStop(1, "#874435");
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.moveTo(-size * 0.18, -size * 0.58);
  ctx.quadraticCurveTo(-size * 0.46, -size * 0.36, -size * 0.42, size * 0.18);
  ctx.quadraticCurveTo(0, size * 0.5, size * 0.42, size * 0.18);
  ctx.quadraticCurveTo(size * 0.46, -size * 0.36, size * 0.18, -size * 0.58);
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle = "rgba(104,53,43,0.72)"; ctx.lineWidth = Math.max(1, size * 0.025);
  for (let i = -2; i <= 2; i += 1) {
    ctx.beginPath(); ctx.moveTo(i * size * 0.12, -size * 0.5); ctx.quadraticCurveTo(i * size * 0.2, 0, i * size * 0.12, size * 0.34); ctx.stroke();
  }
  ctx.strokeStyle = "#f5cf8e"; ctx.lineWidth = Math.max(1, size * 0.04);
  ctx.beginPath(); ctx.ellipse(0, -size * 0.56, size * 0.19, size * 0.055, 0, 0, TAU); ctx.stroke();
  ctx.beginPath(); ctx.ellipse(0, size * 0.35, size * 0.41, size * 0.09, 0, 0, TAU); ctx.stroke();
  glow(ctx, 0, size * 0.18, size * 0.5, "rgba(255,223,152,0.22)", 0.95);
  ctx.restore();
}

function drawFirework(ctx, spec, elapsed, w, groundY, s) {
  const age = elapsed - spec.launchAt;
  if (age < 0 || age > spec.flight + 2.5) return;
  const x = spec.x * w;
  const startY = groundY - 65 * s;
  const targetY = groundY - (330 + spec.y * 260) * s;
  const color = `hsla(${spec.hue}, 88%, 72%, 1)`;
  ctx.save(); ctx.globalCompositeOperation = "lighter";
  if (age < spec.flight) {
    const p = easeInOut(age / spec.flight);
    const y = lerp(startY, targetY, p);
    const tail = 82 * s;
    const trail = ctx.createLinearGradient(x, y, x, y + tail);
    trail.addColorStop(0, "rgba(255,245,211,0.95)");
    trail.addColorStop(0.22, color);
    trail.addColorStop(1, "rgba(255,177,96,0)");
    ctx.strokeStyle = trail; ctx.lineWidth = 2.2 * s;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + tail); ctx.stroke();
    glow(ctx, x, y, 22 * s, "rgba(255,215,150,0.6)", 0.8);
    ctx.fillStyle = "#fff8d9"; ctx.beginPath(); ctx.arc(x, y, 2.2 * s, 0, TAU); ctx.fill();
  } else {
    const burstAge = age - spec.flight;
    const fade = clamp(1 - burstAge / 2.5);
    const radiusScale = 0.72 + (1 - Math.exp(-burstAge * 2.8)) * 0.45;
    glow(ctx, x, targetY, (42 + burstAge * 14) * s, `hsla(${spec.hue},95%,68%,0.24)`, fade * 0.8);
    for (const particle of spec.particles) {
      const t = Math.max(0, burstAge - particle.delay);
      const px = x + particle.vx * t * (1 - t * 0.12) * radiusScale * s;
      const py = targetY + particle.vy * t * (1 - t * 0.12) * radiusScale * s + 42 * t * t * s;
      const alpha = fade * particle.alpha;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = particle.size > 1.8 ? "#fff0c6" : color;
      ctx.beginPath(); ctx.arc(px, py, particle.size * s * (0.82 + fade * 0.18), 0, TAU); ctx.fill();
      if (particle.size > 1.8 && t < 0.8) {
        ctx.strokeStyle = `hsla(${spec.hue},90%,78%,${alpha * 0.42})`;
        ctx.lineWidth = 0.7 * s;
        ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px - particle.vx * 0.035 * s, py - particle.vy * 0.035 * s); ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;
  }
  ctx.restore();
}

function drawScene(ctx, width, height, elapsed, now) {
  const time = now / 1000;
  const s = Math.min(width / 840, height / 590);
  const cx = width / 2;
  const groundY = height - 54 * s;
  const diyaY = groundY + 5 * s;
  const active = elapsed >= 0;
  const reveal = active ? smooth((elapsed - 1.4) / 5.1) : 0;
  const panToSky = active ? smooth((elapsed - 12.3) / 3.1) : 0;
  const zoom = active ? lerp(2.55, 0.97, reveal) : 2.55;
  const focusY = active ? lerp(diyaY, groundY - 235 * s, reveal) : diyaY;
  const cameraSkyY = groundY - 235 * s - 82 * s * panToSky;
  const finalFocusY = lerp(focusY, cameraSkyY, panToSky);
  const finalZoom = lerp(zoom, 0.91, panToSky);

  const sky = ctx.createLinearGradient(0, 0, 0, height);
  sky.addColorStop(0, "#101326"); sky.addColorStop(0.48, "#262039");
  sky.addColorStop(0.78, "#523947"); sky.addColorStop(1, "#201c2b");
  ctx.fillStyle = sky; ctx.fillRect(0, 0, width, height);
  const horizonGlow = ctx.createRadialGradient(cx, height * 0.64, 4, cx, height * 0.64, width * 0.68);
  horizonGlow.addColorStop(0, "rgba(183,107,75,0.18)"); horizonGlow.addColorStop(1, "rgba(183,107,75,0)");
  ctx.fillStyle = horizonGlow; ctx.fillRect(0, 0, width, height);

  ctx.save();
  ctx.translate(cx, height / 2);
  ctx.scale(finalZoom, finalZoom);
  ctx.translate(-cx, -finalFocusY);

  // Starfield and crescent moon.
  for (const star of stars) {
    const alpha = star.alpha * (0.75 + Math.sin(time * star.speed + star.phase) * 0.25);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = "#fff0d3";
    ctx.beginPath(); ctx.arc(star.x * width, star.y * height, star.r * s, 0, TAU); ctx.fill();
  }
  ctx.globalAlpha = 1;
  const moonX = width * 0.79; const moonY = height * 0.18;
  glow(ctx, moonX, moonY, 65 * s, "rgba(255,221,169,0.12)", 1);
  ctx.fillStyle = "#f2ddb3"; ctx.beginPath(); ctx.arc(moonX, moonY, 20 * s, 0, TAU); ctx.fill();
  ctx.fillStyle = "#211d31"; ctx.beginPath(); ctx.arc(moonX + 9 * s, moonY - 6 * s, 18 * s, 0, TAU); ctx.fill();

  // Distant silhouettes and courtyard ground.
  ctx.fillStyle = "#191a2b";
  for (let i = 0; i < 13; i += 1) {
    const x = (i / 12) * width;
    const h = (22 + (i * 17 % 31)) * s;
    ctx.fillRect(x - 14 * s, groundY - 390 * s - h, 30 * s, h + 390 * s);
    ctx.beginPath(); ctx.moveTo(x - 24 * s, groundY - 390 * s - h); ctx.lineTo(x, groundY - 390 * s - h - 22 * s); ctx.lineTo(x + 24 * s, groundY - 390 * s - h); ctx.fill();
  }
  const groundGradient = ctx.createLinearGradient(0, groundY - 90 * s, 0, height + 100 * s);
  groundGradient.addColorStop(0, "#645052"); groundGradient.addColorStop(0.18, "#423743"); groundGradient.addColorStop(1, "#1c1a29");
  ctx.fillStyle = groundGradient;
  ctx.fillRect(0, groundY - 90 * s, width, height + 200 * s - groundY);
  // Subtle receding paving lines; one canvas path, never hundreds of meshes.
  ctx.strokeStyle = "rgba(223,186,143,0.13)"; ctx.lineWidth = Math.max(0.65, s * 0.7);
  for (let row = 0; row < 8; row += 1) {
    const y = groundY - 72 * s + row * row * 8.8 * s;
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
  }
  for (let col = -5; col <= 5; col += 1) {
    ctx.beginPath(); ctx.moveTo(cx + col * 42 * s, groundY - 70 * s); ctx.lineTo(cx + col * 130 * s, height + 100 * s); ctx.stroke();
  }
  // House and architectural silhouette.
  drawHouse(ctx, cx, groundY, s, reveal, time);

  // Rangoli and lamps appear during the pull-back.
  const rangoliY = groundY - 36 * s;
  ctx.globalAlpha = reveal;
  drawRangoli(ctx, cx, rangoliY, 74 * s, time);
  ctx.globalAlpha = 1;
  const sideLamps = [-0.39, -0.28, -0.17, 0.17, 0.28, 0.39];
  sideLamps.forEach((offset, index) => {
    const lampX = cx + offset * width;
    const lampY = groundY - (28 + (index % 2) * 9) * s;
    const lit = elapsed > 2.1 + index * 0.52;
    ctx.globalAlpha = reveal;
    drawDiya(ctx, lampX, lampY, 24 * s, time, lit, false);
  });
  ctx.globalAlpha = 1;

  // A few lanterns rise gently above the roof once the camera turns skyward.
  const lanterns = [
    { x: width * 0.24, y: groundY - 330 * s, size: 33 * s, at: 12.4 },
    { x: width * 0.72, y: groundY - 315 * s, size: 29 * s, at: 13.0 },
    { x: width * 0.52, y: groundY - 360 * s, size: 25 * s, at: 13.7 },
  ];
  for (let i = 0; i < lanterns.length; i += 1) {
    const item = lanterns[i]; drawLantern(ctx, item.x, item.y, item.size, elapsed, i, item.at);
  }

  // Fireworks start only after the camera has reached the open sky.
  if (elapsed >= 14) fireworkSpecs.forEach((spec) => drawFirework(ctx, spec, elapsed, width, groundY, s));
  // Hero diya is foregrounded throughout the reveal, then rests as a warm detail.
  const heroLit = active && elapsed > 0.15;
  const heroSize = 78 * s;
  drawDiya(ctx, cx, diyaY, heroSize, time, heroLit, true);
  ctx.restore();
}

function createAudio() {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return null;
  const context = new AudioContextClass();
  const master = context.createGain();
  const music = context.createGain();
  const effects = context.createGain();
  master.gain.value = 0.68; music.gain.value = 0.42; effects.gain.value = 0.8;
  music.connect(master); effects.connect(master); master.connect(context.destination);
  const drones = [110, 164.81];
  const persistent = [];
  drones.forEach((frequency, index) => {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = index ? "triangle" : "sine";
    oscillator.frequency.value = frequency;
    gain.gain.value = index ? 0.022 : 0.042;
    oscillator.connect(gain); gain.connect(music); oscillator.start();
    persistent.push(oscillator, gain);
  });
  const notes = [392, 440, 523.25, 587.33, 523.25, 440];
  let noteIndex = 0;
  const playBell = () => {
    if (context.state === "closed") return;
    const now = context.currentTime;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = "sine"; oscillator.frequency.value = notes[noteIndex++ % notes.length];
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.045, now + 0.035);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.1);
    oscillator.connect(gain); gain.connect(music); oscillator.start(now); oscillator.stop(now + 2.15);
    oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
  };
  playBell();
  const timer = window.setInterval(playBell, 2250);
  const noise = (duration, frequency, volume, delay = 0) => {
    const now = context.currentTime + delay;
    const length = Math.ceil(context.sampleRate * duration);
    const buffer = context.createBuffer(1, length, context.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i += 1) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 2.4);
    const source = context.createBufferSource(); source.buffer = buffer;
    const filter = context.createBiquadFilter(); filter.type = "lowpass"; filter.frequency.value = frequency;
    const gain = context.createGain(); gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(volume, now + 0.045);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    source.connect(filter); filter.connect(gain); gain.connect(effects); source.start(now); source.stop(now + duration + 0.02);
    source.onended = () => { source.disconnect(); filter.disconnect(); gain.disconnect(); };
  };
  const ignition = () => {
    const now = context.currentTime;
    [740, 988].forEach((frequency, index) => {
      const oscillator = context.createOscillator(); const gain = context.createGain();
      oscillator.type = "sine"; oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(0.0001, now); gain.gain.exponentialRampToValueAtTime(index ? 0.028 : 0.045, now + 0.06);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.05);
      oscillator.connect(gain); gain.connect(effects); oscillator.start(now); oscillator.stop(now + 1.1);
      oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
    });
  };
  const setEnabled = (enabled) => {
    const target = enabled ? 0.68 : 0.0001;
    master.gain.setTargetAtTime(target, context.currentTime, 0.12);
  };
  return {
    ignition,
    launch: () => noise(0.9, 1600, 0.035),
    boom: () => { noise(1.25, 1700, 0.19); noise(0.46, 6200, 0.055, 0.16); },
    setEnabled,
    close: () => {
      window.clearInterval(timer);
      persistent.forEach((node) => { try { node.stop?.(); node.disconnect(); } catch {} });
      context.close().catch(() => {});
    },
    resume: () => context.resume(),
  };
}

export default function App() {
  const canvasRef = useRef(null);
  const startedAtRef = useRef(null);
  const audioRef = useRef(null);
  const soundOnRef = useRef(true);
  const lastBoomRef = useRef(-1);
  const lastLaunchRef = useRef(-1);
  const doneRef = useRef(false);
  const [started, setStarted] = useState(false);
  const [complete, setComplete] = useState(false);
  const [soundOn, setSoundOn] = useState(true);

  const begin = useCallback(() => {
    if (startedAtRef.current !== null) return;
    startedAtRef.current = performance.now();
    setStarted(true);
    doneRef.current = false;
    lastBoomRef.current = -1;
    lastLaunchRef.current = -1;
    if (!audioRef.current) audioRef.current = createAudio();
    audioRef.current?.resume?.();
    audioRef.current?.setEnabled(soundOnRef.current);
    audioRef.current?.ignition?.();
  }, []);

  const replay = useCallback(() => {
    startedAtRef.current = null;
    doneRef.current = false;
    lastBoomRef.current = -1;
    lastLaunchRef.current = -1;
    setStarted(false);
    setComplete(false);
  }, []);

  const toggleSound = useCallback(() => {
    const next = !soundOnRef.current;
    soundOnRef.current = next;
    setSoundOn(next);
    audioRef.current?.setEnabled(next);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext("2d", { alpha: false, desynchronized: true });
    if (!ctx) return undefined;
    let frame = 0;
    let width = 0;
    let height = 0;
    let dpr = 1;
    let lastFrame = 0;
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      width = Math.max(1, rect.width);
      height = Math.max(1, rect.height);
      dpr = Math.min(window.devicePixelRatio || 1, width < 600 ? 1.15 : 1.35);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    const observer = typeof ResizeObserver !== "undefined" ? new ResizeObserver(resize) : null;
    observer?.observe(canvas);
    window.addEventListener("resize", resize, { passive: true });
    resize();

    const fireworkTimes = fireworkSpecs.map((item) => item.launchAt + item.flight);
    const render = (now) => {
      frame = 0;
      if (document.visibilityState === "hidden") return;
      // Ignore huge frame gaps after tab changes; scene time itself remains deterministic.
      lastFrame = now;
      const startAt = startedAtRef.current;
      const elapsed = startAt === null ? -1 : Math.max(0, (now - startAt) / 1000);
      drawScene(ctx, width, height, elapsed, now);
      if (elapsed >= 0) {
        for (let i = 0; i < fireworkSpecs.length; i += 1) {
          if (elapsed >= fireworkSpecs[i].launchAt && lastLaunchRef.current < i) {
            lastLaunchRef.current = i;
            if (soundOnRef.current) audioRef.current?.launch?.();
          }
          if (elapsed >= fireworkTimes[i] && lastBoomRef.current < i) {
            lastBoomRef.current = i;
            if (soundOnRef.current) audioRef.current?.boom?.();
          }
        }
        if (elapsed >= 23.3 && !doneRef.current) {
          doneRef.current = true;
          setComplete(true);
        }
      }
      frame = requestAnimationFrame(render);
    };
    const onVisibility = () => {
      if (document.visibilityState === "visible" && !frame) {
        lastFrame = 0;
        frame = requestAnimationFrame(render);
      }
    };
    frame = requestAnimationFrame(render);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      observer?.disconnect();
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  useEffect(() => () => { audioRef.current?.close?.(); audioRef.current = null; }, []);

  const onCanvasClick = () => { if (!startedAtRef.current) begin(); };

  return (
    <main className="deepavali-app">
      <canvas
        ref={canvasRef}
        className="festival-canvas"
        onPointerDown={onCanvasClick}
        aria-label="Animated Deepavali courtyard. Tap to light the diya and begin the celebration."
      />
      <div className="screen-shade" aria-hidden="true" />
      <header className="topbar">
        <div className="brand"><span className="brand-mark">✦</span><span>DIWALI SKY</span></div>
        <button className={`sound-toggle ${soundOn ? "is-on" : ""}`} onClick={toggleSound} aria-pressed={soundOn} aria-label={soundOn ? "Mute sound" : "Enable sound"}>
          <span>{soundOn ? "♫" : "♪"}</span><small>{soundOn ? "SOUND ON" : "SOUND OFF"}</small>
        </button>
      </header>
      {!started && (
        <button className="start-hint" onClick={begin}>
          <span className="hint-rule" />
          <span>TAP THE DIYA TO BEGIN</span>
          <small>A little light. A beautiful night.</small>
        </button>
      )}
      {complete && (
        <section className="closing-wish" aria-live="polite">
          <span className="closing-kicker">✦ &nbsp; THE FESTIVAL OF LIGHTS &nbsp; ✦</span>
          <h1>Wishing You a<br /><em>Happy Deepavali</em></h1>
          <button className="replay-button" onClick={replay}>REPLAY THE CELEBRATION <span>↻</span></button>
        </section>
      )}
      <footer className="bottom-line">LIGHT · JOY · TOGETHERNESS</footer>
    </main>
  );
}
