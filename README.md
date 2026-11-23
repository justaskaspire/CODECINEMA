# CODECINEMA

A free, browser-based, code-driven video studio built with React, TypeScript and Canvas.

## How it works
Write JavaScript that draws a frame. CODECINEMA calls your script once for every frame and provides:
- `ctx`: Canvas 2D drawing context
- `t`: current video time in seconds
- `w` and `h`: output dimensions in pixels
- `api`: helper functions — `clamp`, `lerp`, `map`, `ease`, `easeOut`, `smoothstep`, `pingPong`, `mod`, seeded `random`, value `noise`, `hsla`, `fitText`, `textReveal`, `typewriter`, `textMask`, and `roundedRect(ctx, x, y, width, height, radius)`, plus `scene(ctx, t, name, start, end, draw, options)` for timed scenes with fade, slide or zoom transitions, and `glow`, `vignette`, `particles`, `grain`, `colorWash`, `shake` and `camera` helpers

Use normal Canvas 2D APIs, JavaScript math, loops, gradients, paths, transforms and text to create animations. The same script runs during preview and export.

## Features
- Typography engine: staggered character/word reveals, fade/rise/tracking modes, timed typewriter text and directional gradient text masks
- Cinematic effects helpers: radial glow, vignette, deterministic particles, film grain and color wash
- Camera helpers: deterministic shake offsets and scoped camera transforms
- Built-in Cinematic Effects and Kinetic Typography demos to explore the rendering APIs
- Timed scene helper with local scene time, normalized progress and fade, slide or zoom transitions
- Scene callbacks are deterministic and render consistently in preview and export
- Named projects with portable `.cinema.json` save/load, including script and render settings
- Project name and script autosave locally in the browser
- Touch-first mobile workflow with editor/preview tabs, code insertion toolbar, undo/redo and quick action bar; optional keyboard shortcuts are also available
- Export filenames use the project name
- JavaScript code editor with local autosave and Tab indentation
- Run script with Ctrl+Enter / Cmd+Enter
- Helpful escaped-code detection and runtime error messages
- Time-based animation controlled by `t`
- Canvas typography helpers support custom fonts, alignment, reveal timing, tracking, gradients and optional glow
- 16:9, 9:16, 1:1 and 4:5 output sizes
- 720p lightweight default, with optional 1080p output
- 5–60 second video duration
- Selectable 24, 30 or 60 FPS target\n- Selectable 4, 6, 8 or 12 Mbps video bitrate
- Fullscreen preview
- Canvas drawing capped at the selected 24/30/60 FPS target during playback/export
- Deterministic frame-by-frame MP4 (H.264) and WebM export through WebCodecs
- Optional local audio-track import and AAC/Opus encoding
- Export progress and cancellation with encoder cleanup
- Export cancellation and encoder cleanup
- Open and save JavaScript scripts locally
- No paid APIs, cloud rendering, external font downloads or accounts required

## Run locally
```bash
npm install
npm run dev
```

## Build
```bash
npm run build
```

## Important notes
- Scripts run locally in the current browser tab with access to the page's JavaScript environment. Only run code you wrote or trust.
- Export re-renders each script frame at its exact timestamp through WebCodecs; keep this tab open until rendering finishes.
- MP4 / WebM export support and performance depend on the browser and device. 1080p and high bitrates may be demanding on mobile devices; start with 720p and 4–6 Mbps for a lighter export.
- Export frame timestamps follow the selected FPS. Preview playback may still drop frames on slower devices.
- MP4 and WebM export use browser-provided WebCodecs encoders through Mediabunny. Exact codec availability depends on the browser/device.
- Audio is optional and imported from a local file; supported audio formats depend on the browser's AudioContext decoder.
- Export is rendered locally and uses an in-memory output buffer. For large projects, lower bitrate, resolution or duration to avoid memory pressure on mobile devices.
- FFmpeg and WebGPU are not bundled in this mobile-first build. They remain optional future modules rather than loading large runtimes on every launch.
