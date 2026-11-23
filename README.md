# CODECINEMA

A free, browser-based, code-driven video studio built with React, TypeScript and Canvas.

## How it works
Write JavaScript that draws a frame. CODECINEMA calls your script once for every frame and provides:
- `ctx`: Canvas 2D drawing context
- `t`: current video time in seconds
- `w` and `h`: output dimensions in pixels
- `api`: helper functions — `clamp`, `lerp`, `map`, `ease`, `easeOut`, and `roundedRect(ctx, x, y, width, height, radius)`

Use normal Canvas 2D APIs, JavaScript math, loops, gradients, paths, transforms and text to create animations. The same script runs during preview and export.

## Features
- JavaScript code editor with local autosave and Tab indentation
- Run script with Ctrl+Enter / Cmd+Enter
- Helpful escaped-code detection and runtime error messages
- Time-based animation controlled by `t`
- 16:9, 9:16, 1:1 and 4:5 output sizes
- 720p lightweight default, with optional 1080p output
- 5–60 second video duration
- Selectable 4, 6, 8 or 12 Mbps WebM recording bitrate
- Fullscreen preview
- Canvas drawing capped at 30 updates per second during playback/export
- WebM export targeting 30 FPS (actual frame pacing depends on browser/device)
- Export cancellation and recorder cleanup
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
- Export records the Canvas in real time using the browser's MediaRecorder API. Keep this tab open until rendering finishes.
- WebM export support and performance depend on the browser and device. 1080p and high bitrates may be demanding on mobile devices; start with 720p and 4–6 Mbps for a lighter export.
- The 30 FPS value is a target, not a guarantee. Actual frame pacing depends on browser/device performance.
- The studio currently exports WebM, not MP4. Audio export is not implemented.
