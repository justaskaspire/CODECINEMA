import { useCallback, useEffect, useRef, useState } from "react";
import { renderExport, type ExportContainer } from "./mediaExport";

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
`
};

const api = {
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
  }
};

type CinemaApi = {
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
};
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
  const [renderProgress, setRenderProgress] = useState(0);
  const [webCodecsAvailable, setWebCodecsAvailable] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<(Event & { prompt: () => Promise<void>; userChoice?: Promise<{ outcome: string }> }) | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [projectName, setProjectName] = useState(() => { try { return localStorage.getItem("codec-2026-project-name") || "Untitled Cinema"; } catch { return "Untitled Cinema"; } });
  const [mobileTab, setMobileTab] = useState<"editor" | "preview">("editor");
  const [historyState, setHistoryState] = useState({ canUndo: false, canRedo: false });
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
    "16:9": quality === "720p" ? [1280, 720] : [1920, 1080],
    "9:16": quality === "720p" ? [720, 1280] : [1080, 1920],
    "1:1": quality === "720p" ? [720, 720] : [1080, 1080],
    "4:5": quality === "720p" ? [720, 900] : [1080, 1350]
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

  useEffect(() => { codeRef.current = code; try { localStorage.setItem("codec-2026-script", code); localStorage.setItem("codec-2026-project-name", projectName); } catch { /* storage may be unavailable */ } }, [code, projectName]);

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
      setError("");
    } catch (e) {
      setError(scriptError(e));
      setRunning(false);
      setStatus("SCRIPT ERROR");
    }
  }, []);

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
      settings: { duration, format, quality, fps, container, bitrate }
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
        settings?: { duration?: number; format?: string; quality?: string; fps?: number; container?: ExportContainer; bitrate?: number };
      };
      if (project.app !== "CODECINEMA" || project.schemaVersion !== 1 || typeof project.code !== "string") {
        throw new Error("This is not a supported CODECINEMA project file.");
      }
      const settings = project.settings || {};
      changeCode(project.code);
      setProjectName(typeof project.name === "string" ? project.name.slice(0, 60) : "Imported Cinema");
      if ([5,8,10,15,20,30,45,60].includes(settings.duration || 0)) setDuration(settings.duration!);
      if (["16:9","9:16","1:1","4:5"].includes(settings.format || "")) setFormat(settings.format!);
      if (["720p","1080p"].includes(settings.quality || "")) setQuality(settings.quality!);
      if ([24,30,60].includes(settings.fps || 0)) setFps(settings.fps!);
      if (settings.container === "mp4" || settings.container === "webm") setContainer(settings.container);
      if ([4,6,8,12].includes(settings.bitrate || 0)) setBitrate(settings.bitrate!);
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
      <div className="brand"><span className="brand-mark">C</span><span>CODE<span className="brand-light">CINEMA</span></span><small>CODE STUDIO / 001</small></div>
      <div className="top-status"><i /> LOCAL RENDER ENGINE <span>/</span> {status}</div>
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
        <div className="example-row"><label htmlFor="example-select">START FROM</label><select id="example-select" value={example} onChange={e => { const key=e.target.value; setExample(key); if (key) { changeCode(examples[key]); setStatus("EXAMPLE LOADED — PRESS RUN"); } }}><option value="">Choose an example…</option><option>Cinematic title</option><option>Particle universe</option><option>Orbiting geometry</option><option>Wave typography</option><option>Motion graphics lab</option><option>Scene sequence</option><option>Cinematic effects</option><option>Kinetic typography</option></select></div>
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
        <div className="api-card">
          <div className="section-title">02 / QUICK REFERENCE</div>
          <p><code>ctx</code> — Canvas 2D drawing context</p>
          <p><code>t</code> — current time in seconds</p>
          <p><code>w</code> / <code>h</code> — output width and height</p>
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
          <button className="play-control" onClick={running ? pause : play} aria-label={running ? "Pause" : "Play"} disabled={exporting}>{running ? "Ⅱ" : "▶"}</button>
          <span>{elapsed.toFixed(2)}s <em>/ {duration.toFixed(1)}s</em></span>
          <input className="scrubber" type="range" min="0" max={duration} step="0.01" value={elapsed} disabled={exporting} onChange={e => { const value = Number(e.target.value); elapsedRef.current = value; setElapsed(value); setRunning(false); drawFrame(value); setStatus("SCRUBBING"); }} />
          <span>{Math.max(0, duration - elapsed).toFixed(1)}s left</span>
        </div>
        <div className="render-settings">
          <label>FORMAT <select value={format} disabled={exporting} onChange={e => setFormat(e.target.value)}>{Object.keys(formats).map(item => <option key={item}>{item}</option>)}</select></label>
          <label>QUALITY <select value={quality} disabled={exporting} onChange={e => setQuality(e.target.value)}><option value="720p">720p · lighter</option><option value="1080p">1080p · sharper</option></select></label>
          <label>DURATION <select value={duration} disabled={exporting} onChange={e => setDuration(Number(e.target.value))}>{[5,8,10,15,20,30,45,60].map(value => <option key={value} value={value}>{value} seconds</option>)}</select></label>
          <label>FPS <select value={fps} disabled={exporting} onChange={e => setFps(Number(e.target.value))}><option value={24}>24 · cinematic</option><option value={30}>30 · standard</option><option value={60}>60 · smooth</option></select></label>
          <label>CONTAINER <select value={container} disabled={exporting} onChange={e => setContainer(e.target.value as ExportContainer)}><option value="mp4">MP4 · H.264</option><option value="webm">WebM · VP9 / VP8</option></select></label>
          <label>BITRATE <select value={bitrate} disabled={exporting} onChange={e => setBitrate(Number(e.target.value))}><option value={4}>4 Mbps · light</option><option value={6}>6 Mbps · balanced</option><option value={8}>8 Mbps · high</option><option value={12}>12 Mbps · max</option></select></label>
          <label className="button secondary audio-picker">♫ ADD MUSIC<input hidden type="file" accept="audio/*,.mp3,.wav,.m4a,.ogg,.opus" disabled={exporting} onChange={e => { const file = e.target.files?.[0]; if (file && file.size > 50 * 1024 * 1024) setError("Choose an audio file smaller than 50 MB."); else if (file) { setAudioFile(file); setError(""); } e.currentTarget.value = ""; }} /></label>
          {audioFile && <span className="audio-name">♪ {audioFile.name}<button type="button" onClick={() => setAudioFile(null)} disabled={exporting} aria-label="Remove music">×</button></span>}
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
    <footer><span>CODECINEMA <b>0.19.0 / COMPOSITING & LIGHT ENGINE</b></span><span>TAP RUN · PREVIEW · EXPORT</span></footer>
  </main>;
}
