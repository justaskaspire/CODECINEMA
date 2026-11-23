import { useCallback, useEffect, useRef, useState } from "react";

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
ctx.fillText("EVERY FRAME IS CODE",w/2,h*.72);`
};

const api = {
  clamp: (v: number, min = 0, max = 1) => Math.max(min, Math.min(max, v)),
  lerp: (a: number, b: number, p: number) => a + (b - a) * p,
  ease: (p: number) => { const x = Math.max(0, Math.min(1, p)); return x * x * (3 - 2 * x); },
  easeOut: (p: number) => 1 - Math.pow(1 - Math.max(0, Math.min(1, p)), 3),
  map: (v: number, inMin: number, inMax: number, outMin: number, outMax: number) => outMin + ((v - inMin) / (inMax - inMin || 1)) * (outMax - outMin),
  roundedRect: (ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius = 12) => {
    const r = Math.max(0, Math.min(radius, width / 2, height / 2));
    ctx.beginPath(); ctx.roundRect(x, y, width, height, r);
  }
};

type CinemaApi = {
  clamp: (v: number, min?: number, max?: number) => number;
  lerp: (a: number, b: number, p: number) => number;
  ease: (p: number) => number;
  easeOut: (p: number) => number;
  map: (v: number, inMin: number, inMax: number, outMin: number, outMax: number) => number;
  roundedRect: (ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius?: number) => void;
};
type RenderFunction = (ctx: CanvasRenderingContext2D, t: number, w: number, h: number, api: CinemaApi) => void;

function scriptError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error || "Unknown script error");
  if (/&lt;|&gt;|&amp;|&#91;|&#93;|\\\*/i.test(message)) return "Your code may contain HTML-escaped symbols. Use real JavaScript characters (<, >, &, [, ], *) and paste the raw code.";
  const stack = error instanceof Error ? error.stack || "" : "";
  const location = stack.match(/codec-cinema-user-script:(\\d+):(\\d+)/);
  if (location) return `Line ${location[1]}, column ${location[2]}: ${message}`;
  return message;
}

export default function App() {
  const [code, setCode] = useState(() => { try { return localStorage.getItem("codec-2026-script") || starterCode; } catch { return starterCode; } });
  const [example, setExample] = useState("Cinematic title");
  const [duration, setDuration] = useState(8);
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
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const codeRef = useRef(code);
  const renderRef = useRef<RenderFunction | null>(null);
  const rafRef = useRef(0);
  const startRef = useRef(0);
  const lastFrameAtRef = useRef(0);
  const elapsedRef = useRef(0);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const exportCancelledRef = useRef(false);
  const exportFailedRef = useRef(false);
  const formats: Record<string, [number, number]> = {
    "16:9": quality === "720p" ? [1280, 720] : [1920, 1080],
    "9:16": quality === "720p" ? [720, 1280] : [1080, 1920],
    "1:1": quality === "720p" ? [720, 720] : [1080, 1080],
    "4:5": quality === "720p" ? [720, 900] : [1080, 1350]
  };
  const [width, height] = formats[format];

  useEffect(() => { codeRef.current = code; try { localStorage.setItem("codec-2026-script", code); } catch { /* storage may be unavailable */ } }, [code]);

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
      if (recorderRef.current?.state === "recording") {
        exportFailedRef.current = true;
        try { recorderRef.current.stop(); } catch { /* recorder cleanup follows */ }
      }
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
    const frameInterval = 1000 / 30;
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
        if (exporting && recorderRef.current?.state === "recording") recorderRef.current.stop();
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [running, duration, drawFrame, exporting]);

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
    const wasExporting = exporting;
    if (wasExporting) {
      exportCancelledRef.current = true;
      const recorder = recorderRef.current;
      if (recorder && recorder.state !== "inactive") {
        try { recorder.stop(); } catch { /* onstop/error cleanup handles the stream */ }
      } else {
        streamRef.current?.getTracks().forEach(track => track.stop());
        streamRef.current = null;
        recorderRef.current = null;
        setExporting(false);
      }
    }
    setRunning(false);
    elapsedRef.current = 0;
    setElapsed(0);
    drawFrame(0);
    setStatus(wasExporting ? "CANCELLING EXPORT…" : "READY");
  };
  const exportVideo = async () => {
    const canvas = canvasRef.current;
    if (exporting) return;
    if (!canvas?.captureStream || !("MediaRecorder" in window)) {
      setError("WebM recording is not supported by this browser.");
      return;
    }
    try {
      renderRef.current = compile(code);
      const mime = ["video/webm;codecs=vp9", "video/webm;codecs=vp8", "video/webm"].find(type => MediaRecorder.isTypeSupported(type));
      if (!mime) throw new Error("This browser does not support WebM encoding.");
      const stream = canvas.captureStream(30);
      const recorder = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: bitrate * 1_000_000 });
      const chunks: BlobPart[] = [];
      exportCancelledRef.current = false;
      exportFailedRef.current = false;
      streamRef.current = stream;
      recorder.ondataavailable = event => { if (event.data.size) chunks.push(event.data); };
      recorder.onstop = () => {
        if (!exportCancelledRef.current && chunks.length) {
          const url = URL.createObjectURL(new Blob(chunks, { type: mime }));
          const a = document.createElement("a");
          a.href = url; a.download = "codec-cinema.webm"; a.click();
          setTimeout(() => URL.revokeObjectURL(url), 1500);
        }
        stream.getTracks().forEach(track => track.stop());
        streamRef.current = null;
        recorderRef.current = null;
        setExporting(false);
        const failed = exportFailedRef.current;
        setStatus(failed ? "EXPORT FAILED" : exportCancelledRef.current ? "EXPORT CANCELLED" : "EXPORT COMPLETE");
        exportFailedRef.current = false;
      };
      recorder.onerror = () => {
        exportFailedRef.current = true;
        setError("Recording failed. Try 720p or a shorter video.");
        setRunning(false);
        setStatus("EXPORT FAILED — CLEANING UP");
        if (recorder.state !== "inactive") {
          try { recorder.stop(); } catch { /* browser may already have stopped it */ }
        } else {
          stream.getTracks().forEach(track => track.stop());
          streamRef.current = null;
          recorderRef.current = null;
          setExporting(false);
          setStatus("EXPORT FAILED");
        }
      };
      recorderRef.current = recorder;
      setExporting(true);
      setStatus("RENDERING");
      elapsedRef.current = 0;
      setElapsed(0);
      drawFrame(0);
      recorder.start();
      setRunning(true);
    } catch (e) {
      exportFailedRef.current = true;
      setError(scriptError(e));
      streamRef.current?.getTracks().forEach(track => track.stop());
      streamRef.current = null;
      recorderRef.current = null;
      setExporting(false);
      exportFailedRef.current = false;
      setStatus("EXPORT FAILED");
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
        <label className="button secondary">OPEN SCRIPT<input hidden type="file" accept=".js,.txt,text/javascript" onChange={e => { void openScript(e.target.files?.[0]); e.currentTarget.value = ""; }} /></label>
        <button className="button secondary" onClick={downloadScript}>SAVE .JS</button>
        <button className="button primary" onClick={exportVideo} disabled={exporting}>{exporting ? "RENDERING…" : "↗ EXPORT WEBM"}</button>
      </div>
    </header>

    <section className="layout">
      <section className={`editor-panel${editorExpanded ? " editor-expanded" : ""}`}>
        <div className="section-title"><span>01 / YOUR SCRIPT</span><div className="editor-tools"><button className="expand-editor" onClick={() => setEditorExpanded(v => !v)}>{editorExpanded ? "CLOSE EDITOR" : "EXPAND EDITOR"}</button><span className="live-tag">JAVASCRIPT</span></div></div>
        <div className="editor-help">One function. Every frame. Time is <code>t</code> in seconds. Your script auto-saves on this device.</div>\n        <div className="example-row"><label htmlFor="example-select">START FROM</label><select id="example-select" value={example} onChange={e => { const key=e.target.value; setExample(key); if (key) { setCode(examples[key]); setStatus("EXAMPLE LOADED — PRESS RUN"); } }}><option value="">Choose an example…</option><option>Cinematic title</option><option>Particle universe</option><option>Orbiting geometry</option><option>Wave typography</option></select></div>
        <textarea className="code-editor" spellCheck={false} autoCapitalize="off" autoCorrect="off" value={code} onChange={e => setCode(e.target.value)} onKeyDown={e => {
          if ((e.ctrlKey || e.metaKey) && e.key === "Enter") { e.preventDefault(); runCode(); return; }
          if (e.key === "Tab") {
            e.preventDefault();
            const el = e.currentTarget, start = el.selectionStart, end = el.selectionEnd;
            setCode(value => value.slice(0, start) + "  " + value.slice(end));
            requestAnimationFrame(() => el.setSelectionRange(start + 2, start + 2));
          }
        }} aria-label="JavaScript video script" />
        <div className="editor-actions">
          <button className="button primary run-button" onClick={runCode}>▶ RUN SCRIPT</button>
          <button className="button secondary" onClick={() => { setCode(""); setExample(""); setError(""); setStatus("EDITOR CLEARED — PASTE NEW CODE"); }}>RESET</button>
        </div>
        {error && <div className="error-box"><b>CODE ERROR</b><span>{error}</span></div>}
        <div className="api-card">
          <div className="section-title">02 / QUICK REFERENCE</div>
          <p><code>ctx</code> — Canvas 2D drawing context</p>
          <p><code>t</code> — current time in seconds</p>
          <p><code>w</code> / <code>h</code> — output width and height</p>
          <p><code>api.clamp()</code>, <code>api.lerp()</code>, <code>api.map()</code> — math helpers</p>
          <p><code>api.ease()</code>, <code>api.easeOut()</code> — smooth animation curves</p>
          <p><code>api.roundedRect(ctx,x,y,w,h,r)</code> — rounded rectangle path</p>
          <p>Use standard JavaScript and Canvas methods: <code>fillRect()</code>, <code>fillText()</code>, <code>drawImage()</code>, gradients, paths, transforms and more.</p>\n          <p><code>Math.sin(t)</code> creates smooth motion. <code>ctx.save()</code> / <code>ctx.restore()</code> isolate drawing styles.</p>\n          <p><b>Tip:</b> Select an example above, change its code, then press RUN SCRIPT.</p>
        </div>
      </section>

      <section className="preview-panel">
        <div className="preview-head"><div><span className="section-kicker">03 / LIVE OUTPUT</span><h1>Preview</h1></div><div className="preview-head-actions"><span className="resolution">{width} × {height} <b>30 FPS TARGET</b></span><button className="expand-editor" onClick={() => setPreviewExpanded(v => !v)}>{previewExpanded ? "EXIT FULLSCREEN" : "FULLSCREEN"}</button></div></div>
        <div className={`canvas-frame${previewExpanded ? " preview-expanded" : ""}`} style={{ aspectRatio: `${width} / ${height}` }}><canvas ref={canvasRef} /></div>
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
          <label>BITRATE <select value={bitrate} disabled={exporting} onChange={e => setBitrate(Number(e.target.value))}><option value={4}>4 Mbps · light</option><option value={6}>6 Mbps · balanced</option><option value={8}>8 Mbps · high</option><option value={12}>12 Mbps · max</option></select></label>
          <div className="render-note"><span>●</span> Renders locally in your browser. No paid APIs.</div>
        </div>
      </section>
    </section>
    <footer><span>CODECINEMA <b>0.10.0 / CODE-DRIVEN ENGINE</b></span><span>WRITE IT. RUN IT. RENDER IT.</span></footer>
  </main>;
}
