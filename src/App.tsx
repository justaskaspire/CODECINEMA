import { useEffect, useMemo, useRef, useState } from "react";

type Transition = "fade" | "slide" | "zoom" | "none";
type TextLayer = { id: string; text: string; x: number; y: number; size: number; color: string };
type Scene = { title: string; subtitle: string; duration: number; accent: string; transition: Transition; layers?: TextLayer[] };
type Project = { version: 1 | 2; format: string; font: string; textColor: string; backgroundImage: string | null; videoBackground?: string | null; audioTrack?: string | null; scenes: Scene[] };
const initialScenes: Scene[] = [
  { title: "MAKE IT", subtitle: "A STORY WORTH WATCHING", duration: 4, accent: "#b5ff6d", transition: "fade" },
  { title: "MOVE", subtitle: "BEYOND THE ORDINARY", duration: 4, accent: "#8b9cff", transition: "slide" },
  { title: "CODECINEMA", subtitle: "YOUR IDEAS. IN MOTION.", duration: 4, accent: "#ff9b78", transition: "zoom" },
];
const formats: Record<string, [number, number]> = { "16:9":[1920,1080], "9:16":[1080,1920], "1:1":[1080,1080], "4:5":[1080,1350] };
const fonts = ["Manrope", "Arial", "Georgia", "Impact", "system-ui", "monospace"];

export default function App() {
  const [scenes,setScenes]=useState<Scene[]>(initialScenes);
  const [selected,setSelected]=useState(0);
  const [playing,setPlaying]=useState(false);
  const [format,setFormat]=useState("16:9");
  const [font,setFont]=useState("Manrope");
  const [textColor,setTextColor]=useState("#ffffff");
  const [backgroundImage,setBackgroundImage]=useState<string|null>(null);
  const [videoBackground,setVideoBackground]=useState<string|null>(null);
  const [audioTrack,setAudioTrack]=useState<string|null>(null);
  const [activeLayer,setActiveLayer]=useState<string|null>(null);
  const [audioVolume,setAudioVolume]=useState(0.8);
  const [exporting,setExporting]=useState(false);
  const [elapsed,setElapsed]=useState(0);
  const canvasRef=useRef<HTMLCanvasElement>(null);
  const imageRef=useRef<HTMLImageElement|null>(null);
  const videoRef=useRef<HTMLVideoElement>(null);
  const audioRef=useRef<HTMLAudioElement>(null);
  const audioContextRef=useRef<AudioContext|null>(null);
  const audioSourceRef=useRef<MediaElementAudioSourceNode|null>(null);
  const rafRef=useRef<number>(0);
  const startRef=useRef(0);
  const importRef=useRef<HTMLInputElement>(null);
  const [width,height]=formats[format] ?? formats["16:9"];
  const duration=useMemo(()=>scenes.reduce((sum,s)=>sum+s.duration,0),[scenes]);
  const starts=useMemo(()=>scenes.map((_,i)=>scenes.slice(0,i).reduce((sum,s)=>sum+s.duration,0)),[scenes]);
  const playingIndex=starts.findIndex((start,i)=>elapsed>=start && elapsed<start+scenes[i].duration);
  const sceneIndex=playing && playingIndex>=0 ? playingIndex : selected;
  const current=scenes[selected] ?? scenes[0];
  const sceneLayers=current.layers??[];
  const focusedLayer=sceneLayers.find(layer=>layer.id===activeLayer)??sceneLayers[0];
  const sceneTime=playing ? Math.max(0,elapsed-(starts[sceneIndex]??0)) : 0;

  useEffect(()=>{
    if(!playing)return;
    startRef.current=performance.now()-elapsed*1000;
    const tick=(now:number)=>{
      const next=Math.min(duration,(now-startRef.current)/1000);
      setElapsed(next);
      if(next>=duration){setPlaying(false);return;}
      rafRef.current=requestAnimationFrame(tick);
    };
    rafRef.current=requestAnimationFrame(tick);
    return ()=>cancelAnimationFrame(rafRef.current);
  },[playing,duration]);

  useEffect(()=>{
    if(!backgroundImage){imageRef.current=null;return;}
    const image=new Image();
    image.onload=()=>{imageRef.current=image;};
    image.src=backgroundImage;
  },[backgroundImage]);

  useEffect(()=>{
    const video=videoRef.current;
    if(!video)return;
    video.pause();
    if(videoBackground){video.src=videoBackground;video.load();}
    else{video.removeAttribute("src");video.load();}
  },[videoBackground]);

  useEffect(()=>{
    const video=videoRef.current;
    if(!video||!videoBackground)return;
    if(playing){
      if(video.readyState>=1&&Number.isFinite(video.duration)&&video.duration>0)video.currentTime=elapsed%video.duration;
      void video.play().catch(()=>{});
    }else video.pause();
  },[playing,videoBackground]);

  useEffect(()=>{
    const video=videoRef.current;
    if(!playing&&video&&videoBackground&&video.readyState>=1&&Number.isFinite(video.duration)&&video.duration>0)video.currentTime=elapsed%video.duration;
  },[elapsed,playing,videoBackground]);

  useEffect(()=>{
    const audio=audioRef.current;
    if(!audio)return;
    if(audioTrack){audio.src=audioTrack;audio.load();}
    else{audio.pause();audio.removeAttribute("src");audio.load();}
  },[audioTrack]);

  useEffect(()=>{
    const audio=audioRef.current;
    if(!audio||!audioTrack)return;
    audio.volume=audioVolume;
    if(playing){
      if(Number.isFinite(audio.duration)&&audio.duration>0)audio.currentTime=elapsed%audio.duration;
      void audio.play().catch(()=>{});
    }else audio.pause();
  },[playing,audioTrack,audioVolume]);

  useEffect(()=>{
    const audio=audioRef.current;
    if(!playing&&audio&&audioTrack&&Number.isFinite(audio.duration)&&audio.duration>0)audio.currentTime=elapsed%audio.duration;
  },[elapsed,playing,audioTrack]);

  useEffect(()=>{
    const canvas=canvasRef.current;
    if(!canvas)return;
    canvas.width=width;canvas.height=height;
    const ctx=canvas.getContext("2d");
    if(!ctx)return;
    const w=canvas.width,h=canvas.height;
    let frame=0;
    const draw=(now:number)=>{
      const scene=scenes[sceneIndex]??scenes[0];
      const localTime=playing?sceneTime:(now%4000)/1000;
      const progress=Math.min(1,localTime/Math.max(.1,scene.duration));
      const enter=Math.min(1,localTime/.65);
      const eased=1-Math.pow(1-enter,3);
      ctx.clearRect(0,0,w,h);
      const bg=ctx.createLinearGradient(0,0,w,h);
      bg.addColorStop(0,"#111827");bg.addColorStop(1,"#080b12");
      ctx.fillStyle=bg;ctx.fillRect(0,0,w,h);
      if(videoRef.current&&videoRef.current.readyState>=2&&videoRef.current.videoWidth>0){
        const vid=videoRef.current;
        const scale=Math.max(w/vid.videoWidth,h/vid.videoHeight);
        const iw=vid.videoWidth*scale,ih=vid.videoHeight*scale;
        ctx.save();ctx.globalAlpha=.72;ctx.drawImage(vid,(w-iw)/2,(h-ih)/2,iw,ih);ctx.restore();
        ctx.fillStyle="#080b12a8";ctx.fillRect(0,0,w,h);
      }else if(imageRef.current){
        const img=imageRef.current;
        const scale=Math.max(w/img.width,h/img.height);
        const iw=img.width*scale,ih=img.height*scale;
        ctx.save();ctx.globalAlpha=.72;ctx.drawImage(img,(w-iw)/2,(h-ih)/2,iw,ih);ctx.restore();
        ctx.fillStyle="#080b12a8";ctx.fillRect(0,0,w,h);
      }
      const glow=ctx.createRadialGradient(w*.76,h*.2,0,w*.76,h*.2,Math.max(w,h)*.65);
      glow.addColorStop(0,scene.accent+"35");glow.addColorStop(1,scene.accent+"00");
      ctx.fillStyle=glow;ctx.fillRect(0,0,w,h);
      ctx.strokeStyle="#ffffff12";ctx.lineWidth=Math.max(1,w/1920);
      const grid=Math.max(30,Math.round(Math.min(w,h)/22));
      for(let x=0;x<w;x+=grid){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,h);ctx.stroke();}
      for(let y=0;y<h;y+=grid){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(w,y);ctx.stroke();}
      const pulse=1+Math.sin(now/650)*.025;
      ctx.save();ctx.translate(w*.5,h*.47);ctx.scale(pulse,pulse);
      ctx.fillStyle=scene.accent;ctx.globalAlpha=.12;
      ctx.beginPath();ctx.arc(0,0,Math.min(w,h)*.31,0,Math.PI*2);ctx.fill();ctx.restore();
      const titleSize=Math.min(w*.105,h*.105,h>w?112:150);
      let offsetX=0,scale=1,alpha=eased;
      if(scene.transition==="slide")offsetX=(1-eased)*w*.18;
      if(scene.transition==="zoom")scale=.72+eased*.28;
      if(scene.transition==="none"){alpha=1;offsetX=0;scale=1;}
      ctx.save();ctx.globalAlpha=alpha;ctx.translate(w/2+offsetX,h*.47+(1-eased)*24);ctx.scale(scale,scale);
      ctx.fillStyle=textColor;ctx.textAlign="center";ctx.textBaseline="middle";
      ctx.font=`800 ${titleSize}px ${font}, system-ui, sans-serif`;
      ctx.fillText(scene.title.toUpperCase(),0,0,w*.84);
      ctx.fillStyle=scene.accent;ctx.fillRect(-w*.035,h*.08,w*.07,Math.max(4,w*.003));
      ctx.fillStyle="#dce2eb";ctx.font=`500 ${Math.max(18,w*.018)}px ${font}, system-ui, sans-serif`;
      ctx.fillText(scene.subtitle.toUpperCase(),0,h*.16,w*.82);
      ctx.restore();
      for(const layer of (scenes[sceneIndex]?.layers??[])){
        ctx.save();ctx.globalAlpha=alpha;ctx.fillStyle=layer.color;ctx.textAlign="center";ctx.textBaseline="middle";
        ctx.font=`700 ${Math.max(14,Math.min(240,layer.size*(w/1920)))}px ${font}, system-ui, sans-serif`;
        ctx.fillText(layer.text,w*layer.x/100,h*layer.y/100,w*.86);ctx.restore();
      }
      ctx.fillStyle="#ffffff90";ctx.textAlign="center";ctx.font=`500 ${Math.max(12,w*.012)}px ${font}, system-ui, sans-serif`;
      ctx.fillText("A CODECINEMA ORIGINAL",w/2,h*.88);
      ctx.fillStyle="#ffffff25";ctx.fillRect(w*.08,h*.93,w*.84,Math.max(2,w*.002));
      ctx.fillStyle=scene.accent;ctx.fillRect(w*.08,h*.93,w*.84*progress,Math.max(2,w*.002));
      frame=requestAnimationFrame(draw);
    };
    frame=requestAnimationFrame(draw);
    return ()=>cancelAnimationFrame(frame);
  },[scenes,sceneIndex,sceneTime,playing,format,width,height,font,textColor,backgroundImage]);

  const seekToScene=(index:number)=>{
    setPlaying(false);setSelected(index);setElapsed(starts[index]??0);
  };
  const addScene=()=>{
    const next=[...scenes,{title:"NEW SCENE",subtitle:"WRITE YOUR NEXT LINE",duration:4,accent:"#d7a6ff",transition:"fade" as Transition}];
    setScenes(next);setSelected(next.length-1);setPlaying(false);
    setElapsed(next.slice(0,-1).reduce((sum,s)=>sum+s.duration,0));
  };
  const update=(key:"title"|"subtitle"|"duration"|"accent"|"transition",value:string)=>{
    setScenes(old=>old.map((s,i)=>i===selected?{...s,[key]:key==="duration"?Math.max(1,Math.min(30,Number(value)||1)):value}:s));
  };
  const addTextLayer=()=>{
    const layer:TextLayer={id:`layer-${Date.now()}`,text:"YOUR TEXT",x:50,y:72,size:64,color:"#ffffff"};
    setScenes(old=>old.map((scene,i)=>i===selected?{...scene,layers:[...(scene.layers??[]),layer]}:scene));setActiveLayer(layer.id);
  };
  const updateTextLayer=(key:keyof Omit<TextLayer,"id">,value:string)=>{
    setScenes(old=>old.map((scene,i)=>i===selected?{...scene,layers:(scene.layers??[]).map(layer=>layer.id===focusedLayer?.id?{...layer,[key]:key==="text"||key==="color"?value:Number(value)}:layer)}:scene));
  };
  const removeTextLayer=()=>{
    if(!focusedLayer)return;
    setScenes(old=>old.map((scene,i)=>i===selected?{...scene,layers:(scene.layers??[]).filter(layer=>layer.id!==focusedLayer.id)}:scene));setActiveLayer(null);
  };
  const saveProject=()=>{
    const project:Project={version:2,format,font,textColor,backgroundImage,videoBackground,audioTrack,scenes};
    const url=URL.createObjectURL(new Blob([JSON.stringify(project,null,2)],{type:"application/json"}));
    const a=document.createElement("a");a.href=url;a.download="codec cinema-project.json";a.click();
    setTimeout(()=>URL.revokeObjectURL(url),1000);
  };
  const loadProject=async(file:File)=>{
    try{
      const data=JSON.parse(await file.text()) as Project;
      if((data.version!==1&&data.version!==2)||!Array.isArray(data.scenes)||!data.scenes.length)throw new Error("Unsupported project file");
      setScenes(data.scenes);setActiveLayer(null);setFormat(formats[data.format]?data.format:"16:9");
      setFont(fonts.includes(data.font)?data.font:"Manrope");
      setTextColor(/^#[0-9a-f]{6}$/i.test(data.textColor)?data.textColor:"#ffffff");
      setBackgroundImage(typeof data.backgroundImage==="string"?data.backgroundImage:null);
      setVideoBackground(typeof data.videoBackground==="string"?data.videoBackground:null);
      setAudioTrack(typeof data.audioTrack==="string"?data.audioTrack:null);
      setSelected(0);setElapsed(0);setPlaying(false);
    }catch{alert("This project file is invalid or unsupported.");}
  };
  const exportVideo=async()=>{
    const canvas=canvasRef.current;
    if(!canvas||!canvas.captureStream||!("MediaRecorder" in window)){alert("WebM export is not supported in this browser.");return;}
    const mime=["video/webm;codecs=vp9","video/webm;codecs=vp8","video/webm"].find(m=>MediaRecorder.isTypeSupported(m));
    if(!mime){alert("This browser does not support WebM export.");return;}
    setExporting(true);setSelected(0);setElapsed(0);setPlaying(true);
    const stream=canvas.captureStream(30);
    let audioDestination:MediaStreamAudioDestinationNode|null=null;
    if(audioTrack&&audioRef.current){
      try{
        if(!audioContextRef.current)audioContextRef.current=new AudioContext();
        const audioContext=audioContextRef.current;
        if(!audioSourceRef.current)audioSourceRef.current=audioContext.createMediaElementSource(audioRef.current);
        await audioContext.resume();
        audioDestination=audioContext.createMediaStreamDestination();
        audioSourceRef.current.connect(audioDestination);
        stream.addTrack(audioDestination.stream.getAudioTracks()[0]);
      }catch(error){console.warn("Audio export setup failed",error);}
    }
    const recorder=new MediaRecorder(stream,{mimeType:mime});
    const chunks:BlobPart[]=[];
    recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data);};
    recorder.onstop=()=>{
      const url=URL.createObjectURL(new Blob(chunks,{type:"video/webm"}));
      const a=document.createElement("a");a.href=url;a.download="codec-cinema.webm";a.click();
      setTimeout(()=>URL.revokeObjectURL(url),1000);
      stream.getTracks().forEach(track=>track.stop());audioDestination?.stream.getTracks().forEach(track=>track.stop());if(audioDestination&&audioSourceRef.current)audioSourceRef.current.disconnect(audioDestination);setExporting(false);
    };
    recorder.start();
    window.setTimeout(()=>{if(recorder.state!=="inactive")recorder.stop();setPlaying(false);},duration*1000+350);
  };
  const mediaUpload=(file:File|undefined,kind:"video"|"audio")=>{
    if(!file)return;
    const allowed=kind==="video"?file.type.startsWith("video/"):file.type.startsWith("audio/");
    const limit=kind==="video"?30:20;
    if(!allowed){alert(`Choose a ${kind} file.`);return;}
    if(file.size>limit*1024*1024){alert(`Please use a ${kind} smaller than ${limit} MB.`);return;}
    const reader=new FileReader();
    reader.onload=()=>kind==="video"?setVideoBackground(String(reader.result)):setAudioTrack(String(reader.result));
    reader.readAsDataURL(file);
  };
  const imageUpload=(file?:File)=>{
    if(!file)return;
    if(!file.type.startsWith("image/")){alert("Choose an image file.");return;}
    if(file.size>12*1024*1024){alert("Please use an image smaller than 12 MB.");return;}
    const reader=new FileReader();reader.onload=()=>setBackgroundImage(String(reader.result));reader.readAsDataURL(file);
  };

  return <main className="app-shell">
    <header className="topbar">
      <div className="brand"><span className="brand-mark">C</span><span>CODE<span className="brand-light">CINEMA</span></span><small>STUDIO / 003</small></div>
      <div className="top-center"><span className="live-dot"/> LOCAL PROJECT <span className="divider">/</span> UNTITLED FILM</div>
      <div className="top-actions"><span className="saved">● STORED ON YOUR DEVICE</span><button className="secondary-btn" onClick={()=>importRef.current?.click()}>OPEN</button><button className="secondary-btn" onClick={saveProject}>SAVE PROJECT</button><button className="export-btn" onClick={exportVideo} disabled={exporting}>{exporting?"RENDERING…":"↗ EXPORT FILM"}</button><input ref={importRef} type="file" accept="application/json,.json" hidden onChange={e=>{void loadProject(e.target.files?.[0] as File);e.currentTarget.value="";}}/></div>
    </header>
    <section className="workspace">
      <aside className="left-panel">
        <div className="panel-heading">PROJECT <span>03</span></div>
        <div className="project-card"><div className="project-thumb">✳</div><div><b>Untitled Film</b><small>Motion design · 30 FPS</small></div></div>
        <div className="panel-heading section-gap">CANVAS</div>
        <label className="field-label">ASPECT RATIO</label><select value={format} onChange={e=>setFormat(e.target.value)}>{Object.keys(formats).map(f=><option key={f}>{f}</option>)}</select>
        <div className="spec-row"><span>Resolution</span><b>{width} × {height}</b></div><div className="spec-row"><span>Frame rate</span><b>30 FPS</b></div>
        <div className="panel-heading section-gap">TEXT DESIGN</div>
        <label className="field-label">TYPEFACE</label><select value={font} onChange={e=>setFont(e.target.value)}>{fonts.map(f=><option key={f}>{f}</option>)}</select>
        <label className="field-label">TEXT COLOR</label><div className="color-control"><input type="color" value={textColor} onChange={e=>setTextColor(e.target.value)}/><span>{textColor.toUpperCase()}</span></div>
        <div className="panel-heading section-gap">BACKGROUND</div>
        <label className="upload-control">＋ ADD IMAGE<input type="file" accept="image/*" onChange={e=>imageUpload(e.target.files?.[0])}/></label>
        {backgroundImage&&<button className="clear-btn" onClick={()=>setBackgroundImage(null)}>Remove background image</button>}
        <div className="panel-heading section-gap">VIDEO BACKGROUND</div>
        <label className="upload-control">＋ ADD VIDEO<input type="file" accept="video/*" onChange={e=>mediaUpload(e.target.files?.[0],"video")}/></label>
        {videoBackground&&<button className="clear-btn" onClick={()=>setVideoBackground(null)}>Remove video background</button>}
        <div className="panel-heading section-gap">AUDIO TRACK</div>
        <label className="upload-control">＋ ADD MUSIC / AUDIO<input type="file" accept="audio/*" onChange={e=>mediaUpload(e.target.files?.[0],"audio")}/></label>
        {audioTrack&&<><button className="clear-btn" onClick={()=>setAudioTrack(null)}>Remove audio track</button><label className="field-label">MUSIC VOLUME · {Math.round(audioVolume*100)}%</label><input type="range" min="0" max="1" step="0.01" value={audioVolume} onChange={e=>setAudioVolume(Number(e.target.value))}/></>}
        <div className="panel-heading section-gap">SCENE SETTINGS</div>
        <label className="field-label">HEADLINE</label><input value={current.title} onChange={e=>update("title",e.target.value)} maxLength={28}/>
        <label className="field-label">SUBTITLE</label><input value={current.subtitle} onChange={e=>update("subtitle",e.target.value)} maxLength={38}/>
        <label className="field-label">ACCENT COLOR</label><div className="color-control"><input type="color" value={current.accent} onChange={e=>update("accent",e.target.value)}/><span>{current.accent.toUpperCase()}</span></div>
        <label className="field-label">ENTRANCE TRANSITION</label><select value={current.transition} onChange={e=>update("transition",e.target.value)}><option value="fade">Fade + rise</option><option value="slide">Slide in</option><option value="zoom">Zoom in</option><option value="none">None</option></select>
        <label className="field-label">DURATION · SECONDS</label><input type="number" min="1" max="30" value={current.duration} onChange={e=>update("duration",e.target.value)}/>
        <div className="panel-heading section-gap">EXTRA TEXT LAYERS</div>
        <button className="add-layer" onClick={addTextLayer}>＋ Add text layer</button>
        {sceneLayers.map(layer=><button key={layer.id} className={"layer "+(focusedLayer?.id===layer.id?"layer-active":"")} onClick={()=>setActiveLayer(layer.id)}><span className="layer-icon">T</span><span><b>{layer.text}</b><small>Overlay text</small></span></button>)}
        {focusedLayer&&<><label className="field-label">LAYER TEXT</label><input value={focusedLayer.text} maxLength={60} onChange={e=>updateTextLayer("text",e.target.value)}/><label className="field-label">HORIZONTAL · {focusedLayer.x}%</label><input type="range" min="5" max="95" value={focusedLayer.x} onChange={e=>updateTextLayer("x",e.target.value)}/><label className="field-label">VERTICAL · {focusedLayer.y}%</label><input type="range" min="5" max="95" value={focusedLayer.y} onChange={e=>updateTextLayer("y",e.target.value)}/><label className="field-label">SIZE · {focusedLayer.size}</label><input type="range" min="18" max="180" value={focusedLayer.size} onChange={e=>updateTextLayer("size",e.target.value)}/><label className="field-label">LAYER COLOR</label><div className="color-control"><input type="color" value={focusedLayer.color} onChange={e=>updateTextLayer("color",e.target.value)}/><span>{focusedLayer.color.toUpperCase()}</span></div><button className="clear-btn" onClick={removeTextLayer}>Remove selected text layer</button></>}
        <div className="tip"><span>✦</span><p><b>Your creative controls.</b><br/>Add a background, tune the typography and choose how each scene enters.</p></div>
      </aside>
      <section className="center-panel">
        <div className="preview-toolbar"><span>PREVIEW <i>LIVE</i></span><span>{width} × {height} <b>·</b> 30 FPS</span></div>
        <div className="stage-wrap"><div className="stage" style={{aspectRatio:`${width}/${height}`}}><canvas ref={canvasRef} width={width} height={height}/></div></div>
        <video ref={videoRef} muted loop playsInline style={{display:"none"}}/><audio ref={audioRef} preload="auto" style={{display:"none"}}/>
        <div className="transport"><button onClick={()=>{setElapsed(0);setSelected(0);setPlaying(false)}} title="Go to start">↤</button><button className="play-button" onClick={()=>{if(elapsed>=duration){setElapsed(0);setSelected(0)}setPlaying(!playing)}}>{playing?"Ⅱ":"▶"}</button><span>{Math.floor(elapsed/60).toString().padStart(2,"0")}:{Math.floor(elapsed%60).toString().padStart(2,"0")} <em>/ {Math.floor(duration/60).toString().padStart(2,"0")}:{Math.floor(duration%60).toString().padStart(2,"0")}</em></span><div className="transport-spacer"/><span className="zoom-label">{playing?"PLAYING":"READY"}</span></div>
        <div className="timeline-head"><span>TIMELINE</span><span>{scenes.length} SCENES <b>·</b> {duration.toFixed(1)} SEC</span></div>
        <div className="timeline">
          <div className="ruler"><span>00:00</span><span>{Math.floor(duration*.25)}s</span><span>{Math.floor(duration*.5)}s</span><span>{Math.floor(duration*.75)}s</span><span>{duration}s</span></div>
          <div className="track-label">▤ <span>SCENES</span></div>
          <div className="clips">{scenes.map((s,i)=><button key={i} className={"clip "+(sceneIndex===i?"active":"")} style={{flex:s.duration}} onClick={()=>seekToScene(i)}><span className="clip-number">0{i+1}</span><b>{s.title}</b><small>{s.duration}s</small></button>)}<button className="add-clip" onClick={addScene}>＋</button></div>
          <div className="playhead" style={{left:`calc(90px + (100% - 110px) * ${Math.min(1,elapsed/duration)})`}}/>
        </div>
      </section>
      <aside className="right-panel">
        <div className="panel-heading">LAYERS <span>{scenes.length}</span></div>
        {scenes.map((s,i)=><button key={i} onClick={()=>seekToScene(i)} className={"layer "+(sceneIndex===i?"layer-active":"")}><span className="layer-icon">T</span><span><b>{s.title}</b><small>Text layer · Scene 0{i+1}</small></span><span className="eye">◉</span></button>)}
        <button className="add-layer" onClick={addScene}>＋ Add scene</button>
        <div className="panel-heading section-gap">PROJECT</div>
        <div className="export-setting"><span>Scenes</span><b>{scenes.length}</b></div><div className="export-setting"><span>Total length</span><b>{duration}s</b></div><div className="export-setting"><span>Media</span><b>{videoBackground?"Video · ":""}{audioTrack?"Audio":"—"}</b></div><div className="export-setting"><span>Export</span><b>WebM · 30 FPS</b></div>
        <div className="export-note">Save Project stores scenes and embedded image, video and audio files inside one JSON project. Large media files can make project files large. Export includes the audio track when browser support allows it.</div>
      </aside>
    </section>
    <footer><span>CODECINEMA <b>0.5.0</b></span><span>TEXT LAYER ENGINE <b>✦</b></span><span>NO CLOUD. NO SUBSCRIPTION.</span></footer>
  </main>;
}
