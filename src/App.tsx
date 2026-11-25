import { useCallback, useEffect, useRef, useState } from "react";
import packageJson from "../package.json";
import { renderExport, type ExportContainer } from "./mediaExport";
import { createAdvancedApi } from "./advancedEngines";
import { BabylonSceneRenderer } from "./babylonEngine";
import type { ThreeSceneConfig, ThreeObjectSpec, ThreeLightSpec, ThreeParticleSpec } from "./threeEngine";

const babylonSceneRenderer = new BabylonSceneRenderer();

const starterCode = `// CODECINEMA — your video is a function of time.
// Available: ctx (Canvas 2D), t (seconds), w (width), h (height)
// Write normal JavaScript. This code runs once for every frame.

const bg = ctx.createLinearGradient(0, 0, w, h);
bg.addColorStop(0, "#101b2c");
bg.addColorStop(1, "#05070d");
ctx.fillStyle = bg;
ctx.fillRect(0, 0, w, h);

// Moving light
const glow = ctx.createRadialGradient(
  w * (0.72 + Math.sin(t * 0.45) * 0.08), h * 0.28, 0,
  w * 0.72, h * 0.28, w * 0.65
);
glow.addColorStop(0, "rgba(181,255,109,0.22)");
glow.addColorStop(1, "rgba(181,255,109,0)");
ctx.fillStyle = glow;
ctx.fillRect(0, 0, w, h);

// Fine grid
ctx.strokeStyle = "rgba(255,255,255,0.045)";
ctx.lineWidth = 1;
for (let x = 0; x < w; x += 48) {
  ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
}
for (let y = 0; y < h; y += 48) {
  ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
}

// Animated title
const enter = Math.min(1, t / 1.2);
const ease = 1 - Math.pow(1 - enter, 3);
ctx.save();
ctx.globalAlpha = ease;
ctx.translate(w / 2, h * 0.46 + (1 - ease) * 70);
ctx.textAlign = "center";
ctx.textBaseline = "middle";
ctx.fillStyle = "#f4f7fb";
ctx.font = "800 104px Arial";
ctx.fillText("MAKE IT", 0, 0);
ctx.fillStyle = "#b5ff6d";
ctx.fillRect(-54, 76, 108, 5);
ctx.fillStyle = "#aab5c6";
ctx.font = "500 25px Arial";
ctx.fillText("A STORY WORTH WATCHING", 0, 132);
ctx.restore();

// Timecode-inspired footer
ctx.fillStyle = "rgba(255,255,255,0.42)";
ctx.font = "12px monospace";
ctx.textAlign = "left";
ctx.fillText("CODECINEMA / 001", 54, h - 42);
ctx.textAlign = "right";
ctx.fillText(t.toFixed(2) + " SEC", w - 54, h - 42);`;


const examples: Record<string, string> = {
  "3D Solar System": `// TRUE 3D SOLAR SYSTEM — real Babylon.js geometry, camera, lighting and materials
// Call api.render3D once per frame. Keep object IDs stable; animate transforms with t.
ctx.fillStyle="#030611"; ctx.fillRect(0,0,w,h);
for(let i=0;i<100;i++){
  const a=Math.sin(i*127.1+311.7)*43758.5453;
  const b=Math.sin(i*269.5+91.7)*15731.743;
  ctx.globalAlpha=.25+.55*Math.abs(Math.sin(t*1.4+i));
  ctx.fillStyle="#d8eaff";
  ctx.fillRect((a-Math.floor(a))*w,(b-Math.floor(b))*h,1.5,1.5);
}
ctx.globalAlpha=1;
const orbit=(r,s,p=0)=>[Math.cos(t*s+p)*r,0,Math.sin(t*s+p)*r];

api.render3D(ctx,t,w,h,{
  quality:"medium",
  camera:{position:[Math.sin(t*.16)*1.2,4.2,10.5],lookAt:[0,0,0],fov:43},
  lights:[
    {id:"ambient",type:"ambient",color:"#9abaff",intensity:1.05},
    {id:"sun-light",type:"point",color:"#ffe0a3",intensity:48,position:[0,0,0]},
    {id:"blue-fill",type:"directional",color:"#528cff",intensity:1.4,position:[-5,4,6]}
  ],
  objects:[
    {id:"sun",type:"sphere",radius:.72,segments:32,color:"#ffb33d",emissive:"#ff6a00",emissiveIntensity:1.35,roughness:.8,rotation:[0,t*.12,0]},
    {id:"orbit-mercury",type:"torus",radius:1.25,tube:.006,rotation:[Math.PI/2,0,0],color:"#6d829f",unlit:true,opacity:.55,transparent:true},
    {id:"mercury",type:"sphere",radius:.12,segments:20,position:orbit(1.25,1.15),color:"#a7a9ad",roughness:.9},
    {id:"orbit-venus",type:"torus",radius:2,tube:.006,rotation:[Math.PI/2,0,0],color:"#a88a62",unlit:true,opacity:.45,transparent:true},
    {id:"venus",type:"sphere",radius:.2,segments:24,position:orbit(2,.72,1.4),color:"#e4b77b",roughness:.8},
    {id:"orbit-earth",type:"torus",radius:2.9,tube:.007,rotation:[Math.PI/2,0,0],color:"#4b8bd1",unlit:true,opacity:.5,transparent:true},
    {id:"earth",type:"sphere",radius:.25,segments:28,position:orbit(2.9,.48,2.3),color:"#267bd5",metalness:.15,roughness:.48,rotation:[t*.25,t*.7,0]},
    {id:"earth-moon",type:"sphere",radius:.065,segments:16,position:[Math.cos(t*1.8)*.42+Math.cos(t*.48+2.3)*2.9,.04,Math.sin(t*1.8)*.42+Math.sin(t*.48+2.3)*2.9],color:"#c7ced8",roughness:.9},
    {id:"orbit-mars",type:"torus",radius:3.85,tube:.007,rotation:[Math.PI/2,0,0],color:"#a75d4d",unlit:true,opacity:.4,transparent:true},
    {id:"mars",type:"sphere",radius:.17,segments:22,position:orbit(3.85,.32,.8),color:"#c45c43",roughness:.95},
    {id:"saturn-orbit",type:"torus",radius:4.85,tube:.007,rotation:[Math.PI/2,0,0],color:"#a99b77",unlit:true,opacity:.35,transparent:true},
    {id:"saturn",type:"sphere",radius:.31,segments:28,position:orbit(4.85,.22,2.8),color:"#d4b47e",roughness:.8,rotation:[.25,t*.35,0]},
    {id:"saturn-rings",type:"torus",radius:.48,tube:.065,segments:40,position:orbit(4.85,.22,2.8),rotation:[Math.PI/2.5,.15,0],color:"#c9a879",metalness:.25,roughness:.7},
    {id:"nexus",type:"torusKnot",radius:.16,tube:.035,position:[0,1.45,0],rotation:[t*.5,t*.8,0],color:"#6bdcff",emissive:"#168bff",emissiveIntensity:1.8,metalness:.65,roughness:.25}
  ]
});

// Canvas 2D titles are composited over the real 3D scene.
const intro=Math.max(0,Math.min(1,t/1.5));
ctx.globalAlpha=intro; ctx.textAlign="center";
ctx.fillStyle="#f4f8ff"; ctx.font="800 "+(Math.min(w,h)*.045)+"px Arial";
ctx.shadowColor="#4b9cff"; ctx.shadowBlur=18;
ctx.fillText("SOLAR SYSTEM",w/2,h*.12);
ctx.shadowBlur=0; ctx.fillStyle="#9db8dd";
ctx.font="500 "+(Math.min(w,h)*.019)+"px Arial";
ctx.fillText("A REAL-TIME 3D SCENE",w/2,h*.165);
ctx.globalAlpha=1;
ctx.fillStyle="rgba(160,205,255,.75)"; ctx.font="12px monospace"; ctx.textAlign="left";
ctx.fillText("CODECINEMA 3D ENGINE / v0.20",24,h-24);`,
  "Cinematic title": starterCode,
  "Particle universe": `// PARTICLE UNIVERSE — a procedural field of glowing particles
const rand = (n) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
ctx.fillStyle = "#050812"; ctx.fillRect(0, 0, w, h);
const cx = w / 2, cy = h / 2;
for (let i = 0; i < 180; i++) {
  const depth = rand(i + 1);
  const speed = 0.12 + depth * 0.6;
  const angle = rand(i + 300) * Math.PI * 2 + t * speed;
  const radius = (0.08 + rand(i + 700) * 0.48) * Math.min(w, h);
  const x = cx + Math.cos(angle) * radius;
  const y = cy + Math.sin(angle) * radius;
  const size = 1 + depth * 3;
  ctx.globalAlpha = 0.2 + depth * 0.75;
  ctx.fillStyle = depth > 0.82 ? "#b5ff6d" : "#b8d7ff";
  ctx.beginPath(); ctx.arc(x, y, size, 0, Math.PI * 2); ctx.fill();
}
ctx.globalAlpha = 1;
const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.min(w,h)*0.3);
g.addColorStop(0, "rgba(76,126,255,.16)"); g.addColorStop(1, "rgba(76,126,255,0)");
ctx.fillStyle = g; ctx.fillRect(0,0,w,h);`,
  "Orbiting geometry": `// ORBITING GEOMETRY — concentric motion and clean graphic design
ctx.fillStyle = "#090b10"; ctx.fillRect(0, 0, w, h);
const cx = w/2, cy = h/2, unit = Math.min(w,h)*0.28;
ctx.strokeStyle = "rgba(255,255,255,.14)"; ctx.lineWidth = 2;
for (let i=1;i<=4;i++) { ctx.beginPath(); ctx.arc(cx,cy,unit*i/4,0,Math.PI*2); ctx.stroke(); }
for (let i=0;i<3;i++) {
  const a=t*(0.65+i*0.18)+i*2.1, r=unit*(0.35+i*0.29);
  const x=cx+Math.cos(a)*r, y=cy+Math.sin(a)*r;
  ctx.fillStyle=["#b5ff6d","#7dd3fc","#f0abfc"][i];
  ctx.shadowColor=ctx.fillStyle; ctx.shadowBlur=24;
  ctx.beginPath(); ctx.arc(x,y,12+i*4,0,Math.PI*2); ctx.fill(); ctx.shadowBlur=0;
}
ctx.textAlign="center"; ctx.fillStyle="#f4f7fb"; ctx.font="700 34px Arial";
ctx.fillText("MOTION / STUDY 01",cx,h*.88);`,
  "Wave typography": `// WAVE TYPOGRAPHY — a title distorted by a flowing wave
ctx.fillStyle = "#070a10"; ctx.fillRect(0,0,w,h);
const title="CREATE THE IMPOSSIBLE";
ctx.textAlign="center"; ctx.textBaseline="middle";
ctx.font="900 76px Arial";
const chars=[...title], widths=chars.map(c=>ctx.measureText(c).width);
let x=(w-widths.reduce((a,b)=>a+b,0))/2;
chars.forEach((c,i)=>{
  const y=h/2+Math.sin(t*2.2+i*.42)*34;
  ctx.fillStyle=i%3===0?"#b5ff6d":"#f2f5fa";
  ctx.fillText(c,x+widths[i]/2,y); x+=widths[i];
});
ctx.fillStyle="rgba(255,255,255,.42)"; ctx.font="16px monospace";
ctx.fillText("EVERY FRAME IS CODE",w/2,h*.72);`,
  "Kinetic typography": `// KINETIC TYPOGRAPHY — animated type, staggered reveals and text masking
ctx.fillStyle = "#070914"; ctx.fillRect(0,0,w,h);
const cx=w/2, cy=h/2, unit=Math.min(w,h);
const pulse=0.5+0.5*Math.sin(t*1.4);
for(let i=0;i<22;i++){
  const x=(i/21)*w;
  ctx.strokeStyle="rgba(120,150,255,"+(0.035+pulse*0.025)+")";
  ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,h); ctx.stroke();
}
api.glow(ctx,cx,cy,unit*0.42,"#4935bd",0.22);
ctx.textAlign="center"; ctx.textBaseline="middle";
ctx.fillStyle="#91a4d8"; ctx.font="600 "+(unit*0.026)+"px Arial";
ctx.fillText("CODE  /  MOTION  /  STORY",cx,cy-unit*0.29);
api.textReveal(ctx,"MAKE IT MOVE",cx,cy-unit*0.08,api.smoothstep(0.04,0.72,t/5),{
  font:"900 "+(unit*0.105)+"px Arial",color:"#f7f8ff",align:"center",
  mode:"chars",stagger:0.045,tracking:1.5,shadowColor:"#6d5cff",shadowBlur:22
});
api.textReveal(ctx,"EVERY FRAME HAS A PURPOSE",cx,cy+unit*0.09,api.smoothstep(0,1,(t-1.2)/4),{
  font:"600 "+(unit*0.027)+"px Arial",color:"#aeb9df",align:"center",
  mode:"rise",stagger:0.018
});
const maskP=api.smoothstep(0,1,(t-5)/2.5);
api.textMask(ctx,"CODECINEMA",cx,cy+unit*0.28,maskP,{
  font:"800 "+(unit*0.065)+"px Arial",align:"center",
  colors:["#48e5ff","#a78bfa","#ff72c6"],direction:"left"
});
ctx.fillStyle="rgba(255,255,255,.42)"; ctx.font="500 "+(unit*0.019)+"px Arial";
ctx.fillText("A CODE-DRIVEN MOTION STUDIO",cx,cy+unit*0.39);
api.vignette(ctx,0.62);
api.grain(ctx,t,0.045,120);`,
  "Cinematic effects": `// CINEMATIC EFFECTS — glow, particles, camera movement, grading and film finish
ctx.fillStyle = "#050812"; ctx.fillRect(0,0,w,h);
const shake = api.shake(t, 3, 18);
api.camera(ctx, shake.x, shake.y, 1 + Math.sin(t*0.4)*0.025, 0, () => {
  const cx=w/2, cy=h/2;
  api.glow(ctx,cx,cy,Math.min(w,h)*0.42,"#2563eb",0.65);
  ctx.strokeStyle="rgba(125,211,252,.3)"; ctx.lineWidth=2;
  for(let i=0;i<5;i++){ctx.beginPath();ctx.arc(cx,cy,50+i*34+t*9,0,Math.PI*2);ctx.stroke();}
  api.particles(ctx,t,150,{color:"#dbeafe",speed:0.18,size:2.2,seed:17,opacity:0.8});
  ctx.textAlign="center";ctx.textBaseline="middle";
  ctx.fillStyle="#f8fafc";ctx.font="900 72px Arial";
  ctx.shadowColor="#60a5fa";ctx.shadowBlur=28;
  ctx.fillText("CINEMATIC",cx,cy-8);ctx.shadowBlur=0;
  ctx.fillStyle="#93c5fd";ctx.font="600 18px Arial";
  ctx.fillText("LIGHT • MOTION • ATMOSPHERE",cx,cy+58);
});
api.colorWash(ctx,"#0b1d3a",0.12);
api.vignette(ctx,0.72);
api.grain(ctx,t,0.07,180);`,
  "Compositing & Light Lab": `// COMPOSITING & LIGHT LAB — blend modes, masks, blur, ripples, lightning and lens flares
const cx=w/2, cy=h/2, unit=Math.min(w,h);
ctx.fillStyle="#050812";ctx.fillRect(0,0,w,h);
const pulse=.5+.5*Math.sin(t*1.7);
const orbX=cx+Math.sin(t*.55)*unit*.12, orbY=cy+Math.cos(t*.7)*unit*.09;
api.blend(ctx,"screen",()=>{
  api.glow(ctx,orbX,orbY,unit*.34,"#3478ff",.72);
  api.glow(ctx,cx,cy,unit*.19,"#a855f7",.32);
});
api.clipCircle(ctx,orbX,orbY,unit*.13,()=>{
  const g=ctx.createLinearGradient(orbX-unit*.12,orbY-unit*.12,orbX+unit*.13,orbY+unit*.13);
  g.addColorStop(0,"#dbeafe");g.addColorStop(.35,"#4f9fff");g.addColorStop(1,"#101b43");
  ctx.fillStyle=g;ctx.fillRect(orbX-unit*.14,orbY-unit*.14,unit*.28,unit*.28);
  ctx.strokeStyle="rgba(255,255,255,.6)";ctx.lineWidth=2;
  for(let i=0;i<7;i++){ctx.beginPath();ctx.arc(orbX,orbY,unit*(.035+i*.014),0,Math.PI*2);ctx.stroke();}
});
api.ripple(ctx,orbX,orbY,t,{color:"#7dd3fc",speed:unit*.18,rings:5,maxRadius:unit*.36,width:2,opacity:.65});
api.lightning(ctx,orbX-unit*.4,orbY-unit*.5,orbX+unit*.3,orbY+unit*.35,t,{color:"#b9eaff",width:2,segments:15,seed:7});
api.lensFlare(ctx,orbX-unit*.18,orbY-unit*.22,.65+pulse*.5,"#c8edff");
api.blur(ctx,1.5,()=>{
  ctx.strokeStyle="rgba(167,139,250,.22)";ctx.lineWidth=unit*.003;
  for(let i=0;i<5;i++){ctx.beginPath();ctx.arc(cx,cy,unit*(.18+i*.055),0,Math.PI*2);ctx.stroke();}
});
ctx.textAlign="center";ctx.textBaseline="middle";
ctx.fillStyle="#f8fafc";ctx.font="800 "+(unit*.055)+"px Arial";
ctx.fillText("LIGHT / COMPOSITE",cx,h*.82);
ctx.fillStyle="#9db5d7";ctx.font="500 "+(unit*.023)+"px Arial";
ctx.fillText("BLEND  •  MASK  •  LENS  •  ENERGY",cx,h*.88);
api.vignette(ctx,.68);api.grain(ctx,t,.035,100);`,
  "Motion graphics lab": `// MOTION GRAPHICS LAB — spring physics, path animation, stagger and counters
ctx.fillStyle = "#070a12"; ctx.fillRect(0,0,w,h);
const unit=Math.min(w,h), cx=w/2, cy=h/2;
const ease=api.cubicBezier(api.clamp(t/2.2),0.16,1,0.3,1);
const points=[{x:w*.12,y:h*.68},{x:w*.28,y:h*.28},{x:w*.52,y:h*.62},{x:w*.76,y:h*.25},{x:w*.9,y:h*.55}];
ctx.beginPath(); points.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));
ctx.strokeStyle="rgba(148,163,184,.24)";ctx.lineWidth=2;ctx.setLineDash([7,9]);ctx.stroke();ctx.setLineDash([]);
const follower=api.pathPoint(points,api.pingPong(t*.12,1));
api.glow(ctx,follower.x,follower.y,unit*.12,"#8b5cf6",.75);
ctx.save();ctx.translate(follower.x,follower.y);ctx.rotate(follower.angle);
ctx.fillStyle="#c4b5fd";ctx.beginPath();ctx.moveTo(18,0);ctx.lineTo(-12,-10);ctx.lineTo(-7,0);ctx.lineTo(-12,10);ctx.closePath();ctx.fill();ctx.restore();
for(let i=0;i<7;i++){
  const p=api.stagger(i,7,t/2.8,.09), spring=api.spring(p*.9,190,17);
  const x=w*.16+i*w*.112, y=h*.42+(1-spring)*unit*.16;
  ctx.globalAlpha=api.clamp(p*2);
  ctx.fillStyle=api.hsla(250+i*10,85,65);
  ctx.save();ctx.translate(x,y);ctx.rotate((1-spring)*-.45);
  api.roundedRect(ctx,-unit*.025,-unit*.025,unit*.05,unit*.05,unit*.012);ctx.fill();ctx.restore();
}
ctx.globalAlpha=1;
ctx.textAlign="center";ctx.textBaseline="middle";
ctx.fillStyle="#f8fafc";ctx.font="800 "+(unit*.055)+"px Arial";
ctx.fillText("MOTION, WITH INTENTION",cx,h*.82);
ctx.fillStyle="#a5b4fc";ctx.font="600 "+(unit*.026)+"px Arial";
ctx.fillText("SPRING  /  PATH  /  STAGGER",cx,h*.89);
ctx.textAlign="right";ctx.fillStyle="#b5ff6d";ctx.font="700 "+(unit*.045)+"px monospace";
ctx.fillText(api.counter(0,100,ease,0)+"%",w*.88,h*.14);
api.vignette(ctx,.62);api.grain(ctx,t,.035,90);`,
  "Scene sequence": `// SCENE SEQUENCE — independent timed scenes with built-in transitions
ctx.fillStyle = "#050812"; ctx.fillRect(0, 0, w, h);

api.scene(ctx, t, "OPEN", 0, 5, (local, progress) => {
  ctx.fillStyle = "#b5ff6d";
  ctx.textAlign = "center";
  ctx.font = "800 64px Arial";
  ctx.fillText("SCENE ONE", w/2, h/2 + Math.sin(local*2)*12);
}, { transition: "zoom", enter: 1, exit: 0.7 });

api.scene(ctx, t, "MOTION", 5, 10, (local, progress) => {
  const x = api.lerp(-w*0.2, w*1.2, progress);
  ctx.fillStyle = "#7dd3fc";
  ctx.shadowColor = "#7dd3fc"; ctx.shadowBlur = 32;
  ctx.beginPath(); ctx.arc(x, h/2, 48, 0, Math.PI*2); ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = "#fff"; ctx.textAlign = "center";
  ctx.font = "700 42px Arial"; ctx.fillText("SCENE TWO", w/2, h*0.72);
}, { transition: "slide", enter: 0.8, exit: 0.8 });

api.scene(ctx, t, "FINALE", 10, 15, (local, progress) => {
  ctx.fillStyle = "#f4f7fb"; ctx.textAlign = "center";
  ctx.font = "900 76px Arial"; ctx.fillText("YOUR STORY", w/2, h/2);
  ctx.fillStyle = "#b5ff6d"; ctx.fillRect(w/2-70, h/2+54, 140, 5);
}, { transition: "fade", enter: 1, exit: 1 });
`,
  "Your brain at 2 AM": "// CODECINEMA — TikTok short: YOUR BRAIN AT 2 AM\n// 25 seconds | vertical 9:16 | 720p | 30 FPS | 540p/720p export profile\n// Canvas 2D + built-in character2D helper. No external assets or paid APIs.\n// Recommended project settings: 9:16, 25s, 30 FPS, 720p, Vertical Social profile.\n// Audio: add a quiet room tone, a memory-rewind whoosh, chase beat and a final record-scratch in the Audio Mixer.\n\nconst clamp = (v, a, b) => Math.max(a, Math.min(b, v));\nconst smooth = (v) => { v = clamp(v, 0, 1); return v * v * (3 - 2 * v); };\nconst mix = (a, b, p) => a + (b - a) * p;\nconst fade = (start, end) => smooth((t - start) / Math.max(0.001, end - start));\nconst unit = Math.min(w, h);\nconst cx = w * 0.5;\nconst floorY = h * 0.79;\n\nfunction text(label, x, y, size, color, weight = 800, alpha = 1) {\n  ctx.save();\n  ctx.globalAlpha = alpha;\n  ctx.textAlign = \"center\";\n  ctx.textBaseline = \"middle\";\n  ctx.font = weight + \" \" + Math.round(size) + \"px Arial, sans-serif\";\n  ctx.lineJoin = \"round\";\n  ctx.lineWidth = Math.max(3, size * 0.09);\n  ctx.strokeStyle = \"rgba(3,6,15,0.78)\";\n  ctx.strokeText(label, x, y);\n  ctx.fillStyle = color;\n  ctx.fillText(label, x, y);\n  ctx.restore();\n}\n\nfunction rounded(x, y, width, height, radius, fill, stroke) {\n  ctx.beginPath();\n  ctx.roundRect(x, y, width, height, radius);\n  ctx.fillStyle = fill;\n  ctx.fill();\n  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 2; ctx.stroke(); }\n}\n\nfunction background(colorA, colorB) {\n  const g = ctx.createLinearGradient(0, 0, 0, h);\n  g.addColorStop(0, colorA); g.addColorStop(1, colorB);\n  ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);\n}\n\nfunction bedroom() {\n  background(\"#111a35\", \"#080b18\");\n  // Window and moon.\n  rounded(w * .61, h * .13, w * .27, h * .22, 18, \"#1b2a4c\", \"#52678e\");\n  ctx.fillStyle = \"#d9e8ff\";\n  ctx.beginPath(); ctx.arc(w * .77, h * .22, unit * .035, 0, Math.PI * 2); ctx.fill();\n  for (let i = 0; i < 24; i++) {\n    const sx = (Math.sin(i * 91.7) * .5 + .5) * w;\n    const sy = (Math.sin(i * 37.1 + 2) * .5 + .5) * h * .34;\n    ctx.globalAlpha = .25 + .45 * (Math.sin(t * 2 + i) * .5 + .5);\n    ctx.fillStyle = \"#dce8ff\"; ctx.fillRect(sx, sy, 2.5, 2.5);\n  }\n  ctx.globalAlpha = 1;\n  // Floor and bed.\n  ctx.fillStyle = \"#202943\"; ctx.fillRect(0, floorY, w, h - floorY);\n  rounded(w * .10, h * .62, w * .80, h * .19, 24, \"#354563\", \"#7184a8\");\n  rounded(w * .14, h * .60, w * .30, h * .09, 18, \"#e0e8f6\");\n  rounded(w * .39, h * .65, w * .49, h * .14, 18, \"#263b61\");\n  ctx.fillStyle = \"#526b95\";\n  ctx.fillRect(w * .12, h * .80, w * .04, h * .08);\n  ctx.fillRect(w * .83, h * .80, w * .04, h * .08);\n}\n\nfunction sleepingStickman() {\n  const x = w * .52, y = h * .665;\n  ctx.save(); ctx.translate(x, y);\n  ctx.lineCap = \"round\"; ctx.lineJoin = \"round\";\n  ctx.strokeStyle = \"#f5f7ff\"; ctx.lineWidth = unit * .009;\n  // Horizontal body, arms and legs.\n  ctx.beginPath(); ctx.moveTo(-unit*.04, 0); ctx.lineTo(unit*.075, unit*.012);\n  ctx.moveTo(unit*.04, unit*.006); ctx.lineTo(unit*.09, -unit*.025);\n  ctx.moveTo(unit*.04, unit*.006); ctx.lineTo(unit*.09, unit*.035);\n  ctx.moveTo(-unit*.04, 0); ctx.lineTo(-unit*.10, -unit*.02);\n  ctx.moveTo(-unit*.04, 0); ctx.lineTo(-unit*.10, unit*.025);\n  ctx.stroke();\n  ctx.fillStyle = \"#f5f7ff\"; ctx.beginPath(); ctx.arc(-unit*.065, -unit*.008, unit*.026, 0, Math.PI*2); ctx.fill();\n  ctx.strokeStyle = \"#18213a\"; ctx.lineWidth = unit*.004;\n  ctx.beginPath(); ctx.moveTo(-unit*.078,-unit*.008); ctx.lineTo(-unit*.067,-unit*.008); ctx.stroke();\n  ctx.restore();\n  text(\"Z\", w*.69, h*.55, unit*.035, \"#b9c9e8\", 700, .85);\n  text(\"z\", w*.72, h*.51, unit*.025, \"#b9c9e8\", 700, .65);\n}\n\nfunction schoolHall() {\n  background(\"#392b50\", \"#15152a\");\n  // Repeating hallway perspective.\n  ctx.strokeStyle = \"rgba(255,255,255,.15)\"; ctx.lineWidth = 3;\n  for (let i = 0; i < 6; i++) {\n    const x = i * w / 5;\n    ctx.beginPath(); ctx.moveTo(cx, h*.20); ctx.lineTo(x, h*.83); ctx.stroke();\n  }\n  ctx.fillStyle = \"#514365\"; ctx.fillRect(0, h*.72, w, h*.28);\n  for (let i = 0; i < 4; i++) {\n    rounded(w*(.08+i*.23), h*.18, w*.14, h*.26, 10, \"#69718b\", \"#aab1c7\");\n  }\n  text(\"SCHOOL. 2018.\", cx, h*.10, unit*.043, \"#fff0c7\", 900);\n}\n\nfunction memoryMonster(x, y, scale, alpha) {\n  ctx.save(); ctx.globalAlpha = alpha; ctx.translate(x, y); ctx.scale(scale, scale);\n  // Wobbly shadow body.\n  ctx.fillStyle = \"#a34bff\"; ctx.shadowColor = \"#a34bff\"; ctx.shadowBlur = 30;\n  ctx.beginPath();\n  ctx.moveTo(-85, 80); ctx.bezierCurveTo(-120, 5, -65, -110, 0, -95);\n  ctx.bezierCurveTo(75, -130, 120, -35, 82, 55);\n  ctx.bezierCurveTo(65, 120, -40, 130, -85, 80); ctx.fill();\n  ctx.shadowBlur = 0;\n  ctx.fillStyle = \"#fff\"; ctx.beginPath(); ctx.arc(-28,-28,16,0,Math.PI*2); ctx.arc(28,-28,16,0,Math.PI*2); ctx.fill();\n  ctx.fillStyle = \"#241332\"; ctx.beginPath(); ctx.arc(-28,-28,6,0,Math.PI*2); ctx.arc(28,-28,6,0,Math.PI*2); ctx.fill();\n  ctx.strokeStyle = \"#241332\"; ctx.lineWidth = 9; ctx.lineCap = \"round\";\n  ctx.beginPath(); ctx.arc(0,18,28,.15,Math.PI-.15); ctx.stroke();\n  ctx.restore();\n}\n\nfunction memoryScene() {\n  schoolHall();\n  const p = fade(6, 7.3);\n  // Memory card slams into view.\n  ctx.save();\n  ctx.translate(cx, h*.42);\n  ctx.rotate((1-p)*-.08);\n  ctx.globalAlpha = p;\n  rounded(-w*.37, -h*.17, w*.74, h*.34, 22, \"#f4e8d2\", \"#fff\");\n  text(\"2018\", cx, h*.35, unit*.10, \"#3c2d50\", 900, p);\n  text(\"THE WAVE\", cx, h*.44, unit*.047, \"#5a426b\", 900, p);\n  ctx.restore();\n  // The awkward wave: one person waving, the other walking away.\n  const personX = w*.40, personY = h*.68;\n  ctx.save(); ctx.translate(personX, personY);\n  ctx.strokeStyle = \"#ffffff\"; ctx.fillStyle = \"#ffffff\"; ctx.lineWidth = unit*.009; ctx.lineCap = \"round\";\n  ctx.beginPath(); ctx.arc(0,-unit*.06,unit*.025,0,Math.PI*2); ctx.fill();\n  ctx.beginPath(); ctx.moveTo(0,-unit*.035); ctx.lineTo(0,unit*.055);\n  ctx.moveTo(0,-unit*.015); ctx.lineTo(-unit*.035,-unit*.075);\n  ctx.moveTo(0,-unit*.015); ctx.lineTo(unit*.04,-unit*.09);\n  ctx.moveTo(0,unit*.055); ctx.lineTo(-unit*.03,unit*.10);\n  ctx.moveTo(0,unit*.055); ctx.lineTo(unit*.03,unit*.10); ctx.stroke();\n  ctx.restore();\n  // Uninterested passer-by.\n  ctx.save(); ctx.translate(w*.68,h*.69);\n  ctx.strokeStyle=\"#b7c1d8\"; ctx.fillStyle=\"#b7c1d8\"; ctx.lineWidth=unit*.009; ctx.lineCap=\"round\";\n  ctx.beginPath(); ctx.arc(0,-unit*.06,unit*.024,0,Math.PI*2); ctx.fill();\n  ctx.beginPath(); ctx.moveTo(0,-unit*.035); ctx.lineTo(0,unit*.055); ctx.moveTo(0,-unit*.01); ctx.lineTo(-unit*.03,unit*.03); ctx.moveTo(0,-unit*.01); ctx.lineTo(unit*.03,unit*.03); ctx.moveTo(0,unit*.055); ctx.lineTo(-unit*.03,unit*.10); ctx.moveTo(0,unit*.055); ctx.lineTo(unit*.03,unit*.10); ctx.stroke();\n  ctx.restore();\n  text(\"...THEY WERE WAVING AT SOMEONE ELSE.\", cx, h*.88, unit*.027, \"#ffe2b5\", 800, fade(8.3,9));\n}\n\nfunction chaseScene() {\n  background(\"#160e29\", \"#070912\");\n  // Speed lines.\n  ctx.strokeStyle = \"rgba(191,137,255,.28)\"; ctx.lineWidth = 4;\n  for (let i=0;i<18;i++) {\n    const y = (i/18)*h;\n    const drift = (t*260 + i*83) % (w+180);\n    ctx.beginPath(); ctx.moveTo(w-drift, y); ctx.lineTo(w-drift+90, y); ctx.stroke();\n  }\n  // Floor stripes.\n  ctx.fillStyle=\"#24203b\"; ctx.fillRect(0,h*.80,w,h*.20);\n  for(let i=0;i<8;i++){\n    const x=((i*180-t*420)%(w+180)+w+180)%(w+180);\n    ctx.fillStyle=\"rgba(255,255,255,.13)\"; ctx.fillRect(x,h*.82,70,7);\n  }\n  const run = t - 12;\n  const heroX = mix(w*.32, w*.62, (Math.sin(run*2.1)+1)*.5);\n  const bob = Math.sin(run*13)*unit*.012;\n  api.character2D(ctx, t, {x:heroX, y:h*.78+bob, scale:1.35, motion:\"run\", expression:\"surprised\", color:\"#f4f7ff\", timeOffset:0});\n  memoryMonster(w*.76 + Math.sin(t*5)*unit*.025, h*.60, 1.15+Math.sin(t*8)*.06, 1);\n  text(\"WHY IS IT STILL CHASING ME?!\", cx, h*.14, unit*.043, \"#ffe0ff\", 900);\n}\n\nfunction drawFrame() {\n  // 0–5.5s: calm bedroom and the 2 AM hook.\n  if (t < 5.5) {\n    bedroom(); sleepingStickman();\n    if (t > 1.0) {\n      rounded(w*.12,h*.12,w*.76,h*.085,18,\"rgba(8,13,28,.76)\",\"rgba(255,255,255,.2)\");\n      text(\"ME TRYING TO SLEEP AT 2 AM\",cx,h*.162,unit*.039,\"#ffffff\",900,fade(1,1.5));\n    }\n    if (t > 3.2) {\n      const a = fade(3.2,3.8);\n      ctx.save(); ctx.globalAlpha=a;\n      ctx.fillStyle=\"#f6d58b\"; ctx.beginPath(); ctx.arc(w*.50,h*.46,unit*.075,0,Math.PI*2); ctx.fill();\n      text(\"...\",w*.50,h*.46,unit*.06,\"#34233f\",900,a);\n      text(\"WAIT.\",cx,h*.34,unit*.065,\"#ffdf91\",900,a);\n      ctx.restore();\n    }\n  }\n  // 5.5–11.5s: flashback.\n  else if (t < 11.5) {\n    memoryScene();\n    if (t > 9.2) memoryMonster(w*.76,h*.60,fade(9.2,10.2)*1.35,fade(9.2,10.2));\n    if (t > 10.2) text(\"NO. NOT THIS MEMORY.\",cx,h*.16,unit*.045,\"#ffffff\",900,fade(10.2,10.7));\n  }\n  // 11.5–19.5s: the memory becomes a monster.\n  else if (t < 19.5) {\n    chaseScene();\n    const intro = 1-fade(11.5,12.3);\n    if (intro>0) {\n      ctx.fillStyle=\"rgba(255,255,255,\"+(intro*.75)+\")\"; ctx.fillRect(0,0,w,h);\n    }\n  }\n  // 19.5–25s: smash cut back to bed and punchline.\n  else {\n    bedroom(); sleepingStickman();\n    const punch = fade(20,20.8);\n    rounded(w*.12,h*.35,w*.76,h*.17,24,\"rgba(7,11,24,.88)\",\"rgba(255,255,255,.25)\");\n    text(\"ANYWAY...\",cx,h*.405,unit*.055,\"#d9e8ff\",900,punch);\n    text(\"GOOD MORNING.\",cx,h*.465,unit*.055,\"#b5ff6d\",900,punch);\n    if (t > 23.2) text(\"FOLLOW FOR MORE 2 AM THOUGHTS\",cx,h*.89,unit*.025,\"#c5d2e8\",700,fade(23.2,23.8));\n  }\n}\n\ndrawFrame();\napi.vignette(ctx, 0.48);\napi.grain(ctx, t, 0.018, 31);\n",
};

type TimelineTrack = "SCENE" | "VISUAL" | "AUDIO";
type TimelineMarker = { id: string; time: number; track: TimelineTrack; label: string };
type VisualTransformProperty = "position" | "rotation" | "scale";
type VisualKeyframeTrack = { id: string; objectId: string; property: VisualTransformProperty; frames: AnimationKeyframe[] };
type SceneLayerKind = "text2d" | "rect2d" | "circle2d" | "roundedRect2d" | "triangle2d" | "line2d" | "box3d" | "sphere3d" | "cone3d" | "torus3d" | "cylinder3d" | "plane3d" | "torusKnot3d";
type SceneLayer = { id: string; name: string; kind: SceneLayerKind; visible: boolean; color: string; x: number; y: number; z: number; scaleX: number; scaleY: number; scaleZ: number; rotationX?: number; rotationY?: number; rotationZ?: number; opacity?: number; metalness?: number; roughness?: number; emissive?: string; emissiveIntensity?: number; radius?: number; height?: number; tube?: number; width?: number; segments?: number; fontFamily?: string; fontWeight?: number; textAlign?: "left" | "center" | "right"; strokeColor?: string; strokeWidth?: number; shadowColor?: string; shadowBlur?: number; fillMode?: "solid" | "gradient"; gradientColor?: string; gradientAngle?: number; text?: string };
type LayerMotionPreset = "rise" | "slide" | "pop" | "spin";
type SceneCamera = { position: [number, number, number]; lookAt: [number, number, number]; fov: number };
type SceneLight = { id: string; name: string; type: "ambient" | "directional" | "point"; color: string; intensity: number; x: number; y: number; z: number; visible: boolean };
type SceneParticle = { id: string; name: string; count: number; color: string; size: number; opacity: number; spreadX: number; spreadY: number; spreadZ: number; speed: number; x: number; y: number; z: number; visible: boolean };
const defaultSceneCamera: SceneCamera = { position: [0, 0, 8], lookAt: [0, 0, 0], fov: 45 };
type TrackValue = number | number[];
type AnimationKeyframe = { time: number; value: TrackValue; ease?: "linear" | "smooth" | "in" | "out" | "hold" };
const sampleAnimationTrack = (time: number, frames: AnimationKeyframe[], defaultEase: "linear" | "smooth" | "in" | "out" = "smooth"): TrackValue => {
  if (!frames?.length) return 0;
  const ordered = [...frames].filter(frame => Number.isFinite(frame.time)).sort((a, b) => a.time - b.time);
  if (!ordered.length) return 0;
  if (time <= ordered[0].time) return ordered[0].value;
  const last = ordered[ordered.length - 1];
  if (time >= last.time) return last.value;
  let left = ordered[0], right = ordered[1];
  for (let i = 0; i < ordered.length - 1; i++) {
    if (time >= ordered[i].time && time <= ordered[i + 1].time) { left = ordered[i]; right = ordered[i + 1]; break; }
  }
  const raw = Math.max(0, Math.min(1, (time - left.time) / Math.max(0.000001, right.time - left.time)));
  const mode = left.ease ?? defaultEase;
  const p = mode === "hold" ? 0 : mode === "linear" ? raw : mode === "in" ? raw * raw : mode === "out" ? 1 - (1 - raw) * (1 - raw) : raw * raw * (3 - 2 * raw);
  const a = left.value, b = right.value;
  if (typeof a === "number" && typeof b === "number") return a + (b - a) * p;
  if (Array.isArray(a) && Array.isArray(b)) return a.map((value, i) => value + ((b[i] ?? value) - value) * p);
  return p < 1 ? a : b;
};

let activeVisualTracks: VisualKeyframeTrack[] = [];
let activeSceneLayers: SceneLayer[] = [];
let activeSceneCamera: SceneCamera = defaultSceneCamera;
let activeSceneLights: SceneLight[] = [];
let activeSceneParticles: SceneParticle[] = [];
const drawSceneOverlays = (ctx: CanvasRenderingContext2D, time: number, width: number, height: number) => {
  for (const layer of [...activeSceneLayers].reverse()) {
    if (!layer.visible || !["text2d","rect2d","circle2d","roundedRect2d","triangle2d","line2d"].includes(layer.kind)) continue;
    const positionTrack = activeVisualTracks.find(track => track.objectId === layer.id && track.property === "position");
    const scaleTrack = activeVisualTracks.find(track => track.objectId === layer.id && track.property === "scale");
    const rotationTrack = activeVisualTracks.find(track => track.objectId === layer.id && track.property === "rotation");
    const position = positionTrack ? sampleAnimationTrack(time, positionTrack.frames) : [layer.x, layer.y, 0];
    const scale = scaleTrack ? sampleAnimationTrack(time, scaleTrack.frames) : [layer.scaleX, layer.scaleY, 1];
    const rotation = rotationTrack ? sampleAnimationTrack(time, rotationTrack.frames) : [0, 0, 0];
    const px = Array.isArray(position) ? position : [layer.x, layer.y, 0];
    const sc = Array.isArray(scale) ? scale : [layer.scaleX, layer.scaleY, 1];
    const rot = Array.isArray(rotation) ? rotation : [0, 0, 0];
    const x = (px[0] ?? layer.x) * width, y = (px[1] ?? layer.y) * height;
    const sx = Math.max(0.001, sc[0] ?? layer.scaleX), sy = Math.max(0.001, sc[1] ?? layer.scaleY);
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot[2] ?? layer.rotationZ ?? 0); const gradientAngle = (layer.gradientAngle ?? 0) * Math.PI / 180; const gradientLength = Math.max(10, Math.max(sx * width, sy * height)); const gradient = ctx.createLinearGradient(-Math.cos(gradientAngle)*gradientLength/2,-Math.sin(gradientAngle)*gradientLength/2,Math.cos(gradientAngle)*gradientLength/2,Math.sin(gradientAngle)*gradientLength/2); gradient.addColorStop(0,layer.color); gradient.addColorStop(1,layer.gradientColor ?? layer.color); ctx.fillStyle = layer.fillMode === "gradient" ? gradient : layer.color; ctx.globalAlpha = Math.max(0, Math.min(1, layer.opacity ?? 1));
    if (layer.kind === "text2d") { const fontSize = Math.max(10, sx * Math.min(width,height)); ctx.font = `${Math.max(100,Math.min(900,layer.fontWeight ?? 800))} ${fontSize}px ${layer.fontFamily || "Arial"}`; ctx.textAlign = layer.textAlign ?? "center"; ctx.textBaseline = "middle"; ctx.shadowColor = layer.shadowColor ?? "#000000"; ctx.shadowBlur = Math.max(0,Math.min(80,layer.shadowBlur ?? 0)); const label = layer.text || layer.name; if ((layer.strokeWidth ?? 0) > 0) { ctx.lineJoin = "round"; ctx.lineWidth = Math.max(0,Math.min(24,layer.strokeWidth ?? 0)); ctx.strokeStyle = layer.strokeColor ?? "#000000"; ctx.strokeText(label,0,0,width*.9); } ctx.fillText(label,0,0,width*.9); }
    else if (layer.kind === "rect2d" || layer.kind === "roundedRect2d") { const w = Math.max(2, sx * width), h = Math.max(2, sy * height); if (layer.kind === "rect2d") { ctx.fillRect(-w/2,-h/2,w,h); if ((layer.strokeWidth ?? 0)>0) { ctx.strokeStyle=layer.strokeColor ?? "#000000"; ctx.lineWidth=Math.min(24,layer.strokeWidth ?? 0); ctx.strokeRect(-w/2,-h/2,w,h); } } else { const r = Math.min(w,h)*.16; ctx.beginPath(); ctx.moveTo(-w/2+r,-h/2); ctx.lineTo(w/2-r,-h/2); ctx.quadraticCurveTo(w/2,-h/2,w/2,-h/2+r); ctx.lineTo(w/2,h/2-r); ctx.quadraticCurveTo(w/2,h/2,w/2-r,h/2); ctx.lineTo(-w/2+r,h/2); ctx.quadraticCurveTo(-w/2,h/2,-w/2,h/2-r); ctx.lineTo(-w/2,-h/2+r); ctx.quadraticCurveTo(-w/2,-h/2,-w/2+r,-h/2); ctx.closePath(); ctx.fill(); if ((layer.strokeWidth ?? 0)>0) { ctx.strokeStyle=layer.strokeColor ?? "#000000"; ctx.lineWidth=Math.min(24,layer.strokeWidth ?? 0); ctx.stroke(); } } }
    else if (layer.kind === "triangle2d") { const w=Math.max(2,sx*width),h=Math.max(2,sy*height); ctx.beginPath(); ctx.moveTo(0,-h/2); ctx.lineTo(w/2,h/2); ctx.lineTo(-w/2,h/2); ctx.closePath(); ctx.fill(); if ((layer.strokeWidth ?? 0)>0) { ctx.strokeStyle=layer.strokeColor ?? "#000000"; ctx.lineWidth=Math.min(24,layer.strokeWidth ?? 0); ctx.stroke(); } }
    else if (layer.kind === "line2d") { const w=Math.max(2,sx*width); ctx.beginPath(); ctx.strokeStyle=ctx.fillStyle; ctx.lineWidth=Math.max(2,sy*height); ctx.lineCap="round"; ctx.moveTo(-w/2,0); ctx.lineTo(w/2,0); ctx.stroke(); }
    else { ctx.beginPath(); ctx.arc(0,0,Math.max(2,sx*Math.min(width,height)),0,Math.PI*2); ctx.fill(); if ((layer.strokeWidth ?? 0)>0) { ctx.strokeStyle=layer.strokeColor ?? "#000000"; ctx.lineWidth=Math.min(24,layer.strokeWidth ?? 0); ctx.stroke(); } }
    ctx.restore();
  }
};

const api = {
  render3D: (ctx: CanvasRenderingContext2D, time: number, width: number, height: number, config: ThreeSceneConfig = {}) => {
    const layerObjects: ThreeObjectSpec[] = activeSceneLayers.filter(layer => layer.visible && layer.kind.endsWith("3d")).map(layer => ({ id: layer.id, type: layer.kind === "box3d" ? "box" : layer.kind === "sphere3d" ? "sphere" : layer.kind === "cone3d" ? "cone" : layer.kind === "cylinder3d" ? "cylinder" : layer.kind === "plane3d" ? "plane" : layer.kind === "torusKnot3d" ? "torusKnot" : "torus", color: layer.color, position: [layer.x,layer.y,layer.z], rotation: [layer.rotationX ?? 0,layer.rotationY ?? 0,layer.rotationZ ?? 0], scale: [layer.scaleX,layer.scaleY,layer.scaleZ], opacity: layer.opacity ?? 1, transparent: (layer.opacity ?? 1) < 1, metalness: layer.metalness ?? .15, roughness: layer.roughness ?? .55, emissive: layer.emissive ?? "#000000", emissiveIntensity: layer.emissiveIntensity ?? 0, radius: layer.radius ?? .5, height: layer.height ?? 1, tube: layer.tube ?? .08, width: layer.width ?? 1, segments: layer.segments ?? 24 }));
    const merged = [...(config.objects ?? []).filter(object => !layerObjects.some(layer => layer.id === object.id)), ...layerObjects];
    const objects = merged.map(object => {
      const animated = { ...object };
      for (const track of activeVisualTracks) {
        if (track.objectId !== object.id) continue;
        const value = sampleAnimationTrack(time, track.frames);
        if (Array.isArray(value) && value.length === 3) animated[track.property] = value as [number, number, number];
      }
      return animated;
    });
    const editorLights: ThreeLightSpec[] = activeSceneLights.filter(light => light.visible).map(light => ({ id: light.id, type: light.type, color: light.color, intensity: light.intensity, position: [light.x,light.y,light.z] }));
    const lights = [...(config.lights ?? []).filter(light => !editorLights.some(editorLight => editorLight.id === light.id)), ...editorLights];
    const editorParticles: ThreeParticleSpec[] = activeSceneParticles.filter(particle => particle.visible).map(particle => ({ id: particle.id, count: particle.count, color: particle.color, size: particle.size, opacity: particle.opacity, spread: [particle.spreadX,particle.spreadY,particle.spreadZ], speed: particle.speed, position: [particle.x,particle.y,particle.z] }));
    const particles = [...(config.particles ?? []).filter(particle => !editorParticles.some(editorParticle => editorParticle.id === particle.id)), ...editorParticles];
    babylonSceneRenderer.render(ctx,time,width,height,{ ...config, camera: { ...(config.camera ?? {}), position: activeSceneCamera.position, lookAt: activeSceneCamera.lookAt, fov: activeSceneCamera.fov }, objects, lights, particles });
  },
  // Keyframe tracks return a number or vector at any exact timeline time.
  track: (time: number, frames: AnimationKeyframe[], easing: "linear" | "smooth" | "in" | "out" = "smooth") => sampleAnimationTrack(time, frames, easing),
  // Deterministic XZ orbit helper for planets, cameras and moving props.
  orbit3D: (time: number, radius: number, speed = 1, phase = 0, y = 0): [number, number, number] => [Math.cos(time * speed + phase) * radius, y, Math.sin(time * speed + phase) * radius],
  clamp: (v: number, min = 0, max = 1) => Math.max(min, Math.min(max, v)),
  lerp: (a: number, b: number, p: number) => a + (b - a) * p,
  ease: (p: number) => { const x = Math.max(0, Math.min(1, p)); return x * x * (3 - 2 * x); },
  easeOut: (p: number) => 1 - Math.pow(1 - Math.max(0, Math.min(1, p)), 3),
  map: (v: number, inMin: number, inMax: number, outMin: number, outMax: number) => outMin + ((v - inMin) / (inMax - inMin || 1)) * (outMax - outMin),
  smoothstep: (a: number, b: number, x: number) => { const p = Math.max(0, Math.min(1, (x - a) / (b - a || 1))); return p * p * (3 - 2 * p); },
  pingPong: (value: number, length = 1) => length <= 0 ? 0 : length - Math.abs((((value % (2 * length)) + 2 * length) % (2 * length)) - length),
  mod: (value: number, divisor: number) => divisor === 0 ? 0 : ((value % divisor) + divisor) % divisor,
  random: (seed = 1) => { const n = Math.sin(seed * 127.1 + 311.7) * 43758.5453123; return n - Math.floor(n); },
  noise: (x: number, y = 0) => { const hash = (a: number, b: number) => { const n = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return n - Math.floor(n); }; const ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy; const sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy); const a = hash(ix, iy), b = hash(ix + 1, iy), c = hash(ix, iy + 1), d = hash(ix + 1, iy + 1); const top = a + (b-a)*sx, bottom = c + (d-c)*sx; return top + (bottom-top)*sy; },
  hsla: (h: number, s = 100, l = 50, a = 1) => `hsla(${((h % 360) + 360) % 360}, ${s}%, ${l}%, ${a})`,
  textReveal: (ctx: CanvasRenderingContext2D, text: string, x: number, y: number, progress: number, options: { font?: string; color?: string; align?: CanvasTextAlign; mode?: "chars" | "words" | "fade" | "rise" | "tracking"; stagger?: number; tracking?: number; maxWidth?: number; shadowColor?: string; shadowBlur?: number } = {}) => {
    const value=String(text ?? ""), mode=options.mode ?? "chars";
    const units=mode==="words" ? (value.match(/\S+\s*/g) || []) : Array.from(value);
    if(!units.length) return;
    ctx.save(); if(options.font) ctx.font=options.font;
    if(options.maxWidth && ctx.measureText(value).width>options.maxWidth){ const m=ctx.font.match(/(\d+(?:\.\d+)?)px/); if(m) ctx.font=ctx.font.replace(m[0],(Number(m[1])*options.maxWidth/ctx.measureText(value).width).toFixed(2)+"px"); }
    const tracking=options.tracking ?? 0, widths=units.map(unit=>ctx.measureText(unit).width);
    const total=widths.reduce((a,b)=>a+b,0)+tracking*Math.max(0,units.length-1);
    let cursor=x-(options.align==="center"?total/2:options.align==="right"?total:0);
    ctx.textAlign="left"; if(options.color) ctx.fillStyle=options.color;
    if(options.shadowColor){ctx.shadowColor=options.shadowColor;ctx.shadowBlur=options.shadowBlur ?? 16;}
    const p=Math.max(0,Math.min(1,progress)), stagger=Math.max(0,Math.min(0.2,options.stagger ?? 0.035));
    const span=Math.max(0.001,1-stagger*Math.max(0,units.length-1)), baseAlpha=ctx.globalAlpha;
    units.forEach((unit,i)=>{ const local=mode==="fade"?p:Math.max(0,Math.min(1,(p-i*stagger)/span)); if(local>0){ctx.globalAlpha=baseAlpha*local; const rise=mode==="rise"?(1-local)*18:mode==="tracking"?(1-local)*12:0; ctx.fillText(unit,cursor,y+rise);} cursor+=widths[i]+tracking; });
    ctx.restore();
  },
  typewriter: (ctx: CanvasRenderingContext2D, text: string, x: number, y: number, time: number, speed = 18, options: { font?: string; color?: string; align?: CanvasTextAlign; cursor?: boolean } = {}) => {
    const value=String(text ?? ""), count=Math.max(0,Math.min(value.length,Math.floor(Math.max(0,time)*Math.max(0,speed))));
    ctx.save(); if(options.font) ctx.font=options.font; if(options.color) ctx.fillStyle=options.color; ctx.textAlign=options.align ?? "left";
    const shown=value.slice(0,count); ctx.fillText(shown,x,y);
    if(options.cursor && count<value.length && Math.floor(time*2)%2===0){const width=ctx.measureText(shown).width, offset=options.align==="center"?-width/2:options.align==="right"?-width:0, height=ctx.measureText("M").width; ctx.fillRect(x+offset+width+2,y-height*0.72,2,height);}
    ctx.restore();
  },
  textMask: (ctx: CanvasRenderingContext2D, text: string, x: number, y: number, progress: number, options: { font?: string; align?: CanvasTextAlign; colors?: string[]; direction?: "left" | "right"; shadowColor?: string; shadowBlur?: number } = {}) => {
    const value=String(text ?? ""); ctx.save(); if(options.font) ctx.font=options.font;
    const metrics=ctx.measureText(value), width=metrics.width, left=x-(options.align==="center"?width/2:options.align==="right"?width:0);
    const p=Math.max(0,Math.min(1,progress)), reveal=width*p, top=y-(metrics.actualBoundingBoxAscent || 24)-8, height=(metrics.actualBoundingBoxAscent || 24)+(metrics.actualBoundingBoxDescent || 6)+16;
    const gradient=ctx.createLinearGradient(left,0,left+Math.max(1,width),0), colors=options.colors?.length?options.colors:["#55e7ff","#a78bfa","#ff79c6"];
    colors.forEach((color,i)=>gradient.addColorStop(colors.length===1?0.5:i/(colors.length-1),color));
    ctx.beginPath(); ctx.rect(options.direction==="right"?left+width-reveal:left,top,reveal,height); ctx.clip();
    ctx.textAlign="left"; ctx.fillStyle=gradient; if(options.shadowColor){ctx.shadowColor=options.shadowColor;ctx.shadowBlur=options.shadowBlur ?? 18;} ctx.fillText(value,left,y); ctx.restore();
  },
  fitText: (ctx: CanvasRenderingContext2D, text: string, maxWidth: number, size: number, minSize = 10, family = "Arial", weight = "700") => { let current = size; while (current > minSize) { ctx.font = `${weight} ${current}px ${family}`; if (ctx.measureText(text).width <= maxWidth) break; current -= 1; } return current; },
  scene: (ctx: CanvasRenderingContext2D, time: number, _name: string, start: number, end: number, draw: (localTime: number, progress: number, globalTime: number) => void, options: { transition?: "fade" | "slide" | "zoom"; enter?: number; exit?: number } = {}) => {
    if (time < start || time > end || end <= start) return false;
    const length = end - start;
    const enter = Math.max(0, Math.min(length / 2, options.enter ?? 0.6));
    const exit = Math.max(0, Math.min(length / 2, options.exit ?? 0.6));
    const inP = enter > 0 ? Math.max(0, Math.min(1, (time - start) / enter)) : 1;
    const outP = exit > 0 ? Math.max(0, Math.min(1, (end - time) / exit)) : 1;
    const progress = Math.max(0, Math.min(1, (time - start) / length));
    const alpha = Math.min(inP, outP);
    const eased = alpha * alpha * (3 - 2 * alpha);
    const mode = options.transition ?? "fade";
    ctx.save();
    ctx.globalAlpha *= eased;
    if (mode === "slide") {
      const direction = time - start < enter ? 1 - (inP * inP * (3 - 2 * inP)) : 0;
      ctx.translate(-ctx.canvas.width * 0.08 * direction, 0);
    } else if (mode === "zoom") {
      const scale = 1.08 - 0.08 * (inP * inP * (3 - 2 * inP));
      ctx.translate(ctx.canvas.width / 2, ctx.canvas.height / 2);
      ctx.scale(scale, scale);
      ctx.translate(-ctx.canvas.width / 2, -ctx.canvas.height / 2);
    }
    try { draw(time - start, progress, time); } finally { ctx.restore(); }
    return true;
  },
  glow: (ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, color = "#7dd3fc", intensity = 0.6) => {
    const r = Math.max(1, radius);
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    const a = Math.max(0, Math.min(1, intensity));
    g.addColorStop(0, color); g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.save(); ctx.globalAlpha *= a; ctx.fillStyle = g;
    ctx.fillRect(x-r, y-r, r*2, r*2); ctx.restore();
  },
  vignette: (ctx: CanvasRenderingContext2D, strength = 0.55) => {
    const w = ctx.canvas.width, h = ctx.canvas.height;
    const g = ctx.createRadialGradient(w/2, h/2, Math.min(w,h)*0.18, w/2, h/2, Math.max(w,h)*0.72);
    g.addColorStop(0, "rgba(0,0,0,0)");
    g.addColorStop(1, `rgba(0,0,0,${Math.max(0,Math.min(1,strength))})`);
    ctx.save(); ctx.fillStyle = g; ctx.fillRect(0,0,w,h); ctx.restore();
  },
  particles: (ctx: CanvasRenderingContext2D, time: number, count = 80, options: { color?: string; speed?: number; size?: number; seed?: number; opacity?: number } = {}) => {
    const w = ctx.canvas.width, h = ctx.canvas.height;
    const total = Math.max(0, Math.min(240, Math.floor(count)));
    const speed = options.speed ?? 0.12, maxSize = options.size ?? 3, seed = options.seed ?? 1;
    ctx.save();
    for (let i=0;i<total;i++) {
      const rand = (n: number) => { const v=Math.sin((n+seed)*127.1+311.7)*43758.5453; return v-Math.floor(v); };
      const x = rand(i+1)*w;
      const y = ((rand(i+101)*h - time*speed*(20+rand(i+201)*70)) % h + h) % h;
      const radius = 0.5 + rand(i+301)*Math.max(0.5,maxSize);
      ctx.globalAlpha = (options.opacity ?? 0.65) * (0.25 + rand(i+401)*0.75);
      ctx.fillStyle = options.color ?? "#dbeafe";
      ctx.beginPath(); ctx.arc(x,y,radius,0,Math.PI*2); ctx.fill();
    }
    ctx.restore();
  },
  grain: (ctx: CanvasRenderingContext2D, time: number, amount = 0.08, count = 180) => {
    const w=ctx.canvas.width,h=ctx.canvas.height,total=Math.max(0,Math.min(350,Math.floor(count)));
    const seed=Math.floor(time*24);
    ctx.save(); ctx.globalAlpha=Math.max(0,Math.min(0.25,amount));
    for(let i=0;i<total;i++){
      const n=Math.sin((i+1+seed*997)*127.1)*43758.5453, r=n-Math.floor(n);
      const m=Math.sin((i+1+seed*577)*269.5)*15731.743, q=m-Math.floor(m);
      ctx.fillStyle=r>0.5?"#fff":"#000"; ctx.fillRect(q*w,r*h,2,2);
    }
    ctx.restore();
  },
  colorWash: (ctx: CanvasRenderingContext2D, color = "#14213d", opacity = 0.18) => {
    ctx.save(); ctx.globalAlpha=Math.max(0,Math.min(1,opacity)); ctx.fillStyle=color;
    ctx.fillRect(0,0,ctx.canvas.width,ctx.canvas.height); ctx.restore();
  },
  shake: (time: number, intensity = 8, frequency = 24, seed = 1) => {
    const frame=Math.floor(time*Math.max(1,frequency));
    const rand=(n:number)=>{const v=Math.sin((n+seed)*127.1+311.7)*43758.5453;return v-Math.floor(v);};
    return { x:(rand(frame+1)-0.5)*2*intensity, y:(rand(frame+2)-0.5)*2*intensity };
  },
  camera: (ctx: CanvasRenderingContext2D, x: number, y: number, zoom: number, rotation: number, draw: () => void) => {
    ctx.save(); ctx.translate(ctx.canvas.width/2+x,ctx.canvas.height/2+y);
    ctx.rotate(rotation); const z=Math.max(0.05,Math.min(8,zoom)); ctx.scale(z,z);
    ctx.translate(-ctx.canvas.width/2,-ctx.canvas.height/2);
    try { draw(); } finally { ctx.restore(); }
  },
  // Motion graphics helpers — deterministic and safe for frame-by-frame rendering.
  spring: (time: number, stiffness = 170, damping = 20, mass = 1) => {
    const t = Math.max(0, time), k = Math.max(0.001, stiffness), c = Math.max(0, damping), m = Math.max(0.001, mass);
    const omega = Math.sqrt(k / m), zeta = c / (2 * Math.sqrt(k * m));
    if (zeta < 0.999) {
      const wd = omega * Math.sqrt(1 - zeta * zeta);
      return 1 - Math.exp(-zeta * omega * t) * (Math.cos(wd * t) + (zeta * omega / wd) * Math.sin(wd * t));
    }
    if (zeta <= 1.001) return 1 - Math.exp(-omega * t) * (1 + omega * t);
    const root = Math.sqrt(zeta * zeta - 1);
    const r1 = -omega * (zeta - root), r2 = -omega * (zeta + root);
    return 1 - ((r2 * Math.exp(r1 * t) - r1 * Math.exp(r2 * t)) / (r2 - r1));
  },
  cubicBezier: (progress: number, x1: number, y1: number, x2: number, y2: number) => {
    const p = Math.max(0, Math.min(1, progress));
    const curve = (u: number, a: number, b: number) => 3 * (1-u) * (1-u) * u * a + 3 * (1-u) * u * u * b + u*u*u;
    const slope = (u: number, a: number, b: number) => 3*(1-u)*(1-u)*a + 6*(1-u)*u*(b-a) + 3*u*u*(1-b);
    let u = p;
    for (let i=0;i<7;i++) {
      const dx = curve(u,x1,x2)-p, d = slope(u,x1,x2);
      if (Math.abs(dx)<1e-5 || Math.abs(d)<1e-5) break;
      u = Math.max(0,Math.min(1,u-dx/d));
    }
    return curve(u,y1,y2);
  },
  stagger: (index: number, count: number, progress: number, delay = 0.08) => {
    const total = Math.max(1, Math.floor(count)), i = Math.max(0, Math.min(total-1, Math.floor(index)));
    const offset = Math.max(0, delay) * i;
    return Math.max(0, Math.min(1, (progress-offset) / Math.max(0.001, 1 - Math.max(0,delay)*(total-1))));
  },
  counter: (from: number, to: number, progress: number, decimals = 0) => {
    const p = Math.max(0, Math.min(1, progress));
    const value = from + (to-from)*p;
    const digits = Math.max(0, Math.min(6, Math.floor(decimals)));
    return Number(value.toFixed(digits));
  },
  pathPoint: (points: Array<{x:number;y:number}>, progress: number, closed = false) => {
    if (!points.length) return {x:0,y:0,angle:0};
    if (points.length === 1) return {x:points[0].x,y:points[0].y,angle:0};
    const sample = (p: number) => {
      const count = closed ? points.length : points.length-1;
      const q = Math.max(0,Math.min(1,p)) * count;
      const segment = Math.min(count-1,Math.floor(q)), u = q-segment;
      const at = (i:number) => points[closed ? ((i%points.length)+points.length)%points.length : Math.max(0,Math.min(points.length-1,i))];
      const p0=at(segment-1), p1=at(segment), p2=at(segment+1), p3=at(segment+2);
      const u2=u*u, u3=u2*u;
      const coord=(a:number,b:number,c:number,d:number)=>0.5*((2*b)+(-a+c)*u+(2*a-5*b+4*c-d)*u2+(-a+3*b-3*c+d)*u3);
      return {x:coord(p0.x,p1.x,p2.x,p3.x),y:coord(p0.y,p1.y,p2.y,p3.y)};
    };
    const p = Math.max(0,Math.min(1,progress)), point=sample(p), ahead=sample(Math.min(1,p+0.001));
    return {x:point.x,y:point.y,angle:Math.atan2(ahead.y-point.y,ahead.x-point.x)};
  },
  roundedRect: (ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius = 12) => {
    const r = Math.max(0, Math.min(radius, width / 2, height / 2));
    ctx.beginPath(); ctx.roundRect(x, y, width, height, r);
  },
  blend: (ctx: CanvasRenderingContext2D, operation: GlobalCompositeOperation, draw: () => void) => {
    ctx.save();
    try { ctx.globalCompositeOperation = operation; draw(); } finally { ctx.restore(); }
  },
  clipCircle: (ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, draw: () => void) => {
    ctx.save();
    try { ctx.beginPath(); ctx.arc(x, y, Math.max(0, radius), 0, Math.PI * 2); ctx.clip(); draw(); } finally { ctx.restore(); }
  },
  blur: (ctx: CanvasRenderingContext2D, amount: number, draw: () => void) => {
    ctx.save();
    try {
      const px = Math.max(0, Math.min(40, Number.isFinite(amount) ? amount : 0));
      if ("filter" in ctx) ctx.filter = `blur(${px}px)`;
      draw();
    } finally { ctx.restore(); }
  },
  ripple: (ctx: CanvasRenderingContext2D, x: number, y: number, time: number, options: { color?: string; speed?: number; rings?: number; maxRadius?: number; width?: number; opacity?: number } = {}) => {
    const speed = Math.max(0.001, options.speed ?? 120), rings = Math.max(1, Math.min(12, Math.floor(options.rings ?? 4)));
    const maxRadius = Math.max(1, options.maxRadius ?? Math.min(ctx.canvas.width, ctx.canvas.height) * 0.34);
    ctx.save(); ctx.strokeStyle = options.color ?? "#7dd3fc"; ctx.lineWidth = Math.max(0.5, options.width ?? 2);
    for (let i=0;i<rings;i++) {
      const phase = (((time * speed + i * maxRadius / rings) % maxRadius) + maxRadius) % maxRadius;
      ctx.globalAlpha = Math.max(0, options.opacity ?? 0.55) * (1 - phase / maxRadius);
      ctx.beginPath(); ctx.arc(x, y, phase, 0, Math.PI * 2); ctx.stroke();
    }
    ctx.restore();
  },
  lensFlare: (ctx: CanvasRenderingContext2D, x: number, y: number, intensity = 1, color = "#b9eaff") => {
    const power = Math.max(0, Math.min(2, intensity)), reach = Math.max(ctx.canvas.width, ctx.canvas.height) * 0.42;
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    const glow = ctx.createRadialGradient(x, y, 0, x, y, reach * 0.22);
    glow.addColorStop(0, color); glow.addColorStop(0.08, color + "aa"); glow.addColorStop(1, "rgba(0,0,0,0)");
    ctx.globalAlpha = 0.42 * power; ctx.fillStyle = glow; ctx.fillRect(x-reach*.22,y-reach*.22,reach*.44,reach*.44);
    ctx.globalAlpha = 0.22 * power; ctx.fillStyle = color;
    ctx.fillRect(x-reach, y-1, reach*2, 2); ctx.fillRect(x-1, y-reach*.34, 2, reach*.68);
    for (let i=1;i<=3;i++) {
      const px = x + (ctx.canvas.width/2-x) * i * 0.48, py = y + (ctx.canvas.height/2-y) * i * 0.48;
      ctx.globalAlpha = 0.1 * power; ctx.beginPath(); ctx.arc(px,py,reach*(0.012+i*0.008),0,Math.PI*2); ctx.fill();
    }
    ctx.restore();
  },
  lightning: (ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, time: number, options: { color?: string; width?: number; segments?: number; seed?: number; flicker?: number } = {}) => {
    const count = Math.max(2, Math.min(40, Math.floor(options.segments ?? 12))), seed = options.seed ?? 1;
    const frame = Math.floor(Math.max(0,time) * 18), rand = (n:number) => { const v=Math.sin((n+seed+frame*31)*127.1+311.7)*43758.5453; return v-Math.floor(v); };
    const points:Array<{x:number;y:number}> = [{x:x1,y:y1}];
    for(let i=1;i<count;i++) {
      const p=i/count, spread=Math.hypot(x2-x1,y2-y1)*0.12;
      points.push({x:x1+(x2-x1)*p+(rand(i)-.5)*spread,y:y1+(y2-y1)*p+(rand(i+91)-.5)*spread});
    }
    points.push({x:x2,y:y2});
    const color=options.color ?? "#a8eaff", flicker=options.flicker ?? 0.72;
    ctx.save(); ctx.globalAlpha=0.35+rand(500)*Math.max(0,Math.min(0.65,flicker));
    ctx.lineCap="round"; ctx.lineJoin="round"; ctx.strokeStyle=color; ctx.shadowColor=color;
    ctx.shadowBlur=22; ctx.lineWidth=Math.max(1,options.width ?? 3)*3;
    ctx.beginPath(); points.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y)); ctx.stroke();
    ctx.shadowBlur=4; ctx.lineWidth=Math.max(0.7,options.width ?? 3); ctx.strokeStyle="#ffffff"; ctx.stroke();
    ctx.restore();
  },
  ...createAdvancedApi()
};

type CinemaApi = {
  render3D: (ctx: CanvasRenderingContext2D, time: number, width: number, height: number, config?: ThreeSceneConfig) => void;
  clamp: (v: number, min?: number, max?: number) => number;
  lerp: (a: number, b: number, p: number) => number;
  ease: (p: number) => number;
  easeOut: (p: number) => number;
  map: (v: number, inMin: number, inMax: number, outMin: number, outMax: number) => number;
  spring: (time: number, stiffness?: number, damping?: number, mass?: number) => number;
  cubicBezier: (progress: number, x1: number, y1: number, x2: number, y2: number) => number;
  stagger: (index: number, count: number, progress: number, delay?: number) => number;
  counter: (from: number, to: number, progress: number, decimals?: number) => number;
  pathPoint: (points: Array<{x:number;y:number}>, progress: number, closed?: boolean) => {x:number;y:number;angle:number};
  roundedRect: (ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius?: number) => void;
  blend: (ctx: CanvasRenderingContext2D, operation: GlobalCompositeOperation, draw: () => void) => void;
  clipCircle: (ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, draw: () => void) => void;
  blur: (ctx: CanvasRenderingContext2D, amount: number, draw: () => void) => void;
  ripple: (ctx: CanvasRenderingContext2D, x: number, y: number, time: number, options?: { color?: string; speed?: number; rings?: number; maxRadius?: number; width?: number; opacity?: number }) => void;
  lensFlare: (ctx: CanvasRenderingContext2D, x: number, y: number, intensity?: number, color?: string) => void;
  lightning: (ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, time: number, options?: { color?: string; width?: number; segments?: number; seed?: number; flicker?: number }) => void;
  glow: (ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, color?: string, intensity?: number) => void;
  vignette: (ctx: CanvasRenderingContext2D, strength?: number) => void;
  particles: (ctx: CanvasRenderingContext2D, time: number, count?: number, options?: { color?: string; speed?: number; size?: number; seed?: number; opacity?: number }) => void;
  grain: (ctx: CanvasRenderingContext2D, time: number, amount?: number, count?: number) => void;
  colorWash: (ctx: CanvasRenderingContext2D, color?: string, opacity?: number) => void;
  shake: (time: number, intensity?: number, frequency?: number, seed?: number) => { x: number; y: number };
  camera: (ctx: CanvasRenderingContext2D, x: number, y: number, zoom: number, rotation: number, draw: () => void) => void;
  smoothstep: (a: number, b: number, x: number) => number;
  pingPong: (value: number, length?: number) => number;
  mod: (value: number, divisor: number) => number;
  random: (seed?: number) => number;
  noise: (x: number, y?: number) => number;
  hsla: (h: number, s?: number, l?: number, a?: number) => string;
  textReveal: (ctx: CanvasRenderingContext2D, text: string, x: number, y: number, progress: number, options?: { font?: string; color?: string; align?: CanvasTextAlign; mode?: "chars" | "words" | "fade" | "rise" | "tracking"; stagger?: number; tracking?: number; maxWidth?: number; shadowColor?: string; shadowBlur?: number }) => void;
  typewriter: (ctx: CanvasRenderingContext2D, text: string, x: number, y: number, time: number, speed?: number, options?: { font?: string; color?: string; align?: CanvasTextAlign; cursor?: boolean }) => void;
  textMask: (ctx: CanvasRenderingContext2D, text: string, x: number, y: number, progress: number, options?: { font?: string; align?: CanvasTextAlign; colors?: string[]; direction?: "left" | "right"; shadowColor?: string; shadowBlur?: number }) => void;
  fitText: (ctx: CanvasRenderingContext2D, text: string, maxWidth: number, size: number, minSize?: number, family?: string, weight?: string) => number;
  scene: (ctx: CanvasRenderingContext2D, time: number, name: string, start: number, end: number, draw: (localTime: number, progress: number, globalTime: number) => void, options?: { transition?: "fade" | "slide" | "zoom"; enter?: number; exit?: number }) => boolean;
} & ReturnType<typeof createAdvancedApi>;
type RenderFunction = (ctx: CanvasRenderingContext2D, t: number, w: number, h: number, api: CinemaApi) => void;

function scriptError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error || "Unknown script error");
  if (/&lt;|&gt;|&amp;|&#91;|&#93;|\\\*/i.test(message)) return "Your code may contain HTML-escaped symbols. Use real JavaScript characters (<, >, &, [, ], *) and paste the raw code.";
  const stack = error instanceof Error ? error.stack || "" : "";
  const location = stack.match(/codec-cinema-user-script:(\d+):(\d+)/);
  if (location) return `Line ${location[1]}, column ${location[2]}: ${message}`;
  return message;
}

export default function App() {
  const [code, setCode] = useState(() => { try { return localStorage.getItem("codec-2026-script") || starterCode; } catch { return starterCode; } });
  const [example, setExample] = useState("Cinematic title");
  const [duration, setDuration] = useState(30);
  const [format, setFormat] = useState("16:9");
  const [quality, setQuality] = useState("720p");
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("READY");
  const [editorExpanded, setEditorExpanded] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [previewExpanded, setPreviewExpanded] = useState(false);
  const [bitrate, setBitrate] = useState(6);
  const [fps, setFps] = useState(30);
  const [container, setContainer] = useState<ExportContainer>("mp4");
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioTrimStart, setAudioTrimStart] = useState(0);
  const [audioTrimEnd, setAudioTrimEnd] = useState(0);
  const [audioVolume, setAudioVolume] = useState(1);
  const [audioFadeIn, setAudioFadeIn] = useState(0);
  const [audioFadeOut, setAudioFadeOut] = useState(0);
  const [renderProgress, setRenderProgress] = useState(0);
  const [webCodecsAvailable, setWebCodecsAvailable] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<(Event & { prompt: () => Promise<void>; userChoice?: Promise<{ outcome: string }> }) | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [projectName, setProjectName] = useState(() => { try { return localStorage.getItem("codec-2026-project-name") || "Untitled Cinema"; } catch { return "Untitled Cinema"; } });
  const [mobileTab, setMobileTab] = useState<"editor" | "preview">("editor");
  const [historyState, setHistoryState] = useState({ canUndo: false, canRedo: false });
  const [timelineTrack, setTimelineTrack] = useState<TimelineTrack>("SCENE");
  const [timelineMarkers, setTimelineMarkers] = useState<TimelineMarker[]>(() => { try { const saved = JSON.parse(localStorage.getItem("codec-2026-timeline") || "[]"); return Array.isArray(saved) ? saved.filter((m: any) => m && typeof m.id === "string" && Number.isFinite(m.time) && ["SCENE","VISUAL","AUDIO"].includes(m.track) && typeof m.label === "string") : []; } catch { return []; } });
  const [visualTracks, setVisualTracks] = useState<VisualKeyframeTrack[]>(() => { try { const saved = JSON.parse(localStorage.getItem("codec-2026-visual-tracks") || "[]"); return Array.isArray(saved) ? saved.filter((track: any) => track && typeof track.id === "string" && typeof track.objectId === "string" && ["position","rotation","scale"].includes(track.property) && Array.isArray(track.frames)).map((track: any) => ({ ...track, frames: track.frames.filter((frame: any) => frame && Number.isFinite(frame.time) && Array.isArray(frame.value) && frame.value.length === 3 && frame.value.every((v: any) => Number.isFinite(v))).map((frame: any) => ({ ...frame, value: (frame.value as number[]).map(Number) })) })) : []; } catch { return []; } });
  const [objectIdInput, setObjectIdInput] = useState("earth");
  const [propertyInput, setPropertyInput] = useState<VisualTransformProperty>("position");
  const [transformInput, setTransformInput] = useState<[number, number, number]>([0, 0, 0]);
  const [sceneLayers, setSceneLayers] = useState<SceneLayer[]>(() => { try { const saved = JSON.parse(localStorage.getItem("codec-2026-scene-layers") || "[]"); return Array.isArray(saved) ? saved.filter((layer: any) => layer && typeof layer.id === "string" && typeof layer.name === "string" && ["text2d","rect2d","circle2d","roundedRect2d","triangle2d","line2d","box3d","sphere3d","cone3d","torus3d","cylinder3d","plane3d","torusKnot3d"].includes(layer.kind) && [layer.x,layer.y,layer.z,layer.scaleX,layer.scaleY,layer.scaleZ].every(Number.isFinite) && typeof layer.color === "string").map((layer: any) => ({ ...layer, visible: layer.visible !== false, rotationX: Number.isFinite(layer.rotationX ?? 0) ? layer.rotationX ?? 0 : 0, rotationY: Number.isFinite(layer.rotationY ?? 0) ? layer.rotationY ?? 0 : 0, rotationZ: Number.isFinite(layer.rotationZ ?? 0) ? layer.rotationZ ?? 0 : 0, opacity: Number.isFinite(layer.opacity ?? 1) ? Math.max(0,Math.min(1,layer.opacity ?? 1)) : 1, metalness: Number.isFinite(layer.metalness ?? .15) ? Math.max(0,Math.min(1,layer.metalness ?? .15)) : .15, roughness: Number.isFinite(layer.roughness ?? .55) ? Math.max(.04,Math.min(1,layer.roughness ?? .55)) : .55, emissive: typeof layer.emissive === "string" ? layer.emissive : "#000000", emissiveIntensity: Number.isFinite(layer.emissiveIntensity ?? 0) ? Math.max(0,layer.emissiveIntensity ?? 0) : 0 })) : []; } catch { return []; } });
  const [selectedLayerId, setSelectedLayerId] = useState("");
  const [sceneCamera, setSceneCamera] = useState<SceneCamera>(() => { try { const saved = JSON.parse(localStorage.getItem("codec-2026-scene-camera") || "null"); if (saved && Array.isArray(saved.position) && saved.position.length === 3 && saved.position.every(Number.isFinite) && Array.isArray(saved.lookAt) && saved.lookAt.length === 3 && saved.lookAt.every(Number.isFinite) && Number.isFinite(saved.fov)) return { position: saved.position as [number,number,number], lookAt: saved.lookAt as [number,number,number], fov: Math.max(20,Math.min(100,saved.fov)) }; } catch { /* use defaults */ } return defaultSceneCamera; });
  const [sceneLights, setSceneLights] = useState<SceneLight[]>(() => { try { const saved = JSON.parse(localStorage.getItem("codec-2026-scene-lights") || "[]"); return Array.isArray(saved) ? saved.filter((light: any) => light && typeof light.id === "string" && typeof light.name === "string" && ["ambient","directional","point"].includes(light.type) && typeof light.color === "string" && Number.isFinite(light.intensity) && [light.x,light.y,light.z].every(Number.isFinite)).map((light: any) => ({ ...light, intensity: Math.max(0,Math.min(100,light.intensity)), visible: light.visible !== false })) : []; } catch { return []; } });
  const [newLightType, setNewLightType] = useState<SceneLight["type"]>("directional");
  const [sceneParticles, setSceneParticles] = useState<SceneParticle[]>(() => { try { const saved = JSON.parse(localStorage.getItem("codec-2026-scene-particles") || "[]"); return Array.isArray(saved) ? saved.filter((p: any) => p && typeof p.id === "string" && typeof p.name === "string" && typeof p.color === "string" && [p.count,p.size,p.opacity,p.spreadX,p.spreadY,p.spreadZ,p.speed,p.x,p.y,p.z].every(Number.isFinite)).map((p: any) => ({ ...p, count: Math.max(10,Math.min(1200,Math.round(p.count))), size: Math.max(.005,Math.min(.2,p.size)), opacity: Math.max(0,Math.min(1,p.opacity)), spreadX: Math.max(.1,Math.min(50,p.spreadX)), spreadY: Math.max(.1,Math.min(50,p.spreadY)), spreadZ: Math.max(.1,Math.min(50,p.spreadZ)), speed: Math.max(0,Math.min(2,p.speed)), visible: p.visible !== false })) : []; } catch { return []; } });
  const [newLayerKind, setNewLayerKind] = useState<SceneLayerKind>("sphere3d");
  const [newLayerName, setNewLayerName] = useState("New Layer");
  const [newLayerColor, setNewLayerColor] = useState("#65b8ff");
  const [newLayerText, setNewLayerText] = useState("YOUR TITLE");
  activeVisualTracks = visualTracks;
  activeSceneLayers = sceneLayers;
  activeSceneCamera = sceneCamera;
  activeSceneLights = sceneLights;
  activeSceneParticles = sceneParticles;
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const historyRef = useRef<string[]>([code]);
  const historyIndexRef = useRef(0);
  const projectInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const codeRef = useRef(code);
  const renderRef = useRef<RenderFunction | null>(null);
  const rafRef = useRef(0);
  const startRef = useRef(0);
  const lastFrameAtRef = useRef(0);
  const elapsedRef = useRef(0);
  const cancelExportRef = useRef(false);
  const formats: Record<string, [number, number]> = {
    "16:9": quality === "540p" ? [960, 540] : quality === "720p" ? [1280, 720] : [1920, 1080],
    "9:16": quality === "540p" ? [540, 960] : quality === "720p" ? [720, 1280] : [1080, 1920],
    "1:1": quality === "540p" ? [540, 540] : quality === "720p" ? [720, 720] : [1080, 1080],
    "4:5": quality === "540p" ? [540, 675] : quality === "720p" ? [720, 900] : [1080, 1350]
  };
  const [width, height] = formats[format];

  useEffect(() => {
    setWebCodecsAvailable("VideoEncoder" in window);
    setIsInstalled(window.matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true);
    const onPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as Event & { prompt: () => Promise<void>; userChoice?: Promise<{ outcome: string }> });
    };
    const onInstalled = () => { setIsInstalled(true); setInstallPrompt(null); };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const installApp = async () => {
    if (isInstalled) return;
    if (installPrompt) {
      const promptEvent = installPrompt;
      setInstallPrompt(null);
      await promptEvent.prompt();
      await promptEvent.userChoice;
      return;
    }
    window.alert("To install CODECINEMA:\\n1. Open this page in Chrome.\\n2. Tap the ⋮ menu.\\n3. Choose Install app (or Add to Home screen).\\n4. Confirm Install.");
  };

  useEffect(() => { codeRef.current = code; try { localStorage.setItem("codec-2026-script", code); localStorage.setItem("codec-2026-project-name", projectName); localStorage.setItem("codec-2026-timeline", JSON.stringify(timelineMarkers)); localStorage.setItem("codec-2026-visual-tracks", JSON.stringify(visualTracks)); localStorage.setItem("codec-2026-scene-layers", JSON.stringify(sceneLayers)); localStorage.setItem("codec-2026-scene-camera", JSON.stringify(sceneCamera)); localStorage.setItem("codec-2026-scene-lights", JSON.stringify(sceneLights)); localStorage.setItem("codec-2026-scene-particles", JSON.stringify(sceneParticles)); } catch { /* storage may be unavailable */ } }, [code, projectName, timelineMarkers, visualTracks, sceneLayers, sceneCamera, sceneLights, sceneParticles]);
  const addTimelineMarker = () => { const count = timelineMarkers.filter(item => item.track === timelineTrack).length + 1; const label = (timelineTrack === "SCENE" ? "Scene " : timelineTrack === "VISUAL" ? "Visual " : "Audio ") + count; const marker: TimelineMarker = { id: String(Date.now()) + Math.random().toString(36).slice(2,7), time: Math.max(0, Math.min(duration, elapsedRef.current)), track: timelineTrack, label }; setTimelineMarkers(items => [...items, marker].sort((x,y) => x.time-y.time)); setStatus("TIMELINE CUE ADDED"); };
  const scrubTo = (time: number) => { const value = Math.max(0, Math.min(duration, time)); elapsedRef.current = value; setElapsed(value); setRunning(false); drawFrame(value); setStatus("TIMELINE SCRUBBING"); };
  const applyCompositionPreset = (preset: "title" | "lower-third" | "end-card") => {
    const stamp = Date.now().toString(36);
    const makeLayer = (suffix: string, name: string, kind: SceneLayerKind, color: string, x: number, y: number, scaleX: number, scaleY: number, text = ""): SceneLayer => ({
      id: "preset-" + preset + "-" + suffix + "-" + stamp, name, kind, visible: true, color, x, y, z: 0,
      scaleX, scaleY, scaleZ: 1, rotationX: 0, rotationY: 0, rotationZ: 0, opacity: 1,
      metalness: .15, roughness: .55, emissive: "#000000", emissiveIntensity: 0,
      fontFamily: "Arial", fontWeight: 800, textAlign: "center", strokeColor: "#000000", strokeWidth: 0,
      shadowColor: "#000000", shadowBlur: 0, text
    });
    let layers: SceneLayer[] = [];
    if (preset === "title") {
      layers = [
        makeLayer("headline","Title — YOUR STORY","text2d","#f4f7fb",.5,.43,.078,.1,"YOUR STORY"),
        makeLayer("subtitle","Subtitle — A CINEMATIC SHORT","text2d","#aebbd0",.5,.55,.026,.06,"A CINEMATIC SHORT"),
        makeLayer("accent","Accent line","rect2d","#b5ff6d",.5,.63,.16,.006)
      ];
    } else if (preset === "lower-third") {
      layers = [
        makeLayer("name","Lower third — NAME","text2d","#f4f7fb",.24,.755,.032,.07,"YOUR NAME"),
        makeLayer("role","Lower third — ROLE","text2d","#b5ff6d",.24,.82,.018,.05,"YOUR TITLE / ROLE"),
        makeLayer("accent","Lower third accent","rect2d","#b5ff6d",.145,.79,.009,.105),
        makeLayer("panel","Lower third panel","rect2d","#101a2a",.36,.79,.43,.105)
      ];
      layers = layers.map(layer => layer.id.includes("-panel-") ? { ...layer, opacity: .88 } : layer);
    } else {
      layers = [
        makeLayer("headline","End card — THANK YOU","text2d","#f4f7fb",.5,.39,.07,.1,"THANK YOU"),
        makeLayer("subtitle","End card — FOLLOW THE STORY","text2d","#b5ff6d",.5,.51,.027,.06,"FOLLOW THE STORY"),
        makeLayer("cta","End card — SEE YOU NEXT TIME","text2d","#aebbd0",.5,.63,.019,.05,"SEE YOU NEXT TIME"),
        makeLayer("accent","End card accent","rect2d","#b5ff6d",.5,.57,.12,.005)
      ];
    }
    setSceneLayers(items => [...layers, ...items]);
    setSelectedLayerId(layers[0].id);
    setError(""); setStatus(preset.toUpperCase().replace("-"," ") + " COMPOSITION ADDED");
    requestAnimationFrame(() => drawFrame(elapsedRef.current));
  };

  const addSceneLayer = () => {
    const name = newLayerName.trim() || "Layer " + (sceneLayers.length + 1);
    const id = name.toLowerCase().replace(/[^a-z0-9_-]+/g,"-").replace(/^-|-$/g,"") + "-" + Date.now().toString(36);
    const is3d = newLayerKind.endsWith("3d");
    const layer: SceneLayer = { id, name, kind: newLayerKind, visible: true, color: newLayerColor, x: is3d ? 0 : .5, y: is3d ? 0 : .5, z: 0, scaleX: newLayerKind === "text2d" ? .055 : newLayerKind === "circle2d" ? .07 : is3d ? 1 : .28, scaleY: is3d ? 1 : .12, scaleZ: 1, rotationX: 0, rotationY: 0, rotationZ: 0, opacity: 1, metalness: .15, roughness: .55, emissive: "#000000", emissiveIntensity: 0, radius: .5, height: 1, tube: .08, width: 1, segments: 24, fontFamily: "Arial", fontWeight: 800, textAlign: "center", strokeColor: "#000000", strokeWidth: 0, shadowColor: "#000000", shadowBlur: 0, text: newLayerText };
    setSceneLayers(items => [layer, ...items]); setSelectedLayerId(id); setError(""); setStatus("LAYER ADDED");
    requestAnimationFrame(() => drawFrame(elapsedRef.current));
  };
  const updateSceneLayer = (id: string, patch: Partial<SceneLayer>) => setSceneLayers(items => items.map(layer => layer.id === id ? { ...layer, ...patch } : layer));
  const applyMaterialPreset = (id: string, preset: "metal" | "glass" | "matte" | "glow") => {
    const layer = sceneLayers.find(item => item.id === id);
    if (!layer) return;
    const materials: Record<typeof preset, Partial<SceneLayer>> = {
      metal: { metalness: .95, roughness: .18, opacity: 1, emissive: "#000000", emissiveIntensity: 0 },
      glass: { metalness: .05, roughness: .05, opacity: .28, emissive: "#000000", emissiveIntensity: 0 },
      matte: { metalness: 0, roughness: .95, opacity: 1, emissive: "#000000", emissiveIntensity: 0 },
      glow: { metalness: .2, roughness: .25, opacity: 1, emissive: layer.color, emissiveIntensity: 1.8 }
    };
    updateSceneLayer(id, materials[preset]);
    setStatus(preset.toUpperCase() + " MATERIAL APPLIED");
  };
  const duplicateSceneLayer = (id: string) => {
    const source = sceneLayers.find(layer => layer.id === id); if (!source) return;
    const copy = { ...source, id: source.id + "-copy-" + Date.now().toString(36), name: source.name + " Copy" };
    setSceneLayers(items => { const index = items.findIndex(layer => layer.id === id); const next = [...items]; next.splice(index + 1, 0, copy); return next; });
    setSelectedLayerId(copy.id); setStatus("LAYER DUPLICATED");
  };
  const moveSceneLayer = (id: string, direction: -1 | 1) => setSceneLayers(items => {
    const index = items.findIndex(layer => layer.id === id), target = index + direction;
    if (index < 0 || target < 0 || target >= items.length) return items;
    const next = [...items]; [next[index], next[target]] = [next[target], next[index]]; return next;
  });
  const updateSceneCamera = (axis: "position" | "lookAt", index: number, value: number) => setSceneCamera(camera => {
    const next = [...camera[axis]] as [number,number,number]; next[index] = value;
    return { ...camera, [axis]: next };
  });
  const addSceneLight = () => {
    const id = "light-" + newLightType + "-" + Date.now().toString(36);
    const light: SceneLight = { id, name: newLightType.charAt(0).toUpperCase() + newLightType.slice(1) + " Light " + (sceneLights.length + 1), type: newLightType, color: "#ffffff", intensity: newLightType === "ambient" ? .8 : newLightType === "point" ? 20 : 1.5, x: 3, y: 4, z: 5, visible: true };
    setSceneLights(items => [light, ...items]); setStatus("3D LIGHT ADDED");
  };
  const updateSceneLight = (id: string, patch: Partial<SceneLight>) => setSceneLights(items => items.map(light => light.id === id ? { ...light, ...patch } : light));
  const addSceneParticle = () => {
    const id = "particles-" + Date.now().toString(36);
    const particle: SceneParticle = { id, name: "Particle Field " + (sceneParticles.length + 1), count: 300, color: "#b8d7ff", size: .035, opacity: .8, spreadX: 8, spreadY: 5, spreadZ: 8, speed: .12, x: 0, y: 0, z: 0, visible: true };
    setSceneParticles(items => [particle, ...items]); setStatus("PARTICLE FIELD ADDED");
  };
  const updateSceneParticle = (id: string, patch: Partial<SceneParticle>) => setSceneParticles(items => items.map(particle => particle.id === id ? { ...particle, ...patch } : particle));
  const applyParticlePreset = (id: string, preset: "stars" | "dust" | "snow") => {
    const presets: Record<typeof preset, Partial<SceneParticle>> = {
      stars: { count: 500, color: "#dbeafe", size: .025, opacity: .95, speed: .02, spreadX: 30, spreadY: 30, spreadZ: 30 },
      dust: { count: 300, color: "#b5ff6d", size: .018, opacity: .45, speed: .03, spreadX: 8, spreadY: 4, spreadZ: 8 },
      snow: { count: 650, color: "#ffffff", size: .055, opacity: .9, speed: .22, spreadX: 12, spreadY: 8, spreadZ: 12 }
    };
    updateSceneParticle(id, presets[preset]); setStatus(preset.toUpperCase() + " PARTICLE PRESET APPLIED");
  };



  const addVisualKeyframe = () => {
    const objectId = objectIdInput.trim();
    if (!objectId) { setError("Enter a 3D object ID or a scene-layer ID."); return; }
    const time = Math.max(0, Math.min(duration, elapsedRef.current));
    setVisualTracks(items => {
      const existing = items.find(track => track.objectId === objectId && track.property === propertyInput);
      const frame: AnimationKeyframe = { time, value: [...transformInput], ease: "smooth" };
      if (!existing) return [...items, { id: objectId + "-" + propertyInput + "-" + Date.now(), objectId, property: propertyInput, frames: [frame] }];
      return items.map(track => track.id !== existing.id ? track : { ...track, frames: [...track.frames.filter(item => Math.abs(item.time - time) > 0.001), frame].sort((a,b) => a.time-b.time) });
    });
    setError(""); setStatus("VISUAL KEYFRAME ADDED"); drawFrame(time);
  };

  const applyLayerMotionPreset = (preset: LayerMotionPreset) => {
    const layer = sceneLayers.find(item => item.id === selectedLayerId);
    if (!layer) { setError("Select a scene layer before applying a motion preset."); return; }
    const is3d = layer.kind.endsWith("3d");
    const start = Math.min(Math.max(0, elapsedRef.current), Math.max(0, duration - 0.8));
    const end = Math.min(duration, start + 0.8);
    const position: [number,number,number] = [layer.x,layer.y,layer.z];
    const scale: [number,number,number] = [layer.scaleX,layer.scaleY,layer.scaleZ];
    const rotation: [number,number,number] = [layer.rotationX ?? 0,layer.rotationY ?? 0,layer.rotationZ ?? 0];
    const specs: Array<{ property: VisualTransformProperty; from: [number,number,number]; to: [number,number,number] }> = [];
    if (preset === "rise") specs.push({ property: "position", from: [position[0], position[1] + (is3d ? -0.8 : 0.18), position[2]], to: position });
    if (preset === "slide") specs.push({ property: "position", from: [position[0] - (is3d ? 2 : 0.2), position[1], position[2]], to: position });
    if (preset === "pop") specs.push({ property: "scale", from: scale.map(value => Math.max(0.001,value * 0.2)) as [number,number,number], to: scale });
    if (preset === "spin") specs.push({ property: "rotation", from: [rotation[0],rotation[1],rotation[2] - Math.PI * 2], to: rotation });
    setVisualTracks(items => {
      const next = [...items];
      for (const spec of specs) {
        const index = next.findIndex(track => track.objectId === layer.id && track.property === spec.property);
        const existing = index >= 0 ? next[index] : null;
        const frames: AnimationKeyframe[] = [
          ...(existing?.frames ?? []).filter(frame => frame.time < start - 0.001 || frame.time > end + 0.001),
          { time: start, value: [...spec.from], ease: "out" as const },
          { time: end, value: [...spec.to], ease: "smooth" as const }
        ].sort((a,b) => a.time - b.time);
        const updated: VisualKeyframeTrack = { id: existing?.id ?? layer.id + "-" + spec.property + "-preset", objectId: layer.id, property: spec.property, frames };
        if (index >= 0) next[index] = updated; else next.push(updated);
      }
      return next;
    });
    setError(""); setStatus(preset.toUpperCase() + " MOTION PRESET APPLIED");
    requestAnimationFrame(() => scrubTo(start));
  };

  const changeCode = (next: string) => {
    const history = historyRef.current;
    if (history[historyIndexRef.current] !== next) {
      const trimmed = history.slice(0, historyIndexRef.current + 1);
      trimmed.push(next);
      if (trimmed.length > 60) trimmed.shift();
      historyRef.current = trimmed;
      historyIndexRef.current = trimmed.length - 1;
      setHistoryState({ canUndo: trimmed.length > 1, canRedo: false });
    }
    setCode(next);
  };
  const undoCode = () => {
    if (historyIndexRef.current <= 0) return;
    historyIndexRef.current -= 1;
    setCode(historyRef.current[historyIndexRef.current]);
    setHistoryState({ canUndo: historyIndexRef.current > 0, canRedo: true });
  };
  const redoCode = () => {
    if (historyIndexRef.current >= historyRef.current.length - 1) return;
    historyIndexRef.current += 1;
    setCode(historyRef.current[historyIndexRef.current]);
    setHistoryState({ canUndo: true, canRedo: historyIndexRef.current < historyRef.current.length - 1 });
  };
  const insertCode = (snippet: string, pair = false) => {
    const editor = editorRef.current;
    if (!editor) return;
    const start = editor.selectionStart, end = editor.selectionEnd;
    const selected = code.slice(start, end);
    const insertion = pair ? snippet[0] + selected + snippet[1] : snippet;
    changeCode(code.slice(0, start) + insertion + code.slice(end));
    requestAnimationFrame(() => {
      editor.focus();
      const cursor = pair ? start + 1 : start + insertion.length;
      editor.setSelectionRange(cursor, pair && selected ? cursor + selected.length : cursor);
    });
  };

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const typing = !!target && (target.tagName === "TEXTAREA" || target.tagName === "INPUT" || target.tagName === "SELECT" || target.isContentEditable);
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
        event.preventDefault(); saveProject(); return;
      }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "o") {
        event.preventDefault(); projectInputRef.current?.click(); return;
      }
      if (event.key === "Escape") {
        if (previewExpanded) setPreviewExpanded(false);
        else if (editorExpanded) setEditorExpanded(false);
        return;
      }
      if (!typing && event.code === "Space" && !exporting) {
        event.preventDefault(); running ? pause() : play();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const compile = useCallback((source: string) => {
    // Scripts are user-authored and execute locally in this browser tab.
    if (/&lt;|&gt;|&amp;|&#91;|&#93;|\\\*/i.test(source)) {
      throw new Error("This code appears HTML-escaped. Replace &lt; with <, &gt; with >, &amp; with &, &#91; with [, &#93; with ], and \\* with * — or ask for raw JavaScript.");
    }
    return new Function("ctx", "t", "w", "h", "api", source + "\n//# sourceURL=codec-cinema-user-script") as RenderFunction;
  }, []);

  const drawFrame = useCallback((time: number) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx || !renderRef.current) return;
    try {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      renderRef.current(ctx, time, canvas.width, canvas.height, api);
      drawSceneOverlays(ctx, time, canvas.width, canvas.height);
      setError("");
    } catch (e) {
      setError(scriptError(e));
      setRunning(false);
      setStatus("SCRIPT ERROR");
    }
  }, []);

  useEffect(() => { drawFrame(elapsedRef.current); }, [sceneCamera, drawFrame]);

  const runCode = () => {
    try {
      renderRef.current = compile(code);
      setError("");
      setElapsed(0);
      elapsedRef.current = 0;
      drawFrame(0);
      setStatus("SCRIPT COMPILED");
    } catch (e) {
      setError(scriptError(e));
      setStatus("COMPILE ERROR");
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = width;
    canvas.height = height;
    try {
      renderRef.current = compile(codeRef.current);
      drawFrame(elapsedRef.current);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not compile this script.");
    }
  }, [width, height, compile, drawFrame]);

  useEffect(() => {
    if (!running) return;
    startRef.current = performance.now() - elapsedRef.current * 1000;
    lastFrameAtRef.current = 0;
    const frameInterval = 1000 / fps;
    const tick = (now: number) => {
      const next = Math.min(duration, (now - startRef.current) / 1000);
      elapsedRef.current = next;
      if (next >= duration || now - lastFrameAtRef.current >= frameInterval) {
        lastFrameAtRef.current = now;
        setElapsed(next);
        drawFrame(next);
      }
      if (next >= duration) {
        setRunning(false);
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [running, duration, drawFrame, exporting, fps]);

  const play = () => {
    if (elapsedRef.current >= duration) {
      elapsedRef.current = 0;
      setElapsed(0);
    }
    setRunning(true);
    setStatus("PLAYING");
  };
  const pause = () => {
    setRunning(false);
    setStatus("PAUSED");
  };
  const stop = () => {
    if (exporting) {
      cancelExportRef.current = true;
      setStatus("CANCELLING EXPORT…");
      return;
    }
    setRunning(false);
    elapsedRef.current = 0;
    setElapsed(0);
    drawFrame(0);
    setStatus("READY");
  };
  const applyRenderPreset = (preset: "mobile" | "cinematic" | "social") => {
    if (preset === "mobile") { setFormat("9:16"); setQuality("540p"); setFps(24); setBitrate(4); setContainer("mp4"); }
    else if (preset === "cinematic") { setFormat("16:9"); setQuality("1080p"); setFps(24); setBitrate(8); setContainer("mp4"); }
    else { setFormat("9:16"); setQuality("720p"); setFps(30); setBitrate(6); setContainer("mp4"); }
    setStatus(preset.toUpperCase() + " RENDER PROFILE APPLIED");
  };

  const savePreviewFramePNG = () => {
    const canvas = canvasRef.current;
    if (!canvas) { setError("Preview canvas is not available."); return; }
    try {
      canvas.toBlob(blob => {
        if (!blob) { setError("The current frame could not be saved as PNG."); return; }
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        const safeName = (projectName.trim() || "codec-cinema").replace(/[^a-z0-9-_]+/gi,"-").replace(/-+/g,"-").replace(/^-|-$/g,"");
        link.href = url; link.download = safeName + "-" + elapsedRef.current.toFixed(2) + "s.png";
        link.click(); window.setTimeout(() => URL.revokeObjectURL(url), 2500);
        setStatus("FRAME PNG SAVED");
      }, "image/png");
    } catch { setError("PNG frame capture is not supported by this browser."); }
  };

  const exportVideo = async () => {
    const canvas = canvasRef.current;
    if (exporting || !canvas) return;
    try {
      renderRef.current = compile(code);
      cancelExportRef.current = false;
      setExporting(true);
      setRenderProgress(0);
      setError("");
      setRunning(false);
      setStatus("PREPARING WEB CODECS");
      elapsedRef.current = 0;
      setElapsed(0);

      const blob = await renderExport({
        canvas,
        duration,
        fps,
        bitrateMbps: bitrate,
        container,
        audioFile,
        audioStartSeconds: audioTrimStart,
        audioEndSeconds: audioTrimEnd,
        audioVolume,
        audioFadeInSeconds: audioFadeIn,
        audioFadeOutSeconds: audioFadeOut,
        isCancelled: () => cancelExportRef.current,
        onProgress: progress => {
          setRenderProgress(progress);
          setStatus(`RENDERING ${Math.round(progress * 100)}%`);
        },
        renderFrame: time => {
          const ctx = canvas.getContext("2d");
          if (!ctx || !renderRef.current) throw new Error("The preview canvas is unavailable.");
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          renderRef.current(ctx, time, canvas.width, canvas.height, api);
          drawSceneOverlays(ctx, time, canvas.width, canvas.height);
          elapsedRef.current = time;
          setElapsed(time);
        },
      });

      if (cancelExportRef.current) throw new DOMException("Export cancelled", "AbortError");
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${safeFileName(projectName)}.${container}`;
      a.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 3000);
      setRenderProgress(1);
      elapsedRef.current = duration;
      setElapsed(duration);
      setStatus("EXPORT COMPLETE");
    } catch (e) {
      if ((e instanceof DOMException && e.name === "AbortError") || cancelExportRef.current) {
        setStatus("EXPORT CANCELLED");
      } else {
        setError(e instanceof Error ? e.message : "The export failed unexpectedly.");
        setStatus("EXPORT FAILED");
      }
    } finally {
      setExporting(false);
      cancelExportRef.current = false;
    }
  };
  const safeFileName = (name: string) => (name.trim() || "codec-cinema").replace(/[^a-z0-9-_]+/gi, "-").replace(/-+/g, "-").replace(/^-|-$/g, "").toLowerCase() || "codec-cinema";
  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename; a.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1500);
  };
  const saveProject = () => {
    const project = {
      app: "CODECINEMA",
      schemaVersion: 1,
      savedAt: new Date().toISOString(),
      name: projectName,
      code,
      settings: { duration, format, quality, fps, container, bitrate, audioMix: { trimStart: audioTrimStart, trimEnd: audioTrimEnd, volume: audioVolume, fadeIn: audioFadeIn, fadeOut: audioFadeOut } },
      timeline: { markers: timelineMarkers, visualTracks, sceneLayers, sceneCamera, sceneLights, sceneParticles }
    };
    downloadBlob(new Blob([JSON.stringify(project, null, 2)], { type: "application/json" }), safeFileName(projectName) + ".cinema.json");
    setStatus("PROJECT SAVED");
  };
  const openProject = async (file?: File) => {
    if (!file) return;
    if (file.size > 1_000_000) { setError("Project files must be smaller than 1 MB."); return; }
    try {
      const project = JSON.parse(await file.text()) as {
        app?: string; schemaVersion?: number; name?: string; code?: string;
        settings?: { duration?: number; format?: string; quality?: string; fps?: number; container?: ExportContainer; bitrate?: number; audioMix?: { trimStart?: number; trimEnd?: number; volume?: number; fadeIn?: number; fadeOut?: number } };
        timeline?: { markers?: TimelineMarker[]; visualTracks?: VisualKeyframeTrack[]; sceneLayers?: SceneLayer[]; sceneCamera?: SceneCamera; sceneLights?: SceneLight[]; sceneParticles?: SceneParticle[] };
      };
      if (project.app !== "CODECINEMA" || project.schemaVersion !== 1 || typeof project.code !== "string") {
        throw new Error("This is not a supported CODECINEMA project file.");
      }
      if (project.code.length > 500_000) throw new Error("The project script is larger than the 500 KB import limit.");
      const settings = project.settings || {};
      changeCode(project.code);
      setProjectName(typeof project.name === "string" ? project.name.slice(0, 60) : "Imported Cinema");
      if ([5,8,10,15,20,30,45,60].includes(settings.duration || 0)) setDuration(settings.duration!);
      if (["16:9","9:16","1:1","4:5"].includes(settings.format || "")) setFormat(settings.format!);
      if (["540p","720p","1080p"].includes(settings.quality || "")) setQuality(settings.quality!);
      if ([24,30,60].includes(settings.fps || 0)) setFps(settings.fps!);
      if (settings.container === "mp4" || settings.container === "webm") setContainer(settings.container);
      if ([4,6,8,12].includes(settings.bitrate || 0)) setBitrate(settings.bitrate!);
      const audioMix = settings.audioMix || {};
      if (Number.isFinite(audioMix.trimStart)) setAudioTrimStart(Math.max(0,audioMix.trimStart!));
      if (Number.isFinite(audioMix.trimEnd)) setAudioTrimEnd(Math.max(0,audioMix.trimEnd!));
      if (Number.isFinite(audioMix.volume)) setAudioVolume(Math.max(0,Math.min(1.5,audioMix.volume!)));
      if (Number.isFinite(audioMix.fadeIn)) setAudioFadeIn(Math.max(0,Math.min(15,audioMix.fadeIn!)));
      if (Number.isFinite(audioMix.fadeOut)) setAudioFadeOut(Math.max(0,Math.min(15,audioMix.fadeOut!)));
      if (Array.isArray(project.timeline?.markers)) setTimelineMarkers(project.timeline.markers.filter(marker => marker && typeof marker.id === "string" && Number.isFinite(marker.time) && ["SCENE","VISUAL","AUDIO"].includes(marker.track) && typeof marker.label === "string").slice(0,300).map(marker => ({ ...marker, label: marker.label.slice(0,40) })).map(marker => ({ ...marker, time: Math.max(0, Math.min(settings.duration || 60, marker.time)) })));
      setVisualTracks(Array.isArray(project.timeline?.visualTracks) ? project.timeline.visualTracks.filter(track => track && typeof track.id === "string" && typeof track.objectId === "string" && ["position","rotation","scale"].includes(track.property) && Array.isArray(track.frames)).slice(0,300).map(track => ({ ...track, objectId: track.objectId.slice(0,100), frames: track.frames.filter(frame => frame && Number.isFinite(frame.time) && Array.isArray(frame.value) && frame.value.length === 3 && frame.value.every(Number.isFinite)).slice(0,1000).map(frame => ({ ...frame, time: Math.max(0, Math.min(settings.duration || 60, frame.time)), value: (frame.value as number[]).map(Number) })) })) : []);
      setSceneLayers(Array.isArray(project.timeline?.sceneLayers) ? project.timeline.sceneLayers.filter(layer => layer && typeof layer.id === "string" && typeof layer.name === "string" && ["text2d","rect2d","circle2d","roundedRect2d","triangle2d","line2d","box3d","sphere3d","cone3d","torus3d","cylinder3d","plane3d","torusKnot3d"].includes(layer.kind) && [layer.x,layer.y,layer.z,layer.scaleX,layer.scaleY,layer.scaleZ].every(Number.isFinite) && typeof layer.color === "string").slice(0,200).map(layer => ({ ...layer, name: layer.name.slice(0,32), visible: layer.visible !== false, rotationX: Number.isFinite(layer.rotationX ?? 0) ? layer.rotationX ?? 0 : 0, rotationY: Number.isFinite(layer.rotationY ?? 0) ? layer.rotationY ?? 0 : 0, rotationZ: Number.isFinite(layer.rotationZ ?? 0) ? layer.rotationZ ?? 0 : 0, opacity: Number.isFinite(layer.opacity ?? 1) ? Math.max(0,Math.min(1,layer.opacity ?? 1)) : 1, metalness: Number.isFinite(layer.metalness ?? .15) ? Math.max(0,Math.min(1,layer.metalness ?? .15)) : .15, roughness: Number.isFinite(layer.roughness ?? .55) ? Math.max(.04,Math.min(1,layer.roughness ?? .55)) : .55, emissive: typeof layer.emissive === "string" ? layer.emissive : "#000000", emissiveIntensity: Number.isFinite(layer.emissiveIntensity ?? 0) ? Math.max(0,layer.emissiveIntensity ?? 0) : 0 })) : []);
      setSceneCamera(project.timeline?.sceneCamera && Array.isArray(project.timeline.sceneCamera.position) && project.timeline.sceneCamera.position.length === 3 && project.timeline.sceneCamera.position.every(Number.isFinite) && Array.isArray(project.timeline.sceneCamera.lookAt) && project.timeline.sceneCamera.lookAt.length === 3 && project.timeline.sceneCamera.lookAt.every(Number.isFinite) && Number.isFinite(project.timeline.sceneCamera.fov) ? { position: project.timeline.sceneCamera.position, lookAt: project.timeline.sceneCamera.lookAt, fov: Math.max(20,Math.min(100,project.timeline.sceneCamera.fov)) } : defaultSceneCamera);
      setSceneLights(Array.isArray(project.timeline?.sceneLights) ? project.timeline.sceneLights.filter(light => light && typeof light.id === "string" && typeof light.name === "string" && ["ambient","directional","point"].includes(light.type) && typeof light.color === "string" && Number.isFinite(light.intensity) && [light.x,light.y,light.z].every(Number.isFinite)).slice(0,24).map(light => ({ ...light, name: light.name.slice(0,32), intensity: Math.max(0,Math.min(100,light.intensity)), visible: light.visible !== false })) : []);
      setSceneParticles(Array.isArray(project.timeline?.sceneParticles) ? project.timeline.sceneParticles.filter(p => p && typeof p.id === "string" && typeof p.name === "string" && typeof p.color === "string" && [p.count,p.size,p.opacity,p.spreadX,p.spreadY,p.spreadZ,p.speed,p.x,p.y,p.z].every(Number.isFinite)).slice(0,8).map(p => ({ ...p, name: p.name.slice(0,32), count: Math.max(10,Math.min(1200,Math.round(p.count))), size: Math.max(.005,Math.min(.2,p.size)), opacity: Math.max(0,Math.min(1,p.opacity)), spreadX: Math.max(.1,Math.min(50,p.spreadX)), spreadY: Math.max(.1,Math.min(50,p.spreadY)), spreadZ: Math.max(.1,Math.min(50,p.spreadZ)), speed: Math.max(0,Math.min(2,p.speed)), visible: p.visible !== false })) : []);
      setSelectedLayerId("");
      setExample("");
      setError("");
      setElapsed(0); elapsedRef.current = 0;
      setStatus("PROJECT LOADED — PRESS RUN");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not open this project file.");
      setStatus("PROJECT IMPORT FAILED");
    }
  };
  const downloadScript = () => {
    const url = URL.createObjectURL(new Blob([code], { type: "text/javascript" }));
    const a = document.createElement("a");
    a.href = url; a.download = "my-cinema.js"; a.click();
    URL.revokeObjectURL(url);
  };
  const openScript = async (file?: File) => {
    if (!file) return;
    if (file.size > 500_000) { setError("Please choose a script smaller than 500 KB."); return; }
    setCode(await file.text());
    setStatus("SCRIPT LOADED — PRESS RUN");
  };

  return <main className="studio">
    <header className="topbar">
      <div className="brand"><span className="brand-mark">C</span><span>CODE<span className="brand-light">CINEMA</span></span><small>CODE STUDIO / 001</small><span className="brand-version">v{packageJson.version} · STABLE</span></div>
      <div className="top-status"><i /> DUAL 2D / 3D RENDER ENGINE <span>/</span> {status}</div>
      <div className="top-actions">
        <input ref={projectInputRef} hidden type="file" accept=".json,application/json" onChange={e => { void openProject(e.target.files?.[0]); e.currentTarget.value = ""; }} />
        <input className="project-name" aria-label="Project name" value={projectName} maxLength={60} onChange={e => setProjectName(e.target.value)} />
        <button className="button secondary project-button" onClick={saveProject} title="Save complete project (Ctrl+S)">SAVE PROJECT</button>
        <label className="button secondary project-button">OPEN PROJECT<input hidden type="file" accept=".json,application/json" onChange={e => { void openProject(e.target.files?.[0]); e.currentTarget.value = ""; }} /></label>
        {!isInstalled && <button className="button install-button" onClick={() => void installApp()}>↓ INSTALL APP</button>}\n        {isInstalled && <span className="installed-badge">✓ INSTALLED</span>}
        <label className="button secondary">OPEN SCRIPT<input hidden type="file" accept=".js,.txt,text/javascript" onChange={e => { void openScript(e.target.files?.[0]); e.currentTarget.value = ""; }} /></label>
        <button className="button secondary" onClick={downloadScript}>SAVE .JS</button>
        <button className="button primary" onClick={() => void exportVideo()} disabled={exporting}>{exporting ? `RENDERING ${Math.round(renderProgress * 100)}%` : `↗ EXPORT ${container.toUpperCase()}`}</button>
      </div>
    </header>

    <nav className="mobile-tabs" aria-label="Studio sections">
      <button type="button" className={mobileTab === "editor" ? "active" : ""} onClick={() => setMobileTab("editor")}>01 · CODE</button>
      <button type="button" className={mobileTab === "preview" ? "active" : ""} onClick={() => setMobileTab("preview")}>02 · PREVIEW</button>
    </nav>
    <section className="layout">
      <section className={`editor-panel${editorExpanded ? " editor-expanded" : ""}${mobileTab === "preview" ? " mobile-hidden" : ""}`}>
        <div className="section-title"><span>01 / YOUR SCRIPT</span><div className="editor-tools"><button className="expand-editor" onClick={() => setEditorExpanded(v => !v)}>{editorExpanded ? "CLOSE EDITOR" : "EXPAND EDITOR"}</button><span className="live-tag">JAVASCRIPT</span></div></div>
        <div className="editor-help">One function. Every frame. Time is <code>t</code> in seconds. Auto-saved on this device.</div>
        <div className="mobile-code-tools" aria-label="Code insertion tools">
          <button type="button" onClick={() => insertCode("{}", true)}>{`{ }`}</button>
          <button type="button" onClick={() => insertCode("()", true)}>( )</button>
          <button type="button" onClick={() => insertCode("[]", true)}>[ ]</button>
          <button type="button" onClick={() => insertCode(" => ")}>{"=>"}</button>
          <button type="button" onClick={() => insertCode(";")}>;</button>
          <button type="button" onClick={() => insertCode(" = ")}>=</button>
          <button type="button" onClick={() => insertCode("ctx.")}>ctx.</button>
          <button type="button" onClick={() => insertCode("Math.sin(t)")}>sin(t)</button>
        </div>
        <div className="history-tools">
          <button type="button" className="button secondary" onClick={undoCode} disabled={!historyState.canUndo}>↶ UNDO</button>
          <button type="button" className="button secondary" onClick={redoCode} disabled={!historyState.canRedo}>↷ REDO</button>
          <span>EDIT HISTORY</span>
        </div>
        <div className="example-row"><label htmlFor="example-select">START FROM</label><select id="example-select" value={example} onChange={e => { const key=e.target.value; setExample(key); if (key) { changeCode(examples[key]); setStatus("EXAMPLE LOADED — PRESS RUN"); } }}><option value="">Choose an example…</option><option>3D Solar System</option><option>Cinematic title</option><option>Particle universe</option><option>Orbiting geometry</option><option>Wave typography</option><option>Motion graphics lab</option><option>Scene sequence</option><option>Cinematic effects</option><option>Kinetic typography</option></select></div>
        <textarea ref={editorRef} className="code-editor" spellCheck={false} autoCapitalize="off" autoCorrect="off" value={code} onChange={e => changeCode(e.target.value)} onKeyDown={e => {
          if ((e.ctrlKey || e.metaKey) && e.key === "Enter") { e.preventDefault(); runCode(); return; }
          if (e.key === "Tab") {
            e.preventDefault();
            const el = e.currentTarget, start = el.selectionStart, end = el.selectionEnd;
            setCode(value => value.slice(0, start) + "  " + value.slice(end));
            requestAnimationFrame(() => el.setSelectionRange(start + 2, start + 2));
          }
        }} aria-label="JavaScript video script" />
        <div className="editor-actions">
          <button className="button primary run-button" onClick={() => { runCode(); setMobileTab("preview"); }}>▶ RUN & PREVIEW</button>
          <button className="button secondary" onClick={() => { changeCode(""); setExample(""); setError(""); setStatus("EDITOR CLEARED — PASTE NEW CODE"); }}>RESET</button>
        </div>
        {error && <div className="error-box"><b>CODE ERROR</b><span>{error}</span></div>}
        <details className="api-card" style={{ marginBottom: 14 }}>
          <summary style={{ cursor: "pointer", fontWeight: 800, color: "#b5ff6d", padding: "4px 0 12px" }}>04 / ENGINE LAB — VISUAL TOOLBOX</summary>
          <p>Insert a ready-to-edit engine starter at your cursor. Keep your own code safe: these tools add snippets; they do not replace your project.</p>
          <div className="editor-actions" style={{ flexWrap: "wrap", gap: 8 }}>
            <button type="button" className="button secondary" onClick={() => insertCode(`\n// CHARACTER MOTION — procedural 2D character\nctx.fillStyle = "#080d18"; ctx.fillRect(0,0,w,h);\napi.character2D(ctx, t, { x:w/2, y:h*.78, scale:Math.min(w,h)/520, motion:"walk", expression:"happy", color:"#b5ff6d" });\n`)}>＋ CHARACTER</button>
            <button type="button" className="button secondary" onClick={() => insertCode(`\n// CINEMATIC CAMERA PATH — keyframed 3D camera\nconst camera = api.cameraPath3D(t, [\n  { time:0, position:[0,2,10], lookAt:[0,0,0], fov:48, ease:"smooth" },\n  { time:3, position:[5,3,7], lookAt:[0,0,0], fov:38, ease:"out" },\n  { time:6, position:[0,5,5], lookAt:[0,0,0], fov:44 }\n]);\napi.render3D(ctx,t,w,h,{ quality:"medium", camera, lights:[{id:"ambient",type:"ambient",intensity:1.2}], objects:[{id:"hero",type:"torusKnot",radius:1,tube:.22,position:[0,0,0],rotation:[t*.3,t*.6,0],color:"#8b5cf6",metalness:.65,roughness:.25}] });\n`)}>＋ CAMERA PATH</button>
            <button type="button" className="button secondary" onClick={() => insertCode(`\n// 2D PHYSICS — gravity, bounce and circle collisions\nctx.fillStyle = "#080d18"; ctx.fillRect(0,0,w,h);\nconst bodies = api.physics2D(t, [\n  {id:"A",x:w*.35,y:80,radius:24,vx:85,vy:0,restitution:.78},\n  {id:"B",x:w*.62,y:35,radius:32,vx:-35,vy:0,restitution:.68}\n], { gravity:900, groundY:h*.84, left:0, right:w });\nctx.fillStyle="#b5ff6d";\nfor (const body of bodies) { ctx.beginPath(); ctx.arc(body.x,body.y,body.radius||12,0,Math.PI*2); ctx.fill(); }\n`)}>＋ PHYSICS</button>
            <button type="button" className="button secondary" onClick={() => insertCode(`\n// AUDIO TIMELINE CUES — calculates clip gain envelopes only\n// This does not create or mix audio; use ADD MUSIC for actual soundtrack export.\nconst cues = api.audioTimeline(t, [\n  {id:"music",start:0,end:12,volume:.7,fadeIn:1.5,fadeOut:2},\n  {id:"impact",start:4,end:5,volume:1,fadeIn:.05,fadeOut:.35}\n]);\nctx.fillStyle="#080d18"; ctx.fillRect(0,0,w,h);\nctx.fillStyle="#f4f7fb"; ctx.font="600 20px Arial"; ctx.textAlign="center";\nctx.fillText("ACTIVE AUDIO CUES: "+cues.length,w/2,h/2);\n`)}>＋ AUDIO CUES</button>
            <button type="button" className="button secondary" onClick={() => insertCode(`\n// RENDER BUDGET — estimate frame count and encoded file size\nconst plan = api.renderPlan(15, 30, 6, 1280, 720);\nctx.fillStyle="#080d18"; ctx.fillRect(0,0,w,h);\nctx.textAlign="center"; ctx.fillStyle="#f4f7fb"; ctx.font="700 24px Arial";\nctx.fillText(plan.frames+" FRAMES",w/2,h*.42);\nctx.font="16px Arial"; ctx.fillText("Estimated file: "+plan.estimatedMB.toFixed(1)+" MB",w/2,h*.52);\nctx.fillStyle=plan.mobileSafe?"#b5ff6d":"#fb7185";\nctx.fillText(plan.mobileSafe?"MOBILE-SAFE ESTIMATE":"LARGE EXPORT ESTIMATE",w/2,h*.62);\n`)}>＋ RENDER PLAN</button>
          </div>
          <div className="keyframe-note">Character and physics helpers are 2D foundations. Camera paths feed the existing 3D renderer. Audio cues calculate gain only; the existing single-track music mixer remains the actual audio export path. Render planning estimates output size and does not change the encoder.</div>
        </details>
        <div className="api-card">
          <div className="section-title">02 / QUICK REFERENCE</div>
          <p><code>ctx</code> — Canvas 2D drawing context</p>
          <p><code>t</code> — current time in seconds</p>
          <p><code>w</code> / <code>h</code> — output width and height</p>
          <p><code>api.render3D(ctx,t,w,h,config)</code> — real Babylon.js 3D rendering with perspective camera, lights, geometry, materials and animated transforms. Quality: low, medium or high.</p>
          <p><code>api.clamp()</code>, <code>api.lerp()</code>, <code>api.map()</code> — math helpers</p>
          <p><code>api.ease()</code>, <code>api.easeOut()</code>, <code>api.smoothstep()</code> — easing curves</p>
          <p><code>api.pingPong()</code>, <code>api.mod()</code> — looping motion helpers</p>
          <p><code>api.random(seed)</code>, <code>api.noise(x,y)</code> — repeatable procedural variation</p>
          <p><code>api.hsla()</code>, <code>api.fitText()</code> — color and typography helpers</p>
          <p><code>api.textReveal(ctx,text,x,y,progress,options)</code> — staggered character/word reveals, fade, rise and tracking</p>
          <p><code>api.typewriter(ctx,text,x,y,time,speed,options)</code> — timed typewriter text with optional cursor</p>
          <p><code>api.textMask(ctx,text,x,y,progress,options)</code> — gradient text revealed through a directional clipping mask</p>
          <p><code>api.spring(t,stiffness,damping,mass)</code> — natural spring motion with overshoot</p>
          <p><code>api.cubicBezier(p,x1,y1,x2,y2)</code> — custom easing curve</p>
          <p><code>api.stagger(index,count,p,delay)</code> — timed sequences for repeated elements</p>
          <p><code>api.counter(from,to,p,decimals)</code> — animated numeric values</p>
          <p><code>api.pathPoint(points,p,closed)</code> — smooth Catmull–Rom path position and angle</p>
          <p><code>api.roundedRect(ctx,x,y,w,h,r)</code> — rounded rectangle path</p>
          <p><code>api.blend(ctx,mode,draw)</code> — isolated Canvas blend/composite mode</p>
          <p><code>api.clipCircle(ctx,x,y,r,draw)</code> — circular mask for any drawing callback</p>
          <p><code>api.blur(ctx,px,draw)</code> — scoped blur filter with safe fallback</p>
          <p><code>api.ripple(ctx,x,y,t,options)</code> — animated expanding ripple rings</p>
          <p><code>api.lensFlare(ctx,x,y,intensity,color)</code> — cinematic optical flare and streaks</p>
          <p><code>api.lightning(ctx,x1,y1,x2,y2,t,options)</code> — deterministic animated energy bolt</p>
          <p><code>api.scene(ctx,t,name,start,end,draw,options)</code> — timed scene with fade, slide or zoom transition. The draw callback receives local time, progress and global time.</p>
          <p><code>api.glow(ctx,x,y,radius,color,intensity)</code>, <code>api.vignette(ctx,strength)</code> — light bloom and edge shading</p>
          <p><code>api.particles(ctx,t,count,options)</code>, <code>api.grain(ctx,t,amount,count)</code> — procedural particles and film grain</p>
          <p><code>api.colorWash(ctx,color,opacity)</code> — color grading overlay</p>
          <p><code>api.shake(t,intensity,frequency)</code> — deterministic camera shake offset</p>
          <p><code>api.camera(ctx,x,y,zoom,rotation,draw)</code> — isolated camera transform for a drawing callback</p>
          <p>Use standard JavaScript and Canvas methods: <code>fillRect()</code>, <code>fillText()</code>, <code>drawImage()</code>, gradients, paths, transforms and more.</p>
          <p><code>Math.sin(t)</code> creates smooth motion. <code>ctx.save()</code> / <code>ctx.restore()</code> isolate drawing styles.</p>
          <p><b>Tip:</b> Select an example above, change its code, then press RUN SCRIPT.</p>
        </div>
      </section>

      <section className={`preview-panel${mobileTab === "editor" ? " mobile-hidden" : ""}`}>
        <div className="preview-head"><div><span className="section-kicker">03 / LIVE OUTPUT</span><h1>Preview</h1></div><div className="preview-head-actions"><span className="resolution">{width} × {height} <b>{fps} FPS TARGET</b></span><button className="expand-editor" onClick={() => setPreviewExpanded(v => !v)}>{previewExpanded ? "EXIT FULLSCREEN" : "FULLSCREEN"}</button></div></div>
        <div className={`canvas-frame${previewExpanded ? " preview-expanded" : ""}`} style={{ aspectRatio: `${width} / ${height}` }}>
          <canvas ref={canvasRef} />
          {previewExpanded && <div className="fullscreen-controls">
            <div className="fullscreen-topbar">
              <span>CODECINEMA <i>LIVE PREVIEW</i></span>
              <button type="button" onClick={() => setPreviewExpanded(false)} aria-label="Close fullscreen preview">✕ <b>EXIT</b></button>
            </div>
            <div className="fullscreen-bottom">
              <button type="button" className="fullscreen-play" onClick={running ? pause : play} disabled={exporting} aria-label={running ? "Pause preview" : "Play preview"}>{running ? "Ⅱ" : "▶"}</button>
              <span>{elapsed.toFixed(1)}s</span>
              <input aria-label="Preview timeline" type="range" min="0" max={duration} step="0.01" value={elapsed} disabled={exporting} onChange={e => { const value = Number(e.target.value); elapsedRef.current = value; setElapsed(value); setRunning(false); drawFrame(value); setStatus("SCRUBBING"); }} />
              <span>{duration.toFixed(0)}s</span>
            </div>
          </div>}
        </div>
        <div className="transport">
          <button onClick={stop} aria-label={exporting ? "Cancel export" : "Stop"}>{exporting ? "×" : "■"}</button>
          <button className="play-control" onClick={running ? pause : play} aria-label={running ? "Pause" : "Play"} disabled={exporting}>{running ? "Ⅱ" : "▶"}</button><button type="button" className="frame-save-button" onClick={savePreviewFramePNG} disabled={exporting}>↓ PNG</button>
          <span>{elapsed.toFixed(2)}s <em>/ {duration.toFixed(1)}s</em></span>
          <input className="scrubber" type="range" min="0" max={duration} step="0.01" value={elapsed} disabled={exporting} onChange={e => { const value = Number(e.target.value); elapsedRef.current = value; setElapsed(value); setRunning(false); drawFrame(value); setStatus("SCRUBBING"); }} />
          <span>{Math.max(0, duration - elapsed).toFixed(1)}s left</span>
        </div>
        <section className="timeline-panel" aria-label="Visual timeline">
          <div className="timeline-heading"><div><span className="section-kicker">04 / EDITING WORKSPACE</span><h2>Timeline</h2><p>Place scene, visual and audio cue markers. Tap a marker to jump to its time.</p></div><button type="button" className="button primary timeline-add" onClick={addTimelineMarker} disabled={exporting}>＋ ADD CUE</button></div>
          <div className="timeline-toolbar"><label>TRACK <select value={timelineTrack} onChange={e => setTimelineTrack(e.target.value as TimelineTrack)} disabled={exporting}><option value="SCENE">SCENE</option><option value="VISUAL">VISUAL</option><option value="AUDIO">AUDIO</option></select></label><span>{timelineMarkers.length} CUES · {duration}s</span></div>
          <div className="timeline-ruler">{Array.from({length: 7}, (_,i) => { const time = duration * i / 6; return <button key={i} type="button" style={{left: (time/duration*100) + "%"}} onClick={() => scrubTo(time)}>{time.toFixed(0)}s</button>; })}</div>
          <div className="timeline-lanes">{(["SCENE","VISUAL","AUDIO"] as TimelineTrack[]).map(track => <div className="timeline-lane" key={track}><span className="timeline-lane-name">{track}</span><div className="timeline-lane-track" onClick={e => { const rect=e.currentTarget.getBoundingClientRect(); scrubTo(((e.clientX-rect.left)/rect.width)*duration); }}>{timelineMarkers.filter(marker => marker.track === track).map(marker => <button key={marker.id} type="button" className={"timeline-marker marker-" + track.toLowerCase()} style={{left: (marker.time/duration*100) + "%"}} title={marker.label + " · " + marker.time.toFixed(2) + "s"} onClick={e => { e.stopPropagation(); scrubTo(marker.time); }}><i />{marker.label}</button>)}<span className="timeline-playhead" style={{left: (elapsed/duration*100) + "%"}} /></div></div>)}</div>
          {timelineMarkers.length > 0 && <div className="timeline-cue-list">{[...timelineMarkers].sort((x,y)=>x.time-y.time).map(marker => <div className="timeline-cue timeline-cue-edit" key={marker.id}><button type="button" className="timeline-cue-jump" onClick={() => scrubTo(marker.time)}><b>{marker.track}</b><em>{marker.time.toFixed(2)}s</em></button><label>LABEL<input value={marker.label} maxLength={40} onChange={e=>setTimelineMarkers(items=>items.map(item=>item.id===marker.id?{...item,label:e.target.value}:item))} disabled={exporting}/></label><label>TIME<input type="number" min="0" max={duration} step="0.01" value={marker.time} onChange={e=>{const time=Math.max(0,Math.min(duration,Number(e.target.value)||0));setTimelineMarkers(items=>items.map(item=>item.id===marker.id?{...item,time}:item).sort((a,b)=>a.time-b.time));}} disabled={exporting}/></label><label>TRACK<select value={marker.track} onChange={e=>setTimelineMarkers(items=>items.map(item=>item.id===marker.id?{...item,track:e.target.value as TimelineTrack}:item))} disabled={exporting}><option value="SCENE">SCENE</option><option value="VISUAL">VISUAL</option><option value="AUDIO">AUDIO</option></select></label><button type="button" aria-label={"Delete " + marker.label} onClick={() => setTimelineMarkers(items => items.filter(item => item.id !== marker.id))} disabled={exporting}>×</button></div>)}</div>}
          <div className="timeline-footnote">Scene, visual and audio cues are editorial markers. Visual Keyframes animate 2D layers and 3D objects in preview and export.</div>
        </section>
        <section className="layer-panel" aria-label="2D and 3D object layer editor">
          <div className="keyframe-heading"><div><span className="section-kicker">06 / SCENE COMPOSER</span><h2>Scene Composer</h2><p>Build a scene, organize layers and frame the 3D camera.</p></div><span className="keyframe-count">{sceneLayers.length} LAYERS</span></div>
          <div className="scene-camera-editor"><div className="layer-properties-title">3D CAMERA · GLOBAL OVERRIDE</div><div className="camera-control-grid">{(["position","lookAt"] as const).map(axis => <div className="camera-axis-group" key={axis}><b>{axis === "position" ? "CAMERA POSITION" : "LOOK AT TARGET"}</b>{(["X","Y","Z"] as const).map((label,index)=><label key={label}>{label}<input type="number" step="0.1" value={sceneCamera[axis][index]} onChange={e=>updateSceneCamera(axis,index,Number(e.target.value))} disabled={exporting}/></label>)}</div>)}<label className="camera-fov">FIELD OF VIEW<input type="number" min="20" max="100" step="1" value={sceneCamera.fov} onChange={e=>setSceneCamera(camera=>({...camera,fov:Math.max(20,Math.min(100,Number(e.target.value)||45))}))} disabled={exporting}/></label><button type="button" className="button secondary camera-reset" onClick={()=>setSceneCamera(defaultSceneCamera)} disabled={exporting}>RESET CAMERA</button></div><div className="keyframe-note">These camera values override script camera settings whenever api.render3D is called. They are saved with the project.</div></div>
          <section className="scene-lighting-editor"><div className="layer-properties-title">3D LIGHTING DIRECTOR · {sceneLights.length} LIGHTS</div><div className="light-add-row"><label>LIGHT TYPE<select value={newLightType} onChange={e=>setNewLightType(e.target.value as SceneLight["type"])} disabled={exporting}><option value="ambient">Ambient</option><option value="directional">Directional</option><option value="point">Point</option></select></label><button type="button" className="button primary" onClick={addSceneLight} disabled={exporting}>＋ ADD LIGHT</button></div>{sceneLights.length===0 && <div className="keyframe-note">Add a light to illuminate your editable 3D objects. Script-defined lights continue to work normally.</div>}{sceneLights.map(light=><div className="scene-light-row" key={light.id}><div className="scene-light-title"><b>{light.name}</b><span>{light.type.toUpperCase()}</span><button type="button" onClick={()=>updateSceneLight(light.id,{visible:!light.visible})} disabled={exporting}>{light.visible?"◉":"○"}</button><button type="button" onClick={()=>setSceneLights(items=>items.filter(item=>item.id!==light.id))} disabled={exporting}>×</button></div><div className="scene-light-controls"><label>NAME<input value={light.name} maxLength={32} onChange={e=>updateSceneLight(light.id,{name:e.target.value})} disabled={exporting}/></label><label>COLOR<input type="color" value={light.color} onChange={e=>updateSceneLight(light.id,{color:e.target.value})} disabled={exporting}/></label><label>INTENSITY<input type="number" min="0" max="100" step="0.1" value={light.intensity} onChange={e=>updateSceneLight(light.id,{intensity:Math.max(0,Math.min(100,Number(e.target.value)||0))})} disabled={exporting}/></label>{light.type!=="ambient" && (["x","y","z"] as const).map(axis=><label key={axis}>{axis.toUpperCase()}<input type="number" step="0.1" value={light[axis]} onChange={e=>updateSceneLight(light.id,{[axis]:Number(e.target.value)||0})} disabled={exporting}/></label>)}</div></div>)}</section>
          <section className="scene-particle-editor"><div className="layer-properties-title">3D PARTICLE DIRECTOR · {sceneParticles.length} SYSTEMS</div><button type="button" className="button primary" onClick={addSceneParticle} disabled={exporting}>＋ ADD PARTICLE FIELD</button>{sceneParticles.length===0 && <div className="keyframe-note">Create procedural 3D particle fields for stars, dust, snow and atmosphere. Keep counts modest on phones.</div>}{sceneParticles.map(p=><div className="scene-particle-row" key={p.id}><div className="scene-light-title"><b>{p.name}</b><span>{p.count} PARTICLES</span><button type="button" onClick={()=>updateSceneParticle(p.id,{visible:!p.visible})} disabled={exporting}>{p.visible?"◉":"○"}</button><button type="button" onClick={()=>setSceneParticles(items=>items.filter(item=>item.id!==p.id))} disabled={exporting}>×</button></div><div className="particle-presets"><button type="button" onClick={()=>applyParticlePreset(p.id,"stars")} disabled={exporting}>STARS</button><button type="button" onClick={()=>applyParticlePreset(p.id,"dust")} disabled={exporting}>DUST</button><button type="button" onClick={()=>applyParticlePreset(p.id,"snow")} disabled={exporting}>SNOW</button></div><div className="scene-particle-controls"><label>NAME<input value={p.name} maxLength={32} onChange={e=>updateSceneParticle(p.id,{name:e.target.value})} disabled={exporting}/></label><label>COLOR<input type="color" value={p.color} onChange={e=>updateSceneParticle(p.id,{color:e.target.value})} disabled={exporting}/></label><label>COUNT<input type="number" min="10" max="1200" step="10" value={p.count} onChange={e=>updateSceneParticle(p.id,{count:Math.max(10,Math.min(1200,Math.round(Number(e.target.value)||10)))})} disabled={exporting}/></label><label>SIZE<input type="number" min=".005" max=".2" step=".005" value={p.size} onChange={e=>updateSceneParticle(p.id,{size:Math.max(.005,Math.min(.2,Number(e.target.value)||.005))})} disabled={exporting}/></label><label>OPACITY<input type="number" min="0" max="1" step=".05" value={p.opacity} onChange={e=>updateSceneParticle(p.id,{opacity:Math.max(0,Math.min(1,Number(e.target.value)||0))})} disabled={exporting}/></label><label>SPEED<input type="number" min="0" max="2" step=".05" value={p.speed} onChange={e=>updateSceneParticle(p.id,{speed:Math.max(0,Math.min(2,Number(e.target.value)||0))})} disabled={exporting}/></label>{(["x","y","z"] as const).map(axis=><label key={axis}>POS {axis.toUpperCase()}<input type="number" step=".1" value={p[axis]} onChange={e=>updateSceneParticle(p.id,{[axis]:Number(e.target.value)||0})} disabled={exporting}/></label>)}{(["spreadX","spreadY","spreadZ"] as const).map((axis,index)=><label key={axis}>SPREAD {"XYZ"[index]}<input type="number" min=".1" max="50" step=".5" value={p[axis]} onChange={e=>updateSceneParticle(p.id,{[axis]:Math.max(.1,Math.min(50,Number(e.target.value)||.1))})} disabled={exporting}/></label>)}</div></div>)}</section>
          <div className="layer-create">
            <label>LAYER TYPE<select value={newLayerKind} disabled={exporting} onChange={e => setNewLayerKind(e.target.value as SceneLayerKind)}><optgroup label="2D OVERLAY"><option value="text2d">Text</option><option value="rect2d">Rectangle</option><option value="circle2d">Circle</option><option value="roundedRect2d">Rounded rectangle</option><option value="triangle2d">Triangle</option><option value="line2d">Line</option></optgroup><optgroup label="3D OBJECT"><option value="box3d">3D Box</option><option value="sphere3d">3D Sphere</option><option value="cone3d">3D Cone</option><option value="torus3d">3D Torus</option><option value="cylinder3d">3D Cylinder</option><option value="plane3d">3D Plane</option><option value="torusKnot3d">3D Torus Knot</option></optgroup></select></label>
            <label>NAME<input value={newLayerName} onChange={e => setNewLayerName(e.target.value)} maxLength={32} disabled={exporting} /></label>
            <label>COLOR<input type="color" value={newLayerColor} onChange={e => setNewLayerColor(e.target.value)} disabled={exporting} /></label>
            {newLayerKind === "text2d" && <label>TEXT<input value={newLayerText} onChange={e => setNewLayerText(e.target.value)} maxLength={80} disabled={exporting} /></label>}
            <button type="button" className="button primary" onClick={addSceneLayer} disabled={exporting}>＋ ADD LAYER</button>
          </div>
          <div className="composition-presets"><span>QUICK COMPOSITIONS · EDITABLE LAYERS</span><div><button type="button" onClick={()=>applyCompositionPreset("title")} disabled={exporting}>TITLE CARD</button><button type="button" onClick={()=>applyCompositionPreset("lower-third")} disabled={exporting}>LOWER THIRD</button><button type="button" onClick={()=>applyCompositionPreset("end-card")} disabled={exporting}>END CARD</button></div></div>
          {sceneLayers.length > 0 && <div className="layer-list">{sceneLayers.map(layer => <div className={"layer-row" + (selectedLayerId === layer.id ? " selected" : "")} key={layer.id}><button type="button" className="layer-select" onClick={() => setSelectedLayerId(layer.id)}><i style={{background:layer.color}}/><span><b>{layer.name}</b><small>{layer.kind.toUpperCase()} · {layer.id}</small></span></button><button type="button" className="layer-order" onClick={() => moveSceneLayer(layer.id,-1)} disabled={exporting || sceneLayers[0]?.id===layer.id} aria-label="Move layer up">↑</button><button type="button" className="layer-order" onClick={() => moveSceneLayer(layer.id,1)} disabled={exporting || sceneLayers[sceneLayers.length-1]?.id===layer.id} aria-label="Move layer down">↓</button><button type="button" className="layer-duplicate" onClick={() => duplicateSceneLayer(layer.id)} disabled={exporting} aria-label="Duplicate layer">＋</button><button type="button" className="layer-visibility" onClick={() => updateSceneLayer(layer.id,{visible:!layer.visible})} disabled={exporting} aria-label={layer.visible ? "Hide layer" : "Show layer"}>{layer.visible ? "◉" : "○"}</button><button type="button" className="layer-delete" onClick={() => {setSceneLayers(items=>items.filter(item=>item.id!==layer.id));if(selectedLayerId===layer.id)setSelectedLayerId("");}} disabled={exporting} aria-label="Delete layer">×</button></div>)}</div>}
          {sceneLayers.filter(layer=>layer.id===selectedLayerId).map(layer => <div className="layer-properties" key={layer.id}><div className="layer-properties-title">EDIT SELECTED · {layer.name}</div><div className="layer-property-grid">{(["x","y","z","scaleX","scaleY","scaleZ","rotationX","rotationY","rotationZ","opacity","metalness","roughness"] as const).filter(key => layer.kind.endsWith("3d") || ["x","y","scaleX","scaleY","rotationZ","opacity"].includes(key)).map(key => <label key={key}>{key.toUpperCase()}<input type="number" min={["opacity","metalness","roughness"].includes(key)?0:undefined} max={["opacity","metalness","roughness"].includes(key)?1:undefined} step={["opacity","metalness","roughness"].includes(key)?0.05:0.05} value={layer[key] ?? 0} onChange={e=>updateSceneLayer(layer.id,{[key]:Number(e.target.value)})} disabled={exporting}/></label>)}</div>{layer.kind==="text2d" && <><label className="layer-text-edit">TEXT<input value={layer.text||""} onChange={e=>updateSceneLayer(layer.id,{text:e.target.value})} maxLength={120} disabled={exporting}/></label><div className="layer-property-grid"><label>FONT<select value={layer.fontFamily ?? "Arial"} onChange={e=>updateSceneLayer(layer.id,{fontFamily:e.target.value})} disabled={exporting}><option>Arial</option><option>Georgia</option><option>Impact</option><option>Courier New</option><option>Trebuchet MS</option><option>Verdana</option><option>Times New Roman</option></select></label><label>WEIGHT<select value={layer.fontWeight ?? 800} onChange={e=>updateSceneLayer(layer.id,{fontWeight:Number(e.target.value)})} disabled={exporting}><option value="400">Regular</option><option value="500">Medium</option><option value="600">Semi Bold</option><option value="700">Bold</option><option value="800">Extra Bold</option><option value="900">Black</option></select></label><label>ALIGN<select value={layer.textAlign ?? "center"} onChange={e=>updateSceneLayer(layer.id,{textAlign:e.target.value as "left"|"center"|"right"})} disabled={exporting}><option value="left">Left</option><option value="center">Center</option><option value="right">Right</option></select></label><label>OUTLINE PX<input type="number" min="0" max="24" step="1" value={layer.strokeWidth ?? 0} onChange={e=>updateSceneLayer(layer.id,{strokeWidth:Math.max(0,Math.min(24,Number(e.target.value)||0))})} disabled={exporting}/></label><label>SHADOW BLUR<input type="number" min="0" max="80" step="1" value={layer.shadowBlur ?? 0} onChange={e=>updateSceneLayer(layer.id,{shadowBlur:Math.max(0,Math.min(80,Number(e.target.value)||0))})} disabled={exporting}/></label></div><div className="layer-color-row"><label className="layer-text-edit">OUTLINE COLOR<input type="color" value={layer.strokeColor ?? "#000000"} onChange={e=>updateSceneLayer(layer.id,{strokeColor:e.target.value})} disabled={exporting}/></label><label className="layer-text-edit">SHADOW COLOR<input type="color" value={layer.shadowColor ?? "#000000"} onChange={e=>updateSceneLayer(layer.id,{shadowColor:e.target.value})} disabled={exporting}/></label></div></>}<button type="button" className="button secondary layer-keyframe-load" onClick={()=>{setObjectIdInput(layer.id);setTransformInput(layer.kind.endsWith("3d")?[layer.x,layer.y,layer.z]:[layer.x,layer.y,0]);setPropertyInput("position");setStatus("LAYER LOADED INTO KEYFRAME DIRECTOR");}}>ANIMATE THIS LAYER</button><div className="motion-presets"><span>QUICK MOTION</span><div><button type="button" onClick={()=>applyLayerMotionPreset("rise")} disabled={exporting}>RISE</button><button type="button" onClick={()=>applyLayerMotionPreset("slide")} disabled={exporting}>SLIDE</button><button type="button" onClick={()=>applyLayerMotionPreset("pop")} disabled={exporting}>POP</button><button type="button" onClick={()=>applyLayerMotionPreset("spin")} disabled={exporting}>SPIN</button></div></div><label className="layer-text-edit">COLOR<input type="color" value={layer.color} onChange={e=>updateSceneLayer(layer.id,{color:e.target.value})} disabled={exporting}/></label>{!layer.kind.endsWith("3d") && <div className="gradient-controls"><label>FILL MODE<select value={layer.fillMode ?? "solid"} onChange={e=>updateSceneLayer(layer.id,{fillMode:e.target.value as "solid"|"gradient"})} disabled={exporting}><option value="solid">Solid</option><option value="gradient">Gradient</option></select></label>{layer.fillMode === "gradient" && <><label>END COLOR<input type="color" value={layer.gradientColor ?? "#7c3aed"} onChange={e=>updateSceneLayer(layer.id,{gradientColor:e.target.value})} disabled={exporting}/></label><label>ANGLE<input type="number" min="0" max="360" step="5" value={layer.gradientAngle ?? 0} onChange={e=>updateSceneLayer(layer.id,{gradientAngle:Math.max(0,Math.min(360,Number(e.target.value)||0))})} disabled={exporting}/></label></>}</div>}{!layer.kind.endsWith("3d") && layer.kind !== "text2d" && layer.kind !== "line2d" && <div className="shape-outline-controls"><label>OUTLINE COLOR<input type="color" value={layer.strokeColor ?? "#000000"} onChange={e=>updateSceneLayer(layer.id,{strokeColor:e.target.value})} disabled={exporting}/></label><label>OUTLINE PX<input type="number" min="0" max="24" step="1" value={layer.strokeWidth ?? 0} onChange={e=>updateSceneLayer(layer.id,{strokeWidth:Math.max(0,Math.min(24,Number(e.target.value)||0))})} disabled={exporting}/></label></div>}{layer.kind.endsWith("3d") && <><label className="layer-text-edit">EMISSIVE COLOR<input type="color" value={layer.emissive ?? "#000000"} onChange={e=>updateSceneLayer(layer.id,{emissive:e.target.value})} disabled={exporting}/></label><label className="layer-text-edit">EMISSIVE INTENSITY<input type="number" min="0" max="10" step="0.1" value={layer.emissiveIntensity ?? 0} onChange={e=>updateSceneLayer(layer.id,{emissiveIntensity:Math.max(0,Number(e.target.value)||0)})} disabled={exporting}/></label><div className="material-presets"><span>QUICK MATERIAL</span><div><button type="button" onClick={()=>applyMaterialPreset(layer.id,"metal")} disabled={exporting}>METAL</button><button type="button" onClick={()=>applyMaterialPreset(layer.id,"glass")} disabled={exporting}>GLASS</button><button type="button" onClick={()=>applyMaterialPreset(layer.id,"matte")} disabled={exporting}>MATTE</button><button type="button" onClick={()=>applyMaterialPreset(layer.id,"glow")} disabled={exporting}>GLOW</button></div></div></>}{layer.kind.endsWith("3d") && <div className="layer-property-grid geometry-params">{["sphere3d","cone3d","cylinder3d","torus3d","torusKnot3d"].includes(layer.kind) && <label>RADIUS<input type="number" min="0.01" step="0.05" value={layer.radius ?? .5} onChange={e=>updateSceneLayer(layer.id,{radius:Math.max(.01,Number(e.target.value)||.01)})} disabled={exporting}/></label>}{["cone3d","cylinder3d","plane3d"].includes(layer.kind) && <label>HEIGHT<input type="number" min="0.01" step="0.05" value={layer.height ?? 1} onChange={e=>updateSceneLayer(layer.id,{height:Math.max(.01,Number(e.target.value)||.01)})} disabled={exporting}/></label>}{["torus3d","torusKnot3d"].includes(layer.kind) && <label>TUBE<input type="number" min="0.005" step="0.01" value={layer.tube ?? .08} onChange={e=>updateSceneLayer(layer.id,{tube:Math.max(.005,Number(e.target.value)||.005)})} disabled={exporting}/></label>}{layer.kind==="plane3d" && <label>WIDTH<input type="number" min="0.01" step="0.05" value={layer.width ?? 1} onChange={e=>updateSceneLayer(layer.id,{width:Math.max(.01,Number(e.target.value)||.01)})} disabled={exporting}/></label>}<label>SEGMENTS<input type="number" min="6" max="64" step="1" value={layer.segments ?? 24} onChange={e=>updateSceneLayer(layer.id,{segments:Math.max(6,Math.min(64,Math.round(Number(e.target.value)||6)))})} disabled={exporting}/></label></div>}<div className="keyframe-note">{layer.kind.endsWith("3d") ? "3D position and rotation use world units and radians. Metalness, roughness and emissive controls adjust the material." : "2D X/Y use normalized canvas coordinates (0–1). Size values are relative to the canvas; rotation is in radians and opacity ranges from 0 to 1."}</div></div>)}
          <div className="keyframe-note">2D layers render above your script. The top row is drawn last and appears above lower rows. 3D layers join the Babylon.js scene when your script calls api.render3D. Layer settings autosave and travel with your project.</div>
        </section>
        <section className="keyframe-panel" aria-label="3D animation keyframe editor">
          <div className="keyframe-heading"><div><span className="section-kicker">05 / ANIMATION DIRECTOR</span><h2>Visual Keyframes</h2><p>Animate 2D scene layers or 3D objects with position, rotation and scale tracks.</p></div><span className="keyframe-count">{visualTracks.length} TRACKS</span></div>
          <label className="keyframe-object">OBJECT ID<input value={objectIdInput} onChange={e => setObjectIdInput(e.target.value)} placeholder="e.g. earth or title-layer" disabled={exporting} /></label>
          <div className="keyframe-controls">
            <label>PROPERTY<select value={propertyInput} disabled={exporting} onChange={e => { const next = e.target.value as VisualTransformProperty; setPropertyInput(next); setTransformInput(next === "scale" ? [1,1,1] : [0,0,0]); }}><option value="position">POSITION</option><option value="rotation">ROTATION (RAD)</option><option value="scale">SCALE</option></select></label>
            {(["X","Y","Z"] as const).map((axis,index) => <label key={axis}>{axis}<input type="number" step="0.1" value={transformInput[index]} disabled={exporting} onChange={e => setTransformInput(current => current.map((v,i) => i === index ? Number(e.target.value) : v) as [number,number,number])} /></label>)}
            <button type="button" className="button primary keyframe-add" onClick={addVisualKeyframe} disabled={exporting}>＋ KEYFRAME AT {elapsed.toFixed(2)}s</button>
          </div>
          {visualTracks.length > 0 && <div className="keyframe-track-list">{visualTracks.map(track => <div className="keyframe-track" key={track.id}><div className="keyframe-track-title"><b>{track.objectId}</b><span>{track.property.toUpperCase()}</span><button type="button" onClick={() => setVisualTracks(items => items.filter(item => item.id !== track.id))} disabled={exporting} aria-label={"Delete " + track.objectId + " " + track.property}>×</button></div><div className="keyframe-points">{track.frames.map(frame => <div className="keyframe-point" key={frame.time}><div className="keyframe-point-top"><button type="button" className="keyframe-point-jump" onClick={() => scrubTo(frame.time)} disabled={exporting}><b>{frame.time.toFixed(2)}s</b><span>{(frame.value as number[]).map((v: number) => Number(v).toFixed(2)).join(" / ")}</span></button><label>TIME<input type="number" min="0" max={duration} step="0.01" value={frame.time} disabled={exporting} onChange={e=>{const time=Math.max(0,Math.min(duration,Number(e.target.value)||0));setVisualTracks(items=>items.map(item=>item.id!==track.id?item:{...item,frames:[...item.frames.filter(point=>point!==frame&&Math.abs(point.time-time)>.001),{...frame,time}].sort((a,b)=>a.time-b.time)}));}}/></label><label>EASE<select value={frame.ease ?? "smooth"} disabled={exporting} onChange={e=>setVisualTracks(items=>items.map(item=>item.id!==track.id?item:{...item,frames:item.frames.map(point=>point!==frame?point:{...point,ease:e.target.value as AnimationKeyframe["ease"]})}))}><option value="linear">Linear</option><option value="smooth">Smooth</option><option value="in">Ease In</option><option value="out">Ease Out</option><option value="hold">Hold</option></select></label><button type="button" className="keyframe-point-delete" onClick={()=>setVisualTracks(items=>items.map(item=>item.id!==track.id?item:{...item,frames:item.frames.filter(point=>point!==frame)}).filter(item=>item.frames.length>0))} disabled={exporting} aria-label="Delete keyframe">×</button></div><div className="keyframe-point-values">{(frame.value as number[]).map((value,index)=><label key={index}>{"XYZ"[index]}<input type="number" step="0.05" value={value} disabled={exporting} onChange={e=>setVisualTracks(items=>items.map(item=>item.id!==track.id?item:{...item,frames:item.frames.map(point=>point!==frame?point:{...point,value:(point.value as number[]).map((v,axis)=>axis===index?(Number(e.target.value)||0):v)})}))}/></label>)}</div></div>)}</div></div>)}</div>}
          <div className="keyframe-note">Keyframes interpolate between timestamps and are applied during preview and export. For 2D layers, position uses normalized X/Y (0–1), scale uses relative width/height, and rotation uses the Z value in radians. For 3D objects, all three axes are supported; rotation values use radians. Track values override the matching property.</div>
        </section>
        <div className="render-presets"><span>QUICK EXPORT PROFILES</span><div><button type="button" onClick={()=>applyRenderPreset("mobile")} disabled={exporting}>MOBILE FAST · 540P</button><button type="button" onClick={()=>applyRenderPreset("cinematic")} disabled={exporting}>CINEMATIC · 1080P</button><button type="button" onClick={()=>applyRenderPreset("social")} disabled={exporting}>VERTICAL SOCIAL · 720P</button></div></div>
        <div className="render-settings">
          <label>FORMAT <select value={format} disabled={exporting} onChange={e => setFormat(e.target.value)}>{Object.keys(formats).map(item => <option key={item}>{item}</option>)}</select></label>
          <label>QUALITY <select value={quality} disabled={exporting} onChange={e => setQuality(e.target.value)}><option value="540p">540p · mobile / fast</option><option value="720p">720p · balanced</option><option value="1080p">1080p · sharper</option></select></label>
          <label>DURATION <select value={duration} disabled={exporting} onChange={e => setDuration(Number(e.target.value))}>{[5,8,10,15,20,30,45,60].map(value => <option key={value} value={value}>{value} seconds</option>)}</select></label>
          <label>FPS <select value={fps} disabled={exporting} onChange={e => setFps(Number(e.target.value))}><option value={24}>24 · cinematic</option><option value={30}>30 · standard</option><option value={60}>60 · smooth</option></select></label>
          <label>CONTAINER <select value={container} disabled={exporting} onChange={e => setContainer(e.target.value as ExportContainer)}><option value="mp4">MP4 · H.264</option><option value="webm">WebM · VP9 / VP8</option></select></label>
          <label>BITRATE <select value={bitrate} disabled={exporting} onChange={e => setBitrate(Number(e.target.value))}><option value={4}>4 Mbps · light</option><option value={6}>6 Mbps · balanced</option><option value={8}>8 Mbps · high</option><option value={12}>12 Mbps · max</option></select></label>
          <label className="button secondary audio-picker">♫ ADD MUSIC<input hidden type="file" accept="audio/*,.mp3,.wav,.m4a,.ogg,.opus" disabled={exporting} onChange={e => { const file = e.target.files?.[0]; if (file && file.size > 50 * 1024 * 1024) setError("Choose an audio file smaller than 50 MB."); else if (file) { setAudioFile(file); setError(""); } e.currentTarget.value = ""; }} /></label>
          {audioFile && <><span className="audio-name">♪ {audioFile.name}<button type="button" onClick={() => {setAudioFile(null);setAudioTrimStart(0);setAudioTrimEnd(0);setAudioFadeIn(0);setAudioFadeOut(0);setAudioVolume(1);}} disabled={exporting} aria-label="Remove music">×</button></span><div className="audio-mixer"><label>TRIM IN <input type="number" min="0" max="3600" step="0.1" value={audioTrimStart} onChange={e=>setAudioTrimStart(Math.max(0,Number(e.target.value)||0))} disabled={exporting}/> s</label><label>TRIM OUT <input type="number" min="0" max="3600" step="0.1" value={audioTrimEnd} onChange={e=>setAudioTrimEnd(Math.max(0,Number(e.target.value)||0))} disabled={exporting}/> s <small>0 = end</small></label><label>VOLUME <input type="range" min="0" max="1.5" step="0.05" value={audioVolume} onChange={e=>setAudioVolume(Number(e.target.value))} disabled={exporting}/><b>{Math.round(audioVolume*100)}%</b></label><label>FADE IN <input type="number" min="0" max="15" step="0.1" value={audioFadeIn} onChange={e=>setAudioFadeIn(Math.max(0,Number(e.target.value)||0))} disabled={exporting}/> s</label><label>FADE OUT <input type="number" min="0" max="15" step="0.1" value={audioFadeOut} onChange={e=>setAudioFadeOut(Math.max(0,Number(e.target.value)||0))} disabled={exporting}/> s</label></div></>}
          {exporting && <div className="render-progress" role="progressbar" aria-valuenow={Math.round(renderProgress * 100)} aria-valuemin={0} aria-valuemax={100}><i style={{ width: `${renderProgress * 100}%` }} /></div>}
          <div className="render-note"><span>●</span> {webCodecsAvailable ? "WebCodecs ready · local MP4 / WebM" : "WebCodecs unavailable · check Chrome version"} · {Math.ceil(duration * fps).toLocaleString()} frames · No cloud rendering.</div>
        </div>
      </section>
    </section>
    <nav className="mobile-action-bar" aria-label="Quick actions">
      <button type="button" onClick={() => { runCode(); setMobileTab("preview"); }} disabled={exporting}>▶ RUN</button>
      <button type="button" onClick={() => { running ? pause() : play(); setMobileTab("preview"); }} disabled={exporting}>{running ? "Ⅱ PAUSE" : "▶ PLAY"}</button>
      <button type="button" onClick={saveProject}>↓ SAVE</button>
      <button type="button" onClick={() => setMobileTab("preview")}>▣ VIEW</button>
    </nav>
    <footer><span>CODECINEMA</span><span>TAP RUN · PREVIEW · EXPORT</span></footer>
  </main>;
}
