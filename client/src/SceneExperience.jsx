import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Bloom, EffectComposer, Vignette } from "@react-three/postprocessing";
import * as THREE from "three";

const COLORS = {
  night: "#171326",
  plaster: "#b99a7c",
  plasterLight: "#d2b89a",
  plasterShadow: "#806454",
  wood: "#49303a",
  woodLight: "#70483e",
  copper: "#bd8058",
  gold: "#f0c47f",
  teal: "#397d78",
  tealDark: "#244d50",
  rose: "#bc777b",
  cream: "#f3dfbd",
};

const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
const smooth = (value) => {
  const t = clamp(value);
  return t * t * (3 - 2 * t);
};
const mix = (a, b, t) => a + (b - a) * t;

function seededRandom(seed) {
  let value = seed >>> 0;
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 4294967296;
  };
}

function makePlasterTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const context = canvas.getContext("2d");
  const random = seededRandom(71);
  context.fillStyle = "#b89a7e";
  context.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 14500; i += 1) {
    const x = random() * 512;
    const y = random() * 512;
    const radius = 0.25 + random() * 2.2;
    const alpha = 0.018 + random() * 0.075;
    context.fillStyle = random() > 0.52 ? `rgba(255,238,211,${alpha})` : `rgba(52,34,31,${alpha})`;
    context.beginPath();
    context.arc(x, y, radius, 0, Math.PI * 2);
    context.fill();
  }
  for (let i = 0; i < 38; i += 1) {
    const x = random() * 512;
    const y = random() * 512;
    context.strokeStyle = `rgba(72,48,39,${0.025 + random() * 0.04})`;
    context.lineWidth = 0.4 + random() * 0.8;
    context.beginPath();
    context.moveTo(x, y);
    context.quadraticCurveTo(x + random() * 18 - 9, y + random() * 22, x + random() * 32 - 16, y + random() * 42);
    context.stroke();
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2.5, 1.4);
  texture.anisotropy = 4;
  return texture;
}

function makeStoneTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const context = canvas.getContext("2d");
  const random = seededRandom(113);
  context.fillStyle = "#88786f";
  context.fillRect(0, 0, 512, 512);
  const size = 128;
  for (let row = 0; row < 4; row += 1) {
    for (let column = 0; column < 4; column += 1) {
      const offset = row % 2 ? -size / 2 : 0;
      const x = column * size + offset;
      const y = row * size;
      const gradient = context.createLinearGradient(x, y, x + size, y + size);
      gradient.addColorStop(0, row % 2 ? "#9b8b7c" : "#a18f80");
      gradient.addColorStop(1, row % 2 ? "#82756f" : "#88796f");
      context.fillStyle = gradient;
      context.fillRect(x + 2, y + 2, size - 4, size - 4);
      context.strokeStyle = "rgba(42,32,37,.3)";
      context.lineWidth = 3;
      context.strokeRect(x + 1.5, y + 1.5, size - 3, size - 3);
      context.strokeStyle = "rgba(241,218,185,.12)";
      context.lineWidth = 1;
      context.strokeRect(x + 6, y + 6, size - 12, size - 12);
    }
  }
  for (let i = 0; i < 11000; i += 1) {
    const x = random() * 512;
    const y = random() * 512;
    const alpha = 0.025 + random() * 0.06;
    context.fillStyle = random() > 0.5 ? `rgba(255,239,215,${alpha})` : `rgba(35,27,30,${alpha})`;
    context.fillRect(x, y, 1 + random() * 2, 1 + random() * 2);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2, 2.6);
  texture.anisotropy = 4;
  return texture;
}

function Flame({ scale = 1, intensity = 1 }) {
  const outerRef = useRef(null);
  const innerRef = useRef(null);
  const glowRef = useRef(null);
  useFrame(({ clock }) => {
    const time = clock.elapsedTime;
    if (outerRef.current) {
      outerRef.current.scale.set(0.82 + Math.sin(time * 8.1) * 0.075, 0.96 + Math.sin(time * 11.4) * 0.12, 0.82 + Math.cos(time * 7.3) * 0.065);
      outerRef.current.rotation.z = Math.sin(time * 5.2) * 0.065;
    }
    if (innerRef.current) innerRef.current.scale.y = 0.94 + Math.sin(time * 12.7 + 0.8) * 0.11;
    if (glowRef.current) glowRef.current.intensity = intensity * (1.15 + Math.sin(time * 9.4) * 0.12);
  });
  return (
    <group position={[0, 0.34, 0]} scale={scale}>
      <mesh ref={outerRef} position={[0, 0.18, 0]}>
        <sphereGeometry args={[0.12, 18, 16]} />
        <meshBasicMaterial color="#ff9a3d" toneMapped={false} />
      </mesh>
      <mesh ref={innerRef} position={[0, 0.15, 0.025]} scale={[0.5, 0.73, 0.5]}>
        <sphereGeometry args={[0.105, 16, 14]} />
        <meshBasicMaterial color="#fff1ba" toneMapped={false} />
      </mesh>
      <mesh position={[0, 0.36, 0]} scale={[0.48, 0.8, 0.48]}>
        <sphereGeometry args={[0.08, 14, 12]} />
        <meshBasicMaterial color="#ffe3a0" transparent opacity={0.26} depthWrite={false} toneMapped={false} />
      </mesh>
      <pointLight ref={glowRef} position={[0, 0.25, 0]} color="#ffad55" intensity={intensity} distance={4.1} decay={2} />
    </group>
  );
}

const diyaProfile = [
  new THREE.Vector2(0.025, 0), new THREE.Vector2(0.13, 0.018), new THREE.Vector2(0.24, 0.065),
  new THREE.Vector2(0.32, 0.14), new THREE.Vector2(0.35, 0.2), new THREE.Vector2(0.34, 0.245),
  new THREE.Vector2(0.31, 0.255), new THREE.Vector2(0.285, 0.205), new THREE.Vector2(0.08, 0.18),
];
const diyaGeometry = new THREE.LatheGeometry(diyaProfile, 40);

function Diya({ position, scale = 1, delay = 0, startAt, active = false, onIgnite, index = 0 }) {
  const [lit, setLit] = useState(false);
  useEffect(() => {
    setLit(false);
    if (startAt === null) return undefined;
    const elapsed = Math.max(0, performance.now() - startAt);
    const remaining = Math.max(0, Math.max(0, delay) * 1000 - elapsed);
    const timer = window.setTimeout(() => setLit(true), remaining);
    return () => window.clearTimeout(timer);
  }, [startAt, delay]);
  const studs = useMemo(() => Array.from({ length: 12 }, (_, item) => item), []);
  const handleClick = (event) => {
    if (!active || startAt !== null) return;
    event.stopPropagation();
    onIgnite?.();
  };
  return (
    <group position={position} scale={scale} onClick={handleClick}
      onPointerOver={active && startAt === null ? (event) => { event.stopPropagation(); document.body.style.cursor = "pointer"; } : undefined}
      onPointerOut={active ? () => { document.body.style.cursor = "auto"; } : undefined}>
      <mesh geometry={diyaGeometry} position={[0, 0.015, 0]} castShadow>
        <meshStandardMaterial color="#8f4b34" roughness={0.5} metalness={0.08} />
      </mesh>
      <mesh position={[0, 0.245, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.322, 0.035, 10, 48]} />
        <meshStandardMaterial color="#dfa963" metalness={0.48} roughness={0.32} />
      </mesh>
      <mesh position={[0, 0.145, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.295, 0.012, 8, 48]} />
        <meshStandardMaterial color="#c17e4f" metalness={0.42} roughness={0.36} />
      </mesh>
      <mesh position={[0, 0.187, 0]}>
        <cylinderGeometry args={[0.25, 0.25, 0.012, 36]} />
        <meshStandardMaterial color="#3c2929" roughness={0.28} metalness={0.12} />
      </mesh>
      {studs.map((item) => {
        const angle = (item / studs.length) * Math.PI * 2;
        return <mesh key={item} position={[Math.cos(angle) * 0.323, 0.18, Math.sin(angle) * 0.323]} scale={[1, 0.72, 1]}>
          <sphereGeometry args={[0.027, 8, 8]} />
          <meshStandardMaterial color="#e8b96f" metalness={0.58} roughness={0.28} />
        </mesh>;
      })}
      <mesh position={[0, 0.265, 0.02]} rotation={[0, 0, -0.16]}>
        <cylinderGeometry args={[0.018, 0.026, 0.14, 8]} />
        <meshStandardMaterial color="#25202a" roughness={1} />
      </mesh>
      {lit && <Flame scale={0.9 + (index % 3) * 0.08} intensity={active ? 2.1 : 0.55} />}
      {active && !lit && <group position={[0, 0.58, 0]}>
        <mesh><sphereGeometry args={[0.14, 16, 12]} /><meshBasicMaterial color="#ffdca2" transparent opacity={0.17} depthWrite={false} /></mesh>
        <pointLight color="#ffc778" intensity={0.3} distance={2.2} />
      </group>}
    </group>
  );
}

function FloorTiles({ texture }) {
  const instanced = useRef(null);
  const tileGeometry = useMemo(() => new THREE.BoxGeometry(1.55, 0.055, 1.6), []);
  const { matrices, colors } = useMemo(() => {
    const columns = 19;
    const rows = 22;
    const matrix = new THREE.Object3D();
    const entries = [];
    const random = seededRandom(193);
    for (let row = 0; row < rows; row += 1) {
      for (let column = 0; column < columns; column += 1) {
        const x = -14.4 + column * 1.6;
        const z = -13.4 + row * 1.65;
        const y = -0.055 + random() * 0.007;
        matrix.position.set(x, y, z);
        matrix.rotation.y = (random() - 0.5) * 0.012;
        matrix.scale.set(1, 1, 1);
        matrix.updateMatrix();
        entries.push({ matrix: matrix.matrix.clone(), shade: 0.88 + random() * 0.19 });
      }
    }
    return { matrices: entries.map((entry) => entry.matrix), colors: entries.map((entry) => entry.shade) };
  }, []);
  useEffect(() => {
    if (!instanced.current) return;
    matrices.forEach((entry, index) => {
      instanced.current.setMatrixAt(index, entry);
      const shade = colors[index];
      instanced.current.setColorAt(index, new THREE.Color(shade, shade * 0.965, shade * 0.92));
    });
    instanced.current.instanceMatrix.needsUpdate = true;
    if (instanced.current.instanceColor) instanced.current.instanceColor.needsUpdate = true;
  }, [matrices, colors]);
  useEffect(() => () => tileGeometry.dispose(), [tileGeometry]);
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.12, 3.9]} receiveShadow>
        <planeGeometry args={[31.5, 38]} />
        <meshStandardMaterial map={texture} color="#d2c2ad" roughness={0.82} metalness={0.035} />
      </mesh>
      <instancedMesh ref={instanced} args={[tileGeometry, undefined, matrices.length]} receiveShadow castShadow>
        <meshStandardMaterial map={texture} color="#ffffff" roughness={0.86} metalness={0.025} />
      </instancedMesh>
      {[-15.2, 15.2].map((x) => <mesh key={x} position={[x, 0.015, 2]}>
        <boxGeometry args={[0.12, 0.045, 36]} />
        <meshStandardMaterial color="#b88a64" metalness={0.28} roughness={0.45} />
      </mesh>)}
      <mesh position={[0, 0.015, 20.2]}><boxGeometry args={[30.5, 0.045, 0.12]} /><meshStandardMaterial color="#b88a64" metalness={0.28} roughness={0.45} /></mesh>
    </group>
  );
}

function ArchWindow({ position, startAt, delay = 0, balcony = false, width = 1.7 }) {
  const [lit, setLit] = useState(false);
  useEffect(() => {
    setLit(false);
    if (startAt === null) return undefined;
    const elapsed = Math.max(0, performance.now() - startAt);
    const timer = window.setTimeout(() => setLit(true), Math.max(0, delay * 1000 - elapsed));
    return () => window.clearTimeout(timer);
  }, [startAt, delay]);
  const bars = useMemo(() => Array.from({ length: 4 }, (_, index) => index), []);
  return (
    <group position={position}>
      <mesh position={[0, 0.95, -0.06]}>
        <boxGeometry args={[width * 0.77, 1.72, 0.12]} />
        <meshStandardMaterial color="#372a35" roughness={0.72} />
      </mesh>
      <mesh position={[0, 0.95, 0.012]}>
        <boxGeometry args={[width * 0.66, 1.58, 0.025]} />
        <meshStandardMaterial color={lit ? "#ffdca6" : "#211b2a"} emissive={lit ? "#f9ae5c" : "#080711"} emissiveIntensity={lit ? 1.25 : 0.03} roughness={0.5} />
      </mesh>
      <mesh position={[0, 1.95, 0.045]} rotation={[0, 0, 0]}>
        <torusGeometry args={[width * 0.385, 0.075, 10, 36, Math.PI]} />
        <meshStandardMaterial color={COLORS.cream} roughness={0.62} />
      </mesh>
      <mesh position={[0, 1.95, 0.075]}>
        <torusGeometry args={[width * 0.34, 0.027, 8, 36, Math.PI]} />
        <meshStandardMaterial color={COLORS.copper} metalness={0.35} roughness={0.45} />
      </mesh>
      {[-width * 0.39, width * 0.39].map((x) => <group key={x} position={[x, 0.92, 0.04]}>
        <mesh><boxGeometry args={[0.16, 1.9, 0.16]} /><meshStandardMaterial color="#e0c6a4" roughness={0.72} /></mesh>
        <mesh position={[0, 0.73, 0.095]}><boxGeometry args={[0.25, 0.12, 0.19]} /><meshStandardMaterial color={COLORS.copper} metalness={0.2} /></mesh>
        <mesh position={[0, -0.87, 0.09]}><boxGeometry args={[0.28, 0.14, 0.2]} /><meshStandardMaterial color={COLORS.copper} metalness={0.2} /></mesh>
      </group>)}
      {bars.map((index) => <mesh key={index} position={[-width * 0.25 + index * width * 0.165, 0.95, 0.085]}>
        <boxGeometry args={[0.045, 1.55, 0.045]} /><meshStandardMaterial color="#543b3b" metalness={0.22} roughness={0.48} />
      </mesh>)}
      {[-0.05, 0.66, 1.36].map((y) => <mesh key={y} position={[0, y, 0.105]}>
        <boxGeometry args={[width * 0.65, 0.052, 0.052]} /><meshStandardMaterial color="#9c7255" metalness={0.28} roughness={0.46} />
      </mesh>)}
      {[-0.46, 0.46].map((x) => <mesh key={x} position={[x, 0.95, 0.09]}>
        <boxGeometry args={[0.035, 1.55, 0.04]} /><meshStandardMaterial color="#704940" />
      </mesh>)}
      <mesh position={[0, 0.16, 0.11]}><boxGeometry args={[width + 0.2, 0.17, 0.42]} /><meshStandardMaterial color="#8a5d4b" roughness={0.58} /></mesh>
      <mesh position={[0, 0.25, 0.3]}><boxGeometry args={[width + 0.35, 0.055, 0.42]} /><meshStandardMaterial color={COLORS.gold} metalness={0.28} roughness={0.4} /></mesh>
      <mesh position={[0, 2.46, 0.09]}><sphereGeometry args={[0.095, 12, 10]} /><meshStandardMaterial color={COLORS.gold} metalness={0.55} roughness={0.3} /></mesh>
      {balcony && <Balcony position={[0, -0.23, 0.42]} width={width + 1.1} depth={0.85} />}
      {lit && <pointLight position={[0, 1.05, 0.55]} color="#ffc77f" intensity={0.65} distance={4.5} decay={2} />}
    </group>
  );
}

function Balcony({ position = [0, 0, 0], width = 5, depth = 0.8 }) {
  const posts = useMemo(() => Array.from({ length: Math.max(8, Math.floor(width / 0.28)) }, (_, index) => index), [width]);
  return (
    <group position={position}>
      <mesh position={[0, -0.12, depth * 0.44]} castShadow><boxGeometry args={[width, 0.24, depth]} /><meshStandardMaterial color="#765042" roughness={0.65} /></mesh>
      <mesh position={[0, 0.55, depth * 0.88]}><boxGeometry args={[width, 0.13, 0.13]} /><meshStandardMaterial color={COLORS.wood} metalness={0.18} roughness={0.52} /></mesh>
      <mesh position={[0, 0.08, depth * 0.88]}><boxGeometry args={[width, 0.11, 0.13]} /><meshStandardMaterial color={COLORS.copper} metalness={0.28} roughness={0.46} /></mesh>
      {posts.map((index) => {
        const x = -width / 2 + (index / (posts.length - 1)) * width;
        return <group key={index} position={[x, 0.29, depth * 0.88]}>
          <mesh><boxGeometry args={[0.055, 0.48, 0.055]} /><meshStandardMaterial color="#e0c29b" metalness={0.12} roughness={0.55} /></mesh>
          <mesh position={[0, 0.27, 0]}><sphereGeometry args={[0.052, 8, 8]} /><meshStandardMaterial color={COLORS.gold} metalness={0.58} roughness={0.28} /></mesh>
        </group>;
      })}
      {[-width / 2, width / 2].map((x) => <mesh key={x} position={[x, 0.28, depth * 0.88]}><boxGeometry args={[0.16, 0.7, 0.18]} /><meshStandardMaterial color="#b98a64" roughness={0.6} /></mesh>)}
    </group>
  );
}

function CarvedDoor() {
  const panels = [0, 1];
  return (
    <group position={[0, 0.28, 0]}>
      <mesh position={[0, 2.0, -0.05]}><boxGeometry args={[2.85, 4.15, 0.22]} /><meshStandardMaterial color="#352630" roughness={0.62} /></mesh>
      <mesh position={[0, 4.03, 0.08]}><torusGeometry args={[1.34, 0.12, 12, 48, Math.PI]} /><meshStandardMaterial color={COLORS.cream} roughness={0.6} /></mesh>
      <mesh position={[0, 4.03, 0.12]}><torusGeometry args={[1.19, 0.045, 8, 48, Math.PI]} /><meshStandardMaterial color={COLORS.gold} metalness={0.34} roughness={0.38} /></mesh>
      <mesh position={[-0.7, 1.95, 0.11]}><boxGeometry args={[1.25, 3.55, 0.12]} /><meshStandardMaterial color="#704238" roughness={0.54} /></mesh>
      <mesh position={[0.7, 1.95, 0.11]}><boxGeometry args={[1.25, 3.55, 0.12]} /><meshStandardMaterial color="#704238" roughness={0.54} /></mesh>
      {panels.map((index) => {
        const x = index ? 0.7 : -0.7;
        return <group key={index} position={[x, 1.95, 0.19]}>
          <mesh><boxGeometry args={[0.91, 2.97, 0.035]} /><meshStandardMaterial color="#51323a" roughness={0.64} /></mesh>
          <mesh><boxGeometry args={[0.76, 2.78, 0.035]} /><meshStandardMaterial color="#7a4a3b" roughness={0.56} /></mesh>
          <mesh><boxGeometry args={[0.63, 2.6, 0.025]} /><meshStandardMaterial color="#59343a" roughness={0.56} /></mesh>
          <mesh position={[0, 0.9, 0.035]}><boxGeometry args={[0.42, 0.78, 0.025]} /><meshStandardMaterial color="#875944" roughness={0.52} /></mesh>
          <mesh position={[0, -0.5, 0.035]}><boxGeometry args={[0.42, 0.64, 0.025]} /><meshStandardMaterial color="#875944" roughness={0.52} /></mesh>
          {[-0.92, 0, 0.92].map((y) => <mesh key={y} position={[0, y, 0.085]} rotation={[0, 0, Math.PI / 4]}>
            <octahedronGeometry args={[0.14, 0]} /><meshStandardMaterial color={COLORS.gold} metalness={0.62} roughness={0.28} />
          </mesh>)}
          {[-0.3, 0.3].map((offset) => <mesh key={offset} position={[offset, -0.02, 0.06]}><sphereGeometry args={[0.035, 8, 8]} /><meshStandardMaterial color={COLORS.gold} metalness={0.75} roughness={0.25} /></mesh>)}
        </group>;
      })}
      <mesh position={[0, 0.18, 0.29]}><boxGeometry args={[2.95, 0.12, 0.38]} /><meshStandardMaterial color={COLORS.gold} metalness={0.34} roughness={0.4} /></mesh>
      <mesh position={[0, 4.34, 0.12]}><sphereGeometry args={[0.13, 12, 12]} /><meshStandardMaterial color={COLORS.gold} metalness={0.68} roughness={0.25} /></mesh>
      <mesh position={[0, 4.65, 0.1]}><coneGeometry args={[0.19, 0.32, 8]} /><meshStandardMaterial color={COLORS.copper} metalness={0.25} roughness={0.48} /></mesh>
      {[-0.18, 0.18].map((x) => <mesh key={x} position={[x, 1.85, 0.32]}><sphereGeometry args={[0.07, 12, 10]} /><meshStandardMaterial color="#f3c77f" metalness={0.78} roughness={0.2} /></mesh>)}
    </group>
  );
}

function SculptedColumn({ position, height = 5.1, radius = 0.2 }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.14, 0]}><boxGeometry args={[radius * 3.6, 0.28, radius * 3.6]} /><meshStandardMaterial color="#775345" roughness={0.72} /></mesh>
      <mesh position={[0, 0.32, 0]}><cylinderGeometry args={[radius * 1.5, radius * 1.65, 0.13, 16]} /><meshStandardMaterial color={COLORS.gold} metalness={0.3} roughness={0.43} /></mesh>
      <mesh position={[0, height / 2 + 0.35, 0]}><cylinderGeometry args={[radius, radius * 1.18, height - 0.2, 18]} /><meshStandardMaterial color={COLORS.plasterLight} roughness={0.76} /></mesh>
      {[0.42, height - 0.3].map((y) => <mesh key={y} position={[0, y, 0]}><torusGeometry args={[radius * 1.2, 0.045, 8, 24]} /><meshStandardMaterial color={COLORS.copper} metalness={0.36} roughness={0.42} /></mesh>)}
      <mesh position={[0, height + 0.08, 0]}><cylinderGeometry args={[radius * 1.6, radius * 1.35, 0.26, 16]} /><meshStandardMaterial color="#926b56" roughness={0.62} /></mesh>
      <mesh position={[0, height + 0.24, 0]}><boxGeometry args={[radius * 4.1, 0.16, radius * 4.1]} /><meshStandardMaterial color={COLORS.gold} metalness={0.24} roughness={0.46} /></mesh>
      {Array.from({ length: 8 }, (_, index) => {
        const angle = (index / 8) * Math.PI * 2;
        return <mesh key={index} position={[Math.cos(angle) * radius * 0.8, height / 2 + 0.35, Math.sin(angle) * radius * 0.8]}>
          <cylinderGeometry args={[0.018, 0.018, height - 0.48, 5]} /><meshStandardMaterial color="#98755f" roughness={0.7} />
        </mesh>;
      })}
    </group>
  );
}

function StringLights({ y, z, width, count = 42, delay = 4.8, startAt }) {
  const [lit, setLit] = useState(false);
  useEffect(() => {
    setLit(false);
    if (startAt === null) return undefined;
    const elapsed = Math.max(0, performance.now() - startAt);
    const timer = window.setTimeout(() => setLit(true), Math.max(0, delay * 1000 - elapsed));
    return () => window.clearTimeout(timer);
  }, [startAt, delay]);
  const { curve, points } = useMemo(() => {
    const pointsOnCurve = [];
    for (let index = 0; index <= 32; index += 1) {
      const t = index / 32;
      pointsOnCurve.push(new THREE.Vector3(-width / 2 + t * width, y - Math.sin(t * Math.PI) * 0.55, z));
    }
    const path = new THREE.CatmullRomCurve3(pointsOnCurve);
    const bulbs = Array.from({ length: count }, (_, index) => {
      const t = index / (count - 1);
      return path.getPoint(t);
    });
    return { curve: path, points: bulbs };
  }, [y, z, width, count]);
  return (
    <group>
      <mesh><tubeGeometry args={[curve, 64, 0.018, 5, false]} /><meshStandardMaterial color="#382a35" roughness={0.8} /></mesh>
      {points.map((point, index) => <mesh key={index} position={point.toArray()}>
        <sphereGeometry args={[0.067, 9, 9]} />
        <meshBasicMaterial color={lit ? ["#ffe5a8", "#f5bb79", "#dca4a0"][index % 3] : "#3c333c"} toneMapped={false} />
      </mesh>)}
      {lit && <pointLight position={[0, y - 0.2, z + 0.8]} color="#f5c18b" intensity={1.1} distance={16} decay={2} />}
    </group>
  );
}

function MarigoldGarland({ startAt, position = [0, 0, 0] }) {
  const flowers = useMemo(() => Array.from({ length: 27 }, (_, index) => index), []);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    setVisible(false);
    if (startAt === null) return undefined;
    const elapsed = Math.max(0, performance.now() - startAt);
    const timer = window.setTimeout(() => setVisible(true), Math.max(0, 3600 - elapsed));
    return () => window.clearTimeout(timer);
  }, [startAt]);
  if (!visible) return null;
  return (
    <group position={position}>
      {flowers.map((index) => {
        const t = index / (flowers.length - 1);
        const x = mix(-1.4, 1.4, t);
        const y = 3.8 - Math.sin(t * Math.PI) * 0.58;
        return <group key={index} position={[x, y, 0.18]}>
          <mesh><dodecahedronGeometry args={[0.105, 0]} /><meshStandardMaterial color={index % 2 ? "#e9a344" : "#f3bc57"} roughness={0.8} /></mesh>
          <mesh position={[0, -0.04, 0.03]} scale={[0.52, 0.52, 0.52]}><sphereGeometry args={[0.1, 8, 8]} /><meshStandardMaterial color="#d36d39" roughness={0.8} /></mesh>
        </group>;
      })}
    </group>
  );
}

function WallSconce({ position, startAt, delay = 6 }) {
  const [lit, setLit] = useState(false);
  useEffect(() => {
    setLit(false);
    if (startAt === null) return undefined;
    const elapsed = Math.max(0, performance.now() - startAt);
    const timer = window.setTimeout(() => setLit(true), Math.max(0, delay * 1000 - elapsed));
    return () => window.clearTimeout(timer);
  }, [startAt, delay]);
  return (
    <group position={position}>
      <mesh position={[0, 0.13, -0.04]}><cylinderGeometry args={[0.16, 0.16, 0.09, 12]} /><meshStandardMaterial color={COLORS.copper} metalness={0.45} roughness={0.35} /></mesh>
      <mesh position={[0, -0.07, 0.07]}><cylinderGeometry args={[0.105, 0.15, 0.32, 8, 1, true]} /><meshStandardMaterial color="#68433c" roughness={0.65} side={THREE.DoubleSide} /></mesh>
      <mesh position={[0, -0.23, 0.07]}><coneGeometry args={[0.16, 0.12, 8]} /><meshStandardMaterial color={COLORS.gold} metalness={0.3} roughness={0.45} /></mesh>
      {lit && <><Flame scale={0.38} intensity={0.36} /><pointLight position={[0, -0.08, 0.55]} color="#ffb66a" intensity={0.8} distance={4.5} decay={2} /></>}
    </group>
  );
}

function House({ startAt, plasterTexture }) {
  const [facadeGlow, setFacadeGlow] = useState(false);
  const lowerWindows = [-7.7, -4.25, 4.25, 7.7];
  const upperWindows = [-7.7, -4.25, 0, 4.25, 7.7];
  useEffect(() => {
    setFacadeGlow(false);
    if (startAt === null) return undefined;
    const elapsed = Math.max(0, performance.now() - startAt);
    const timer = window.setTimeout(() => setFacadeGlow(true), Math.max(0, 7200 - elapsed));
    return () => window.clearTimeout(timer);
  }, [startAt]);
  return (
    <group>
      {/* Deep masonry body, side returns and shadowed plinth */}
      <mesh position={[0, 5.55, -15.1]} castShadow receiveShadow>
        <boxGeometry args={[21.4, 11.1, 1.8]} />
        <meshStandardMaterial map={plasterTexture} color="#d9c0a3" roughness={0.91} />
      </mesh>
      {[-10.55, 10.55].map((x) => <mesh key={x} position={[x, 5.6, -14.45]} castShadow>
        <boxGeometry args={[0.55, 11.2, 1.05]} /><meshStandardMaterial color="#846858" roughness={0.82} />
      </mesh>)}
      <mesh position={[0, 0.36, -14.1]}><boxGeometry args={[22.2, 0.72, 2.5]} /><meshStandardMaterial color="#593e3e" roughness={0.68} /></mesh>
      <mesh position={[0, 0.72, -12.91]}><boxGeometry args={[21.9, 0.11, 0.13]} /><meshStandardMaterial color={COLORS.gold} metalness={0.28} roughness={0.44} /></mesh>
      <mesh position={[0, 5.62, -14.08]}><boxGeometry args={[22.05, 0.28, 2.45]} /><meshStandardMaterial color="#8f6852" roughness={0.62} /></mesh>
      <mesh position={[0, 5.79, -12.83]}><boxGeometry args={[22.25, 0.075, 0.12]} /><meshStandardMaterial color={COLORS.gold} metalness={0.3} roughness={0.45} /></mesh>
      <mesh position={[0, 11.08, -14.28]}><boxGeometry args={[22.3, 0.48, 2.4]} /><meshStandardMaterial color="#745143" roughness={0.62} /></mesh>
      <mesh position={[0, 11.38, -14.0]}><boxGeometry args={[22.6, 0.12, 2.45]} /><meshStandardMaterial color={COLORS.gold} metalness={0.26} roughness={0.48} /></mesh>
      {/* Parapet with repeating recessed panels */}
      <mesh position={[0, 12.05, -15.15]}><boxGeometry args={[20.6, 0.9, 1.3]} /><meshStandardMaterial map={plasterTexture} color="#cfb194" roughness={0.85} /></mesh>
      {Array.from({ length: 19 }, (_, index) => {
        const x = -9.5 + index * 1.06;
        return <group key={index} position={[x, 12.62, -14.42]}>
          <mesh><boxGeometry args={[0.64, 0.28, 0.14]} /><meshStandardMaterial color="#9f775e" roughness={0.72} /></mesh>
          <mesh position={[0, 0.24, 0]}><sphereGeometry args={[0.105, 8, 8]} /><meshStandardMaterial color={COLORS.gold} metalness={0.42} roughness={0.34} /></mesh>
        </group>;
      })}
      {/* Upper and lower arch windows */}
      {lowerWindows.map((x, index) => <ArchWindow key={`low-${x}`} position={[x, 1.02, -14.08]} startAt={startAt} delay={1.2 + index * 0.44} width={1.85} />)}
      {upperWindows.map((x, index) => <ArchWindow key={`up-${x}`} position={[x, 6.65, -14.08]} startAt={startAt} delay={3.4 + index * 0.34} width={1.85} />)}
      {/* Central carved double door and broad steps */}
      <group position={[0, 0, -14.11]}><CarvedDoor /></group>
      <group position={[0, 0, -12.38]}>
        <mesh position={[0, 0.13, 0]}><boxGeometry args={[4.15, 0.26, 1.0]} /><meshStandardMaterial color="#b18b70" roughness={0.75} /></mesh>
        <mesh position={[0, 0.29, 0.27]}><boxGeometry args={[3.85, 0.08, 0.9]} /><meshStandardMaterial color={COLORS.gold} metalness={0.25} roughness={0.52} /></mesh>
        <mesh position={[0, 0.4, 0.9]}><boxGeometry args={[3.35, 0.18, 0.72]} /><meshStandardMaterial color="#98745f" roughness={0.8} /></mesh>
      </group>
      {/* Deep columns, capitals and moulded details */}
      {[-9.35, -6.3, 6.3, 9.35].map((x) => <SculptedColumn key={x} position={[x, 0.1, -12.95]} height={5.15} radius={0.19} />)}
      {[-9.7, 9.7].map((x) => <SculptedColumn key={`upper-${x}`} position={[x, 6.0, -13.0]} height={4.9} radius={0.14} />)}
      {/* Central upper balcony with sculpted brackets */}
      <Balcony position={[0, 6.7, -12.85]} width={5.2} depth={1.0} />
      {[-2.3, 2.3].map((x) => <mesh key={x} position={[x, 5.95, -12.4]} rotation={[0, 0, Math.PI]}>
        <coneGeometry args={[0.34, 0.7, 4]} /><meshStandardMaterial color="#9a6e57" roughness={0.72} />
      </mesh>)}
      {/* Roof crest / chhatri-inspired crown */}
      <group position={[0, 12.56, -14.25]}>
        <mesh position={[0, 0.13, 0]}><cylinderGeometry args={[2.35, 2.5, 0.28, 32]} /><meshStandardMaterial color="#795744" roughness={0.63} /></mesh>
        <mesh position={[0, 0.34, 0]}><torusGeometry args={[1.96, 0.1, 10, 48]} /><meshStandardMaterial color={COLORS.gold} metalness={0.44} roughness={0.35} /></mesh>
        <mesh position={[0, 1.02, 0]}><sphereGeometry args={[1.82, 32, 18, 0, Math.PI * 2, 0, Math.PI / 2]} /><meshStandardMaterial color="#9f755e" roughness={0.72} /></mesh>
        <mesh position={[0, 2.1, 0]}><cylinderGeometry args={[0.16, 0.22, 0.5, 12]} /><meshStandardMaterial color={COLORS.copper} metalness={0.3} roughness={0.4} /></mesh>
        <mesh position={[0, 2.43, 0]}><sphereGeometry args={[0.16, 12, 12]} /><meshStandardMaterial color={COLORS.gold} metalness={0.65} roughness={0.23} /></mesh>
        {Array.from({ length: 8 }, (_, index) => {
          const angle = (index / 8) * Math.PI * 2;
          return <mesh key={index} position={[Math.cos(angle) * 1.55, 0.62, Math.sin(angle) * 1.55]}>
            <cylinderGeometry args={[0.055, 0.07, 0.76, 8]} /><meshStandardMaterial color={COLORS.cream} roughness={0.68} />
          </mesh>;
        })}
      </group>
      {/* Moulded facade bands and decorative medallions */}
      {[-9.2, -5.7, -2.9, 2.9, 5.7, 9.2].map((x, index) => <group key={x} position={[x, 5.95, -13.98]}>
        <mesh><torusGeometry args={[0.22, 0.034, 8, 24]} /><meshStandardMaterial color={COLORS.gold} metalness={0.3} roughness={0.45} /></mesh>
        <mesh position={[0, 0, 0.03]}><sphereGeometry args={[0.105, 12, 12]} /><meshStandardMaterial color={index % 2 ? COLORS.teal : COLORS.rose} roughness={0.55} /></mesh>
      </group>)}
      {/* Festival strings and marigold toran */}
      <StringLights y={10.72} z={-12.9} width={21} count={55} delay={4.8} startAt={startAt} />
      <StringLights y={5.53} z={-12.72} width={20.6} count={51} delay={5.6} startAt={startAt} />
      <StringLights y={12.98} z={-13.2} width={16} count={37} delay={6.2} startAt={startAt} />
      <MarigoldGarland startAt={startAt} position={[0, 0, -13.92]} />
      <WallSconce position={[-10.0, 4.2, -12.6]} startAt={startAt} delay={6.3} />
      <WallSconce position={[10.0, 4.2, -12.6]} startAt={startAt} delay={6.7} />
      <pointLight position={[0, 8.3, -11.3]} color="#ffd09a" intensity={facadeGlow ? 2.2 : 0.12} distance={22} decay={2} />
    </group>
  );
}

function Rangoli({ position = [0, 0, -2.4] }) {
  const petals = useMemo(() => Array.from({ length: 16 }, (_, index) => index), []);
  const outerDots = useMemo(() => Array.from({ length: 48 }, (_, index) => index), []);
  const petalColors = ["#d77b76", "#e5b56e", "#4a9a8c", "#e6d3ad", "#b879a0"];
  return (
    <group position={position}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.005, 0]}>
        <circleGeometry args={[2.65, 96]} /><meshStandardMaterial color="#4b3b42" roughness={0.95} />
      </mesh>
      {[2.55, 2.38, 1.92, 1.72, 1.25, 0.98, 0.62, 0.32].map((radius, index) => <mesh key={radius} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.025 + index * 0.002, 0]}>
        <torusGeometry args={[radius, index % 2 ? 0.028 : 0.048, 8, 96]} />
        <meshStandardMaterial color={[COLORS.gold, COLORS.teal, COLORS.rose, COLORS.cream, COLORS.gold, COLORS.teal, COLORS.copper, COLORS.gold][index]} metalness={0.27} roughness={0.47} />
      </mesh>)}
      {petals.map((index) => {
        const angle = (index / petals.length) * Math.PI * 2;
        return <group key={index} position={[Math.cos(angle) * 1.37, 0.065, Math.sin(angle) * 1.37]} rotation={[0, -angle, 0]}>
          <mesh scale={[0.3, 0.035, 0.73]}><sphereGeometry args={[1, 18, 12]} /><meshStandardMaterial color={petalColors[index % petalColors.length]} roughness={0.75} /></mesh>
          <mesh position={[0, 0.025, 0]} scale={[0.12, 0.018, 0.5]}><sphereGeometry args={[1, 12, 8]} /><meshStandardMaterial color="#f2d89f" roughness={0.64} /></mesh>
          <mesh position={[0, 0.045, 0.58]}><sphereGeometry args={[0.065, 10, 10]} /><meshStandardMaterial color={COLORS.gold} metalness={0.24} /></mesh>
        </group>;
      })}
      {outerDots.map((index) => {
        const angle = (index / outerDots.length) * Math.PI * 2;
        const radius = index % 2 ? 2.18 : 2.32;
        return <mesh key={index} position={[Math.cos(angle) * radius, 0.07, Math.sin(angle) * radius]}>
          <sphereGeometry args={[index % 3 === 0 ? 0.052 : 0.032, 8, 8]} />
          <meshStandardMaterial color={index % 2 ? COLORS.gold : COLORS.cream} emissive={COLORS.copper} emissiveIntensity={0.12} />
        </mesh>;
      })}
      {/* Layered central lotus */}
      {Array.from({ length: 10 }, (_, index) => {
        const angle = (index / 10) * Math.PI * 2;
        return <group key={index} position={[Math.cos(angle) * 0.42, 0.1, Math.sin(angle) * 0.42]} rotation={[0, -angle, 0]}>
          <mesh scale={[0.13, 0.035, 0.38]}><sphereGeometry args={[1, 12, 8]} /><meshStandardMaterial color={index % 2 ? "#e5a08b" : "#e8c17f"} roughness={0.6} /></mesh>
        </group>;
      })}
      <mesh position={[0, 0.11, 0]}><cylinderGeometry args={[0.22, 0.24, 0.12, 32]} /><meshStandardMaterial color={COLORS.teal} metalness={0.25} roughness={0.48} /></mesh>
      <mesh position={[0, 0.2, 0]}><sphereGeometry args={[0.1, 16, 12]} /><meshStandardMaterial color="#ffe3a1" emissive="#cb8e53" emissiveIntensity={0.4} /></mesh>
    </group>
  );
}

function Tree({ position, scale = 1, variant = 0 }) {
  const clusters = useMemo(() => {
    const random = seededRandom(301 + variant);
    return Array.from({ length: 32 }, () => ({
      x: (random() - 0.5) * 3.1,
      y: 2.5 + random() * 3.0,
      z: (random() - 0.5) * 1.8,
      r: 0.36 + random() * 0.58,
      color: random() > 0.5 ? "#29474a" : "#355452",
    }));
  }, [variant]);
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 1.7, 0]}><cylinderGeometry args={[0.22, 0.37, 3.4, 9]} /><meshStandardMaterial color="#4c3734" roughness={1} /></mesh>
      {[-1, 1].map((side) => <mesh key={side} position={[side * 0.48, 2.35, 0]} rotation={[0, 0, side * -0.48]}><cylinderGeometry args={[0.09, 0.15, 1.9, 7]} /><meshStandardMaterial color="#4c3734" roughness={1} /></mesh>)}
      {clusters.map((cluster, index) => <mesh key={index} position={[cluster.x, cluster.y, cluster.z]} scale={[cluster.r * 1.2, cluster.r * 0.78, cluster.r]}>
        <icosahedronGeometry args={[1, 1]} /><meshStandardMaterial color={cluster.color} roughness={1} flatShading />
      </mesh>)}
    </group>
  );
}

function Planter({ position }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.38, 0]}><cylinderGeometry args={[0.48, 0.34, 0.76, 16]} /><meshStandardMaterial color="#9a624e" roughness={0.72} /></mesh>
      <mesh position={[0, 0.78, 0]}><torusGeometry args={[0.45, 0.06, 8, 24]} /><meshStandardMaterial color={COLORS.gold} metalness={0.38} roughness={0.43} /></mesh>
      <mesh position={[0, 1.25, 0]} scale={[0.62, 0.75, 0.62]}><icosahedronGeometry args={[0.72, 1]} /><meshStandardMaterial color="#31564c" roughness={1} flatShading /></mesh>
      {Array.from({ length: 8 }, (_, index) => {
        const angle = (index / 8) * Math.PI * 2;
        return <mesh key={index} position={[Math.cos(angle) * 0.42, 1.3 + (index % 2) * 0.2, Math.sin(angle) * 0.42]} scale={[0.34, 0.27, 0.34]}>
          <icosahedronGeometry args={[0.7, 1]} /><meshStandardMaterial color={index % 2 ? "#3d6959" : "#294b43"} roughness={1} flatShading />
        </mesh>;
      })}
    </group>
  );
}

function Lantern({ index, startAt }) {
  const group = useRef(null);
  const x = [-7.8, -5.3, -2.8, 0, 2.8, 5.3, 7.8, -9.3, 9.3][index % 9];
  const z = -17 - (index % 3) * 3;
  const releaseAt = 25.5 + (index % 6) * 0.7;
  const lanternGeometry = useMemo(() => new THREE.LatheGeometry([
    new THREE.Vector2(0.16, -0.46), new THREE.Vector2(0.25, -0.39),
    new THREE.Vector2(0.35, -0.23), new THREE.Vector2(0.405, -0.04),
    new THREE.Vector2(0.405, 0.12), new THREE.Vector2(0.35, 0.29),
    new THREE.Vector2(0.25, 0.41), new THREE.Vector2(0.16, 0.46),
  ], 32), []);
  const paperTexture = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 256; canvas.height = 512;
    const ctx = canvas.getContext("2d");
    const gradient = ctx.createLinearGradient(0, 0, 256, 0);
    gradient.addColorStop(0, "#b96639"); gradient.addColorStop(0.32, "#f6c17c");
    gradient.addColorStop(0.66, "#f7d59d"); gradient.addColorStop(1, "#aa593b");
    ctx.fillStyle = gradient; ctx.fillRect(0, 0, 256, 512);
    ctx.strokeStyle = "rgba(116,55,45,.34)"; ctx.lineWidth = 3;
    for (let y = 38; y < 512; y += 82) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(256, y); ctx.stroke();
    }
    ctx.strokeStyle = "rgba(255,235,184,.7)"; ctx.lineWidth = 2;
    for (let column = 0; column < 4; column += 1) {
      for (let row = 0; row < 5; row += 1) {
        const cx = 32 + column * 64; const cy = 49 + row * 91;
        ctx.beginPath(); ctx.arc(cx, cy, 12, 0, Math.PI * 2); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(cx, cy - 17); ctx.lineTo(cx, cy + 17);
        ctx.moveTo(cx - 17, cy); ctx.lineTo(cx + 17, cy); ctx.stroke();
      }
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 4;
    return texture;
  }, []);
  const ribs = useMemo(() => Array.from({ length: 8 }, (_, rib) => {
    const angle = (rib / 8) * Math.PI * 2;
    const points = [
      new THREE.Vector3(Math.cos(angle) * 0.18, -0.44, Math.sin(angle) * 0.18),
      new THREE.Vector3(Math.cos(angle) * 0.31, -0.24, Math.sin(angle) * 0.31),
      new THREE.Vector3(Math.cos(angle) * 0.405, -0.02, Math.sin(angle) * 0.405),
      new THREE.Vector3(Math.cos(angle) * 0.39, 0.18, Math.sin(angle) * 0.39),
      new THREE.Vector3(Math.cos(angle) * 0.27, 0.42, Math.sin(angle) * 0.27),
    ];
    return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 20, 0.012, 5, false);
  }), []);
  useEffect(() => () => {
    lanternGeometry.dispose(); paperTexture.dispose(); ribs.forEach((geometry) => geometry.dispose());
  }, [lanternGeometry, paperTexture, ribs]);
  useFrame(({ clock }) => {
    if (!group.current) return;
    const elapsed = startAt === null ? -1 : (performance.now() - startAt) / 1000;
    const travel = elapsed < releaseAt ? 0 : clamp((elapsed - releaseAt) / 16, 0, 1);
    group.current.visible = travel > 0.001;
    group.current.position.y = 0.5 + travel * 17;
    group.current.position.x = x + Math.sin(clock.elapsedTime * 0.55 + index) * (0.2 + index * 0.008);
    group.current.rotation.z = Math.sin(clock.elapsedTime * 0.45 + index) * 0.055;
    group.current.rotation.x = Math.cos(clock.elapsedTime * 0.35 + index) * 0.045;
  });
  return (
    <group ref={group} position={[x, 0.5, z]} visible={false}>
      <mesh geometry={lanternGeometry}>
        <meshStandardMaterial map={paperTexture} color="#f4d2a0" emissive="#d96931" emissiveMap={paperTexture} emissiveIntensity={0.42} transparent opacity={0.94} side={THREE.DoubleSide} roughness={0.86} depthWrite={false} />
      </mesh>
      {ribs.map((geometry, rib) => <mesh key={rib} geometry={geometry}>
        <meshStandardMaterial color="#744b3e" metalness={0.24} roughness={0.55} />
      </mesh>)}
      {[-0.43, 0.43].map((y) => <mesh key={y} position={[0, y, 0]}>
        <torusGeometry args={[y < 0 ? 0.19 : 0.17, 0.026, 8, 24]} />
        <meshStandardMaterial color={COLORS.gold} metalness={0.5} roughness={0.32} />
      </mesh>)}
      <mesh position={[0, -0.52, 0]}><cylinderGeometry args={[0.14, 0.11, 0.14, 8]} /><meshStandardMaterial color="#3a3036" metalness={0.2} roughness={0.64} /></mesh>
      <mesh position={[0, -0.39, 0]}><sphereGeometry args={[0.095, 12, 10]} /><meshBasicMaterial color="#fff0b3" toneMapped={false} /></mesh>
      <pointLight position={[0, -0.25, 0]} color="#ffb55f" intensity={1.25} distance={4.2} decay={2} />
    </group>
  );
}

function makeRocket(id, startAt) {
  const random = seededRandom(500 + id * 37);
  const x = -8.8 + random() * 17.6;
  const z = -15 + random() * 4.6;
  const targetY = 8.2 + random() * 5.8;
  const count = 190;
  const velocities = new Float32Array(count * 3);
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const color = new THREE.Color(["#ffd58e", "#e9a76e", "#f4e7bf", "#8bd4c4", "#e6a0a8", "#d9b7f0"][id % 6]);
  for (let index = 0; index < count; index += 1) {
    const direction = new THREE.Vector3().randomDirection();
    const speed = 1.7 + random() * 4.3;
    velocities[index * 3] = direction.x * speed;
    velocities[index * 3 + 1] = direction.y * speed;
    velocities[index * 3 + 2] = direction.z * speed * 0.38;
    const variation = 0.74 + random() * 0.45;
    colors[index * 3] = color.r * variation;
    colors[index * 3 + 1] = color.g * variation;
    colors[index * 3 + 2] = color.b * variation;
    positions[index * 3] = x;
    positions[index * 3 + 1] = 0.8;
    positions[index * 3 + 2] = z;
  }
  return { id, x, z, targetY, velocities, positions, colors, bornAt: startAt };
}

function RocketBurst({ rocket, onDone, onBoom }) {
  const pointsRef = useRef(null);
  const rocketRef = useRef(null);
  const trailRef = useRef(null);
  const lightRef = useRef(null);
  const exploded = useRef(false);
  const geometry = useMemo(() => {
    const next = new THREE.BufferGeometry();
    next.setAttribute("position", new THREE.BufferAttribute(rocket.positions, 3));
    next.setAttribute("color", new THREE.BufferAttribute(rocket.colors, 3));
    return next;
  }, [rocket]);
  const material = useMemo(() => new THREE.PointsMaterial({ size: 0.09, sizeAttenuation: true, vertexColors: true, transparent: true, opacity: 1, blending: THREE.AdditiveBlending, depthWrite: false }), []);
  const trailGeometry = useMemo(() => new THREE.CylinderGeometry(0.018, 0.018, 1, 6), []);
  useFrame(() => {
    const age = (performance.now() - rocket.bornAt) / 1000;
    const flight = 0.92 + (rocket.id % 3) * 0.12;
    const flightProgress = clamp(age / flight);
    const rocketY = 0.8 + (rocket.targetY - 0.8) * (1 - Math.pow(1 - flightProgress, 1.65));
    const headPosition = new THREE.Vector3(rocket.x, rocketY, rocket.z);
    if (rocketRef.current) {
      rocketRef.current.visible = age < flight;
      rocketRef.current.position.copy(headPosition);
      rocketRef.current.scale.setScalar(0.85 + Math.sin(age * 32) * 0.08);
    }
    if (trailRef.current) {
      trailRef.current.visible = age < flight;
      const bottom = new THREE.Vector3(rocket.x, Math.max(0.8, rocketY - 1.15), rocket.z);
      const direction = headPosition.clone().sub(bottom);
      trailRef.current.position.copy(bottom).add(headPosition).multiplyScalar(0.5);
      trailRef.current.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.clone().normalize());
      trailRef.current.scale.y = Math.max(0.01, direction.length());
    }
    if (age >= flight && !exploded.current) {
      exploded.current = true;
      onBoom?.();
    }
    const explodedAge = age - flight;
    if (pointsRef.current) {
      pointsRef.current.visible = explodedAge >= 0;
      const attribute = geometry.getAttribute("position");
      const array = attribute.array;
      for (let index = 0; index < rocket.velocities.length / 3; index += 1) {
        const offset = index * 3;
        const velocityScale = Math.exp(-explodedAge * 0.28);
        const t = Math.max(0, explodedAge);
        array[offset] = rocket.x + rocket.velocities[offset] * t * velocityScale;
        array[offset + 1] = rocket.targetY + rocket.velocities[offset + 1] * t * velocityScale - 1.25 * t * t;
        array[offset + 2] = rocket.z + rocket.velocities[offset + 2] * t * velocityScale;
      }
      attribute.needsUpdate = true;
      material.opacity = clamp(1 - explodedAge / 2.45);
      material.size = 0.085 + Math.sin(Math.max(0, explodedAge) * 16) * 0.012;
    }
    if (lightRef.current) {
      lightRef.current.position.set(rocket.x, rocket.targetY, rocket.z);
      lightRef.current.intensity = explodedAge < 0 ? 0 : 12 * Math.exp(-explodedAge * 8);
    }
  });
  useEffect(() => {
    const timer = window.setTimeout(() => onDone(rocket.id), 3650);
    return () => window.clearTimeout(timer);
  }, [rocket.id, onDone]);
  useEffect(() => () => { geometry.dispose(); material.dispose(); trailGeometry.dispose(); }, [geometry, material, trailGeometry]);
  return (
    <group>
      <points ref={pointsRef} geometry={geometry} material={material} visible={false} frustumCulled={false} />
      <mesh ref={rocketRef} visible={false}><sphereGeometry args={[0.075, 10, 10]} /><meshBasicMaterial color="#fff1bd" toneMapped={false} /></mesh>
      <mesh ref={trailRef} geometry={trailGeometry} visible={false}><meshBasicMaterial color="#f6c47c" transparent opacity={0.42} toneMapped={false} /></mesh>
      <pointLight ref={lightRef} color="#ffd29a" intensity={0} distance={11} decay={2} />
    </group>
  );
}

function Fireworks({ startAt, onLaunch, onBoom }) {
  const [rockets, setRockets] = useState([]);
  const idRef = useRef(0);
  const remove = useCallback((id) => setRockets((items) => items.filter((item) => item.id !== id)), []);
  useEffect(() => {
    if (startAt === null) { setRockets([]); return undefined; }
    let interval;
    const launch = () => {
      const id = idRef.current++;
      const rocket = makeRocket(id, performance.now());
      onLaunch?.();
      setRockets((items) => [...items, rocket].slice(-7));
    };
    const first = window.setTimeout(() => {
      launch();
      interval = window.setInterval(launch, 1550);
    }, Math.max(0, 35.5 - (performance.now() - startAt) / 1000) * 1000);
    return () => { window.clearTimeout(first); if (interval) window.clearInterval(interval); };
  }, [startAt, onLaunch]);
  return <>{rockets.map((rocket) => <RocketBurst key={rocket.id} rocket={rocket} onDone={remove} onBoom={onBoom} />)}</>;
}

function createTextCloud(text, seed) {
  const canvas = document.createElement("canvas");
  canvas.width = 1600;
  canvas.height = 300;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "#fff";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.font = "600 164px Georgia, 'Times New Roman', serif";
  context.shadowColor = "#fff";
  context.shadowBlur = 4;
  context.fillText(text.toUpperCase(), 800, 150, 1500);
  const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
  const random = seededRandom(seed);
  const targets = [];
  for (let y = 14; y < canvas.height - 14; y += 5) {
    for (let x = 12; x < canvas.width - 12; x += 5) {
      if (pixels[(y * canvas.width + x) * 4 + 3] > 100 && random() > 0.12) {
        targets.push([(x - 800) * 0.0115, (150 - y) * 0.0115, 0]);
      }
    }
  }
  const from = new Float32Array(targets.length * 3);
  const to = new Float32Array(targets.length * 3);
  const colors = new Float32Array(targets.length * 3);
  const gold = new THREE.Color("#f9d79a");
  const cream = new THREE.Color("#fff0cb");
  targets.forEach((target, index) => {
    const offset = index * 3;
    to[offset] = target[0];
    to[offset + 1] = target[1];
    to[offset + 2] = target[2];
    from[offset] = target[0] + (random() - 0.5) * 8;
    from[offset + 1] = target[1] + (random() - 0.5) * 5;
    from[offset + 2] = (random() - 0.5) * 4;
    const color = random() > 0.18 ? gold : cream;
    colors[offset] = color.r;
    colors[offset + 1] = color.g;
    colors[offset + 2] = color.b;
  });
  return { from, to, colors };
}

function ParticleGreeting({ startAt, text = "HAPPY DIWALI" }) {
  const pointsRef = useRef(null);
  const data = useMemo(() => createTextCloud(text, 811), [text]);
  const geometry = useMemo(() => {
    const next = new THREE.BufferGeometry();
    next.setAttribute("position", new THREE.BufferAttribute(new Float32Array(data.from), 3));
    next.setAttribute("color", new THREE.BufferAttribute(data.colors, 3));
    return next;
  }, [data]);
  const material = useMemo(() => new THREE.PointsMaterial({ size: 0.075, sizeAttenuation: true, vertexColors: true, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }), []);
  useFrame(() => {
    const elapsed = startAt === null ? -1 : (performance.now() - startAt) / 1000;
    const progress = smooth((elapsed - 45.5) / 3.8);
    const positions = geometry.getAttribute("position").array;
    const shimmer = performance.now() * 0.0008;
    for (let index = 0; index < data.to.length / 3; index += 1) {
      const offset = index * 3;
      const drift = Math.sin(shimmer + index * 0.19) * 0.018 * progress;
      positions[offset] = mix(data.from[offset], data.to[offset], progress) + drift;
      positions[offset + 1] = mix(data.from[offset + 1], data.to[offset + 1], progress) + Math.cos(shimmer * 1.2 + index * 0.11) * 0.014 * progress;
      positions[offset + 2] = mix(data.from[offset + 2], 0, progress);
    }
    geometry.getAttribute("position").needsUpdate = true;
    material.opacity = clamp((elapsed - 44.5) / 2.2);
    material.size = 0.07 + Math.sin(shimmer * 5) * 0.006;
  });
  useEffect(() => () => { geometry.dispose(); material.dispose(); }, [geometry, material]);
  return <points ref={pointsRef} geometry={geometry} material={material} position={[0, 15.3, -23]} frustumCulled={false} />;
}

function Stars() {
  const geometry = useMemo(() => {
    const random = seededRandom(904);
    const positions = new Float32Array(540 * 3);
    const colors = new Float32Array(540 * 3);
    for (let index = 0; index < 540; index += 1) {
      const offset = index * 3;
      positions[offset] = (random() - 0.5) * 100;
      positions[offset + 1] = 8 + random() * 44;
      positions[offset + 2] = -42 + random() * 34;
      const warm = random() > 0.65 ? new THREE.Color("#f7d7a4") : new THREE.Color("#c8d4e8");
      colors[offset] = warm.r; colors[offset + 1] = warm.g; colors[offset + 2] = warm.b;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    return geo;
  }, []);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return <points geometry={geometry}><pointsMaterial size={0.085} vertexColors transparent opacity={0.8} sizeAttenuation depthWrite={false} /></points>;
}

function Moon() {
  return (
    <group position={[12, 23, -34]}>
      <mesh><sphereGeometry args={[1.55, 32, 24]} /><meshBasicMaterial color="#f4d9aa" toneMapped={false} /></mesh>
      <mesh position={[0.55, 0.13, 0.7]}><sphereGeometry args={[1.43, 32, 24]} /><meshBasicMaterial color="#201b31" /></mesh>
      <mesh scale={[2.5, 2.5, 2.5]}><sphereGeometry args={[1, 24, 16]} /><meshBasicMaterial color="#e9c58c" transparent opacity={0.075} depthWrite={false} /></mesh>
      <pointLight color="#e4c99a" intensity={1.6} distance={36} decay={2} />
    </group>
  );
}

function CameraDirector({ startAt, onPhase }) {
  const lastPhase = useRef(-1);
  const { size } = useThree();
  const vectors = useMemo(() => ({
    closePosition: new THREE.Vector3(0, 1.78, 6.15),
    closeTarget: new THREE.Vector3(0, 0.42, 2.55),
    widePosition: new THREE.Vector3(0, 12.1, 33),
    wideTarget: new THREE.Vector3(0, 5.1, -14.2),
    rangoliPosition: new THREE.Vector3(0, 6.6, 13.8),
    rangoliTarget: new THREE.Vector3(0, 0.3, -2.4),
    skyPosition: new THREE.Vector3(0, 18.5, 19),
    skyTarget: new THREE.Vector3(0, 14.6, -24),
    position: new THREE.Vector3(),
    target: new THREE.Vector3(),
    fromPosition: new THREE.Vector3(),
    toPosition: new THREE.Vector3(),
    fromTarget: new THREE.Vector3(),
    toTarget: new THREE.Vector3(),
  }), []);
  useFrame(({ camera, clock }) => {
    const elapsed = startAt === null ? -1 : (performance.now() - startAt) / 1000;
    const portrait = size.width / size.height < 0.76;
    let phase = 0;
    let fromPosition = vectors.closePosition;
    let toPosition = vectors.closePosition;
    let fromTarget = vectors.closeTarget;
    let toTarget = vectors.closeTarget;
    let progress = 1;
    if (elapsed < 0) {
      phase = 0;
    } else if (elapsed < 4.8) {
      phase = 1;
    } else if (elapsed < 14) {
      phase = 2;
      fromPosition = vectors.closePosition;
      toPosition = vectors.widePosition;
      fromTarget = vectors.closeTarget;
      toTarget = vectors.wideTarget;
      progress = smooth((elapsed - 4.8) / 9.2);
    } else if (elapsed < 25) {
      phase = 3;
      fromPosition = toPosition = vectors.widePosition;
      fromTarget = toTarget = vectors.wideTarget;
    } else if (elapsed < 32.5) {
      phase = 4;
      fromPosition = vectors.widePosition;
      toPosition = vectors.rangoliPosition;
      fromTarget = vectors.wideTarget;
      toTarget = vectors.rangoliTarget;
      progress = smooth((elapsed - 25) / 7.5);
    } else if (elapsed < 38.5) {
      phase = 5;
      fromPosition = vectors.rangoliPosition;
      toPosition = vectors.skyPosition;
      fromTarget = vectors.rangoliTarget;
      toTarget = vectors.skyTarget;
      progress = smooth((elapsed - 32.5) / 6);
    } else if (elapsed < 50) {
      phase = 5;
      fromPosition = toPosition = vectors.skyPosition;
      fromTarget = toTarget = vectors.skyTarget;
    } else {
      phase = 6;
      fromPosition = toPosition = vectors.skyPosition;
      fromTarget = toTarget = vectors.skyTarget;
    }
    vectors.position.lerpVectors(fromPosition, toPosition, progress);
    vectors.target.lerpVectors(fromTarget, toTarget, progress);
    if (portrait) {
      const pullBack = phase === 0 || phase === 1 ? 0 : phase <= 3 ? 8 : phase <= 4 ? 3.5 : 5;
      vectors.position.z += pullBack;
      if (phase === 0 || phase === 1) vectors.position.z += 0.25;
    }
    if (phase === 1) {
      vectors.position.x += Math.sin(clock.elapsedTime * 0.35) * 0.025;
      vectors.position.y += Math.sin(clock.elapsedTime * 0.55) * 0.025;
    }
    camera.position.copy(vectors.position);
    camera.lookAt(vectors.target);
    const desiredFov = portrait ? (phase <= 1 ? 43 : 49) : 42;
    if (camera.isPerspectiveCamera && Math.abs(camera.fov - desiredFov) > 0.1) {
      camera.fov = mix(camera.fov, desiredFov, 0.08);
      camera.updateProjectionMatrix();
    }
    if (phase !== lastPhase.current) {
      lastPhase.current = phase;
      onPhase?.(phase);
    }
  });
  return null;
}

function SceneContents({ startAt, onIgnite, onPhase, onLaunch, onBoom }) {
  const plasterTexture = useMemo(() => makePlasterTexture(), []);
  const stoneTexture = useMemo(() => makeStoneTexture(), []);
  const diyaPositions = useMemo(() => {
    const items = [{ position: [0, 0, 2.55], delay: 0, scale: 1.48 }];
    const paths = [
      { z: 5.8, xs: [-8.2, -5.5, -2.8, 2.8, 5.5, 8.2] },
      { z: 3.0, xs: [-7.8, -5.2, -2.6, 2.6, 5.2, 7.8] },
      { z: 0.1, xs: [-8.4, -5.6, -2.8, 2.8, 5.6, 8.4] },
      { z: -3.2, xs: [-8.8, -6.0, -3.2, 3.2, 6.0, 8.8] },
      { z: -7.2, xs: [-9.3, -6.2, -3.1, 3.1, 6.2, 9.3] },
      { z: -10.4, xs: [-8.0, -4.0, 4.0, 8.0] },
    ];
    paths.forEach((row, rowIndex) => row.xs.forEach((x) => items.push({ position: [x, 0, row.z], delay: 0.5 + items.length * 0.16, scale: 0.66 + (items.length % 3) * 0.055 })));
    for (let index = 0; index < 16; index += 1) {
      const angle = (index / 16) * Math.PI * 2;
      items.push({ position: [Math.cos(angle) * 3.35, 0, -2.4 + Math.sin(angle) * 3.35], delay: 2.2 + index * 0.09, scale: 0.58 });
    }
    return items;
  }, []);
  useEffect(() => () => { plasterTexture.dispose(); stoneTexture.dispose(); }, [plasterTexture, stoneTexture]);
  return (
    <>
      <color attach="background" args={[COLORS.night]} />
      <fog attach="fog" args={[COLORS.night, 29, 78]} />
      <ambientLight intensity={0.53} color="#c6b7d0" />
      <hemisphereLight args={["#d7c5dd", "#33252d", 0.72]} />
      <directionalLight position={[-11, 19, 9]} intensity={1.55} color="#ffe3c0" castShadow shadow-mapSize-width={1024} shadow-mapSize-height={1024} shadow-camera-far={48} shadow-camera-left={-22} shadow-camera-right={22} shadow-camera-top={25} shadow-camera-bottom={-18} />
      <pointLight position={[0, 4.6, 5]} color="#e8a971" intensity={0.22} distance={19} decay={2} />
      <Stars />
      <Moon />
      <FloorTiles texture={stoneTexture} />
      <House startAt={startAt} plasterTexture={plasterTexture} />
      <Rangoli />
      <Tree position={[-12.8, 0, -10.5]} scale={1.05} variant={0} />
      <Tree position={[12.6, 0, -9.8]} scale={1.18} variant={1} />
      <Planter position={[-12.1, 0, 0.2]} />
      <Planter position={[12.1, 0, -1.0]} />
      {/* Courtyard perimeter walls, caps, niches and warm side lamps */}
      {[-15.15, 15.15].map((x) => <group key={x} position={[x, 0, -0.8]}>
        <mesh position={[0, 0.94, 0]} castShadow><boxGeometry args={[0.48, 1.88, 30]} /><meshStandardMaterial color="#72594f" roughness={0.88} /></mesh>
        <mesh position={[0, 1.91, 0]}><boxGeometry args={[0.68, 0.13, 30.2]} /><meshStandardMaterial color="#c2a083" roughness={0.72} /></mesh>
        {[-12, -7, -2, 3, 8, 12].map((z) => <mesh key={z} position={[x < 0 ? 0.26 : -0.26, 0.92, z]}><boxGeometry args={[0.035, 0.88, 1.25]} /><meshStandardMaterial color="#b28a6c" roughness={0.75} /></mesh>)}
      </group>)}
      <mesh position={[0, 0.94, 14.2]}><boxGeometry args={[30.3, 1.88, 0.48]} /><meshStandardMaterial color="#72594f" roughness={0.88} /></mesh>
      <mesh position={[0, 1.91, 14.2]}><boxGeometry args={[30.5, 0.13, 0.68]} /><meshStandardMaterial color="#c2a083" roughness={0.72} /></mesh>
      {diyaPositions.map((entry, index) => <Diya key={index} position={entry.position} scale={entry.scale} delay={entry.delay} startAt={startAt} active={index === 0} onIgnite={onIgnite} index={index} />)}
      {Array.from({ length: 9 }, (_, index) => <Lantern key={index} index={index} startAt={startAt} />)}
      <Fireworks startAt={startAt} onLaunch={onLaunch} onBoom={onBoom} />
      <ParticleGreeting startAt={startAt} />
      <CameraDirector startAt={startAt} onPhase={onPhase} />
      <EffectComposer multisampling={0}>
        <Bloom intensity={1.18} luminanceThreshold={0.78} luminanceSmoothing={0.23} mipmapBlur />
        <Vignette eskil={false} offset={0.18} darkness={0.48} />
      </EffectComposer>
    </>
  );
}

export default function SceneExperience({ startAt, onIgnite, onPhase, onLaunch, onBoom, onReady }) {
  return (
    <Canvas
      shadows
      dpr={[1, 1.45]}
      camera={{ position: [0, 1.78, 6.15], fov: 42, near: 0.1, far: 120 }}
      gl={{ antialias: true, powerPreference: "high-performance", alpha: false, stencil: false }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.12;
        gl.outputColorSpace = THREE.SRGBColorSpace;
        gl.setClearColor(COLORS.night, 1);
        onReady?.();
      }}
      onPointerMissed={() => {}}
    >
      <React.Suspense fallback={null}>
        <SceneContents startAt={startAt} onIgnite={onIgnite} onPhase={onPhase} onLaunch={onLaunch} onBoom={onBoom} />
      </React.Suspense>
    </Canvas>
  );
}
