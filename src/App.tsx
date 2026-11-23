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

type RenderFunction = (ctx: CanvasRenderingContext2D, t: number, w: number, h: number) => void;

export default function App() {
  const [code, setCode] = useState(starterCode);
  const [duration, setDuration] = useState(8);
  const [format, setFormat] = useState("16:9");
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("READY");
  const [exporting, setExporting] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const codeRef = useRef(code);
  const renderRef = useRef<RenderFunction | null>(null);
  const rafRef = useRef(0);
  const startRef = useRef(0);
  const elapsedRef = useRef(0);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const formats: Record<string, [number, number]> = {
    "16:9": [1920, 1080], "9:16": [1080, 1920], "1:1": [1080, 1080], "4:5": [1080, 1350]
  };
  const [width, height] = formats[format];

  useEffect(() => { codeRef.current = code; }, [code]);

  const compile = useCallback((source: string) => {
    // Scripts are user-authored and execute locally in this browser tab.
    return new Function("ctx", "t", "w", "h", source) as RenderFunction;
  }, []);

  const drawFrame = useCallback((time: number) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx || !renderRef.current) return;
    try {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      renderRef.current(ctx, time, canvas.width, canvas.height);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Your script has an error.");
      setRunning(false);
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
      setError(e instanceof Error ? e.message : "Could not compile this script.");
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
    const tick = (now: number) => {
      const next = Math.min(duration, (now - startRef.current) / 1000);
      elapsedRef.current = next;
      setElapsed(next);
      drawFrame(next);
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
    setRunning(false);
    elapsedRef.current = 0;
    setElapsed(0);
    drawFrame(0);
    setStatus("READY");
  };
  const exportVideo = async () => {
    const canvas = canvasRef.current;
    if (!canvas?.captureStream || !("MediaRecorder" in window)) {
      setError("WebM recording is not supported by this browser.");
      return;
    }
    try {
      renderRef.current = compile(code);
      const mime = ["video/webm;codecs=vp9", "video/webm;codecs=vp8", "video/webm"].find(type => MediaRecorder.isTypeSupported(type));
      if (!mime) throw new Error("This browser does not support WebM encoding.");
      const stream = canvas.captureStream(30);
      const recorder = new MediaRecorder(stream, { mimeType: mime });
      const chunks: BlobPart[] = [];
      recorder.ondataavailable = event => { if (event.data.size) chunks.push(event.data); };
      recorder.onstop = () => {
        const url = URL.createObjectURL(new Blob(chunks, { type: mime }));
        const a = document.createElement("a");
        a.href = url; a.download = "codec cinema.webm"; a.click();
        setTimeout(() => URL.revokeObjectURL(url), 1500);
        stream.getTracks().forEach(track => track.stop());
        recorderRef.current = null;
        setExporting(false);
        setStatus("EXPORT COMPLETE");
      };
      recorder.onerror = () => {
        setError("Recording failed. Try a smaller format or a shorter video.");
        setExporting(false);
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
      setError(e instanceof Error ? e.message : "Export failed.");
      setExporting(false);
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
      <section className="editor-panel">
        <div className="section-title"><span>01 / YOUR SCRIPT</span><span className="live-tag">JAVASCRIPT</span></div>
        <div className="editor-help">One function. Every frame. Time is <code>t</code> in seconds.</div>
        <textarea className="code-editor" spellCheck={false} autoCapitalize="off" autoCorrect="off" value={code} onChange={e => setCode(e.target.value)} aria-label="JavaScript video script" />
        <div className="editor-actions">
          <button className="button primary run-button" onClick={runCode}>▶ RUN SCRIPT</button>
          <button className="button secondary" onClick={() => { setCode(starterCode); setStatus("STARTER RESTORED"); }}>RESET</button>
        </div>
        {error && <div className="error-box"><b>CODE ERROR</b><span>{error}</span></div>}
        <div className="api-card">
          <div className="section-title">02 / QUICK REFERENCE</div>
          <p><code>ctx</code> — Canvas 2D drawing context</p>
          <p><code>t</code> — current time in seconds</p>
          <p><code>w</code> / <code>h</code> — output width and height</p>
          <p>Use standard JavaScript and Canvas methods: <code>fillRect()</code>, <code>fillText()</code>, <code>drawImage()</code>, gradients, paths, transforms and more.</p>
        </div>
      </section>

      <section className="preview-panel">
        <div className="preview-head"><div><span className="section-kicker">03 / LIVE OUTPUT</span><h1>Preview</h1></div><span className="resolution">{width} × {height} <b>30 FPS</b></span></div>
        <div className="canvas-frame"><canvas ref={canvasRef} /></div>
        <div className="transport">
          <button onClick={stop} aria-label="Stop">■</button>
          <button className="play-control" onClick={running ? pause : play} aria-label={running ? "Pause" : "Play"}>{running ? "Ⅱ" : "▶"}</button>
          <span>{elapsed.toFixed(2)}s <em>/ {duration.toFixed(1)}s</em></span>
          <input className="scrubber" type="range" min="0" max={duration} step="0.01" value={elapsed} onChange={e => { const value = Number(e.target.value); elapsedRef.current = value; setElapsed(value); setRunning(false); drawFrame(value); setStatus("SCRUBBING"); }} />
          <span>{Math.max(0, duration - elapsed).toFixed(1)}s left</span>
        </div>
        <div className="render-settings">
          <label>FORMAT <select value={format} onChange={e => setFormat(e.target.value)}>{Object.keys(formats).map(item => <option key={item}>{item}</option>)}</select></label>
          <label>DURATION <select value={duration} onChange={e => setDuration(Number(e.target.value))}>{[5,8,10,15,20,30,45,60].map(value => <option key={value} value={value}>{value} seconds</option>)}</select></label>
          <div className="render-note"><span>●</span> Renders locally in your browser. No paid APIs.</div>
        </div>
      </section>
    </section>
    <footer><span>CODECINEMA <b>0.7.0 / CODE-DRIVEN ENGINE</b></span><span>WRITE IT. RUN IT. RENDER IT.</span></footer>
  </main>;
}
