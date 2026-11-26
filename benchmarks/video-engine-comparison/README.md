# CODECINEMA Video Engine Benchmark

Status: scaffold only — no engine has been benchmarked or integrated yet.

This benchmark lives on the `benchmark/video-engine-comparison` branch. It does not change `main`, the existing CODECINEMA app, or the GitHub Pages deployment.

## Goal

Compare the current CODECINEMA renderer with HyperFrames and Remotion using the same deterministic 10-second scene specification. Evaluate huashu-motion separately as an AI-agent filmmaking workflow: it is an orchestration/workflow project, not a directly equivalent frame renderer.

## Baseline facts from the current main branch

- CODECINEMA is a React 19 + TypeScript + Vite browser app.
- Current dependencies include Babylon.js, Three.js, GSAP and Mediabunny.
- The current app renders user scripts frame-by-frame in the browser and exports through browser codecs/Mediabunny.
- The documented production target is mobile-friendly, with 540p/720p profiles and optional 1080p.
- The benchmark must not alter the existing production app or its dependencies.

## Shared scene

See [scene-spec.json](./scene-spec.json). All renderer implementations must reproduce the same timing, composition, motion, typography, colors, and output settings. Use generated/procedural shapes only; no paid assets or APIs.

## Test matrix

| Candidate | Role | Test approach |
|---|---|---|
| CODECINEMA current renderer | Baseline | Run the scene through the existing script/frame/export path |
| HyperFrames | HTML/CSS/JS renderer | Implement the same scene in its supported timeline/render workflow |
| Remotion | React renderer | Implement the same scene as a React composition |
| huashu-motion | AI-agent filmmaking workflow | Ask the agent to produce the scene; measure setup, edits, reproducibility and dependency/API requirements separately |

Do not describe huashu-motion as a renderer benchmark result unless a distinct rendering backend is identified and measured.

## Measurements

For every render, record:

1. Rendered duration and actual frame count.
2. Output dimensions, frame rate and codec/container.
3. Wall-clock render time (same machine, cold/warm state recorded).
4. Peak memory and CPU usage where measurable.
5. File size and whether audio is present/synchronized.
6. Visual fidelity against the scene spec (timing, positions, colors, typography, transitions).
7. Reproducibility: render twice and compare frame count, timing and visual output.
8. Mobile feasibility: browser support, memory pressure and whether rendering is practical on a 4 GB Android phone.
9. Cost and external requirements: API keys, paid services, cloud compute, local binaries and license restrictions.

## Fairness rules

- Use the same machine, browser/runtime, resolution, FPS, duration and scene assets for comparable renderers.
- Start with 540p, 24 FPS, 10 seconds; run 720p only if all candidates complete safely.
- Separate setup time from render time.
- Do not compare different visual scenes or silently omit unsupported effects.
- Record failures and unsupported features; do not substitute estimates for measurements.
- Verify each candidate's current license and dependency requirements before any integration.
- No packages are added to the production app by this benchmark scaffold.

## Current result

No render measurements have been collected yet. This repository path currently contains the benchmark plan and shared scene specification only.
