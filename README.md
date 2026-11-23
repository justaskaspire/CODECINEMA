# CODECINEMA

A browser-based motion design studio built with React, TypeScript, Canvas and the MediaRecorder API.

## Current features
- Multiple editable scenes with durations and entrance transitions
- Live Canvas preview and timeline playback
- 16:9, 9:16, 1:1 and 4:5 project formats
- Multiple independent text layers per scene
- Per-layer position, size, color, entrance animation and start delay
- Image and video backgrounds
- Audio track with volume control and audio-enabled WebM export where supported
- Save and reopen projects as JSON, including embedded media
- Browser-based 30 FPS WebM export

## Run locally
```bash
npm install
npm run dev
```

## Build
```bash
npm run build
```

## Notes
CODECINEMA renders locally in the browser and uses no paid APIs or services. WebM export records the Canvas in real time and depends on browser MediaRecorder support. Audio export depends on browser Web Audio support. Project JSON files can become large when media is embedded.

The editor is designed as a lightweight, free motion-design studio rather than a full professional nonlinear video editor.
