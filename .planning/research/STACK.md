# Stack Research

**Domain:** Immersive web audio player with Canvas visualizations
**Researched:** 2026-02-12
**Confidence:** HIGH

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Vanilla JavaScript | ES2024+ | Application logic and Canvas rendering | No framework overhead; Web Audio API and Canvas are native browser APIs that don't benefit from React/Vue abstraction. For this focused use case (single fullscreen player), vanilla JS provides optimal performance with zero build-time complexity. |
| TypeScript | 5.9.3 (stable) or 6.0 beta | Type safety and developer experience | Industry standard for JavaScript development in 2026. Provides compile-time error detection, better IDE support, and self-documenting code. Version 5.9.3 is latest stable; 6.0 beta available (last JS-based release before TypeScript 7 moves to native Go compiler). |
| Web Audio API | Native browser API | Audio playback, analysis, and effects | Native browser API (Baseline widely available since April 2021). Provides AnalyserNode for frequency/time domain data, precise timing controls, real-time effects, and superior performance vs HTML5 Audio element. Use AudioWorklet (not deprecated ScriptProcessorNode) for custom processing. |
| HTML5 Canvas 2D | Native browser API | Space scene rendering and visualizations | Native API optimized for 2D graphics. Simpler than WebGL for 2D layered scenes (planets, moons, starfield). Achieves 60fps with proper requestAnimationFrame usage and canvas optimization techniques. |
| Vite | 7.3.1+ | Dev server and production bundler | Next-generation build tool with ~20-30x faster TypeScript transpilation than tsc (uses esbuild). Ultra-fast HMR (<50ms), optimized production builds via Rollup. Note: Vite 8 (with Rolldown bundler) expected later in 2026 but 7.x is stable and production-ready. |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| NONE recommended | - | - | Vanilla approach recommended. Web Audio API + Canvas 2D APIs are sufficient. Adding abstraction layers (Howler.js, Tone.js, PixiJS) introduces unnecessary complexity for this focused use case. |

**Rationale for zero dependencies:**
- Web Audio API provides everything needed for audio playback and frequency analysis
- Canvas 2D API handles all rendering requirements (layered scenes, particle systems, alpha blending)
- requestAnimationFrame provides optimal animation loop
- File API handles drag-drop of local audio files
- Fullscreen API provides immersive mode
- No state management library needed (single-page, no complex UI state)
- No audio library needed (Web Audio API is comprehensive)
- No canvas library needed (2D API is straightforward, WebGL unnecessary for this project)

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| ESLint | Code quality and pattern enforcement | Use @typescript-eslint/eslint-plugin and @typescript-eslint/parser for TypeScript support. Include eslint-config-prettier to avoid conflicts. |
| Prettier | Code formatting | Configure via .prettierrc.json. Ensure Prettier runs last in ESLint extends array to override formatting rules. |
| TypeScript Compiler | Type checking and transpilation | Vite uses esbuild for fast transpilation; tsc used for type checking only (npm run type-check). |

## Installation

```bash
# Initialize project
npm create vite@latest cosmic-player -- --template vanilla-ts
cd cosmic-player

# Core dependencies (none beyond Vite's defaults)
# Vite template includes: vite, typescript

# Dev dependencies for code quality
npm install -D eslint @eslint/js @typescript-eslint/eslint-plugin @typescript-eslint/parser
npm install -D prettier eslint-config-prettier eslint-plugin-prettier

# Optional: Additional dev tooling
npm install -D @types/web # For Web API type definitions if needed
```

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| Vanilla JS + TypeScript | React + TypeScript | If building a complex music app with multiple views, playlists, user accounts, or state-heavy UI. For single fullscreen player, React adds unnecessary overhead (~40kb min+gzip) and complexity. |
| Native Web Audio API | Howler.js | If you need simplified audio API with automatic fallbacks and cross-browser audio sprite support. However, for 2026 browsers, Web Audio API has excellent support and provides granular control needed for visualization. |
| HTML5 Canvas 2D | PixiJS (WebGL) | If you need particle systems with 10,000+ particles, complex sprite animations, or GPU-accelerated effects. For layered space scene with subtle reactivity, Canvas 2D provides simpler API and adequate performance. PixiJS v8.16.0 has Canvas 2D fallback, but WebGL is its strength. |
| HTML5 Canvas 2D | WebGL / Three.js | If you need 3D graphics, complex shaders, or GPU-intensive effects. This project specifies "2D Canvas layered space scene" so WebGL is over-engineering. |
| Vite | Webpack | Never for new projects in 2026. Vite's dev server is dramatically faster (ES modules + esbuild). Only use Webpack if maintaining legacy codebase. |
| Vite | Parcel | Parcel is viable but Vite has better TypeScript support, larger ecosystem, and active development (Vite 8 coming 2026). |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| ScriptProcessorNode | Deprecated Web Audio API. Runs on main thread causing performance issues and audio glitches. | AudioWorklet for custom audio processing (runs in separate thread with <3ms latency budget). |
| jQuery | Outdated, unnecessary in 2026. Native DOM APIs (querySelector, addEventListener) are concise and performant. | Vanilla JavaScript DOM APIs |
| Howler.js / Tone.js | Abstraction layer over Web Audio API. Useful for complex audio apps, but adds 20-30kb and hides direct API access needed for custom visualizations. | Native Web Audio API with AnalyserNode |
| Create React App | Deprecated, slow build times, outdated tooling. React team recommends Next.js or Vite. | Vite (or don't use React at all for this project) |
| PixiJS for this project | Excellent library, but optimized for sprite-based games and WebGL. For 2D layered Canvas with subtle audio reactivity, it's over-engineering. | HTML5 Canvas 2D API directly |
| webpack-dev-server | Slow compared to Vite. HMR updates take seconds vs <50ms with Vite. | Vite dev server |

## Stack Patterns by Variant

**If you need offline support or PWA features:**
- Add Workbox for service worker management
- Vite has PWA plugin: vite-plugin-pwa
- Cache audio files and visualizer assets

**If you add more complex UI later (playlists, settings panel):**
- Consider lightweight state management (Zustand ~1kb, or even just custom events)
- Still avoid React unless UI complexity justifies the overhead

**If performance issues emerge (unlikely):**
- Use multiple Canvas layers (background starfield static, foreground planets animated)
- OffscreenCanvas for background rendering (if supported)
- WebAssembly for intensive DSP (audio analysis already optimized in native Web Audio API)

**If you want shader-like effects:**
- Use Canvas 2D filters (blur, brightness, contrast via ctx.filter)
- Or selectively upgrade specific visual elements to WebGL (keeping Canvas 2D for most)

## Version Compatibility

| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| TypeScript 5.9.3 | Vite 7.3.1+ | Vite uses esbuild for TS transpilation. No compatibility issues. |
| TypeScript 6.0 beta | Vite 7.3.1+ | Compatible but beta. Wait for stable release unless testing new features. |
| ESLint 9.x | @typescript-eslint/eslint-plugin 8.x+ | Use flat config format (eslint.config.js) for ESLint 9.x |
| Vite 7.x | Node.js 20.19+ or 22.12+ | Vite requires modern Node.js. Use nvm to manage versions. |

## Browser Targets

**Recommended browserslist config:**
```json
{
  "browserslist": [
    "defaults",
    "not IE 11",
    "maintained node versions"
  ]
}
```

**Web Audio API:** Baseline widely available since April 2021 (Chrome 88+, Firefox 87+, Safari 14.1+)
**Canvas 2D:** Universal support across all modern browsers
**Fullscreen API:** Universal support (with vendor prefixes handled by Vite)
**File API (drag-drop):** Universal support
**ES2024 features:** Transpiled by Vite's esbuild (targets es2020 by default)

## Performance Targets

| Metric | Target | How to Achieve |
|--------|--------|---------------|
| Animation frame rate | 60fps | Use requestAnimationFrame, limit canvas redraws, use window.devicePixelRatio for hi-DPI displays |
| Audio latency | <3ms | Use AudioWorklet if custom processing needed, AnalyserNode is already optimized |
| Bundle size | <100kb (gzipped) | Zero runtime dependencies, tree-shaken Vite build, code splitting if needed |
| First paint | <1s | Minimal HTML, inline critical CSS, defer non-critical scripts |
| Time to interactive | <2s | No heavy framework initialization, lazy-load audio analysis until playback starts |

## Architecture Notes

**Separation of concerns:**
- `audio.ts` — Web Audio API context, nodes, AnalyserNode, playback control
- `canvas.ts` — Canvas rendering, animation loop, requestAnimationFrame
- `visuals.ts` — Space scene rendering (planets, moons, stars, parallax)
- `analyzer.ts` — Audio analysis (frequency/time domain data) → visual parameters
- `controls.ts` — UI event handlers (play/pause, skip, volume, fullscreen)
- `files.ts` — File API drag-drop, playlist management, audio file loading

**Data flow:**
1. User drops audio files → File API → AudioContext.decodeAudioData
2. Audio plays → AnalyserNode extracts frequency data (Uint8Array)
3. Frequency data → visual parameters (brightness, scale, rotation speed)
4. requestAnimationFrame loop → render space scene with reactive parameters
5. User interactions → control methods → update audio/visual state

**No global state library needed:**
- Audio context is singleton (one per app)
- Canvas reference is module-scoped
- Playlist is simple array in module scope
- UI state is minimal (playing/paused, current track index, volume)
- Use CustomEvent for cross-module communication if needed

## Sources

**High Confidence (Official Documentation):**
- [Vite Guide](https://vite.dev/guide/) — Vite v7.3.1, features, Node.js requirements
- [MDN Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API) — Baseline widely available, best practices, AudioWorklet
- [MDN Web Audio API Best Practices](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Best_practices) — Performance, security, accessibility
- [MDN Visualizations with Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Visualizations_with_Web_Audio_API) — AnalyserNode usage, Canvas rendering
- [MDN requestAnimationFrame](https://developer.mozilla.org/en-US/docs/Web/API/Window/requestAnimationFrame) — Animation loop best practices
- [MDN Fullscreen API](https://developer.mozilla.org/en-US/docs/Web/API/Fullscreen_API) — Immersive mode implementation

**Medium Confidence (Industry Sources):**
- [PixiJS v8.16.0 Release](https://pixijs.com/blog/8.16.0) — Canvas 2D renderer (experimental)
- [TypeScript Releases](https://github.com/microsoft/typescript/releases) — Version 5.9.3 stable, 6.0 beta
- [Vite TypeScript Audio Worklet Example](https://github.com/kgullion/vite-typescript-audio-worklet-example) — Vite setup for Web Audio projects
- [SVG vs Canvas Animation 2026](https://www.augustinfotech.com/blogs/svg-vs-canvas-animation-what-modern-frontends-should-use-in-2026/) — Canvas for motion-heavy animations
- [Netlify vs Vercel 2026](https://www.clarifai.com/blog/vercel-vs-netlify) — Static site hosting options

**Low Confidence (Needs Validation):**
- Vite 8 with Rolldown expected 2026 — mentioned in search results but no official release date
- TypeScript 7 native Go compiler — in development but timeline unclear

---
*Stack research for: Cosmic Player (Immersive web audio player)*
*Researched: 2026-02-12*
