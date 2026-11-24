import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { BokehPass } from "three/examples/jsm/postprocessing/BokehPass.js";

export type ThreeVec3=[number,number,number];
export type ThreeObjectSpec={
 id:string; type:"box"|"sphere"|"torus"|"cone"|"cylinder"|"plane"|"torusKnot"|"model";
 url?:string; position?:ThreeVec3; rotation?:ThreeVec3; scale?:ThreeVec3; size?:ThreeVec3;
 radius?:number; tube?:number; height?:number; radiusTop?:number; radiusBottom?:number;
 width?:number; segments?:number; color?:string; emissive?:string; emissiveIntensity?:number;
 metalness?:number; roughness?:number; opacity?:number; transparent?:boolean; wireframe?:boolean;
 unlit?:boolean; visible?:boolean; castShadow?:boolean; receiveShadow?:boolean;
};
export type ThreeLightSpec={id:string;type:"ambient"|"directional"|"point";color?:string;intensity?:number;position?:ThreeVec3;castShadow?:boolean};
export type ThreeParticleSpec={id:string;count?:number;color?:string;size?:number;opacity?:number;spread?:ThreeVec3;speed?:number;seed?:number;position?:ThreeVec3};
export type ThreeSceneConfig={
 camera?:{position?:ThreeVec3;lookAt?:ThreeVec3;fov?:number;near?:number;far?:number};
 background?:string|null;environment?:string;quality?:"low"|"medium"|"high";shadows?:boolean;
 depthOfField?:{focus?:number;aperture?:number;maxBlur?:number};
 lights?:ThreeLightSpec[];objects?:ThreeObjectSpec[];particles?:ThreeParticleSpec[];
};
type MeshEntry={mesh:THREE.Mesh;key:string;unlit:boolean};
type ModelEntry={group:THREE.Group;url:string};
type ParticleEntry={points:THREE.Points;positions:Float32Array;key:string};

export class ThreeSceneRenderer{
 private renderer:THREE.WebGLRenderer|null=null;
 private scene=new THREE.Scene();
 private camera=new THREE.PerspectiveCamera(45,16/9,.1,1000);
 private meshes=new Map<string,MeshEntry>();
 private models=new Map<string,ModelEntry>();
 private modelCache=new Map<string,Promise<THREE.Group>>();
 private loader=new GLTFLoader();
 private particles=new Map<string,ParticleEntry>();
 private lights=new Map<string,THREE.Light>();
 private environmentUrl="";
 private environmentTexture:THREE.Texture|null=null;
 private composer:EffectComposer|null=null;
 private bokeh:BokehPass|null=null;
 private sizeKey="";
 private getRenderer(){
  if(this.renderer)return this.renderer;
  try{
   const r=new THREE.WebGLRenderer({alpha:true,antialias:false,powerPreference:"low-power",preserveDrawingBuffer:true});
   r.setPixelRatio(1);r.outputColorSpace=THREE.SRGBColorSpace;r.toneMapping=THREE.ACESFilmicToneMapping;r.toneMappingExposure=1.15;
   r.setClearColor(0,0);r.shadowMap.enabled=true;r.shadowMap.type=THREE.PCFSoftShadowMap;this.renderer=r;return r;
  }catch{throw new Error("CODECINEMA 3D needs WebGL. Try the latest Chrome, close heavy tabs, and reload the studio.");}
 }
 private geometry(s:ThreeObjectSpec):THREE.BufferGeometry{
  const n=Math.max(6,Math.min(64,Math.floor(s.segments??24)));
  switch(s.type){
   case"box":{const v=s.size??[1,1,1];return new THREE.BoxGeometry(v[0],v[1],v[2]);}
   case"sphere":return new THREE.SphereGeometry(s.radius??.5,n,Math.max(6,Math.floor(n*.66)));
   case"torus":return new THREE.TorusGeometry(s.radius??.5,s.tube??.08,Math.max(6,Math.floor(n/3)),n*2);
   case"cone":return new THREE.ConeGeometry(s.radius??.5,s.height??1,n);
   case"cylinder":return new THREE.CylinderGeometry(s.radiusTop??.5,s.radiusBottom??.5,s.height??1,n);
   case"plane":return new THREE.PlaneGeometry(s.width??1,s.height??1);
   case"torusKnot":return new THREE.TorusKnotGeometry(s.radius??.5,s.tube??.12,n*3,Math.max(6,Math.floor(n/2)));
   default:return new THREE.BufferGeometry();
  }
 }
 private geometryKey(s:ThreeObjectSpec){return JSON.stringify([s.type,s.size,s.radius,s.tube,s.height,s.radiusTop,s.radiusBottom,s.width,s.segments]);}
 private material(s:ThreeObjectSpec):THREE.MeshStandardMaterial|THREE.MeshBasicMaterial{
  const common={color:s.color??"#fff",wireframe:!!s.wireframe,transparent:!!s.transparent||(s.opacity!==undefined&&s.opacity<1),opacity:Math.max(0,Math.min(1,s.opacity??1)),side:THREE.DoubleSide};
  return s.unlit?new THREE.MeshBasicMaterial(common):new THREE.MeshStandardMaterial({...common,metalness:Math.max(0,Math.min(1,s.metalness??.15)),roughness:Math.max(.04,Math.min(1,s.roughness??.55)),emissive:s.emissive??"#000",emissiveIntensity:Math.max(0,s.emissiveIntensity??0)});
 }
 private updateMeshes(specs:ThreeObjectSpec[],shadows:boolean){
  const active=new Set<string>();
  for(const s of specs.filter(x=>x.type!=="model")){
   if(!s.id)continue;active.add(s.id);const key=this.geometryKey(s);let e=this.meshes.get(s.id);
   if(!e){const mesh=new THREE.Mesh(this.geometry(s),this.material(s));this.scene.add(mesh);e={mesh,key,unlit:!!s.unlit};this.meshes.set(s.id,e);}
   else{
    if(e.key!==key){e.mesh.geometry.dispose();e.mesh.geometry=this.geometry(s);e.key=key;}
    if(e.unlit!==!!s.unlit){const old=e.mesh.material;e.mesh.material=this.material(s);if(Array.isArray(old))old.forEach(m=>m.dispose());else old.dispose();e.unlit=!!s.unlit;}
   }
   const m=e.mesh;m.position.set(...(s.position??[0,0,0]));m.rotation.set(...(s.rotation??[0,0,0]));m.scale.set(...(s.scale??[1,1,1]));m.visible=s.visible!==false;
   m.castShadow=shadows&&s.castShadow!==false;m.receiveShadow=shadows&&(s.receiveShadow!==false||s.type==="plane");
   const mat=m.material as THREE.MeshStandardMaterial|THREE.MeshBasicMaterial;mat.color.set(s.color??"#fff");mat.wireframe=!!s.wireframe;mat.transparent=!!s.transparent||(s.opacity!==undefined&&s.opacity<1);mat.opacity=Math.max(0,Math.min(1,s.opacity??1));
   if(mat instanceof THREE.MeshStandardMaterial){mat.metalness=Math.max(0,Math.min(1,s.metalness??.15));mat.roughness=Math.max(.04,Math.min(1,s.roughness??.55));mat.emissive.set(s.emissive??"#000");mat.emissiveIntensity=Math.max(0,s.emissiveIntensity??0);}
  }
  for(const[id,e]of this.meshes)if(!active.has(id)){this.scene.remove(e.mesh);e.mesh.geometry.dispose();const m=e.mesh.material;if(Array.isArray(m))m.forEach(x=>x.dispose());else m.dispose();this.meshes.delete(id);}
 }
 private loadModel(url:string){
  let p=this.modelCache.get(url);if(!p){p=new Promise<THREE.Group>((resolve,reject)=>this.loader.load(url,g=>resolve(g.scene),undefined,e=>reject(e)));this.modelCache.set(url,p);}return p;
 }
 private updateModels(specs:ThreeObjectSpec[],shadows:boolean){
  const active=new Set<string>();
  for(const s of specs.filter(x=>x.type==="model"&&x.url)){
   active.add(s.id);let e=this.models.get(s.id);
   if(!e||e.url!==s.url){
    if(e)this.scene.remove(e.group);const group=new THREE.Group();this.scene.add(group);e={group,url:s.url!};this.models.set(s.id,e);
    const current=e;void this.loadModel(s.url!).then(source=>{if(this.models.get(s.id)!==current)return;const clone=source.clone(true);clone.traverse(n=>{if(n instanceof THREE.Mesh){n.castShadow=shadows;n.receiveShadow=shadows;}});current.group.add(clone);}).catch(err=>console.warn("CODECINEMA model load failed:",err));
   }
   e.group.position.set(...(s.position??[0,0,0]));e.group.rotation.set(...(s.rotation??[0,0,0]));e.group.scale.set(...(s.scale??[1,1,1]));e.group.visible=s.visible!==false;
  }
  for(const[id,e]of this.models)if(!active.has(id)){this.scene.remove(e.group);this.models.delete(id);}
 }
 private updateParticles(specs:ThreeParticleSpec[],time:number){
  const active=new Set<string>();
  for(const s of specs){if(!s.id)continue;active.add(s.id);const count=Math.max(1,Math.min(5000,Math.floor(s.count??300)));
   const key=JSON.stringify([count,s.spread,s.seed,s.color,s.size]);let e=this.particles.get(s.id);
   if(!e||e.key!==key){
    if(e){this.scene.remove(e.points);e.points.geometry.dispose();(e.points.material as THREE.Material).dispose();}
    const pos=new Float32Array(count*3),seed=s.seed??1,rand=(n:number)=>{const v=Math.sin((n+seed)*127.1+311.7)*43758.5453;return v-Math.floor(v);},spread=s.spread??[8,5,8];
    for(let i=0;i<count;i++){pos[i*3]=(rand(i+1)-.5)*spread[0];pos[i*3+1]=(rand(i+101)-.5)*spread[1];pos[i*3+2]=(rand(i+201)-.5)*spread[2];}
    const g=new THREE.BufferGeometry();g.setAttribute("position",new THREE.BufferAttribute(pos,3));
    const mat=new THREE.PointsMaterial({color:s.color??"#cdeaff",size:Math.max(.005,s.size??.035),transparent:true,opacity:Math.max(0,Math.min(1,s.opacity??.8)),sizeAttenuation:true,depthWrite:false});
    const points=new THREE.Points(g,mat);this.scene.add(points);e={points,positions:pos,key};this.particles.set(s.id,e);
   }
   e.points.position.set(...(s.position??[0,0,0]));const spread=s.spread??[8,5,8],speed=s.speed??.12,attr=e.points.geometry.getAttribute("position") as THREE.BufferAttribute;
   for(let i=0;i<count;i++)attr.array[i*3+1]=((e.positions[i*3+1]+time*speed*spread[1]+spread[1])%(spread[1]*2))-spread[1];attr.needsUpdate=true;
  }
  for(const[id,e]of this.particles)if(!active.has(id)){this.scene.remove(e.points);e.points.geometry.dispose();(e.points.material as THREE.Material).dispose();this.particles.delete(id);}
 }
 private updateEnvironment(url?:string){
  if(!url){this.scene.environment=null;if(this.environmentTexture)this.environmentTexture.dispose();this.environmentTexture=null;this.environmentUrl="";return;}
  if(url===this.environmentUrl)return;this.environmentUrl=url;
  new THREE.TextureLoader().load(url,tex=>{if(this.environmentUrl!==url){tex.dispose();return;}tex.mapping=THREE.EquirectangularReflectionMapping;tex.colorSpace=THREE.SRGBColorSpace;if(this.environmentTexture)this.environmentTexture.dispose();this.environmentTexture=tex;this.scene.environment=tex;this.scene.background=tex;},undefined,e=>console.warn("CODECINEMA environment load failed:",e));
 }
 private updateLights(specs:ThreeLightSpec[],shadows:boolean){
  const active=new Set<string>();
  for(const s of specs){if(!s.id)continue;active.add(s.id);let l=this.lights.get(s.id);
   const valid=(s.type==="ambient"&&l instanceof THREE.AmbientLight)||(s.type==="directional"&&l instanceof THREE.DirectionalLight)||(s.type==="point"&&l instanceof THREE.PointLight);
   if(!valid){if(l)this.scene.remove(l);l=s.type==="ambient"?new THREE.AmbientLight():s.type==="directional"?new THREE.DirectionalLight():new THREE.PointLight();this.scene.add(l);this.lights.set(s.id,l);}
   if(!l)continue;l.color.set(s.color??"#fff");l.intensity=Math.max(0,s.intensity??1);if(!(l instanceof THREE.AmbientLight))l.position.set(...(s.position??[4,6,5]));
   if(l instanceof THREE.DirectionalLight){l.castShadow=shadows&&!!s.castShadow;l.shadow.mapSize.set(1024,1024);l.shadow.camera.left=-18;l.shadow.camera.right=18;l.shadow.camera.top=18;l.shadow.camera.bottom=-18;l.shadow.bias=-.0002;}
  }
  for(const[id,l]of this.lights)if(!active.has(id)){this.scene.remove(l);this.lights.delete(id);}
 }
 private ensureComposer(w:number,h:number){
  if(!this.composer){this.composer=new EffectComposer(this.getRenderer());this.composer.addPass(new RenderPass(this.scene,this.camera));this.bokeh=new BokehPass(this.scene,this.camera,{focus:8,aperture:.00008,maxblur:.008,width:w,height:h});this.composer.addPass(this.bokeh);}
  this.composer.setSize(w,h);
 }
 render(ctx:CanvasRenderingContext2D,time:number,width:number,height:number,config:ThreeSceneConfig={}){
  const r=this.getRenderer(),quality=config.quality??"medium",scale=quality==="low"?.58:quality==="high"?1:.82,rw=Math.max(1,Math.round(width*scale)),rh=Math.max(1,Math.round(height*scale)),key=rw+"x"+rh;
  if(key!==this.sizeKey){r.setSize(rw,rh,false);this.sizeKey=key;}
  const shadows=!!config.shadows&&quality!=="low";r.shadowMap.enabled=shadows;
  this.scene.background=config.background?new THREE.Color(config.background):null;
  this.camera.aspect=width/Math.max(1,height);this.camera.fov=Math.max(20,Math.min(100,config.camera?.fov??45));this.camera.near=Math.max(.01,config.camera?.near??.1);this.camera.far=Math.max(this.camera.near+1,config.camera?.far??1000);
  this.camera.position.set(...(config.camera?.position??[0,0,8]));this.camera.lookAt(new THREE.Vector3(...(config.camera?.lookAt??[0,0,0])));this.camera.updateProjectionMatrix();
  this.updateEnvironment(config.environment);this.updateLights(config.lights??[],shadows);this.updateMeshes(config.objects??[],shadows);this.updateModels(config.objects??[],shadows);this.updateParticles(config.particles??[],time);
  if(config.depthOfField){this.ensureComposer(rw,rh);const u=(this.bokeh as unknown as {uniforms:Record<string,{value:number}>}).uniforms;u.focus.value=Math.max(.1,config.depthOfField.focus??8);u.aperture.value=Math.max(0,Math.min(.001,config.depthOfField.aperture??.00008));u.maxblur.value=Math.max(0,Math.min(.02,config.depthOfField.maxBlur??.008));this.composer!.render();}
  else r.render(this.scene,this.camera);
  ctx.drawImage(r.domElement,0,0,width,height);
 }
}
