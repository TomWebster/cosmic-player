# Project Research Summary

**Project:** Cosmic Player (Immersive Web Audio Player)
**Domain:** Web-based audio player with real-time Canvas visualization
**Researched:** 2026-02-12
**Confidence:** HIGH

## Executive Summary

The Cosmic Player is an immersive web audio player featuring a 2D Canvas space scene that reacts subtly to music. Research reveals this is best built as a vanilla JavaScript/TypeScript application using native Web Audio API and Canvas 2D, with zero runtime dependencies beyond a Vite build setup. The "immersive fullscreen music visualizer" category is well-established with proven patterns documented in official MDN resources and performance guides.

The recommended approach leverages three core browser APIs: Web Audio API for playback and frequency analysis via AnalyserNode, HTML5 Canvas 2D for multi-layer parallax rendering, and the Fullscreen API for immersive presentation. A Proxy-based reactive state manager will coordinate audio, visual, and UI systems without framework overhead. The vanilla approach is justified because Web Audio and Canvas are native browser APIs that don't benefit from React/Vue abstraction—for this focused single-screen player, vanilla JS provides optimal performance with zero build complexity.

Key risks center around browser API constraints and performance bottlenecks: autoplay policies require user gesture initialization (solved via splash screen), garbage collection in animation loops causes audio glitches (solved via pre-allocated typed arrays), and canvas rendering performance requires multi-layer architecture with integer coordinates. All critical pitfalls have established prevention patterns from MDN and performance guides, giving high confidence in implementation approach.

## Key Findings

### Recommended Stack

The research strongly recommends a zero-dependency vanilla approach with modern tooling. Vanilla JavaScript with TypeScript provides optimal performance for this use case because Web Audio API and Canvas 2D are native browser APIs that perform best without abstraction layers. Adding frameworks like React (40kb overhead) or audio libraries like Howler.js (hides direct AnalyserNode access needed for visualizations) introduces unnecessary complexity for a single-screen focused player.

**Core technologies:**
- **TypeScript 5.9.3+ with Vite 7.3.1+**: Type safety and ultra-fast dev server (20-30x faster than tsc alone) with optimized production builds
- **Web Audio API (native)**: Industry standard for audio playback with AnalyserNode for real-time frequency analysis; baseline widely available since April 2021
- **HTML5 Canvas 2D (native)**: Sufficient for 2D layered space scenes with 60fps performance using proper optimization techniques
- **Zero runtime dependencies**: File API for drag-drop, Fullscreen API for immersive mode, no state management library needed (custom Proxy-based solution)

**Development tools:**
- ESLint + Prettier for code quality
- TypeScript compiler for type checking (Vite handles transpilation via esbuild)

**Critical version note:** Vite requires Node.js 20.19+ or 22.12+. Use nvm to manage versions.

### Expected Features

Research identified clear divisions between table stakes, competitive differentiators, and features to defer.

**Must have (table stakes):**
- Play/Pause/Next/Previous controls with keyboard shortcuts (spacebar, arrows)
- Volume control with slider and mute toggle
- Track metadata display (title, artist, album art)
- Progress indicator (visual only, non-scrubbing in v1)
- Continuous playback with auto-advance
- Fullscreen mode (core to "immersive" positioning)
- Loading states and basic error handling
- Local file playlist support (mp3/m4a via File API)

**Should have (competitive differentiators):**
- Audio-reactive 2D Canvas cosmic scene (planet, moons, stars with subtle frequency-based reactions)
- Parallax drift effects across multiple canvas layers
- Click-to-enter splash screen (solves autoplay policy + sets tone)
- Immersive fullscreen-first design with minimal UI chrome
- Performance-optimized rendering (60fps target)
- Subtle reactive design tuned for electronic/atmospheric music
- Auto-hide UI controls after inactivity

**Defer (v2+):**
- Scrubbing/seeking (contradicts "immersive listening" positioning)
- Multiple visual scenes (focus on perfecting one scene first)
- WebGL upgrade (Canvas 2D sufficient for launch)
- Social sharing/cloud sync (local-only is the feature)
- Equalizer/DSP effects (respect artist's mix)
- Session persistence (edge case for v1)

**Feature prioritization insight:** Competitive analysis shows Kaleidosync (Spotify visualizer) and Synesthesia (VJ software) are either too complex or too professional. The Cosmic Player targets the "beautiful simplicity" gap—load your music, enter fullscreen, get lost in the cosmos.

### Architecture Approach

The architecture follows a modular, separation-of-concerns pattern with three primary layers: UI/Control, Audio Processing, and Visualization. A Proxy-based reactive state manager serves as the central nervous system, broadcasting state changes to all layers without manual event dispatching.

**Major components:**
1. **State Manager** (Proxy-based reactive) — Single source of truth for playback state, volume, current track; automatically notifies subscribers on mutation
2. **Audio Engine** — AudioContext singleton with Web Audio graph (source → AnalyserNode → GainNode → destination); handles playback, analysis, and volume control
3. **Multi-layer Canvas System** — Three stacked canvases (background starfield, midground planet/sun, foreground moons) with independent parallax speeds; only redraws layers that change
4. **Animation Loop** (requestAnimationFrame) — Coordinates 60fps updates across all canvas layers with timestamp-based smooth motion
5. **Playlist Manager** — Array-based track list with JSON loading; exposes next(), previous(), loadTrack() methods
6. **UI Controls** — Event handlers for play/pause/skip/volume/fullscreen; writes to state, subscribes for updates

**Key architectural patterns:**
- **User Gesture Initialization**: AudioContext created/resumed on splash screen click to comply with autoplay policies
- **Multi-Layer Canvas with Parallax**: Stacked canvases with CSS positioning, different update frequencies per layer for performance
- **Audio Analysis Pipeline**: AnalyserNode extracts frequency data each frame → maps to visual parameters → modulates canvas rendering
- **Reactive State Propagation**: State mutations trigger Proxy traps → subscriber callbacks → audio/UI/visual updates automatically

**Data flow:** User drops audio files → File API → AudioContext.decodeAudioData → Audio plays → AnalyserNode extracts frequency data (Uint8Array) → Animation loop reads data → Maps to visual parameters (brightness, scale, rotation) → Canvas layers redraw with reactive parameters

### Critical Pitfalls

Research identified 10 major pitfalls with clear prevention strategies. Top 5 by severity and likelihood:

1. **Autoplay Policy Violation** — Creating AudioContext outside user gesture results in suspended state; audio won't play. **Prevention:** Always create/resume AudioContext inside splash screen click handler; verify state is "running" before playback.

2. **Garbage Collection Causing Audio Glitches** — Creating new typed arrays in animation loop (60fps) triggers frequent GC, blocking audio thread and causing clicks/pops. **Prevention:** Pre-allocate all Uint8Arrays once outside loop; reuse by passing to getByteFrequencyData() which overwrites contents.

3. **Audio-Visual Desynchronization** — Using requestAnimationFrame timestamps to schedule audio causes drift (two independent clocks). **Prevention:** Always use AudioContext.currentTime as timing source of truth; rAF only triggers visual updates, not audio scheduling.

4. **Memory Leaks from Undisconnected AudioNodes** — Creating new source nodes for each track without calling .disconnect() causes unbounded memory growth; mobile browsers eventually crash. **Prevention:** Track active nodes, call .disconnect() on previous source before creating new one, clean up in onended handler.

5. **Sub-Pixel Canvas Rendering Overhead** — Using floating-point coordinates forces browser to anti-alias, preventing 60fps. **Prevention:** Always use Math.floor() or Math.round() on coordinates before passing to Canvas drawing methods.

**Additional critical pitfalls:**
- **Single Canvas Architecture**: Redrawing static background 60fps wastes GPU/CPU; use multi-layer stacked canvases
- **AnalyserNode FFT Misconfiguration**: fftSize too high (>2048) causes lag; too low (<256) lacks detail; use 1024 for balance
- **iOS Safari Interrupted State**: Non-standard "interrupted" state on tab switch; requires visibilitychange listener and manual resume
- **No Audio Format Fallback**: M4A fails in Firefox (no AAC support in Web Audio API); add try/catch around decodeAudioData with user error message
- **Parallax Coordinate Overflow**: Continuous scrolling without modulo wrapping causes coordinates to overflow after minutes; use (x + speed) % width pattern

## Implications for Roadmap

Based on research, the roadmap should follow a layered build order where each phase produces a working, testable artifact. Audio and visuals must work independently before integration.

### Phase 1: Foundation & Audio Engine
**Rationale:** State management is the spine—all systems depend on it. Audio playback is the core feature—prove this works before adding visuals. This phase addresses the most critical pitfall (autoplay policy) and establishes the user gesture pattern via splash screen.

**Delivers:**
- Working audio playback with local file loading
- User gesture-based AudioContext initialization (splash screen)
- Playlist management (load, next, previous)
- Basic playback controls (play/pause/skip/volume)
- Error handling for decode failures

**Implements:**
- Proxy-based reactive state manager
- AudioContext singleton with Web Audio graph (source → analyser → gain → destination)
- Playlist manager with JSON loading
- Splash screen with click-to-start pattern

**Avoids:**
- Pitfall #1: Autoplay policy violation (AudioContext created on user click)
- Pitfall #9: No audio format fallback (try/catch on decodeAudioData)

**Research flag:** Standard patterns well-documented in MDN—skip detailed phase research.

---

### Phase 2: Canvas Foundation & Static Scene
**Rationale:** Render static scene first to validate multi-layer architecture, ensure visual quality, and handle coordinate systems before adding animation complexity. This phase establishes the canvas patterns that prevent later pitfalls.

**Delivers:**
- Multi-layer canvas setup (3 layers: background, midground, foreground)
- Static rendering of cosmic scene (starfield, planet/sun, moons)
- Fullscreen API integration
- Canvas resize handling (window resize, fullscreen transitions)

**Implements:**
- Stacked canvases with CSS positioning and z-index
- Background layer: starfield
- Midground layer: planet and sun
- Foreground layer: moons
- Fullscreen toggle and event handling

**Avoids:**
- Pitfall #7: Single canvas architecture (establishes multi-layer from start)
- Pitfall #6: Sub-pixel rendering (integer coordinates enforced)

**Research flag:** Canvas optimization patterns are well-established in MDN—skip detailed phase research.

---

### Phase 3: Animation Loop & Parallax
**Rationale:** Prove 60fps performance with parallax before introducing audio data processing. Easier to debug animation issues without audio analysis complexity. This phase validates the performance foundation.

**Delivers:**
- requestAnimationFrame coordinator running at 60fps
- Parallax movement with different speeds per layer
- Timestamp-based smooth animation
- Performance monitoring (frame rate detection)

**Implements:**
- Animation loop using requestAnimationFrame
- Parallax speed multipliers per layer (0.2x, 0.5x, 1.0x)
- Coordinate wrapping via modulo for infinite scroll
- Frame timing and performance tracking

**Avoids:**
- Pitfall #8: Parallax coordinate overflow (modulo wrapping implemented)
- Pitfall #3: Using setInterval (anti-pattern avoided via rAF)

**Research flag:** Standard rAF patterns—skip detailed phase research.

---

### Phase 4: Audio Visualization Integration
**Rationale:** Final integration layer—both audio and animation must work independently before coupling. This is where the product differentiator comes together. Audio-reactive visuals are complex; breaking this into its own phase allows focus.

**Delivers:**
- Real-time frequency data extraction in animation loop
- Audio-reactive modulation (star twinkle, planet glow, moon orbit)
- Subtle effects tuned for atmospheric music
- Smooth interpolation to prevent jittery visuals

**Implements:**
- AnalyserNode data extraction (getByteFrequencyData)
- Pre-allocated Uint8Array for frequency data (reused every frame)
- Frequency-to-visual parameter mapping utilities
- Smoothing/interpolation functions

**Avoids:**
- Pitfall #2: Garbage collection glitches (pre-allocated arrays)
- Pitfall #3: Audio-visual desync (AudioContext.currentTime as source of truth)
- Pitfall #4: AnalyserNode FFT misconfiguration (1024 fftSize for balance)

**Research flag:** NEEDS DEEPER RESEARCH—audio-reactive mapping strategies are artistic/experimental. Consider `/gsd:research-phase` to explore frequency band mapping, smoothing algorithms, and visual effect tuning specific to electronic/atmospheric music.

---

### Phase 5: UI Polish & Mobile Optimization
**Rationale:** Polish after functionality is proven. Easier to design UI around working features than build features around designed UI. This phase addresses cross-browser compatibility and mobile-specific concerns.

**Delivers:**
- Custom-styled controls (replace browser defaults)
- Track info display with album art
- Keyboard shortcuts (spacebar, arrows, Esc)
- Mobile touch support and gesture handling
- Auto-hide UI after inactivity
- Loading states and enhanced error messages

**Implements:**
- Splash screen design
- Control panel with fade in/out
- Keyboard event handlers
- Touch event handlers for mobile
- CSS transitions for UI chrome
- Error state UI components

**Avoids:**
- Pitfall #10: iOS Safari interrupted state (visibilitychange listener, resume handling)
- UX pitfalls: loading indicators, error feedback, fullscreen exit communication

**Research flag:** Standard UI patterns—skip detailed phase research. However, iOS testing on actual devices is critical.

---

### Phase Ordering Rationale

**Why this order:**
1. **Foundation first**: State manager must exist before audio/visuals can coordinate
2. **Audio independence**: Prove audio works standalone with browser's default UI before building custom visuals
3. **Canvas independence**: Render and animate scene without audio reactivity to isolate performance issues
4. **Late integration**: Only combine audio + visuals after both systems work perfectly in isolation
5. **Polish last**: UI design follows function; easier to style working features

**Dependency graph:**
```
Phase 1 (Foundation + Audio)
    ├──→ Phase 2 (Canvas Static) ──→ Phase 3 (Animation)
    └──────────────────────┬─────────────────────┘
                           ↓
                    Phase 4 (Audio + Visuals)
                           ↓
                    Phase 5 (UI Polish)
```

**How this avoids pitfalls:**
- Autoplay (P1), format errors (P1), memory leaks (P1) addressed before complexity grows
- Canvas architecture (P2) established before animation logic (P3) prevents costly refactoring
- GC issues (P4) prevented by pattern established early; audio-visual sync (P4) isolated to single phase
- iOS quirks (P5) handled after core functionality proven

### Research Flags

**Phases needing deeper research during planning:**
- **Phase 4 (Audio Visualization)**: Audio-reactive mapping strategies are domain-specific and artistic. Standard Web Audio API AnalyserNode usage is documented, but optimal frequency band selection, smoothing algorithms, and visual effect tuning for electronic/atmospheric music may benefit from `/gsd:research-phase` to explore:
  - Which frequency bands (bass, mids, treble) map to which visual elements
  - Smoothing time constants and interpolation strategies
  - Genre-specific reactivity curves
  - Reference implementations from successful music visualizers

**Phases with standard patterns (skip research-phase):**
- **Phase 1**: Web Audio API patterns extensively documented in MDN; autoplay policy solutions standardized
- **Phase 2**: Canvas multi-layer architecture is established pattern with IBM/MDN tutorials
- **Phase 3**: requestAnimationFrame and parallax techniques have canonical implementations
- **Phase 5**: UI/UX patterns are standard; iOS testing is validation not research

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | **HIGH** | Vanilla JS + Web Audio + Canvas 2D approach verified by official MDN docs, Vite guide, and performance resources. Zero-dependency recommendation supported by domain analysis (no framework needed for single-screen player). |
| Features | **MEDIUM-HIGH** | Table stakes features clearly identified from player conventions and user expectations. Differentiators validated against competitors (Kaleidosync, Synesthesia). Anti-features based on product positioning reasoning. Medium confidence on exact MVP scope—may need user validation. |
| Architecture | **HIGH** | Multi-layer canvas, Web Audio API patterns, and reactive state management all have official documentation and established implementations. Build order follows standard dependency resolution. Architectural patterns from MDN, IBM tutorials, and Paul Adenot's performance guide. |
| Pitfalls | **HIGH** | All 10 pitfalls verified with official sources (MDN, Chrome docs) or authoritative community sources (Paul Adenot's Web Audio perf guide, GitHub issue trackers). Prevention strategies tested in production environments. Phase mapping logical. |

**Overall confidence:** **HIGH**

The combination of official browser API documentation (MDN, Chrome), established performance patterns, and domain-specific resources gives high confidence in the recommended approach. The vanilla JS + Web Audio + Canvas stack is not experimental—it's the standard approach for this category of application.

### Gaps to Address

While overall confidence is high, a few areas need attention during implementation:

- **Audio-reactive visual tuning**: While AnalyserNode usage is well-documented, the artistic mapping of frequency data to visual parameters (which bands affect which elements, smoothing strategies, intensity curves) is subjective and may require iteration. Consider `/gsd:research-phase` in Phase 4 to explore reference implementations and tuning strategies.

- **iOS Safari quirks**: The "interrupted" state behavior is documented in GitHub issues but lacks official MDN coverage. Testing on actual iOS devices (iPhone/iPad) is mandatory in Phase 5 to validate recovery strategies work as expected.

- **Mobile performance validation**: Research focused on desktop capabilities. Canvas performance on low-end Android devices may require optimization beyond the documented patterns (reducing fftSize, simplifying visuals dynamically). Performance testing on actual mobile devices needed in Phase 5.

- **M4A transcoding strategy**: Firefox's lack of M4A support is documented, but optimal user experience (error message vs. client-side transcoding via FFmpeg.wasm vs. server-side conversion) needs product decision. Phase 1 addresses with error message; transcoding can be deferred to post-launch.

- **Artistic asset creation**: Research covers technical implementation but doesn't address creation of cosmic scene artwork (planet, moons, stars). This is an execution detail, not a research gap, but requires design resources or asset generation in Phases 2-3.

## Sources

### Primary (HIGH confidence)
- [MDN Web Audio API Documentation](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API) — API reference, best practices, autoplay guide
- [MDN Canvas API Documentation](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API) — Optimization techniques, layering patterns
- [MDN Visualizations with Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Visualizations_with_Web_Audio_API) — AnalyserNode usage, frequency data extraction
- [Vite Official Guide v7.3.1](https://vite.dev/guide/) — Build tool setup, TypeScript integration, Node.js requirements
- [Chrome Autoplay Policy](https://developer.chrome.com/blog/autoplay) — Browser policy details
- [MDN Autoplay Guide for Media and Web Audio](https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Autoplay) — User gesture requirements

### Secondary (MEDIUM confidence)
- [Web Audio Performance and Debugging Notes - Paul Adenot](https://padenot.github.io/web-audio-perf/) — Performance insights from Firefox Web Audio lead
- [A Tale of Two Clocks - web.dev](https://web.dev/articles/audio-scheduling) — Audio-visual synchronization patterns
- [Optimize HTML5 Canvas with Layering - IBM](https://developer.ibm.com/tutorials/wa-canvashtml5layering/) — Multi-canvas architecture
- [Modern State Management in Vanilla JS 2026 - Medium](https://medium.com/@orami98/modern-state-management-in-vanilla-javascript-2026-patterns-and-beyond-ce00425f7ac5) — Proxy-based patterns
- [Profiling Web Audio Apps in Chrome](https://web.dev/profiling-web-audio-apps-in-chrome/) — Performance debugging
- [Synchronize Animation to Audio - Hans Garon](https://hansgaron.com/articles/web_audio/animation_sync_with_audio/part_one/) — Timing coordination
- [Unlock Web Audio in Safari iOS - Matt Montag](https://www.mattmontag.com/web/unlock-web-audio-in-safari-for-ios-and-macos) — iOS-specific workarounds

### Tertiary (LOW-MEDIUM confidence)
- [WebAudio/web-audio-api GitHub Issues](https://github.com/WebAudio/web-audio-api/issues) — Community-reported edge cases, iOS bugs
- [29 Best HTML Music Players 2026 - uiCookies](https://uicookies.com/html-music-player/) — Feature landscape survey
- [Top Spotify Visualizers 2026 - Macsome](https://www.macsome.com/spotify-music-tips/spotify-visualizer.html) — Competitor examples
- Music visualizer examples: Kaleidosync, ÜBERVIZ, raVe — Competitive feature analysis

---
*Research completed: 2026-02-12*
*Ready for roadmap: yes*
