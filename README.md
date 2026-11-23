# CODECINEMA

A browser-based motion design studio built with React, TypeScript, Canvas and the MediaRecorder API.

## Current MVP
- Editable text scenes and durations
- Live canvas preview
- 16:9, 9:16, 1:1 and 4:5 project format selector
- Timeline scene selection and playback
- Browser-based WebM recording export (real-time)
- GitHub Pages deployment workflow

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
This is an early MVP, not a full professional nonlinear editor yet. Export records the canvas in real time and depends on browser MediaRecorder support. The current preview renderer is 1920×1080; aspect-ratio-specific canvas resizing, audio, imported media, project saving, and performance testing on mobile are still to be implemented.

No paid APIs or services are used by the application. Google Fonts is an optional external font request; the UI falls back to system fonts.
