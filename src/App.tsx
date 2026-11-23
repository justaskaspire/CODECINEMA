import { useEffect, useMemo, useRef, useState } from "react";

type Scene = { title: string; subtitle: string; duration: number; accent: string };
const initialScenes: Scene[] = [
  { title: "MAKE IT", subtitle: "A STORY WORTH WATCHING", duration: 4, accent: "#b5ff6d" },
  { title: "MOVE", subtitle: "BEYOND THE ORDINARY", duration: 4, accent: "#8b9cff" },
  { title: "CODECINEMA", subtitle: "YOUR IDEAS. IN MOTION.", duration: 4, accent: "#ff9b78" },
];
const formats: Record<string, [number, number]> = {
  "16:9": [1920, 1080], "9:16": [1080, 1920], "1:1": [1080, 1080], "4:5": [1080, 1350],
};

export default function App() {
  const [scenes, setScenes] = useState(initialScenes);
  const [selected, setSelected] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [format, setFormat] = useState("16:9");
  const [exporting, setExporting] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const startRef = useRef(0);
  const duration = useMemo(() => scenes.reduce((sum, s) => sum + s.duration, 0), [scenes]);
  const [width, height] = formats[format];
  const starts = useMemo(() => scenes.map((_, i) => scenes.slice(0, i).reduce((sum, s) => sum + s.duration, 0)), [scenes]);
  const activeIndex = playing ? Math.max(0, starts.findIndex((start, i) => elapsed >= start && elapsed < start + scenes[i].duration)) : selected;
  const sceneIndex = activeIndex < 0 ? scenes.length - 1 : activeIndex;
  const current = scenes[selected] ?? scenes[0];
  const sceneTime = playing ? Math.max(0, elapsed - (starts[sceneIndex] ?? 0)) : 0;

  useEffect(() => {
    if (!playing) return;
    startRef.current = performance.now() - elapsed * 1000;
    const tick = (now: number) => {
      const next = Math.min(duration, (now - startRef.current) / 1000);
      setElapsed(next);
      if (next >= duration) { setPlaying(false); return; }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [playing, duration]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = width; canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const w = canvas.width, h = canvas.height;
    let frame = 0;
    const draw = (now: number) => {
      const scene = scenes[sceneIndex] ?? scenes[0];
      const localTime = playing ? sceneTime : (now % 4000) / 1000;
      const progress = Math.min(1, localTime / Math.max(.1, scene.duration));
      const isPortrait = h > w;
      ctx.clearRect(0, 0, w, h);
      const bg = ctx.createLinearGradient(0, 0, w, h);
      bg.addColorStop(0, "#111827"); bg.addColorStop(1, "#080b12");
      ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);
      const glow = ctx.createRadialGradient(w * .76, h * .2, 0, w * .76, h * .2, Math.max(w,h) * .65);
      glow.addColorStop(0, scene.accent + "35"); glow.addColorStop(1, scene.accent + "00");
      ctx.fillStyle = glow; ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = "#ffffff12"; ctx.lineWidth = Math.max(1, w / 1920);
      const grid = Math.max(30, Math.round(Math.min(w,h) / 22));
      for (let x = 0; x < w; x += grid) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,h); ctx.stroke(); }
      for (let y = 0; y < h; y += grid) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(w,y); ctx.stroke(); }
      const enter = Math.min(1, localTime / .65);
      const eased = 1 - Math.pow(1 - enter, 3);
      const pulse = 1 + Math.sin(now / 650) * .025;
      ctx.save(); ctx.translate(w * .5, h * .47); ctx.scale(pulse * (.92 + eased * .08), pulse * (.92 + eased * .08));
      ctx.fillStyle = scene.accent; ctx.globalAlpha = .12;
      ctx.beginPath(); ctx.arc(0,0,Math.min(w,h)*.31,0,Math.PI*2); ctx.fill();
      ctx.restore();
      const titleSize = Math.min(w * .105, h * .105, isPortrait ? 112 : 150);
      ctx.save(); ctx.globalAlpha = eased; ctx.translate(0, (1 - eased) * 35);
      ctx.fillStyle = "#ffffff"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.font = `800 ${titleSize}px Manrope, system-ui, sans-serif`;
      const title = scene.title.toUpperCase();
      ctx.fillText(title, w/2, h*.47, w*.84);
      ctx.fillStyle = scene.accent; ctx.fillRect(w/2 - w*.035, h*.55, w*.07, Math.max(4,w*.003));
      ctx.fillStyle = "#c4cbd8"; ctx.font = `500 ${Math.max(18,w*.018)}px Manrope, system-ui, sans-serif`;
      ctx.fillText(scene.subtitle.toUpperCase(), w/2, h*.63, w*.82);
      ctx.restore();
      ctx.fillStyle = "#ffffff70"; ctx.textAlign = "center"; ctx.font = `500 ${Math.max(12,w*.012)}px Manrope, system-ui, sans-serif`;
      ctx.fillText("A CODECINEMA ORIGINAL", w/2, h*.88);
      ctx.fillStyle = "#ffffff20"; ctx.fillRect(w*.08,h*.93,w*.84,Math.max(2,w*.002));
      ctx.fillStyle = scene.accent; ctx.fillRect(w*.08,h*.93,w*.84*progress,Math.max(2,w*.002));
      frame = requestAnimationFrame(draw);
    };
    frame = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frame);
  }, [scenes, sceneIndex, sceneTime, playing, format, width, height]);

  const seekToScene = (index: number) => {
    setPlaying(false);
    setSelected(index);
    setElapsed(starts[index] ?? 0);
  };
  const seekTimeline = (event: React.MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
    const time = ratio * duration;
    const index = Math.max(0, starts.findIndex((start, i) => time >= start && time < start + scenes[i].duration));
    setPlaying(false); setElapsed(time); setSelected(index < 0 ? scenes.length - 1 : index);
  };
  const addScene = () => {
    const next = [...scenes, { title: "NEW SCENE", subtitle: "WRITE YOUR NEXT LINE", duration: 4, accent: "#d7a6ff" }];
    setScenes(next); setSelected(next.length - 1); setPlaying(false);
    setElapsed(next.slice(0,-1).reduce((sum,s)=>sum+s.duration,0));
  };
  const update = (key: "title" | "subtitle" | "duration", value: string) => {
    setScenes(old => old.map((s,i) => i === selected ? { ...s, [key]: key === "duration" ? Math.max(1, Math.min(30, Number(value) || 1)) : value } : s));
  };
  const exportVideo = async () => {
    const canvas = canvasRef.current;
    if (!canvas || !(canvas as HTMLCanvasElement).captureStream || !(window as typeof window & { MediaRecorder?: typeof MediaRecorder }).MediaRecorder) {
      alert("WebM recording is not supported in this browser. Try a recent Chrome browser."); return;
    }
    const mime = ["video/webm;codecs=vp9","video/webm;codecs=vp8","video/webm"].find(m => MediaRecorder.isTypeSupported(m));
    if (!mime) { alert("This browser does not support WebM export."); return; }
    setExporting(true); setSelected(0); setElapsed(0); setPlaying(true);
    const stream = canvas.captureStream(30);
    const recorder = new MediaRecorder(stream, { mimeType: mime });
    const chunks: BlobPart[] = [];
    recorder.ondataavailable = e => { if (e.data.size) chunks.push(e.data); };
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: "video/webm" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url; a.download = "codec-cinema.webm"; a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      stream.getTracks().forEach(track => track.stop()); setExporting(false);
    };
    recorder.start();
    window.setTimeout(() => { if (recorder.state !== "inactive") recorder.stop(); setPlaying(false); }, duration * 1000 + 250);
  };

  return <main className="app-shell">
    <header className="topbar">
      <div className="brand"><span className="brand-mark">C</span><span>CODE<span className="brand-light">CINEMA</span></span><small>STUDIO / 002</small></div>
      <div className="top-center"><span className="live-dot"/> LOCAL PROJECT <span className="divider">/</span> UNTITLED FILM</div>
      <div className="top-actions"><span className="saved">● ALL CHANGES LOCAL</span><button className="export-btn" onClick={exportVideo} disabled={exporting}>{exporting ? "RENDERING…" : "↗ EXPORT FULL FILM"}</button></div>
    </header>
    <section className="workspace">
      <aside className="left-panel">
        <div className="panel-heading">PROJECT <span>02</span></div>
        <div className="project-card"><div className="project-thumb">✳</div><div><b>Untitled Film</b><small>Motion design · 30 FPS</small></div></div>
        <div className="panel-heading section-gap">CANVAS</div>
        <label className="field-label">ASPECT RATIO</label>
        <select value={format} onChange={e=>setFormat(e.target.value)}>{Object.keys(formats).map(f=><option key={f}>{f}</option>)}</select>
        <div className="spec-row"><span>Resolution</span><b>{width} × {height}</b></div><div className="spec-row"><span>Frame rate</span><b>30 FPS</b></div>
        <div className="panel-heading section-gap">SCENE SETTINGS</div>
        <label className="field-label">HEADLINE</label><input value={current.title} onChange={e=>update("title",e.target.value)} maxLength={28}/>
        <label className="field-label">SUBTITLE</label><input value={current.subtitle} onChange={e=>update("subtitle",e.target.value)} maxLength={38}/>
        <label className="field-label">DURATION · SECONDS</label><input type="number" min="1" max="30" value={current.duration} onChange={e=>update("duration",e.target.value)}/>
        <div className="tip"><span>✦</span><p><b>Now the scenes flow.</b><br/>Press play to preview the complete film, or tap a clip to jump to that scene.</p></div>
      </aside>
      <section className="center-panel">
        <div className="preview-toolbar"><span>PREVIEW <i>LIVE</i></span><span>{width} × {height} <b>·</b> FIT TO VIEW</span></div>
        <div className="stage-wrap"><div className="stage" style={{aspectRatio:`${width}/${height}`}}><canvas ref={canvasRef} width={width} height={height}/></div></div>
        <div className="transport"><button onClick={()=>{setElapsed(0);setSelected(0);setPlaying(false)}} title="Go to start">↤</button><button className="play-button" onClick={()=>{if(elapsed>=duration){setElapsed(0);setSelected(0)}setPlaying(!playing)}}>{playing?"Ⅱ":"▶"}</button><span>{Math.floor(elapsed/60).toString().padStart(2,"0")}:{Math.floor(elapsed%60).toString().padStart(2,"0")} <em>/ {Math.floor(duration/60).toString().padStart(2,"0")}:{Math.floor(duration%60).toString().padStart(2,"0")}</em></span><div className="transport-spacer"/><span className="zoom-label">{playing?"PLAYING":"READY"}</span></div>
        <div className="timeline-head"><span>TIMELINE</span><span>{scenes.length} SCENES <b>·</b> {duration.toFixed(1)} SEC</span></div>
        <div className="timeline" onClick={seekTimeline}>
          <div className="ruler"><span>00:00</span><span>{Math.floor(duration*.25)}s</span><span>{Math.floor(duration*.5)}s</span><span>{Math.floor(duration*.75)}s</span><span>{duration}s</span></div>
          <div className="track-label">▤ <span>SCENES</span></div>
          <div className="clips">{scenes.map((s,i)=><button key={i} className={"clip "+(sceneIndex===i?"active":"")} style={{flex:s.duration}} onClick={e=>{e.stopPropagation();seekToScene(i)}}><span className="clip-number">0{i+1}</span><b>{s.title}</b><small>{s.duration}s</small></button>)}<button className="add-clip" onClick={e=>{e.stopPropagation();addScene()}}>＋</button></div>
          <div className="playhead" style={{left:`calc(90px + (100% - 110px) * ${Math.min(1,elapsed/duration)})`}}/>
        </div>
      </section>
      <aside className="right-panel">
        <div className="panel-heading">LAYERS <span>{scenes.length}</span></div>
        {scenes.map((s,i)=><button key={i} onClick={()=>seekToScene(i)} className={"layer "+(sceneIndex===i?"layer-active":"")}><span className="layer-icon">T</span><span><b>{s.title}</b><small>Text layer · Scene 0{i+1}</small></span><span className="eye">◉</span></button>)}
        <button className="add-layer" onClick={addScene}>＋ Add scene</button>
        <div className="panel-heading section-gap">EXPORT SETTINGS</div>
        <div className="export-setting"><span>Format</span><b>WebM</b></div><div className="export-setting"><span>Frame rate</span><b>30 FPS</b></div><div className="export-setting"><span>Resolution</span><b>{width} × {height}</b></div>
        <div className="export-note">Full-film export records every scene in sequence. Keep this tab open until the render finishes.</div>
      </aside>
    </section>
    <footer><span>CODECINEMA <b>0.2.0</b></span><span>BUILT FOR THE BROWSER <b>✦</b></span><span>NO CLOUD. NO SUBSCRIPTION.</span></footer>
  </main>;
}
