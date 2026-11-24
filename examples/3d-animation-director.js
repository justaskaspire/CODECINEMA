// CODECINEMA v0.22 — 3D ANIMATION DIRECTOR
// Test keyframe tracks, easing, vector animation, camera moves and orbit paths.
// Paste into the editor or load this file as a script.

const clamp = (v) => api.clamp(v, 0, 1);
const intro = api.track(t, [
  { time: 0, value: 0, ease: "out" },
  { time: 2, value: 1 }
]);
const heroY = api.track(t, [
  { time: 0, value: -2.4, ease: "out" },
  { time: 2.5, value: 0.15 },
  { time: 7, value: 0.15, ease: "hold" },
  { time: 9, value: 2.1, ease: "in" },
  { time: 11, value: -2.4 }
]);
const heroRot = api.track(t, [
  { time: 0, value: [0, 0, 0] },
  { time: 4, value: [0.4, Math.PI * 2, 0.2] },
  { time: 8, value: [0, Math.PI * 4, 0] },
  { time: 12, value: [0.4, Math.PI * 6, -0.2] }
]);
const cameraPos = api.track(t, [
  { time: 0, value: [0, 2.5, 13], ease: "out" },
  { time: 4, value: [5, 3.2, 9] },
  { time: 8, value: [0, 1.4, 7] },
  { time: 12, value: [-4, 2.8, 9] },
  { time: 16, value: [0, 2, 12] }
]);

ctx.fillStyle = "#030711";
ctx.fillRect(0, 0, w, h);

// Animated 2D star field, deterministic across preview and export.
for (let i = 0; i < 110; i++) {
  const r = api.random(i + 31);
  const q = api.random(i + 701);
  const x = (r * w + t * (8 + q * 18)) % w;
  const y = q * h;
  ctx.globalAlpha = 0.2 + q * 0.55;
  ctx.fillStyle = "#c9e5ff";
  ctx.fillRect(x, y, 1.2 + q, 1.2 + q);
}
ctx.globalAlpha = 1;

const orbitA = api.orbit3D(t, 3.1, 0.55, 0.4, 0.15);
const orbitB = api.orbit3D(t, 4.4, -0.31, 2.1, -0.25);
const objects = [
  { id: "hero-core", type: "torusKnot", radius: 0.92, tube: 0.22, segments: 48, position: [0, heroY, 0], rotation: heroRot, color: "#91e8ff", emissive: "#1769d2", emissiveIntensity: 1.35, metalness: 0.7, roughness: 0.22 },
  { id: "inner-ring", type: "torus", radius: 1.55, tube: 0.025, segments: 64, position: [0, heroY, 0], rotation: [Math.PI / 2, t * 0.45, 0], color: "#b5ff6d", emissive: "#6aa52f", emissiveIntensity: 0.8, metalness: 0.65, roughness: 0.25 },
  { id: "outer-ring", type: "torus", radius: 2.15, tube: 0.012, segments: 64, position: [0, heroY, 0], rotation: [0.8, -t * 0.22, t * 0.16], color: "#7dd3fc", metalness: 0.8, roughness: 0.2 },
  { id: "satellite-a", type: "sphere", radius: 0.22, position: orbitA, color: "#ffbd70", emissive: "#b95d20", emissiveIntensity: 0.6, metalness: 0.5, roughness: 0.3 },
  { id: "satellite-b", type: "box", size: [0.28, 0.28, 0.28], position: orbitB, rotation: [t * 0.7, t * 0.9, t * 0.4], color: "#c5a5ff", emissive: "#6841b8", emissiveIntensity: 0.8, metalness: 0.6, roughness: 0.28 },
  { id: "floor", type: "plane", width: 22, height: 22, position: [0, -2.8, 0], rotation: [-Math.PI / 2, 0, 0], color: "#101a2a", metalness: 0.25, roughness: 0.65, receiveShadow: true }
];

api.render3D(ctx, t, w, h, {
  quality: "medium",
  background: "#030711",
  camera: { position: cameraPos, lookAt: [0, 0, 0], fov: 42 },
  lights: [
    { id: "ambient", type: "ambient", color: "#a8c8ff", intensity: 0.85 },
    { id: "key", type: "directional", color: "#d8f3ff", intensity: 2.2, position: [4, 7, 6], castShadow: true },
    { id: "rim", type: "point", color: "#4f8dff", intensity: 35, position: [-4, 1, -3] },
    { id: "warm", type: "point", color: "#b5ff6d", intensity: 18, position: [3, -1, 4] }
  ],
  shadows: true,
  objects,
  particles: [
    { id: "dust", count: 260, color: "#b9ddff", size: 0.025, opacity: 0.7, spread: [13, 8, 9], speed: 0.08, seed: 44 }
  ]
});

// Typography is composited above the 3D render.
ctx.save();
ctx.globalAlpha = intro;
ctx.textAlign = "center";
ctx.textBaseline = "middle";
ctx.shadowColor = "#62b9ff";
ctx.shadowBlur = 24;
ctx.fillStyle = "#f4f8ff";
ctx.font = "900 " + Math.round(Math.min(w, h) * 0.075) + "px Arial";
ctx.fillText("ANIMATION DIRECTOR", w / 2, h * 0.16);
ctx.shadowBlur = 0;
ctx.fillStyle = "#b5ff6d";
ctx.font = "600 " + Math.round(Math.min(w, h) * 0.025) + "px Arial";
ctx.fillText("KEYFRAMES  /  CAMERA  /  ORBIT", w / 2, h * 0.215);
ctx.restore();

const outro = clamp((t - 14) / 2);
ctx.save();
ctx.globalAlpha = outro;
ctx.textAlign = "center";
ctx.fillStyle = "#d8e7f7";
ctx.font = "700 " + Math.round(Math.min(w, h) * 0.027) + "px Arial";
ctx.fillText("EVERY MOMENT, ON YOUR TIMELINE", w / 2, h * 0.86);
ctx.restore();

api.vignette(ctx, 0.52);
api.grain(ctx, t, 0.025, 90);
