// NEON CHAOS — 50-second vertical action-comedy engine showcase.
// Recommended: 9:16, 720p, 30 FPS, medium 3D quality.
// All motion is deterministic from t, so preview scrubbing and export match.
// For sound: import a music/SFX file in the Audio Mixer; this script supplies
// timing cues for visual accents but does not start audio playback itself.

const clamp = (v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const smooth = v => {v=clamp(v);return v*v*(3-2*v);};
const mix = (a,b,p)=>a+(b-a)*p;
const segment = (a,b)=>smooth((t-a)/(b-a));
const unit = Math.min(w,h);
const cx=w*.5, floor=h*.79;

function text(label,x,y,size,color="#fff",alpha=1){
  ctx.save();ctx.globalAlpha=alpha;ctx.textAlign="center";ctx.textBaseline="middle";
  ctx.font="900 "+Math.round(size)+"px Arial";ctx.lineJoin="round";
  ctx.lineWidth=Math.max(3,size*.075);ctx.strokeStyle="rgba(3,5,18,.85)";
  ctx.strokeText(label,x,y);ctx.fillStyle=color;ctx.fillText(label,x,y);ctx.restore();
}
function background(top="#090b22",bottom="#170b2e"){
  const g=ctx.createLinearGradient(0,0,0,h);g.addColorStop(0,top);g.addColorStop(1,bottom);
  ctx.fillStyle=g;ctx.fillRect(0,0,w,h);
}
function rand(n){const x=Math.sin(n*127.1+311.7)*43758.5453;return x-Math.floor(x);}
function neonGrid(){
  ctx.save();ctx.strokeStyle="rgba(80,220,255,.16)";ctx.lineWidth=1;
  const horizon=h*.58;
  for(let i=-8;i<=8;i++){ctx.beginPath();ctx.moveTo(cx+i*unit*.12,horizon);ctx.lineTo(cx+i*unit*.65,h);ctx.stroke();}
  for(let i=0;i<9;i++){const p=i/8;const y=horizon+(h-horizon)*p*p;ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(w,y);ctx.stroke();}
  ctx.restore();
}
function skyline(){
  for(let i=0;i<13;i++){
    const bw=w*(.055+rand(i+3)*.045), bh=h*(.12+rand(i+30)*.34);
    const x=i*w/12-bw*.5, y=h*.59-bh;
    ctx.fillStyle=i%2?"#111b3c":"#171438";ctx.fillRect(x,y,bw,bh);
    ctx.strokeStyle=i%2?"#18d9f2":"#a855f7";ctx.globalAlpha=.45;ctx.strokeRect(x,y,bw,bh);ctx.globalAlpha=1;
    for(let row=0;row<5;row++)for(let col=0;col<3;col++){
      if(rand(i*30+row*4+col)>.35){ctx.fillStyle=rand(i+row+col)>.5?"#16e0f5":"#ff4fd8";ctx.globalAlpha=.55;
        ctx.fillRect(x+bw*.18+col*bw*.23,y+bh*.16+row*bh*.14,Math.max(2,bw*.07),Math.max(3,bh*.025));}
    }
  }
}
function button2D(pulse=0){
  const x=cx,y=h*.64,r=unit*.095;
  ctx.save();ctx.shadowColor="#ff174f";ctx.shadowBlur=24+20*pulse;
  ctx.fillStyle="#25213d";ctx.beginPath();ctx.roundRect(x-r*1.25,y+r*.55,r*2.5,r*.48,12);ctx.fill();
  ctx.fillStyle="#fa174f";ctx.beginPath();ctx.ellipse(x,y,r,r*.72,0,0,Math.PI*2);ctx.fill();
  ctx.strokeStyle="#ff9bb4";ctx.lineWidth=4;ctx.stroke();ctx.shadowBlur=0;
  ctx.fillStyle="#fff";ctx.beginPath();ctx.ellipse(x,y-r*.1,r*.62,r*.38,0,0,Math.PI*2);ctx.fill();
  ctx.restore();
}
function stickman(x,y,scale=1,motion="idle",expression="neutral",facing=1){
  api.character2D(ctx,t,{x,y,scale,motion,expression,facing,color:"#f4f7ff",lineWidth:5});
  // Tiny violet visor keeps the hero readable against the neon background.
  ctx.save();ctx.fillStyle="#b8f4ff";ctx.shadowColor="#23dfff";ctx.shadowBlur=12;
  ctx.fillRect(x-9*scale,y-70*scale,18*scale,3*scale);ctx.restore();
}
function flash(power=1){
  ctx.save();ctx.globalAlpha=clamp(power)*.5;ctx.fillStyle="#e8fbff";ctx.fillRect(0,0,w,h);ctx.restore();
}
function drawBurst(x,y,p){
  for(let i=0;i<22;i++){
    const a=rand(i+8)*Math.PI*2, d=(.15+rand(i+90)*.9)*unit*p;
    ctx.globalAlpha=(1-p)*.9;ctx.fillStyle=i%2?"#21e6ff":"#ff48c8";
    ctx.beginPath();ctx.arc(x+Math.cos(a)*d,y+Math.sin(a)*d,2+rand(i+7)*5,0,Math.PI*2);ctx.fill();
  }ctx.globalAlpha=1;
}

// 3D city, flying cars and portal. IDs stay stable across every frame.
const portalOpen=segment(22,28);
const portalPulse=.5+.5*Math.sin(t*5);
const cam=api.cameraPath3D(t,[
  {time:0,position:[0,5,19],lookAt:[0,1,0],fov:48,ease:"power2.inOut"},
  {time:6,position:[0,4,15],lookAt:[0,1,0],fov:43,ease:"power3.inOut"},
  {time:13,position:[-5,3,12],lookAt:[0,1,0],fov:54,ease:"power2.inOut"},
  {time:22,position:[0,7,17],lookAt:[0,2,0],fov:48,ease:"sine.inOut"},
  {time:32,position:[7,3,12],lookAt:[0,1,0],fov:52,ease:"power3.inOut"},
  {time:42,position:[0,4,14],lookAt:[0,1,0],fov:45,ease:"power2.inOut"},
  {time:50,position:[0,5,18],lookAt:[0,1,0],fov:48,ease:"sine.inOut"}
],false);

const buildings=[];
for(let i=0;i<9;i++){
  const x=(i-4)*2.25, height=2.8+rand(i+4)*4.5;
  buildings.push({id:"tower-"+i,type:"box",size:[1.55,height,1.5],position:[x,height/2-1.2,-2-rand(i+20)*2],
    color:i%2?"#171d48":"#25133f",emissive:i%2?"#092b60":"#3c0e55",emissiveIntensity:.32,roughness:.72});
}
const objects=[
  ...buildings,
  {id:"road",type:"box",size:[22,.18,12],position:[0,-1.35,0],color:"#10142b",emissive:"#111a3d",emissiveIntensity:.22},
  {id:"portal-ring",type:"torus",radius:2.35,tube:.16,position:[0,2.5,-1.5],rotation:[0,0,0],color:"#a855f7",emissive:"#7c3aed",emissiveIntensity:1.8,opacity:portalOpen,transparent:true},
  {id:"portal-core",type:"sphere",radius:1.95,position:[0,2.5,-1.55],color:"#18235b",emissive:"#155eaa",emissiveIntensity:portalOpen*(.5+portalPulse),opacity:portalOpen*.72,transparent:true,unlit:true},
  {id:"flying-car-a",type:"box",size:[1.8,.45,.9],position:[Math.sin(t*1.8)*4,Math.max(-.4,Math.sin(t*2.1))*2,1],rotation:[0,t*.5,Math.sin(t*2)*.25],color:"#08d9f2",emissive:"#00a6d8",emissiveIntensity:.9,metalness:.6},
  {id:"flying-car-b",type:"box",size:[1.25,.35,.7],position:[Math.cos(t*1.3)*5,1+Math.sin(t*2.4),-2],rotation:[0,-t*.6,Math.cos(t*2)*.2],color:"#ff3dbb",emissive:"#bd168d",emissiveIntensity:.8,metalness:.5},
  {id:"chaos-knot",type:"torusKnot",radius:.55,tube:.12,position:[Math.sin(t)*2,2+Math.cos(t*1.5),-1],rotation:[t,t*.8,0],color:"#c4b5fd",emissive:"#9333ea",emissiveIntensity:1.2}
];
api.render3D(ctx,t,w,h,{
  quality:"medium",
  camera:cam,
  lights:[
    {id:"ambient",type:"ambient",color:"#8bbcff",intensity:.85},
    {id:"pink-key",type:"point",color:"#ff36c9",intensity:38,position:[-5,5,3]},
    {id:"cyan-fill",type:"directional",color:"#24dfff",intensity:1.6,position:[5,7,4]}
  ],
  objects,
  particles:[{id:"neon-dust",count:170,color:"#9defff",size:.035,opacity:.7,spread:[16,9,9],speed:.16,seed:23,position:[0,2,-1]}]
});

// Scene 1 — temptation.
background();skyline();neonGrid();
if(t<6){
  const p=segment(0,1.4);
  text("DON'T PRESS IT",cx,h*.18,unit*.075,"#fff",p);
  button2D(.5+.5*Math.sin(t*4));
  stickman(cx-unit*.22,floor,1.05,"idle",t>3.8?"surprised":"neutral",1);
  text("…",cx+unit*.17,h*.48,unit*.08,"#ff4fd8",1);
}
// Scene 2 — reality breaks.
else if(t<13){
  const p=segment(6,7.1);flash(1-p);
  const shake=api.shake(t-6,3,24);
  api.camera(ctx,shake.x,shake.y,1.03,0,()=>{
    skyline();neonGrid();
    for(let i=0;i<16;i++){
      const a=rand(i+55)*Math.PI*2, d=(.1+rand(i+90))*unit*segment(6,9);
      ctx.fillStyle=i%2?"#ff42c8":"#26eaff";ctx.save();ctx.translate(cx+Math.cos(a)*d,h*.52+Math.sin(a)*d);ctx.rotate(t*2+i);
      ctx.fillRect(-8,-8,16,16);ctx.restore();
    }
    stickman(cx+unit*.05,floor-unit*.12,1.15,"run","surprised",-1);
  });
  text("REALITY.EXE HAS STOPPED",cx,h*.16,unit*.046,"#ff7bd5",segment(7,8));
  drawBurst(cx,h*.55,segment(6,8));
}
// Scene 3 — parkour.
else if(t<22){
  const p=segment(13,22), x=mix(-unit*.2,unit*1.2,p);
  skyline();neonGrid();
  ctx.fillStyle="#20244a";ctx.fillRect(0,floor,w,h-floor);
  for(let i=0;i<5;i++){
    const bx=(i*unit*.24-(t-13)*unit*.15)%(w+unit*.3);
    ctx.fillStyle=i%2?"#171d42":"#27204e";ctx.fillRect(bx,h*(.55-(i%2)*.07),unit*.14,h*.25);
    ctx.strokeStyle="#19e6ff";ctx.strokeRect(bx,h*(.55-(i%2)*.07),unit*.14,h*.25);
  }
  stickman(x,floor-unit*.12,1.12,"run","happy",1);
  const orbX=w*(1-p)+unit*.08,orbY=h*.42+Math.sin(t*4)*unit*.07;
  ctx.shadowColor="#ff38cf";ctx.shadowBlur=35;ctx.fillStyle="#ff45d0";
  ctx.beginPath();ctx.arc(orbX,orbY,unit*.09,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;
  text("RUN!!!",cx,h*.16,unit*.08,"#a9f6ff",1);
}
// Scene 4 — portal pulls everything upward.
else if(t<32){
  const p=segment(22,32);skyline();neonGrid();
  ctx.save();ctx.translate(cx,h*.43);ctx.scale(.55+p*.9,.55+p*.9);
  ctx.strokeStyle="#bd65ff";ctx.lineWidth=unit*.025;ctx.shadowColor="#9d4dff";ctx.shadowBlur=35;
  ctx.beginPath();ctx.ellipse(0,0,unit*.22,unit*.29,0,0,Math.PI*2);ctx.stroke();
  ctx.strokeStyle="#42eaff";ctx.lineWidth=unit*.009;ctx.beginPath();ctx.ellipse(0,0,unit*.18,unit*.25,t*.5,0,Math.PI*2);ctx.stroke();ctx.restore();
  // Debris uses the deterministic 2D physics helper.
  const debris=api.physics2D(Math.max(0,t-22),Array.from({length:12},(_,i)=>({
    id:"debris-"+i,x:cx+(rand(i+5)-.5)*unit*.65,y:h*.38+rand(i+30)*unit*.3,
    radius:4+rand(i+80)*7,vx:(rand(i+100)-.5)*130,vy:-80-rand(i+120)*170,restitution:.35
  })),{gravity:-90,groundY:h*.9,left:-unit,right:w+unit});
  for(const b of debris){ctx.fillStyle="#36e7ff";ctx.globalAlpha=.8;ctx.fillRect(b.x,b.y,b.radius*1.6,b.radius*1.6);}ctx.globalAlpha=1;
  stickman(cx,h*.74,1.05,"run","surprised",1);
  text("GRAVITY? NEVER HEARD OF IT.",cx,h*.13,unit*.042,"#fff",1);
}
// Scene 5 — geometric dimension.
else if(t<42){
  const p=segment(32,42);background("#170d39","#05091b");
  for(let i=0;i<30;i++){
    const a=t*.35+i*2.4,r=unit*(.12+rand(i+200)*.42);
    ctx.save();ctx.translate(cx+Math.cos(a)*r,h*.46+Math.sin(a*1.2)*r);ctx.rotate(a);
    ctx.strokeStyle=i%2?"#ff4fd8":"#37eaff";ctx.globalAlpha=.2+.5*p;
    ctx.strokeRect(-unit*.025,-unit*.025,unit*.05,unit*.05);ctx.restore();
  }ctx.globalAlpha=1;
  stickman(cx,h*.73,1.2,"idle","surprised",1);
  text("WELCOME TO THE GLITCHVERSE",cx,h*.14,unit*.045,"#e8d5ff",p);
  api.svgPath(ctx,"M 0 -48 L 13 -13 L 45 0 L 13 13 L 0 48 L -13 13 L -45 0 L -13 -13 Z",{
    x:cx,y:h*.39,scaleX:1.1+Math.sin(t*3)*.12,scaleY:1.1+Math.sin(t*3)*.12,
    rotation:t*.7,fill:"#ff4fd8",stroke:"#fff",lineWidth:2,alpha:.85
  });
}
// Scene 6 — the loop.
else {
  const p=segment(42,50);background("#080d25","#210b35");skyline();
  button2D(.5+.5*Math.sin(t*5));
  stickman(cx-unit*.2,floor,1.05,"walk","happy",1);
  text("WOULD YOU DO IT AGAIN?",cx,h*.17,unit*.055,"#fff",p);
  if(t>47.5){const q=segment(47.5,49);flash(q*.65);text("CLICK.",cx,h*.48,unit*.13,"#ff4b8b",q);}
}

// SVG lightning accent and cinematic finish.
if(t>6&&t<13){
  api.svgPath(ctx,"M 0 -34 L -12 -2 L 1 -2 L -8 34 L 18 -8 L 5 -8 L 14 -34 Z",{
    x:w*.78,y:h*.35,scaleX:1.1,scaleY:1.1,fill:"#fff36b",stroke:"#fff",lineWidth:1,alpha:.9
  });
}
const audioCues=api.audioTimeline(t,[
  {id:"intro",start:0,end:6,volume:.35,fadeIn:.4,fadeOut:.5},
  {id:"impact",start:6,end:13,volume:.8,fadeIn:.05,fadeOut:.8},
  {id:"parkour",start:13,end:22,volume:.65,fadeIn:.5,fadeOut:.5},
  {id:"portal",start:22,end:32,volume:.75,fadeIn:.5,fadeOut:.7},
  {id:"glitchverse",start:32,end:42,volume:.45,fadeIn:.6,fadeOut:.5},
  {id:"ending",start:42,end:50,volume:.7,fadeIn:.2,fadeOut:1}
]);
const audioLevel=audioCues.reduce((sum,c)=>sum+c.gain,0);
ctx.save();ctx.globalAlpha=.35+audioLevel*.25;ctx.fillStyle="#fff";
ctx.fillRect(w*.08,h*.94,w*.84*clamp(audioLevel/1.5),3);ctx.restore();
ctx.fillStyle="rgba(255,255,255,.55)";ctx.font="12px monospace";ctx.textAlign="left";
ctx.fillText("NEON CHAOS  /  CODECINEMA",w*.06,h*.975);
ctx.textAlign="right";ctx.fillText(t.toFixed(2)+"s",w*.94,h*.975);
api.vignette(ctx,.48);
api.grain(ctx,t,.025,80);
