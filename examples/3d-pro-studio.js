// CODECINEMA 3D PRO — 20-second feature test
// Paste into the editor, then tap RUN & PREVIEW.
// Replace the optional GLB/environment URLs with CORS-enabled URLs you control.

const ease = p => { p=Math.max(0,Math.min(1,p)); return p*p*(3-2*p); };
const key = (time, keys) => {
  if(time<=keys[0][0]) return keys[0][1];
  for(let i=1;i<keys.length;i++){
    if(time<=keys[i][0]){
      const [t0,v0]=keys[i-1], [t1,v1]=keys[i];
      return v0+(v1-v0)*ease((time-t0)/(t1-t0));
    }
  }
  return keys[keys.length-1][1];
};

ctx.fillStyle="#030712";ctx.fillRect(0,0,w,h);
const camX=key(t,[[0,-5],[5,0],[12,4],[20,0]]);
const camY=key(t,[[0,3],[8,1.5],[15,3],[20,2]]);
const camZ=key(t,[[0,12],[7,8],[14,10],[20,12]]);
const spin=t*.45;
api.render3D(ctx,t,w,h,{
  quality:"medium",
  shadows:true,
  camera:{
    position:[camX,camY,camZ],
    lookAt:[0,0,0],
    fov:key(t,[[0,48],[8,38],[15,52],[20,48]])
  },
  // Optional: use an equirectangular environment image (CORS must allow this site).
  // environment:"https://your-host.example/studio-environment.jpg",
  depthOfField:{focus:8,aperture:0.00008,maxBlur:0.008},
  lights:[
    {id:"ambient",type:"ambient",color:"#8aa9d8",intensity:.48},
    {id:"key-light",type:"directional",color:"#fff0d0",intensity:3.2,position:[-4,7,5],castShadow:true},
    {id:"rim-light",type:"point",color:"#6d8cff",intensity:22,position:[4,2,-4]}
  ],
  objects:[
    {id:"floor",type:"plane",width:22,height:22,position:[0,-1.25,0],rotation:[-Math.PI/2,0,0],color:"#101827",roughness:.82,receiveShadow:true},
    {id:"hero",type:"torusKnot",radius:1.05,tube:.28,segments:36,position:[0,.25,0],rotation:[spin*.7,spin,0],color:"#8a7cff",metalness:.82,roughness:.2,emissive:"#3020a0",emissiveIntensity:.35,castShadow:true},
    {id:"core",type:"sphere",radius:.42,position:[0,.25,0],rotation:[0,spin*1.5,0],color:"#c4f1ff",metalness:.35,roughness:.16,emissive:"#1a7cff",emissiveIntensity:.55,castShadow:true},
    {id:"ring-a",type:"torus",radius:2.05,tube:.025,position:[0,.25,0],rotation:[Math.PI/2.5,0,spin*.2],color:"#7dd3fc",metalness:.7,roughness:.25,castShadow:true},
    {id:"ring-b",type:"torus",radius:2.65,tube:.012,position:[0,.25,0],rotation:[Math.PI/2.2,spin*.15,0],color:"#b5ff6d",metalness:.6,roughness:.3}
    // Optional imported model: replace URL with a CORS-enabled .glb/.gltf file.
    // {id:"imported-model",type:"model",url:"https://your-host.example/model.glb",position:[0,-1,0],scale:[1,1,1]}
  ],
  particles:[
    {id:"starfield",count:900,color:"#b8d7ff",size:.025,opacity:.8,spread:[18,10,18],speed:.08,seed:41,position:[0,0,-2]},
    {id:"energy-dust",count:180,color:"#b5ff6d",size:.035,opacity:.55,spread:[7,5,7],speed:.16,seed:12}
  ]
});

// 2D typography composited over the 3D render.
const intro=ease(t/1.3);
ctx.save();ctx.globalAlpha=intro;ctx.textAlign="center";ctx.textBaseline="middle";
ctx.shadowColor="#6d8cff";ctx.shadowBlur=22;ctx.fillStyle="#f5f7ff";
ctx.font="800 "+(Math.min(w,h)*.055)+"px Arial";
ctx.fillText("DIMENSION / 03",w/2,h*.13);
ctx.shadowBlur=0;ctx.fillStyle="#a8b7d4";
ctx.font="500 "+(Math.min(w,h)*.021)+"px Arial";
ctx.fillText("CAMERA KEYFRAMES  •  LIGHT  •  PARTICLES  •  DEPTH",w/2,h*.19);
ctx.restore();
ctx.fillStyle="rgba(255,255,255,.48)";ctx.font="12px monospace";
ctx.fillText("CODECINEMA 3D PRO / v0.21",24,h-28);
