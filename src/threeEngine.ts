import * as THREE from "three";

export type ThreeVec3 = [number, number, number];
export type ThreeObjectSpec = {
  id: string;
  type: "box" | "sphere" | "torus" | "cone" | "cylinder" | "plane" | "torusKnot";
  position?: ThreeVec3; rotation?: ThreeVec3; scale?: ThreeVec3; size?: ThreeVec3;
  radius?: number; tube?: number; height?: number; radiusTop?: number; radiusBottom?: number;
  width?: number; segments?: number; color?: string; emissive?: string;
  emissiveIntensity?: number; metalness?: number; roughness?: number;
  opacity?: number; transparent?: boolean; wireframe?: boolean; unlit?: boolean; visible?: boolean;
};
export type ThreeLightSpec = {
  id: string; type: "ambient" | "directional" | "point";
  color?: string; intensity?: number; position?: ThreeVec3;
};
export type ThreeSceneConfig = {
  camera?: { position?: ThreeVec3; lookAt?: ThreeVec3; fov?: number; near?: number; far?: number };
  background?: string | null;
  quality?: "low" | "medium" | "high";
  lights?: ThreeLightSpec[];
  objects?: ThreeObjectSpec[];
};
type CachedMesh = { mesh: THREE.Mesh; geometryKey: string; unlit: boolean };

export class ThreeSceneRenderer {
  private renderer: THREE.WebGLRenderer | null = null;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(45, 16/9, 0.1, 1000);
  private meshes = new Map<string, CachedMesh>();
  private lights = new Map<string, THREE.Light>();
  private sizeKey = "";

  private getRenderer(): THREE.WebGLRenderer {
    if (this.renderer) return this.renderer;
    try {
      const r = new THREE.WebGLRenderer({
        alpha: true, antialias: false, powerPreference: "low-power",
        preserveDrawingBuffer: true
      });
      r.setPixelRatio(1);
      r.outputColorSpace = THREE.SRGBColorSpace;
      r.toneMapping = THREE.ACESFilmicToneMapping;
      r.toneMappingExposure = 1.15;
      r.setClearColor(0x000000, 0);
      this.renderer = r;
      return r;
    } catch {
      throw new Error("CODECINEMA 3D needs WebGL. Try the latest Chrome, close heavy tabs, and reload the studio.");
    }
  }

  private geometry(s: ThreeObjectSpec): THREE.BufferGeometry {
    const n = Math.max(6, Math.min(64, Math.floor(s.segments ?? 24)));
    switch (s.type) {
      case "box": { const v=s.size ?? [1,1,1]; return new THREE.BoxGeometry(v[0],v[1],v[2]); }
      case "sphere": return new THREE.SphereGeometry(s.radius ?? .5,n,Math.max(6,Math.floor(n*.66)));
      case "torus": return new THREE.TorusGeometry(s.radius ?? .5,s.tube ?? .08,Math.max(6,Math.floor(n/3)),n*2);
      case "cone": return new THREE.ConeGeometry(s.radius ?? .5,s.height ?? 1,n);
      case "cylinder": return new THREE.CylinderGeometry(s.radiusTop ?? .5,s.radiusBottom ?? .5,s.height ?? 1,n);
      case "plane": return new THREE.PlaneGeometry(s.width ?? 1,s.height ?? 1);
      case "torusKnot": return new THREE.TorusKnotGeometry(s.radius ?? .5,s.tube ?? .12,n*3,Math.max(6,Math.floor(n/2)));
    }
  }

  private geometryKey(s: ThreeObjectSpec): string {
    return JSON.stringify([s.type,s.size,s.radius,s.tube,s.height,s.radiusTop,s.radiusBottom,s.width,s.segments]);
  }

  private material(s: ThreeObjectSpec): THREE.MeshStandardMaterial | THREE.MeshBasicMaterial {
    const common = {
      color:s.color ?? "#ffffff", wireframe:!!s.wireframe,
      transparent:!!s.transparent || (s.opacity !== undefined && s.opacity < 1),
      opacity:Math.max(0,Math.min(1,s.opacity ?? 1)), side:THREE.DoubleSide
    };
    if (s.unlit) return new THREE.MeshBasicMaterial(common);
    return new THREE.MeshStandardMaterial({
      ...common, metalness:Math.max(0,Math.min(1,s.metalness ?? .15)),
      roughness:Math.max(.04,Math.min(1,s.roughness ?? .55)),
      emissive:s.emissive ?? "#000000", emissiveIntensity:Math.max(0,s.emissiveIntensity ?? 0)
    });
  }

  private updateObjects(specs: ThreeObjectSpec[]): void {
    const active = new Set<string>();
    for (const s of specs) {
      if (!s?.id) continue;
      active.add(s.id);
      const key=this.geometryKey(s);
      let item=this.meshes.get(s.id);
      if (!item) {
        const mesh=new THREE.Mesh(this.geometry(s),this.material(s));
        this.scene.add(mesh);
        item={mesh,geometryKey:key,unlit:!!s.unlit};
        this.meshes.set(s.id,item);
      } else {
        if (item.geometryKey !== key) {
          item.mesh.geometry.dispose();
          item.mesh.geometry=this.geometry(s);
          item.geometryKey=key;
        }
        if (item.unlit !== !!s.unlit) {
          const old=item.mesh.material;
          item.mesh.material=this.material(s);
          if (Array.isArray(old)) old.forEach(m=>m.dispose()); else old.dispose();
          item.unlit=!!s.unlit;
        }
      }
      const m=item.mesh;
      m.position.set(...(s.position ?? [0,0,0]));
      m.rotation.set(...(s.rotation ?? [0,0,0]));
      m.scale.set(...(s.scale ?? [1,1,1]));
      m.visible=s.visible !== false;
      const mat=m.material as THREE.MeshStandardMaterial | THREE.MeshBasicMaterial;
      mat.color.set(s.color ?? "#ffffff");
      mat.wireframe=!!s.wireframe;
      mat.transparent=!!s.transparent || (s.opacity !== undefined && s.opacity < 1);
      mat.opacity=Math.max(0,Math.min(1,s.opacity ?? 1));
      if (mat instanceof THREE.MeshStandardMaterial) {
        mat.metalness=Math.max(0,Math.min(1,s.metalness ?? .15));
        mat.roughness=Math.max(.04,Math.min(1,s.roughness ?? .55));
        mat.emissive.set(s.emissive ?? "#000000");
        mat.emissiveIntensity=Math.max(0,s.emissiveIntensity ?? 0);
      }
    }
    for (const [id,item] of this.meshes) if (!active.has(id)) {
      this.scene.remove(item.mesh); item.mesh.geometry.dispose();
      const mat=item.mesh.material;
      if (Array.isArray(mat)) mat.forEach(m=>m.dispose()); else mat.dispose();
      this.meshes.delete(id);
    }
  }

  private updateLights(specs: ThreeLightSpec[]): void {
    const active=new Set<string>();
    for (const s of specs) {
      if (!s?.id) continue;
      active.add(s.id);
      let light=this.lights.get(s.id);
      const valid=(s.type==="ambient" && light instanceof THREE.AmbientLight) ||
        (s.type==="directional" && light instanceof THREE.DirectionalLight) ||
        (s.type==="point" && light instanceof THREE.PointLight);
      if (!valid) {
        if (light) this.scene.remove(light);
        light=s.type==="ambient" ? new THREE.AmbientLight() :
          s.type==="directional" ? new THREE.DirectionalLight() : new THREE.PointLight();
        this.scene.add(light); this.lights.set(s.id,light);
      }
      if (!light) continue;
      light.color.set(s.color ?? "#ffffff");
      light.intensity=Math.max(0,s.intensity ?? 1);
      if (!(light instanceof THREE.AmbientLight)) light.position.set(...(s.position ?? [4,6,5]));
    }
    for (const [id,light] of this.lights) if (!active.has(id)) {
      this.scene.remove(light); this.lights.delete(id);
    }
  }

  render(ctx: CanvasRenderingContext2D, _time: number, width: number, height: number, config: ThreeSceneConfig = {}): void {
    const renderer=this.getRenderer();
    const quality=config.quality ?? "medium";
    const scale=quality==="low" ? .58 : quality==="high" ? 1 : .82;
    const rw=Math.max(1,Math.round(width*scale)), rh=Math.max(1,Math.round(height*scale));
    const key=rw+"x"+rh;
    if (key !== this.sizeKey) { renderer.setSize(rw,rh,false); this.sizeKey=key; }
    this.scene.background=config.background ? new THREE.Color(config.background) : null;
    this.camera.aspect=width/Math.max(1,height);
    this.camera.fov=Math.max(20,Math.min(100,config.camera?.fov ?? 45));
    this.camera.near=Math.max(.01,config.camera?.near ?? .1);
    this.camera.far=Math.max(this.camera.near+1,config.camera?.far ?? 1000);
    this.camera.position.set(...(config.camera?.position ?? [0,0,8]));
    this.camera.lookAt(new THREE.Vector3(...(config.camera?.lookAt ?? [0,0,0])));
    this.camera.updateProjectionMatrix();
    this.updateLights(config.lights ?? []);
    this.updateObjects(config.objects ?? []);
    renderer.render(this.scene,this.camera);
    ctx.drawImage(renderer.domElement,0,0,width,height);
  }
}
