/**
 * CODECINEMA Advanced Engine Suite
 * Deterministic helpers designed to work at any preview/export frame time.
 * No external runtime dependencies; safe for mobile browsers.
 */

export type Vec2 = { x: number; y: number };
export type CharacterExpression = "neutral" | "happy" | "sad" | "surprised";
export type CharacterMotion = "idle" | "breathe" | "walk" | "run";
export type CharacterOptions = {
  x: number; y: number; scale?: number; motion?: CharacterMotion;
  expression?: CharacterExpression; facing?: 1 | -1; color?: string;
  lineWidth?: number; timeOffset?: number;
};
export type CameraKey = {
  time: number; position: [number, number, number];
  lookAt: [number, number, number]; fov?: number;
  ease?: "linear" | "smooth" | "in" | "out";
};
export type PhysicsBody = {
  id: string; x: number; y: number; radius?: number; mass?: number;
  vx?: number; vy?: number; restitution?: number; friction?: number;
  static?: boolean;
};
export type AudioClipCue = {
  id: string; start: number; end: number; volume?: number;
  fadeIn?: number; fadeOut?: number;
};

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const smooth = (p: number) => p * p * (3 - 2 * p);
const mix = (a: number, b: number, p: number) => a + (b - a) * p;

/** Draws a reusable 2D character with a simple articulated skeleton. */
export function drawCharacter2D(ctx: CanvasRenderingContext2D, time: number, options: CharacterOptions) {
  const { x, y, scale = 1, motion = "idle", expression = "neutral", facing = 1, color = "#b5ff6d", lineWidth = 5, timeOffset = 0 } = options;
  const t = Math.max(0, time + timeOffset), cycle = t * (motion === "run" ? 12 : motion === "walk" ? 6 : 2);
  const moving = motion === "walk" || motion === "run";
  const stride = moving ? Math.sin(cycle) * (motion === "run" ? 0.62 : 0.38) : 0;
  const bounce = motion === "run" ? Math.abs(Math.sin(cycle * 2)) * 9 : motion === "walk" ? Math.abs(Math.sin(cycle * 2)) * 4 : motion === "breathe" ? Math.sin(t * 2.1) * 2 : 0;
  const armSwing = moving ? Math.sin(cycle + Math.PI) * (motion === "run" ? 0.85 : 0.55) : Math.sin(t * 1.4) * 0.035;
  const leg = (angle: number, length: number) => ({ x: Math.sin(angle) * length, y: Math.cos(angle) * length });
  ctx.save();
  ctx.translate(x, y - bounce * scale);
  ctx.scale(scale * facing, scale);
  ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.lineWidth = lineWidth;
  const stroke = (points: Vec2[], width = lineWidth) => {
    ctx.beginPath(); ctx.lineWidth = width; ctx.moveTo(points[0].x, points[0].y);
    for (const p of points.slice(1)) ctx.lineTo(p.x, p.y);
    ctx.stroke();
  };
  const headY = -66, shoulderY = -34, hipY = 20;
  ctx.strokeStyle = color; ctx.fillStyle = color;
  // Legs and feet.
  const leftLeg = leg(stride, 34), rightLeg = leg(-stride, 34);
  stroke([{x:-7,y:hipY},{x:-7+leftLeg.x,y:hipY+leftLeg.y},{x:-12+leftLeg.x,y:hipY+leftLeg.y+5}], lineWidth);
  stroke([{x:7,y:hipY},{x:7+rightLeg.x,y:hipY+rightLeg.y},{x:12+rightLeg.x,y:hipY+rightLeg.y+5}], lineWidth);
  // Torso and arms.
  stroke([{x:0,y:shoulderY},{x:0,y:hipY}], lineWidth + 1);
  const leftArm = armSwing, rightArm = -armSwing;
  const armPoint = (a:number):Vec2 => ({x:Math.sin(a)*28,y:shoulderY+Math.cos(a)*28});
  stroke([{x:-1,y:shoulderY+3},armPoint(leftArm),{x:armPoint(leftArm).x-3,y:armPoint(leftArm).y+10}], lineWidth);
  stroke([{x:1,y:shoulderY+3},armPoint(rightArm),{x:armPoint(rightArm).x+3,y:armPoint(rightArm).y+10}], lineWidth);
  // Head.
  ctx.beginPath(); ctx.arc(0, headY, 17, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = "#111827";
  const eyeY = headY - 2;
  if (expression === "surprised") {
    ctx.beginPath(); ctx.arc(-6,eyeY,2.2,0,Math.PI*2); ctx.arc(6,eyeY,2.2,0,Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(0,headY+7,3.2,0,Math.PI*2); ctx.fill();
  } else {
    ctx.beginPath(); ctx.arc(-6,eyeY,1.8,0,Math.PI*2); ctx.arc(6,eyeY,1.8,0,Math.PI*2); ctx.fill();
    ctx.strokeStyle = "#111827"; ctx.lineWidth = 1.8; ctx.beginPath();
    if (expression === "happy") ctx.arc(0,headY+3,6,0.15,Math.PI-0.15);
    else if (expression === "sad") ctx.arc(0,headY+12,6,Math.PI+0.2,Math.PI*2-0.2);
    else ctx.moveTo(-3,headY+8), ctx.lineTo(3,headY+8);
    ctx.stroke();
  }
  ctx.restore();
}

/** Deterministic keyframed 3D camera path. */
export function sampleCameraPath(time: number, keys: CameraKey[], loop = false) {
  const ordered = [...keys].filter(k => Number.isFinite(k.time)).sort((a,b)=>a.time-b.time);
  if (!ordered.length) return { position:[0,0,8] as [number,number,number], lookAt:[0,0,0] as [number,number,number], fov:45 };
  if (ordered.length === 1) return { position:ordered[0].position, lookAt:ordered[0].lookAt, fov:ordered[0].fov ?? 45 };
  const first=ordered[0].time,last=ordered[ordered.length-1].time,span=Math.max(.001,last-first);
  let t=time;
  if(loop) t=first+(((time-first)%span)+span)%span;
  if(t<=first) t=first;
  if(t>=last) t=last;
  let a=ordered[0],b=ordered[1];
  for(let i=0;i<ordered.length-1;i++) if(t>=ordered[i].time&&t<=ordered[i+1].time){a=ordered[i];b=ordered[i+1];break;}
  const raw=clamp((t-a.time)/Math.max(.0001,b.time-a.time),0,1);
  const p=a.ease==="linear"?raw:a.ease==="in"?raw*raw:a.ease==="out"?1-(1-raw)*(1-raw):smooth(raw);
  return {
    position:a.position.map((v,i)=>mix(v,b.position[i]??v,p)) as [number,number,number],
    lookAt:a.lookAt.map((v,i)=>mix(v,b.lookAt[i]??v,p)) as [number,number,number],
    fov:mix(a.fov??45,b.fov??45,p)
  };
}

/** A deterministic, fixed-step 2D circle physics solve from t=0 to the requested frame. */
export function simulatePhysics2D(time: number, input: PhysicsBody[], options: { gravity?: number; groundY?: number; left?: number; right?: number; substeps?: number } = {}) {
  const bodies=input.slice(0,32).map(b=>({...b}));
  const gravity=options.gravity??980, ground=options.groundY??Infinity, left=options.left??-Infinity, right=options.right??Infinity;
  const steps=Math.min(2400,Math.max(0,Math.ceil(Math.max(0,time)*60)));
  const dt=steps?Math.max(0,time)/steps:0;
  for(let step=0;step<steps;step++){
    for(const b of bodies){
      if(b.static) continue;
      b.vy=(b.vy??0)+gravity*dt; b.x+=(b.vx??0)*dt; b.y+=(b.vy??0)*dt;
      const r=Math.max(0,b.radius??12);
      if(b.y+r>ground){b.y=ground-r;b.vy=-(b.vy??0)*clamp(b.restitution??.45,0,1);b.vx=(b.vx??0)*(1-clamp(b.friction??.08,0,1));if(Math.abs(b.vy)<8)b.vy=0;}
      if(b.x-r<left){b.x=left+r;b.vx=Math.abs(b.vx??0)*clamp(b.restitution??.45,0,1);}
      if(b.x+r>right){b.x=right-r;b.vx=-Math.abs(b.vx??0)*clamp(b.restitution??.45,0,1);}
    }
    for(let i=0;i<bodies.length;i++) for(let j=i+1;j<bodies.length;j++){
      const a=bodies[i],b=bodies[j]; if(a.static&&b.static)continue;
      const dx=b.x-a.x,dy=b.y-a.y,dist=Math.hypot(dx,dy)||.0001,min=(a.radius??12)+(b.radius??12);
      if(dist>=min)continue;
      const nx=dx/dist,ny=dy/dist,overlap=min-dist,am=a.static?Infinity:Math.max(.001,a.mass??1),bm=b.static?Infinity:Math.max(.001,b.mass??1);
      const invA=a.static?0:1/am, invB=b.static?0:1/bm, invTotal=invA+invB;
      if(invTotal>0){if(!a.static){a.x-=nx*overlap*(invA/invTotal);a.y-=ny*overlap*(invA/invTotal);}if(!b.static){b.x+=nx*overlap*(invB/invTotal);b.y+=ny*overlap*(invB/invTotal);}}
      const relative=((b.vx??0)-(a.vx??0))*nx+((b.vy??0)-(a.vy??0))*ny;
      if(relative<0&&invTotal>0){const e=Math.min(clamp(a.restitution??.45,0,1),clamp(b.restitution??.45,0,1)),impulse=-(1+e)*relative/invTotal;if(!a.static){a.vx=(a.vx??0)-impulse*nx*invA;a.vy=(a.vy??0)-impulse*ny*invA;}if(!b.static){b.vx=(b.vx??0)+impulse*nx*invB;b.vy=(b.vy??0)+impulse*ny*invB;}}
    }
  }
  return bodies;
}

/** Audio timeline envelope calculation; returns per-clip gain at an exact timeline time. */
export function sampleAudioTimeline(time: number, clips: AudioClipCue[]) {
  return clips.filter(c=>time>=c.start&&time<=c.end).map(c=>{
    const fadeIn=Math.max(0,c.fadeIn??0),fadeOut=Math.max(0,c.fadeOut??0);
    const inGain=fadeIn?clamp((time-c.start)/fadeIn,0,1):1;
    const outGain=fadeOut?clamp((c.end-time)/fadeOut,0,1):1;
    return { id:c.id, gain:clamp(c.volume??1,0,1.5)*Math.min(inGain,outGain) };
  });
}

/** Export planning helpers for frame-accurate, mobile-conscious rendering. */
export function getRenderPlan(duration: number, fps: number, bitrateMbps: number, width: number, height: number) {
  const safeDuration=Math.max(0,duration), safeFps=clamp(Math.round(fps),1,60), safeBitrate=clamp(bitrateMbps,.5,30);
  const frames=Math.ceil(safeDuration*safeFps);
  const estimatedBytes=Math.ceil(safeDuration*safeBitrate*1_000_000/8);
  return { frames, fps:safeFps, duration:safeDuration, width:Math.max(1,Math.floor(width)), height:Math.max(1,Math.floor(height)), estimatedBytes, estimatedMB:estimatedBytes/1048576, mobileSafe:estimatedBytes<=80*1048576 };
}

export function createAdvancedApi() {
  return {
    character2D: drawCharacter2D,
    cameraPath3D: sampleCameraPath,
    physics2D: simulatePhysics2D,
    audioTimeline: sampleAudioTimeline,
    renderPlan: getRenderPlan
  };
}
