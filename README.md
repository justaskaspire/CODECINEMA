# CODECINEMA

A free, browser-based, code-driven video studio built with React, TypeScript, Canvas 2D and Three.js/WebGL.

## How it works
Write JavaScript that draws a frame. CODECINEMA calls your script once for every frame and provides:
- `ctx`: Canvas 2D drawing context
- `t`: current video time in seconds
- `w` and `h`: output dimensions in pixels
- `api.render3D(ctx, t, w, h, config)`: real Three.js/WebGL 3D rendering composited into the current 2D frame. Configure a perspective camera, lights, geometry, materials and object transforms. Keep object IDs stable and animate positions/rotations with `t`; quality can be `low`, `medium` or `high`.
- `api`: helper functions — `clamp`, `lerp`, `map`, `ease`, `easeOut`, `smoothstep`, `pingPong`, `mod`, seeded `random`, value `noise`, `hsla`, `fitText`, `textReveal`, `typewriter`, `textMask`, `spring`, `cubicBezier`, `stagger`, `counter`, `pathPoint`, `roundedRect`, `blend`, `clipCircle`, `blur`, `ripple`, `lensFlare` and `lightning`, plus `scene(ctx, t, name, start, end, draw, options)` for timed scenes with fade, slide or zoom transitions, and `glow`, `vignette`, `particles`, `grain`, `colorWash`, `shake` and `camera` helpers

Use normal Canvas 2D APIs, JavaScript math, loops, gradients, paths, transforms and text to create animations. The same script runs during preview and export.

## Features
- Integrated dual renderer: existing Canvas 2D scripts plus real Three.js/WebGL 3D scenes in the same frame and export pipeline
- 3D primitives: boxes, spheres, toruses, cones, cylinders, planes and torus knots; per-object transforms, metallic/rough materials, emissive color and opacity
- 3D perspective camera and ambient, directional and point lights; mobile-friendly low/medium/high render scales
- Built-in 3D Solar System example demonstrating orbiting planets, rings, a moving camera, lighting and 2D title compositing
- Motion graphics engine: damped spring physics, custom cubic-Bezier easing, staggered sequences, animated number counters and smooth Catmull–Rom path following with tangent angles
- Compositing and lighting engine: scoped blend modes, circular clipping masks, blur callbacks, animated ripple rings, deterministic lightning bolts and cinematic lens flares
- Typography engine: staggered character/word reveals, fade/rise/tracking modes, timed typewriter text and directional gradient text masks
- Cinematic effects helpers: radial glow, vignette, deterministic particles, film grain and color wash
- Camera helpers: deterministic shake offsets and scoped camera transforms
- Built-in Motion Graphics Lab, Cinematic Effects and Kinetic Typography demos to explore the rendering APIs
- Timed scene helper with local scene time, normalized progress and fade, slide or zoom transitions
- Scene callbacks are deterministic and render consistently in preview and export
- Named projects with portable `.cinema.json` save/load, including script and render settings
- Project name and script autosave locally in the browser
- Touch-first mobile workflow with editor/preview tabs, code insertion toolbar, undo/redo and quick action bar; optional keyboard shortcuts are also available
- Export filenames use the project name
- JavaScript code editor with local autosave and Tab indentation
- Run scripts with the on-screen RUN controls; optional keyboard shortcuts are also available
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
- Three.js is bundled for real WebGL 3D rendering. WebGL support and performance depend on the browser and device. The 3D renderer uses reduced internal resolution in medium/low quality modes and disables expensive antialiasing/shadows by default. FFmpeg and WebGPU are not bundled in this mobile-first build. They remain optional future modules rather than loading large runtimes on every launch.

## 3D Pro engine (v0.21)
The 3D renderer also supports:
- GLB/ glTF model loading with `{ id, type: "model", url, position, rotation, scale }`. Use a CORS-enabled URL; local file picking is not part of this API yet.
- Directional-light shadow maps with `shadows: true`, `castShadow: true` on a directional light, and `castShadow` / `receiveShadow` on objects. Low quality disables shadow maps to protect mobile performance.
- Deterministic animated 3D point fields through `particles: [{ id, count, color, size, opacity, spread, speed, seed, position }]`.
- Equirectangular environment images through `environment: "https://…"` for scene backgrounds and PBR reflections. The host must allow cross-origin access.
- Depth of field through `depthOfField: { focus, aperture, maxBlur }`.
- Script-driven camera and object keyframes: interpolate values using `api.track`, `api.lerp` or `api.cubicBezier`. Camera position, look-at and FOV can be changed on every frame.

See [examples/3d-pro-studio.js](examples/3d-pro-studio.js) for a complete test scene. Replace optional model and environment URLs with your own CORS-enabled assets. On mobile, begin at 720p, medium quality and a few hundred particles; shadows, imported models and depth of field increase GPU and memory use.


## 3D Animation Director (v0.22)
The animation API adds reusable, deterministic timeline helpers:
- `api.track(t, keyframes, easing)` samples a numeric or vector track at the current video time. Each keyframe is `{ time, value, ease? }`; easing modes are `linear`, `smooth`, `in`, `out` and `hold`. The final keyframe value is held after its timestamp.
- Vector values such as `[x, y, z]` interpolate component by component, so the same helper can animate object positions, rotations, scales and camera positions.
- `api.orbit3D(t, radius, speed, phase, y)` returns a deterministic `[x, y, z]` position for orbiting objects.
- Keyframe sampling is stateless and uses the exact render timestamp, so preview scrubbing and frame-by-frame export use the same values.

See [examples/3d-animation-director.js](examples/3d-animation-director.js) for a full 3D cinematic test. This is a script-driven animation system, not a visual keyframe timeline editor. On a 4 GB mobile device, start with 720p, 24/30 FPS and medium quality; reduce particles or disable shadows if playback becomes slow.


## Visual timeline (v0.23)
- Touch-friendly three-lane cue timeline for scene, visual and audio planning.
- Add cues at the playhead, tap ruler positions or cues to scrub, and remove cues.
- Timeline cues autosave locally and are included in portable `.cinema.json` project files.
- Cues are editorial planning markers; they do not yet drive animation properties or replace the script-based keyframe API.


## Visual 3D Keyframe Director (v0.24)
- Add visual keyframes for a 3D object's `position`, `rotation` or `scale` at the current playhead time.
- Enter the exact object `id` used in your `api.render3D` object list, then set X/Y/Z values and add a keyframe.
- Multiple keyframes on the same object/property are interpolated with smooth easing; preview scrubbing and frame-by-frame export use the same timestamp-based values.
- Keyframe tracks autosave locally and are included in portable `.cinema.json` projects.
- Rotation values are radians. A visual track overrides that object's matching transform property.
- This editor animates transforms of existing script-defined 3D objects; it does not create 3D objects or replace the code editor.


## Visual Object Layer Studio (v0.25)
- Create 2D text, rectangle and circle overlay layers, plus 3D box, sphere, cone and torus layers.
- Select layers to edit their color, position and size/scale; hide/show or delete individual layers.
- 2D overlay coordinates use normalized canvas positions (0–1) and render above the script output.
- 3D layers use Three.js world coordinates and are added to scenes when the script calls `api.render3D`.
- Layer definitions autosave locally and are included in portable `.cinema.json` project files.
- 3D layers can be animated with the v0.24 keyframe director by using the generated layer ID as the object ID.
- The layer editor manages objects created inside the studio; it does not yet extract arbitrary objects drawn directly by user code into editable layers.


## Visual Scene Composer (v0.26)
- Global 3D camera controls for camera position, look-at target and field of view. These controls override camera values supplied by scripts whenever `api.render3D` is called.
- Reorder layers with up/down controls; 2D overlays draw in list order, with later rows composited above earlier rows.
- Duplicate existing 2D or 3D layers while preserving their editable properties and creating a unique object ID.
- Send a selected 3D layer directly to the keyframe director with its current position prefilled.
- Camera settings and layer hierarchy autosave locally and are included in portable `.cinema.json` project files.


## Visual Keyframe Director (v0.27)
- Animate 2D scene-layer position, size and rotation as well as 3D object position, rotation and scale.
- Load any selected scene layer directly into the keyframe editor with its current position prefilled.
- 2D position keyframes use normalized canvas coordinates (0–1); 2D scale keyframes use relative width and height; 2D rotation uses the Z value in radians.
- The same timestamp-based keyframe tracks drive preview and frame-by-frame export, and remain included in local autosave and portable `.cinema.json` projects.
- Existing script-defined 3D object IDs continue to work with the visual keyframe editor.


## Scene Transform & Material Lab (v0.28)
- Edit 3D layer position, rotation (radians), scale, opacity, metalness, roughness and emissive color/intensity from the visual layer inspector.
- Edit 2D layer rotation and opacity alongside position and size.
- Existing projects remain compatible: missing new layer properties are filled with safe defaults when loaded from local storage or imported from older `.cinema.json` files.
- 3D material controls are applied through the existing Three.js renderer; no new runtime, paid API or external dependency is added.


## Motion Preset Director (v0.29)
- Apply one-tap Rise, Slide, Pop and Spin motion presets to any selected 2D or 3D scene layer.
- Presets create real editable position, scale or rotation keyframes on the existing visual timeline tracks; they are not baked effects.
- Presets use the current playhead as their start point and a short 0.8-second animation, while preserving keyframes outside the preset range.
- Preset-generated animation uses the same deterministic keyframe evaluation in preview and export.


## Typography Studio (v0.30)
- Text layers support selectable system font families, weight and alignment.
- Add adjustable text outlines and configurable shadow color/blur.
- Typography settings are part of the normal scene-layer project data and render in preview and frame-by-frame export.
- Fonts use local system/browser fonts; no external font download or paid font service is required.


## Audio Mixer (v0.31)
- Trim the beginning and optional end of an imported local audio file.
- Adjust music volume (0–150%) and add linear fade-in/fade-out envelopes.
- Audio edits are applied to the decoded audio buffer during local export; source files are not uploaded.
- Audio is limited to the video duration and the existing mobile-safe export memory budget.


## Mobile Render Profiles (v0.32)
- Add a lightweight 540p render profile for quicker previews/exports and lower memory pressure on phones.
- Keep 720p balanced and 1080p high-detail options.
- All four aspect ratios (16:9, 9:16, 1:1 and 4:5) receive matching output dimensions.
- Existing export bitrate, FPS, frame-count and 80 MB memory safety checks remain in place.


## Composition Template Library (v0.33)
- Add ready-made Title Card, Lower Third and End Card compositions with one tap.
- Templates create normal editable 2D scene layers, not flattened images.
- Edit text, fonts, colors, opacity, position, size, layer order and motion using the existing visual tools.
- Templates append to the current project and do not replace existing layers or script code.


## Keyframe Easing Editor (v0.34)
- Change interpolation independently for every visual keyframe: Linear, Smooth, Ease In, Ease Out or Hold.
- Remove individual keyframes without deleting the entire animation track.
- Easing choices are saved with the existing project keyframe data and are applied consistently in preview and export.


## Frame Capture & Mobile Polish (v0.35)
- Save the exact current preview frame as a full-resolution PNG.
- The filename includes the project name and playhead time.
- Frame capture uses the local preview canvas and does not require cloud rendering or external services.


## 2D Shape Studio (v0.36)
- Add rounded rectangles, triangles and line layers alongside text, rectangles and circles.
- New shapes support existing position, scale, rotation, opacity, color, ordering, duplication and motion keyframes.
- Rounded corners and line caps are drawn procedurally on Canvas 2D for crisp output at each export resolution.
- Older projects remain compatible; the additional layer types are only present when added by the user.


## Direct Keyframe Value Editor (v0.37)
- Edit each keyframe's exact timeline timestamp and X/Y/Z values directly.
- Keep independent per-keyframe easing controls and individual keyframe deletion.
- Time edits are clamped to the project duration and keyframes remain sorted chronologically.
- Values and easing are saved in project data and drive both preview and export.


## Project Portability (v0.38)
- Portable `.cinema.json` projects now include audio trim, volume and fade settings alongside visual and export settings.
- Import restores those mixer settings and recognizes the 540p render profile.
- Audio media itself remains a local file and is not embedded in the project; reselect the audio file after opening the project.
- The existing schema version remains compatible with earlier project files; missing audio settings use the current studio defaults.


## 3D Lighting Director (v0.39)
- Add Ambient, Directional and Point lights without writing code.
- Edit each light's name, color, intensity and position (where applicable); toggle visibility or delete it.
- Scene lights merge with script-defined lights by ID, so the visual editor and code can work together.
- Lights autosave locally and are included in portable `.cinema.json` projects.


## 3D Geometry Library (v0.40)
- Add Cylinder, Plane and Torus Knot objects to the visual scene-layer creator.
- New geometry uses the existing Three.js renderer and supports transforms, materials, lights, visibility, layer ordering and keyframes.
- No new package or external 3D asset is required.


## Geometry Parameter Lab (v0.41)
- Adjust primitive-specific dimensions directly: radius, height, tube thickness, plane width and segment detail.
- Available controls adapt to the selected 3D geometry type.
- Geometry parameters are stored with scene layers and used by the existing Three.js renderer in preview and export.
- Segment detail is bounded to 6–64 to keep mobile rendering practical.


## Material Preset Director (v0.42)
- Apply Metal, Glass, Matte and Glow material presets to any 3D scene layer.
- Presets adjust metalness, roughness, opacity and emissive properties.
- Presets remain fully editable through the existing material controls and are saved with the project.


## 3D Particle Director (v0.43)
- Create editable procedural 3D particle fields with count, color, size, opacity, speed, spread and position controls.
- Add, hide/show or remove particle systems from the scene.
- Particle fields merge with script-defined particle specs by ID.
- Systems autosave locally and are included in portable projects.
- Visual editor caps each system at 1,200 particles to keep phone workloads controlled; the lower-level script API retains its own renderer limits.


## Particle Preset Library (v0.44)
- One-tap Stars, Dust and Snow particle configurations.
- Presets update the selected particle system's real editable parameters.
- Every preset can be further customized and exported through the existing Three.js renderer.


## Export Profile Director (v0.45)
- One-tap Mobile Fast (vertical 540p/24 FPS/4 Mbps), Cinematic (16:9 1080p/24 FPS/8 Mbps) and Vertical Social (9:16 720p/30 FPS/6 Mbps) profiles.
- Profiles configure existing output settings; users can still fine-tune every setting before export.
- Profiles use the existing local WebCodecs export pipeline and do not upload media.


## Timeline Cue Editor (v0.46)
- Rename scene, visual and audio timeline cues.
- Edit exact cue times and move cues between tracks.
- Time edits are clamped to the project duration; the cue list and timeline markers remain sorted.
- Cue edits are autosaved and included in project files.


## 2D Gradient Studio (v0.47)
- Switch text and 2D shape layers between solid fills and editable linear gradients.
- Set gradient end color and angle; the original layer color is the gradient start.
- Gradients render directly on Canvas 2D and remain consistent in preview, PNG frame capture and video export.
- Gradient settings are stored with scene layers and portable projects.
