# CODECINEMA

A free, browser-based, code-driven video studio built with React, TypeScript and Canvas.

## How it works
Write JavaScript that draws a frame. CODECINEMA calls your script once for every frame and provides:
- `ctx`: Canvas 2D drawing context
- `t`: current video time in seconds
- `w` and `h`: output dimensions in pixels

Use normal Canvas 2D APIs, JavaScript math, loops, gradients, paths, transforms and text to create animations. The same script runs during preview and export.

## Features
- JavaScript code editor with live preview
- Time-based animation controlled by `t`
- 16:9, 9:16, 1:1 and 4:5 output sizes
- 5–60 second video duration
- 30 FPS WebM export (browser support required)
- Open and save JavaScript scripts locally
- No paid APIs, cloud rendering or accounts required

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
- WebM export support and performance depend on the browser and device. High-resolution rendering may be demanding on mobile devices.
- The studio currently exports WebM, not MP4.
