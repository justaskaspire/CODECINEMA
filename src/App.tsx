import { useEffect, useRef, useState } from "react";

type Scene = { title: string; subtitle: string; duration: number; accent: string };
const initialScenes: Scene[] = [
  { title: "MAKE IT", subtitle: "A STORY WORTH WATCHING", duration: 4, accent: "#b5ff6d" },
  { title: "MOVE", subtitle: "BEYOND THE ORDINARY", duration: 4, accent: "#8b9cff" },
  { title: "CODECINEMA", subtitle: "YOUR IDEAS. IN MOTION.", duration: 4, accent: "#ff9b78" },
];

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
  const duration = scenes.reduce((sum, s) => sum + s.duration, 0);
  const current = scenes[selected] ?? scenes[0];

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
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const w = canvas.width, h = canvas.height;
    let t = 0;
    let frame = 0;
    const draw = () => {
      const scene = scenes[selected] ?? scenes[0];
      ctx.clearRect(0, 0, w, h);
      const bg = ctx.createLinearGradient(0, 0, w, h);
      bg.addColorStop(0, "#111827"); bg.addColorStop(1, "#080b12");
      ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);
      const pulse = 1 + Math.sin(t / 650) * 0.035;
      const glow = ctx.createRadialGradient(w * .76, h * .2, 0, w * .76, h * .2, w * .65);
      glow.addColorStop(0, scene.accent + "30"); glow.addColorStop(1, scene.accent + "00");
      ctx.fillStyle = glow; ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = "#ffffff12"; ctx.lineWidth = 1;
      for (let x = 0; x < w; x += 48) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,h); ctx.stroke(); }
      for (let y = 0; y < h; y += 48) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(w,y); ctx.stroke(); }
      ctx.save(); ctx.translate(w * .5, h * .48); ctx.scale(pulse, pulse);
      ctx.fillStyle = scene.accent; ctx.globalAlpha = .12;
      ctx.beginPath(); ctx.arc(0,0,Math.min(w,h)*.31,0,Math.PI*2); ctx.fill();
      ctx.restore();
      ctx.fillStyle = "#ffffff"; ctx.textAlign = "center";
      ctx.font = "800 76px Inter, system-ui, sans-serif"; ctx.letterSpacing = "2px";
      ctx.fillText(scene.title, w/2, h*.48);
      ctx.fillStyle = scene.accent; ctx.fillRect(w/2-38,h*.55,76,4);
      ctx.fillStyle = "#c4cbd8"; ctx.font = "500 19px Inter, system-ui, sans-serif"; ctx.letterSpacing = "5px";
      ctx.fillText(scene.subtitle, w/2, h*.63);
      ctx.fillStyle = "#ffffff70"; ctx.font = "12px Inter, system-ui, sans-serif"; ctx.letterSpacing = "2px";
      ctx.fillText("A CODECINEMA ORIGINAL", w/2, h*.88);
      t = performance.now();
      frame = requestAnimationFrame(draw);
    };
    frame = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frame);
  }, [scenes, selected, format]);

  const addScene = () => {
    const next = [...scenes, { title: "NEW SCENE", subtitle: "WRITE YOUR NEXT LINE", duration: 4, accent: "#d7a6ff" }];
    setScenes(next); setSelected(next.length - 1);
  };
  const update = (key: "title" | "subtitle" | "duration", value: string) => {
    setScenes(old => old.map((s,i) => i === selected ? { ...s, [key]: key === "duration" ? Math.max(1, Math.min(30, Number(value) || 1)) : value } : s));
  };
  const exportVideo = async () => {
    const canvas = canvasRef.current;
    if (!canvas || !("captureStream" in canvas) || !("MediaRecorder" in window)) {
      alert("WebM recording is not supported in this browser. Try a recent Chrome browser."); return;
    }
    setExporting(true);
    const stream = canvas.captureStream(30);
    const mime = ["video/webm;codecs=vp9","video/webm;codecs=vp8","video/webm"].find(m => MediaRecorder.isTypeSupported(m));
    if (!mime) { setExporting(false); alert("This browser does not support WebM export."); return; }
    const recorder = new MediaRecorder(stream, { mimeType: mime });
    const chunks: BlobPart[] = [];
    recorder.ondataavailable = e => { if (e.data.size) chunks.push(e.data); };
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: "video/webm" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url; a.download = "codec cinema-preview.webm"; a.click();
      URL.revokeObjectURL(url); stream.getTracks().forEach(track => track.stop()); setExporting(false);
    };
    recorder.start();
    const end = performance.now() + duration * 1000;
    const stop = () => { if (performance.now() >= end) recorder.stop(); else requestAnimationFrame(stop); };
    requestAnimationFrame(stop);
  };

  return <main className="app-shell">
    <header className="topbar">
      <div className="brand"><span className="brand-mark">C</span><span>CODE<span className="brand-light">CINEMA</span></span><small>STUDIO / 001</small></div>
      <div className="top-center"><span className="live-dot"/> LOCAL PROJECT <span className="divider">/</span> UNTITLED FILM</div>
      <div className="top-actions"><span className="saved">● ALL CHANGES LOCAL</span><button className="export-btn" onClick={exportVideo} disabled={exporting}>{exporting ? "RECORDING…" : "↗ EXPORT WEBM"}</button></div>
    </header>
    <section className="workspace">
      <aside className="left-panel">
        <div className="panel-heading">PROJECT <span>01</span></div>
        <div className="project-card"><div className="project-thumb">✳</div><div><b>Untitled Film</b><small>Motion design · 30 FPS</small></div></div>
        <div className="panel-heading section-gap">CANVAS</div>
        <label className="field-label">ASPECT RATIO</label>
        <select value={format} onChange={e=>setFormat(e.target.value)}><option>16:9</option><option>9:16</option><option>1:1</option><option>4:5</option></select>
        <div className="spec-row"><span>Resolution</span><b>1920 × 1080</b></div><div className="spec-row"><span>Frame rate</span><b>30 FPS</b></div>
        <div className="panel-heading section-gap">SCENE SETTINGS</div>
        <label className="field-label">HEADLINE</label><input value={current.title} onChange={e=>update("title",e.target.value)} maxLength={28}/>
        <label className="field-label">SUBTITLE</label><input value={current.subtitle} onChange={e=>update("subtitle",e.target.value)} maxLength={38}/>
        <label className="field-label">DURATION · SECONDS</label><input type="number" min="1" max="30" value={current.duration} onChange={e=>update("duration",e.target.value)}/>
        <div className="tip"><span>✦</span><p><b>Made to stay yours.</b><br/>Your project runs in this browser. No account, no subscription, no upload.</p></div>
      </aside>
      <section className="center-panel">
        <div className="preview-toolbar"><span>PREVIEW <i>LIVE</i></span><span>FIT TO VIEW <b>⌄</b></span></div>
        <div className="stage-wrap"><div className="stage"><canvas ref={canvasRef} width={1920} height={1080}/></div></div>
        <div className="transport"><button onClick={()=>{setElapsed(0);setPlaying(false)}}>↤</button><button className="play-button" onClick={()=>setPlaying(!playing)}>{playing?"Ⅱ":"▶"}</button><span>{Math.floor(elapsed/60).toString().padStart(2,"0")}:{Math.floor(elapsed%60).toString().padStart(2,"0")} <em>/ {Math.floor(duration/60).toString().padStart(2,"0")}:{Math.floor(duration%60).toString().padStart(2,"0")}</em></span><div className="transport-spacer"/><span className="zoom-label">100%</span></div>
        <div className="timeline-head"><span>TIMELINE</span><span>{scenes.length} SCENES <b>·</b> {duration.toFixed(1)} SEC</span></div>
        <div className="timeline">
          <div className="ruler"><span>00:00</span><span>00:04</span><span>00:08</span><span>00:12</span><span>00:16</span></div>
          <div className="track-label">▤ <span>SCENES</span></div>
          <div className="clips">{scenes.map((s,i)=><button key={i} className={"clip "+(selected===i?"active":"")} style={{flex:s.duration}} onClick={()=>setSelected(i)}><span className="clip-number">0{i+1}</span><b>{s.title}</b><small>{s.duration}s</small></button>)}<button className="add-clip" onClick={addScene}>＋</button></div>
          <div className="playhead" style={{left:`calc(90px + (100% - 110px) * ${Math.min(1,elapsed/duration)})`}}/>
        </div>
      </section>
      <aside className="right-panel">
        <div className="panel-heading">LAYERS <span>{scenes.length}</span></div>
        {scenes.map((s,i)=><button key={i} onClick={()=>setSelected(i)} className={"layer "+(selected===i?"layer-active":"")}><span className="layer-icon">T</span><span><b>{s.title}</b><small>Text layer · Scene 0{i+1}</small></span><span className="eye">◉</span></button>)}
        <button className="add-layer" onClick={addScene}>＋ Add scene</button>
        <div className="panel-heading section-gap">EXPORT SETTINGS</div>
        <div className="export-setting"><span>Format</span><b>WebM</b></div><div className="export-setting"><span>Frame rate</span><b>30 FPS</b></div><div className="export-setting"><span>Quality</span><b>Browser default</b></div>
        <div className="export-note">Export records the animated canvas in real time. Keep this tab open until recording finishes.</div>
      </aside>
    </section>
    <footer><span>CODECINEMA <b>0.1.0</b></span><span>BUILT FOR THE BROWSER <b>✦</b></span><span>NO CLOUD. NO SUBSCRIPTION.</span></footer>
  </main>;
}
