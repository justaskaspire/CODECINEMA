import {
  ArcRotateCamera,
  Color3,
  Color4,
  DirectionalLight,
  Engine,
  HemisphericLight,
  Mesh,
  MeshBuilder,
  PBRMaterial,
  PointLight,
  Scene,
  SceneLoader,
  ShadowGenerator,
  StandardMaterial,
  Vector3,
  VertexBuffer,
  type AbstractMesh,
  type Light
} from "@babylonjs/core";
import "@babylonjs/loaders";
import type {
  ThreeSceneConfig,
  ThreeObjectSpec,
  ThreeLightSpec,
  ThreeParticleSpec,
  ThreeVec3
} from "./threeEngine";

type BabylonMeshEntry = { mesh: AbstractMesh; geometryKey: string; materialKey: string };
type BabylonModelEntry = { root: Mesh; url: string };
type BabylonParticleEntry = { mesh: Mesh; positions: Float32Array; base: Float32Array; key: string };

const vec = (v: ThreeVec3 | undefined, fallback: ThreeVec3 = [0,0,0]) =>
  new Vector3(...(v ?? fallback));

function geometryKey(s: ThreeObjectSpec): string {
  return JSON.stringify([s.type,s.size,s.radius,s.tube,s.height,s.radiusTop,s.radiusBottom,s.width,s.segments]);
}

function makeGeometry(s: ThreeObjectSpec, scene: Scene): AbstractMesh {
  const segments = Math.max(6, Math.min(64, Math.floor(s.segments ?? 24)));
  switch (s.type) {
    case "box": {
      const size = s.size ?? [1,1,1];
      return MeshBuilder.CreateBox(s.id,{width:size[0],height:size[1],depth:size[2]},scene);
    }
    case "sphere":
      return MeshBuilder.CreateSphere(s.id,{diameter:(s.radius ?? .5)*2,segments},scene);
    case "torus":
      return MeshBuilder.CreateTorus(s.id,{diameter:(s.radius ?? .5)*2,thickness:(s.tube ?? .08)*2,tessellation:segments*2},scene);
    case "cone":
      return MeshBuilder.CreateCylinder(s.id,{diameterTop:0,diameterBottom:(s.radius ?? .5)*2,height:s.height ?? 1,tessellation:segments},scene);
    case "cylinder":
      return MeshBuilder.CreateCylinder(s.id,{diameterTop:(s.radiusTop ?? .5)*2,diameterBottom:(s.radiusBottom ?? .5)*2,height:s.height ?? 1,tessellation:segments},scene);
    case "plane":
      return MeshBuilder.CreatePlane(s.id,{width:s.width ?? 1,height:s.height ?? 1},scene);
    case "torusKnot":
      return MeshBuilder.CreateTorusKnot(s.id,{radius:s.radius ?? .5,tube:s.tube ?? .12,radialSegments:segments,tubularSegments:segments*4},scene);
    default:
      return MeshBuilder.CreateBox(s.id,{size:1},scene);
  }
}

export class BabylonSceneRenderer {
  private engine: Engine | null = null;
  private scene: Scene | null = null;
  private camera: ArcRotateCamera | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private meshes = new Map<string,BabylonMeshEntry>();
  private models = new Map<string,BabylonModelEntry>();
  private modelLoads = new Map<string,string>();
  private particles = new Map<string,BabylonParticleEntry>();
  private lights = new Map<string,Light>();
  private shadowGenerator: ShadowGenerator | null = null;
  private sizeKey = "";

  private initialize(): void {
    if (this.engine && this.scene && this.camera) return;
    try {
      this.canvas = document.createElement("canvas");
      this.canvas.width = 1;
      this.canvas.height = 1;
      this.engine = new Engine(this.canvas, false, {
        preserveDrawingBuffer: true,
        stencil: true,
        antialias: false,
        powerPreference: "low-power",
        adaptToDeviceRatio: false
      });
      this.scene = new Scene(this.engine);
      this.scene.clearColor = new Color4(0,0,0,0);
      this.camera = new ArcRotateCamera("codecinema-camera",-Math.PI/2,Math.PI/2.4,10,Vector3.Zero(),this.scene);
      this.camera.minZ = .01;
      this.camera.maxZ = 1000;
      this.camera.fov = 45 * Math.PI / 180;
      this.camera.inputs.clear();
      this.scene.activeCamera = this.camera;
    } catch (error) {
      this.engine?.dispose();
      this.engine = null;
      this.scene = null;
      this.camera = null;
      throw new Error("CODECINEMA Babylon.js renderer could not initialize WebGL. Try Chrome, close heavy tabs, and reload the studio. " + String(error));
    }
  }

  private updateMeshes(specs: ThreeObjectSpec[], shadows: boolean): void {
    const active = new Set<string>();
    const scene = this.scene!;
    for (const spec of specs.filter(item => item.type !== "model")) {
      if (!spec.id) continue;
      active.add(spec.id);
      const key = geometryKey(spec);
      let entry = this.meshes.get(spec.id);
      if (!entry || entry.geometryKey !== key) {
        entry?.mesh.dispose(false,true);
        const mesh = makeGeometry(spec,scene);
        entry = {mesh,geometryKey:key,materialKey:""};
        this.meshes.set(spec.id,entry);
      }
      const mesh = entry.mesh as Mesh;
      mesh.position.copyFrom(vec(spec.position));
      mesh.rotation.copyFrom(vec(spec.rotation));
      mesh.scaling.copyFrom(vec(spec.scale,[1,1,1]));
      mesh.isVisible = spec.visible !== false;
      mesh.receiveShadows = shadows && spec.receiveShadow !== false;
      const nextMaterialKey = JSON.stringify([spec.color,spec.emissive,spec.emissiveIntensity,spec.metalness,spec.roughness,spec.opacity,spec.wireframe,spec.unlit]);
      if (entry.materialKey !== nextMaterialKey) {
        mesh.material?.dispose();
        mesh.material = this.makeMaterial(spec);
        entry.materialKey = nextMaterialKey;
      }
      if (shadows && spec.castShadow !== false && this.shadowGenerator) this.shadowGenerator.addShadowCaster(mesh,true);
    }
    for (const [id,entry] of this.meshes) {
      if (!active.has(id)) {
        entry.mesh.dispose(false,true);
        this.meshes.delete(id);
      }
    }
  }

  private makeMaterial(spec: ThreeObjectSpec): PBRMaterial | StandardMaterial {
    const scene = this.scene!;
    if (spec.unlit) {
      const material = new StandardMaterial(spec.id+"-material",scene);
      material.disableLighting = true;
      material.diffuseColor = Color3.FromHexString(spec.color ?? "#ffffff");
      material.emissiveColor = Color3.FromHexString(spec.emissive ?? "#000000").scale(Math.max(0,spec.emissiveIntensity ?? 0));
      material.alpha = Math.max(0,Math.min(1,spec.opacity ?? 1));
      material.wireframe = !!spec.wireframe;
      material.backFaceCulling = false;
      return material;
    }
    const material = new PBRMaterial(spec.id+"-material",scene);
    material.albedoColor = Color3.FromHexString(spec.color ?? "#ffffff");
    material.metallic = Math.max(0,Math.min(1,spec.metalness ?? .15));
    material.roughness = Math.max(.04,Math.min(1,spec.roughness ?? .55));
    material.emissiveColor = Color3.FromHexString(spec.emissive ?? "#000000").scale(Math.max(0,spec.emissiveIntensity ?? 0));
    material.alpha = Math.max(0,Math.min(1,spec.opacity ?? 1));
    material.wireframe = !!spec.wireframe;
    material.backFaceCulling = false;
    return material;
  }

  private updateLights(specs: ThreeLightSpec[], shadows: boolean): void {
    const active = new Set<string>();
    const scene = this.scene!;
    let shadowLight: DirectionalLight | null = null;
    for (const spec of specs) {
      if (!spec.id) continue;
      active.add(spec.id);
      let light = this.lights.get(spec.id);
      const correct =
        (spec.type === "ambient" && light instanceof HemisphericLight) ||
        (spec.type === "directional" && light instanceof DirectionalLight) ||
        (spec.type === "point" && light instanceof PointLight);
      if (!correct) {
        light?.dispose();
        light = spec.type === "ambient"
          ? new HemisphericLight(spec.id,Vector3.Up(),scene)
          : spec.type === "directional"
            ? new DirectionalLight(spec.id,new Vector3(-1,-2,1),scene)
            : new PointLight(spec.id,Vector3.Zero(),scene);
        this.lights.set(spec.id,light);
      }
      light.intensity = Math.max(0,spec.intensity ?? 1);
      light.diffuse = Color3.FromHexString(spec.color ?? "#ffffff");
      if (light instanceof DirectionalLight || light instanceof PointLight) {
        light.position.copyFrom(vec(spec.position,[4,6,5]));
      }
      if (light instanceof DirectionalLight && shadows && spec.castShadow) shadowLight = light;
    }
    for (const [id,light] of this.lights) {
      if (!active.has(id)) {
        light.dispose();
        this.lights.delete(id);
      }
    }
    if (this.shadowGenerator) {
      this.shadowGenerator.dispose();
      this.shadowGenerator = null;
    }
    if (shadowLight) {
      this.shadowGenerator = new ShadowGenerator(512,shadowLight);
      this.shadowGenerator.useBlurExponentialShadowMap = true;
      this.shadowGenerator.blurKernel = 8;
    }
  }

  private updateModels(specs: ThreeObjectSpec[]): void {
    const active = new Set<string>();
    for (const spec of specs.filter(item => item.type === "model" && item.url)) {
      active.add(spec.id);
      let entry = this.models.get(spec.id);
      if (!entry || entry.url !== spec.url) {
        if (entry) entry.root.dispose(false,true);
        const root = new Mesh(spec.id+"-model-root",this.scene!);
        entry = {root,url:spec.url!};
        this.models.set(spec.id,entry);
        const expectedUrl = spec.url!;
        this.modelLoads.set(spec.id,expectedUrl);
        void SceneLoader.ImportMeshAsync("", "", expectedUrl, this.scene!).then(result => {
          if (this.modelLoads.get(spec.id) !== expectedUrl) {
            result.meshes.forEach(mesh => mesh.dispose(false,true));
            return;
          }
          for (const imported of result.meshes) {
            if (imported !== entry!.root) imported.parent = entry!.root;
          }
        }).catch(error => console.warn("CODECINEMA Babylon model load failed:",error));
      }
      entry.root.position.copyFrom(vec(spec.position));
      entry.root.rotation.copyFrom(vec(spec.rotation));
      entry.root.scaling.copyFrom(vec(spec.scale,[1,1,1]));
      entry.root.setEnabled(spec.visible !== false);
    }
    for (const [id,entry] of this.models) {
      if (!active.has(id)) {
        this.modelLoads.delete(id);
        entry.root.dispose(false,true);
        this.models.delete(id);
      }
    }
  }

  private updateParticles(specs: ThreeParticleSpec[], time: number): void {
    const active = new Set<string>();
    const scene = this.scene!;
    for (const spec of specs) {
      if (!spec.id) continue;
      active.add(spec.id);
      const count = Math.max(1,Math.min(5000,Math.floor(spec.count ?? 300)));
      const key = JSON.stringify([count,spec.spread,spec.seed,spec.color,spec.size]);
      let entry = this.particles.get(spec.id);
      if (!entry || entry.key !== key) {
        if (entry) entry.mesh.dispose(false,true);
        const base = new Float32Array(count*3);
        const positions = new Float32Array(count*3);
        const seed = spec.seed ?? 1;
        const rand = (n:number) => {
          const value = Math.sin((n+seed)*127.1+311.7)*43758.5453;
          return value-Math.floor(value);
        };
        const spread = spec.spread ?? [8,5,8];
        for (let i=0;i<count;i++) {
          base[i*3]=(rand(i+1)-.5)*spread[0];
          base[i*3+1]=(rand(i+101)-.5)*spread[1];
          base[i*3+2]=(rand(i+201)-.5)*spread[2];
        }
        positions.set(base);
        const mesh = new Mesh(spec.id+"-particles",scene);
        mesh.setVerticesData(VertexBuffer.PositionKind,positions,true,3);
        mesh.setIndices(Array.from({length:count},(_,index)=>index));
        const material = new StandardMaterial(spec.id+"-particles-material",scene);
        material.pointsCloud = true;
        material.pointSize = Math.max(1,(spec.size ?? .035)*100);
        material.disableLighting = true;
        material.emissiveColor = Color3.FromHexString(spec.color ?? "#cdeaff");
        material.alpha = Math.max(0,Math.min(1,spec.opacity ?? .8));
        material.disableDepthWrite = true;
        mesh.material = material;
        entry = {mesh,positions,base,key};
        this.particles.set(spec.id,entry);
      }
      const spread = spec.spread ?? [8,5,8];
      const speed = spec.speed ?? .12;
      for (let i=0;i<count;i++) {
        entry.positions[i*3]=entry.base[i*3];
        entry.positions[i*3+1]=((entry.base[i*3+1]+time*speed*spread[1]+spread[1])%(spread[1]*2))-spread[1];
        entry.positions[i*3+2]=entry.base[i*3+2];
      }
      entry.mesh.position.copyFrom(vec(spec.position));
      entry.mesh.updateVerticesData(VertexBuffer.PositionKind,entry.positions);
    }
    for (const [id,entry] of this.particles) {
      if (!active.has(id)) {
        entry.mesh.dispose(false,true);
        this.particles.delete(id);
      }
    }
  }

  render(ctx: CanvasRenderingContext2D,time: number,width: number,height: number,config: ThreeSceneConfig = {}): void {
    this.initialize();
    const engine = this.engine!;
    const scene = this.scene!;
    const camera = this.camera!;
    const quality = config.quality ?? "medium";
    const scale = quality === "low" ? .58 : quality === "high" ? 1 : .82;
    const rw = Math.max(1,Math.round(width*scale));
    const rh = Math.max(1,Math.round(height*scale));
    const key = rw+"x"+rh;
    if (key !== this.sizeKey) {
      engine.setSize(rw,rh);
      this.sizeKey = key;
    }

    const shadows = !!config.shadows && quality !== "low";
    scene.shadowsEnabled = shadows;
    scene.clearColor = config.background
      ? new Color4(Color3.FromHexString(config.background).r,Color3.FromHexString(config.background).g,Color3.FromHexString(config.background).b,1)
      : new Color4(0,0,0,0);

    const position = config.camera?.position ?? [0,0,8];
    const target = config.camera?.lookAt ?? [0,0,0];
    camera.setPosition(vec(position));
    camera.setTarget(vec(target));
    camera.fov = Math.max(20,Math.min(100,config.camera?.fov ?? 45))*Math.PI/180;
    camera.minZ = Math.max(.01,config.camera?.near ?? .1);
    camera.maxZ = Math.max(camera.minZ+1,config.camera?.far ?? 1000);

    this.updateLights(config.lights ?? [],shadows);
    this.updateMeshes(config.objects ?? [],shadows);
    this.updateModels(config.objects ?? []);
    this.updateParticles(config.particles ?? [],time);

    scene.render();
    if (this.canvas) ctx.drawImage(this.canvas,0,0,width,height);
  }
}
