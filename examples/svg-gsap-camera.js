// SVG + GSAP CAMERA PATH — vector character parts and deterministic 3D camera moves.
// SVG paths use SVG path-data syntax and are drawn directly into Canvas 2D.
// Camera easing names are GSAP ease strings, for example "power2.inOut".
ctx.fillStyle = "#080d18";
ctx.fillRect(0, 0, w, h);

// Simple vector character assembled from SVG paths.
api.svgPath(ctx, "M 0 -42 C 24 -42 28 -12 0 -8 C -28 -12 -24 -42 0 -42 Z", {
  x: w * 0.5, y: h * 0.48, scaleX: 1.2, scaleY: 1.2,
  fill: "#f4f7fb", stroke: "#b5ff6d", lineWidth: 2
});
api.svgPath(ctx, "M -10 -25 Q -5 -30 0 -25 M 4 -25 Q 9 -30 14 -25", {
  x: w * 0.5, y: h * 0.48, scaleX: 1.2, scaleY: 1.2,
  fill: null, stroke: "#101827", lineWidth: 2.5
});
api.svgPath(ctx, "M 0 -8 L 0 38 M 0 8 L -24 25 M 0 8 L 24 25 M 0 38 L -18 64 M 0 38 L 18 64", {
  x: w * 0.5, y: h * 0.48, scaleX: 1.2, scaleY: 1.2,
  fill: null, stroke: "#b5ff6d", lineWidth: 5
});

// GSAP-eased, frame-accurate camera path.
const camera = api.cameraPath3D(t, [
  { time: 0, position: [0, 1.5, 10], lookAt: [0, 0, 0], fov: 48, ease: "power2.inOut" },
  { time: 3, position: [2.8, 1.1, 7], lookAt: [0, 0, 0], fov: 40, ease: "power3.inOut" },
  { time: 6, position: [-1.5, 2.2, 8], lookAt: [0, 0, 0], fov: 45, ease: "sine.inOut" }
], false);

api.render3D(ctx, t, w, h, {
  quality: "medium",
  camera,
  lights: [
    { id: "ambient", type: "ambient", color: "#b8d7ff", intensity: 1.1 },
    { id: "key", type: "directional", color: "#b5ff6d", intensity: 1.7, position: [3, 5, 4] }
  ],
  objects: [
    { id: "hero-orbit", type: "torus", radius: 1.5, tube: 0.025, rotation: [Math.PI / 2, 0, t * 0.2], color: "#6e8cff", opacity: 0.7, transparent: true }
  ]
});

ctx.fillStyle = "#f4f7fb";
ctx.textAlign = "center";
ctx.font = "700 24px Arial";
ctx.fillText("SVG CHARACTER + GSAP CAMERA", w / 2, h * 0.88);
