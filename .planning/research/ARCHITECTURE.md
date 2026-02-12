# Architecture Research

**Domain:** Immersive Web Audio Player with Canvas Visualization
**Researched:** 2026-02-12
**Confidence:** HIGH

## Standard Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    UI/Control Layer                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │
│  │ Splash   │  │ Play/    │  │ Volume   │  │ Track    │    │
│  │ Screen   │  │ Skip     │  │ Control  │  │ Info     │    │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘    │
│       │             │             │             │           │
├───────┴─────────────┴─────────────┴─────────────┴───────────┤
│                  State Manager                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  PlaybackState | CurrentTrack | Volume | UIState    │   │
│  └──────────────────────────────────────────────────────┘   │
│       │                    │                    │            │
├───────┴────────────────────┴────────────────────┴────────────┤
│          Audio Processing Layer                              │
│  ┌─────────┐      ┌─────────┐      ┌─────────┐              │
│  │ Audio   │──────│Analyser │──────│  Gain   │──────►Dest   │
│  │ Element │      │  Node   │      │  Node   │              │
│  └─────────┘      └────┬────┘      └─────────┘              │
│                        │                                     │
│                  [freq/time data]                            │
│                        │                                     │
├────────────────────────┴─────────────────────────────────────┤
│            Visualization Layer                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │ Background   │  │  Midground   │  │  Foreground  │       │
│  │ Canvas Layer │  │ Canvas Layer │  │ Canvas Layer │       │
│  │ (Starfield)  │  │ (Planet/Sun) │  │   (Moons)    │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
│         │                 │                  │               │
│         └─────────────────┴──────────────────┘               │
│                Animation Loop (RAF)                          │
│          [60fps updates with parallax speeds]                │
└─────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| **UI Controls** | User interaction capture, fullscreen trigger, control rendering | HTML buttons/elements with event listeners |
| **State Manager** | Single source of truth for app state, broadcasts changes | Reactive Proxy pattern or Pub/Sub event system |
| **Audio Element** | Audio file loading, playback control, time tracking | HTML5 `<audio>` element for streaming |
| **Audio Context** | Web Audio API processing graph, timing clock | Single `AudioContext` instance (singleton) |
| **Analyser Node** | Real-time frequency/time domain data extraction | `AnalyserNode` with configurable FFT size |
| **Gain Node** | Volume control, audio output level | `GainNode` connected to destination |
| **Canvas Layers** | Visual rendering with parallax depth illusion | Multiple stacked `<canvas>` elements, z-indexed |
| **Animation Loop** | Frame-synchronized updates, parallax calculations | `requestAnimationFrame` coordinating all layers |
| **Playlist Manager** | Track list, current index, next/previous logic | Array-based with JSON data loading |

## Recommended Project Structure

```
src/
├── core/
│   ├── state.js           # Reactive state manager (Proxy-based)
│   └── constants.js       # Configuration constants (FFT size, layer counts, etc.)
├── audio/
│   ├── audioEngine.js     # AudioContext, node graph setup
│   ├── analyser.js        # AnalyserNode wrapper, data extraction
│   └── playlist.js        # Playlist loading, track management
├── visuals/
│   ├── canvasManager.js   # Multi-layer canvas setup, resize handling
│   ├── animationLoop.js   # requestAnimationFrame coordinator
│   ├── layers/
│   │   ├── background.js  # Starfield rendering (slowest parallax)
│   │   ├── midground.js   # Planet/sun rendering (medium parallax)
│   │   └── foreground.js  # Moons rendering (fastest parallax)
│   └── effects.js         # Audio-reactive modulation utilities
├── ui/
│   ├── controls.js        # Play/pause/skip/volume controls
│   ├── trackInfo.js       # Current track display
│   ├── splash.js          # Entry screen with fullscreen trigger
│   └── fullscreen.js      # Fullscreen API wrapper
├── utils/
│   ├── loader.js          # JSON/asset loading
│   └── math.js            # Interpolation, easing functions
└── main.js                # App initialization, orchestration
```

### Structure Rationale

- **core/**: Centralized state prevents prop-drilling and synchronization bugs across audio/visual systems
- **audio/**: Isolates Web Audio API complexity; audioEngine is singleton, preventing multiple AudioContext instances
- **visuals/**: Separation by concern—each layer is independent, animationLoop coordinates timing
- **ui/**: User interaction decoupled from audio/visual logic for easier testing and modification
- **utils/**: Reusable helpers prevent code duplication across modules

## Architectural Patterns

### Pattern 1: Multi-Layer Canvas with Parallax Rendering

**What:** Multiple stacked `<canvas>` elements with CSS `position: absolute` and different z-index values, each updating at different rates to create depth illusion.

**When to use:** Anytime you have visual elements with different update frequencies or parallax depth requirements.

**Trade-offs:**
- **Pros:** Only redraw layers that change; background can be static or update infrequently. Massive performance gain (3-5 layers recommended, not more).
- **Cons:** Slight memory overhead per canvas; must coordinate CSS positioning and sizing.

**Example:**
```html
<!-- HTML structure -->
<div id="visualization-container">
  <canvas id="background-layer"></canvas>
  <canvas id="midground-layer"></canvas>
  <canvas id="foreground-layer"></canvas>
</div>

<style>
  #visualization-container {
    position: relative;
    width: 100vw;
    height: 100vh;
  }
  canvas {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
  }
  #background-layer { z-index: 1; }
  #midground-layer { z-index: 2; }
  #foreground-layer { z-index: 3; }
</style>
```

```javascript
// JavaScript coordination
const layers = {
  background: { canvas: document.getElementById('background-layer'), speed: 0.2 },
  midground: { canvas: document.getElementById('midground-layer'), speed: 0.5 },
  foreground: { canvas: document.getElementById('foreground-layer'), speed: 1.0 }
};

function animate(timestamp) {
  requestAnimationFrame(animate);

  // Each layer updates at different parallax speed
  updateLayer(layers.background, timestamp);
  updateLayer(layers.midground, timestamp);
  updateLayer(layers.foreground, timestamp);
}
```

### Pattern 2: Web Audio API Analysis Pipeline

**What:** Connect audio source → AnalyserNode → GainNode → Destination, extracting frequency/time data on each animation frame without blocking playback.

**When to use:** Any audio visualization requiring real-time frequency or waveform data.

**Trade-offs:**
- **Pros:** Non-invasive (AnalyserNode doesn't affect audio output); precise timing via `AudioContext.currentTime`; hardware-accelerated FFT.
- **Cons:** AnalyserNode is computationally intensive—balance `fftSize` (detail) vs performance; larger FFT = slower updates.

**Example:**
```javascript
// Setup (once on user gesture)
const audioCtx = new AudioContext();
const audio = document.getElementById('audio-player');
const source = audioCtx.createMediaElementSource(audio);
const analyser = audioCtx.createAnalyser();
const gainNode = audioCtx.createGain();

// Configure analyser
analyser.fftSize = 512; // Balance: 256 (fast) to 2048 (detailed)
analyser.smoothingTimeConstant = 0.7; // 0-1, higher = smoother but less responsive

// Connect graph
source.connect(analyser);
analyser.connect(gainNode);
gainNode.connect(audioCtx.destination);

// Extract data each frame
const bufferLength = analyser.frequencyBinCount; // Half of fftSize
const dataArray = new Uint8Array(bufferLength); // Reuse this array!

function getAudioData() {
  analyser.getByteFrequencyData(dataArray); // Frequency spectrum (0-255 per bin)
  // Or: analyser.getByteTimeDomainData(dataArray) for waveform
  return dataArray;
}
```

### Pattern 3: Reactive State with Proxy-Based Observation

**What:** Use JavaScript `Proxy` to intercept state mutations and automatically notify subscribers (UI, audio, visuals) without manual event dispatching.

**When to use:** When multiple systems (audio controls, visualizations, UI) need to react to the same state changes.

**Trade-offs:**
- **Pros:** Automatic reactivity; decouples components; reduces boilerplate event code.
- **Cons:** Slightly more complex debugging (Proxy traps); requires modern browser (all 2026 browsers support).

**Example:**
```javascript
// State manager (core/state.js)
function createReactiveState(initialState) {
  const subscribers = new Map();

  const state = new Proxy(initialState, {
    set(target, property, value) {
      const oldValue = target[property];
      target[property] = value;

      // Notify subscribers of this property
      if (subscribers.has(property)) {
        subscribers.get(property).forEach(callback => {
          callback(value, oldValue);
        });
      }
      return true;
    }
  });

  return {
    state,
    subscribe(property, callback) {
      if (!subscribers.has(property)) {
        subscribers.set(property, new Set());
      }
      subscribers.get(property).add(callback);
    }
  };
}

// Usage
const { state, subscribe } = createReactiveState({
  playing: false,
  volume: 1.0,
  currentTrack: null
});

// UI subscribes
subscribe('playing', (isPlaying) => {
  playButton.textContent = isPlaying ? 'Pause' : 'Play';
});

// Audio engine subscribes
subscribe('volume', (newVolume) => {
  gainNode.gain.value = newVolume;
});

// Mutation automatically triggers subscribers
state.playing = true; // Both UI and audio react
```

### Pattern 4: User Gesture-Based Initialization

**What:** Defer AudioContext creation and fullscreen request until explicit user interaction (click) to comply with browser autoplay policies.

**When to use:** Always—required by all modern browsers for AudioContext and fullscreen.

**Trade-offs:**
- **Pros:** Complies with security policies; prevents annoying autoplay.
- **Cons:** Requires splash screen or "click to start" UI.

**Example:**
```javascript
// Splash screen pattern (ui/splash.js)
let audioInitialized = false;
let audioContext = null;

document.getElementById('enter-button').addEventListener('click', async () => {
  // Initialize audio context on first interaction
  if (!audioInitialized) {
    audioContext = new AudioContext();

    // Resume if suspended (some browsers suspend by default)
    if (audioContext.state === 'suspended') {
      await audioContext.resume();
    }

    audioInitialized = true;
  }

  // Request fullscreen
  try {
    await document.documentElement.requestFullscreen();
  } catch (err) {
    console.warn('Fullscreen request failed:', err);
    // Continue anyway—fullscreen is optional enhancement
  }

  // Hide splash, start app
  document.getElementById('splash').style.display = 'none';
  startApplication();
});
```

## Data Flow

### Audio to Visualization Flow

```
User clicks Play
    ↓
State Manager updates state.playing = true
    ↓
Audio Element starts playback
    ↓
AudioContext processes audio through graph
    ↓
AnalyserNode extracts frequency data (each RAF frame)
    ↓
Animation Loop reads dataArray (Uint8Array of frequencies)
    ↓
Effects module maps frequencies to visual parameters
    ↓
Layer renderers modulate colors/positions/scales
    ↓
Canvas layers redraw with audio-reactive values
    ↓
requestAnimationFrame schedules next frame (60fps)
```

### User Control Flow

```
User interacts with control (e.g., volume slider)
    ↓
UI event handler captures input
    ↓
State Manager: state.volume = newValue
    ↓
Proxy triggers subscribers:
    ├─► GainNode.gain.value = newValue (audio)
    └─► UI updates slider display (visual feedback)
```

### Playlist Navigation Flow

```
User clicks Skip
    ↓
Playlist Manager: nextTrack()
    ↓
State Manager: state.currentTrack = newTrack
    ↓
Proxy triggers subscribers:
    ├─► Audio Element: src = newTrack.url, play()
    └─► UI: trackInfo.textContent = newTrack.title
```

### Key Data Flows

1. **Audio Analysis Pipeline**: `<audio>` element → Web Audio graph → AnalyserNode → `getByteFrequencyData()` → Uint8Array → visual modulators → canvas rendering
2. **State Propagation**: User action → State mutation → Proxy trap → Subscriber callbacks → Audio/UI/Visual updates
3. **Animation Timing**: `requestAnimationFrame` → timestamp → parallax speed multipliers → layer position updates → canvas redraw → next RAF

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 0-1k users | Static site hosting (Netlify/Vercel); no backend needed; JSON playlist embedded or CDN-hosted; local audio files or cloud storage URLs |
| 1k-100k users | Add CDN for audio files (CloudFlare/AWS S3); gzip/brotli compress assets; consider service worker for offline playback; lazy-load playlist data |
| 100k+ users | Stream audio from dedicated media CDN (Cloudinary/Mux); implement adaptive bitrate if expanding to mobile; monitor canvas performance on low-end devices; consider WebGL for complex visualizations |

### Scaling Priorities

1. **First bottleneck:** Audio file loading on slow connections
   - **Fix:** Use CDN with edge caching; compress audio (192kbps is sufficient for web); add loading indicators and buffer progress UI

2. **Second bottleneck:** Canvas rendering on low-end devices (<60fps)
   - **Fix:** Detect performance via `requestAnimationFrame` timing; reduce layer complexity or FFT size dynamically; offer "low quality" mode toggle

## Anti-Patterns

### Anti-Pattern 1: Multiple AudioContext Instances

**What people do:** Create new `AudioContext` for each audio source or when switching tracks.

**Why it's wrong:** Each AudioContext consumes significant resources; browsers limit total concurrent contexts; creates timing/synchronization issues between visualizations.

**Do this instead:** Create ONE AudioContext per app lifetime, reuse it by changing the source connected to the graph.

```javascript
// ❌ WRONG
function playTrack(url) {
  const ctx = new AudioContext(); // Creates new context every time!
  // ...
}

// ✅ CORRECT
const audioCtx = new AudioContext(); // Once, globally

function playTrack(url) {
  const source = audioCtx.createMediaElementSource(audioElement);
  source.connect(analyser); // Reuse existing graph
}
```

### Anti-Pattern 2: Redrawing Static Content Every Frame

**What people do:** Clear entire canvas and redraw background, planets, and moons every frame at 60fps.

**Why it's wrong:** Wastes GPU/CPU redrawing content that doesn't change; causes performance issues, especially on mobile.

**Do this instead:** Use multi-layer canvas architecture—render static/slow-changing elements to separate canvases, update only layers that need animation.

```javascript
// ❌ WRONG
function animate() {
  ctx.clearRect(0, 0, width, height);
  drawStarfield(); // Redraws 1000+ stars every frame!
  drawPlanet();
  drawMoons();
  requestAnimationFrame(animate);
}

// ✅ CORRECT
function animateBackground() {
  // Only redraw when stars actually move (low parallax speed)
  if (shouldUpdateBackground) {
    bgCtx.clearRect(0, 0, width, height);
    drawStarfield();
  }
}

function animateForeground() {
  // High-frequency updates only for moving elements
  fgCtx.clearRect(0, 0, width, height);
  drawMoons(); // These actually move noticeably
  requestAnimationFrame(animateForeground);
}
```

### Anti-Pattern 3: Synchronizing Audio with setTimeout/setInterval

**What people do:** Use `setInterval(updateVisualization, 16)` to update visuals at "60fps."

**Why it's wrong:** `setInterval` is not synchronized with screen refresh; causes jank, tearing, and inconsistent frame timing; wastes CPU when tab is not visible.

**Do this instead:** Always use `requestAnimationFrame` for visual updates—it's synchronized with browser paint cycle and paused when tab is inactive.

```javascript
// ❌ WRONG
setInterval(() => {
  updateVisualization();
}, 16); // Not actually 60fps, not synced to display

// ✅ CORRECT
function animate(timestamp) {
  updateVisualization(timestamp);
  requestAnimationFrame(animate); // Browser-optimized timing
}
requestAnimationFrame(animate);
```

### Anti-Pattern 4: Creating New Typed Arrays Every Frame

**What people do:** `const dataArray = new Uint8Array(analyser.frequencyBinCount)` inside the animation loop.

**Why it's wrong:** Allocates memory 60 times per second, triggers frequent garbage collection, causes frame drops/stuttering.

**Do this instead:** Create typed arrays once during initialization, reuse them by passing to `getByteFrequencyData()` which overwrites contents.

```javascript
// ❌ WRONG
function animate() {
  const dataArray = new Uint8Array(analyser.frequencyBinCount); // GC pressure!
  analyser.getByteFrequencyData(dataArray);
  // ...
  requestAnimationFrame(animate);
}

// ✅ CORRECT
const dataArray = new Uint8Array(analyser.frequencyBinCount); // Once, outside loop

function animate() {
  analyser.getByteFrequencyData(dataArray); // Reuses existing array
  // ...
  requestAnimationFrame(animate);
}
```

### Anti-Pattern 5: Floating-Point Canvas Coordinates

**What people do:** Use raw calculated positions like `ctx.drawImage(img, x * 1.5, y * 0.3)`.

**Why it's wrong:** Sub-pixel rendering forces browser to anti-alias, blurs images, reduces performance.

**Do this instead:** Round all coordinates to integers with `Math.floor()` or `Math.round()`.

```javascript
// ❌ WRONG
ctx.drawImage(moonImage, x * parallaxSpeed, y * parallaxSpeed);

// ✅ CORRECT
ctx.drawImage(
  moonImage,
  Math.floor(x * parallaxSpeed),
  Math.floor(y * parallaxSpeed)
);
```

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| JSON Playlist Data | `fetch('/playlist.json')` on app init | Can be local file or API endpoint; validate schema before use |
| Audio Files (Local) | `<audio src="./music/track.mp3">` | Relative paths work for local development; use absolute URLs for production |
| Audio Files (Remote) | `<audio src="https://cdn.example.com/track.mp3" crossorigin="anonymous">` | Requires CORS headers; `crossorigin` attribute mandatory for Web Audio API |
| CDN (Future) | Same as remote audio, but with CDN URLs | CloudFlare R2, AWS S3, or Cloudinary for global edge delivery |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| State ↔ Audio Engine | Reactive subscriptions (`subscribe('volume', callback)`) | State mutations trigger audio parameter changes; audio doesn't write to state |
| State ↔ UI | Reactive subscriptions + direct reads | UI both reads state and writes to it via user interactions |
| State ↔ Visualizations | Reactive subscriptions (read-only) | Visuals react to playback state but don't modify it |
| Audio Engine ↔ Visualizations | Direct data passing (AnalyserNode → dataArray) | One-way: audio provides data, visuals consume; no feedback loop |
| Animation Loop ↔ Layers | Function calls with timestamp parameter | Loop orchestrates, layers render independently; no direct layer-to-layer communication |
| Playlist Manager ↔ State | Method calls update state | Playlist owns track data/logic, exposes methods like `next()`, `previous()`, `loadTrack(index)` |

## Build Order Recommendations

### Phase 1: Foundation (Core Infrastructure)
**Dependencies:** None
**Components:**
- Project structure and module scaffolding
- State manager (Proxy-based reactive system)
- Constants configuration file
- Basic HTML structure with canvas containers

**Rationale:** State management is the spine—audio, UI, and visuals all depend on it. Build this first to avoid refactoring later.

---

### Phase 2: Audio Engine (Playback without Visuals)
**Dependencies:** Phase 1 (State)
**Components:**
- AudioContext singleton initialization
- HTML5 `<audio>` element with controls
- Web Audio graph: source → analyser → gain → destination
- User gesture handler (click-to-start pattern)
- Playlist manager with JSON loading
- Basic playback controls (play/pause/skip/volume)

**Rationale:** Audio is the product's core feature—prove this works before adding visuals. Can test with browser's built-in audio controls initially.

---

### Phase 3: Canvas Foundation (Static Scene)
**Dependencies:** Phase 1 (State), Phase 2 (Audio for timing reference)
**Components:**
- Multi-layer canvas setup with CSS positioning
- Fullscreen API integration
- Static rendering of space scene:
  - Background layer: starfield
  - Midground layer: planet and sun
  - Foreground layer: moons
- Canvas resize handling (window resize, fullscreen transitions)

**Rationale:** Render static scene first to validate layer architecture, ensure visual quality, and handle coordinate systems before adding animation complexity.

---

### Phase 4: Animation Loop (Motion without Audio Reactivity)
**Dependencies:** Phase 3 (Canvas)
**Components:**
- `requestAnimationFrame` coordinator
- Parallax movement (different speeds per layer)
- Timestamp-based smooth animation
- Performance monitoring (detect dropped frames)

**Rationale:** Prove 60fps performance with parallax before introducing audio data processing. Easier to debug animation issues without audio complexity.

---

### Phase 5: Audio Visualization (Reactive Effects)
**Dependencies:** Phase 2 (Audio), Phase 4 (Animation)
**Components:**
- AnalyserNode data extraction in animation loop
- Audio-reactive modulation utilities:
  - Map frequency bins to visual parameters
  - Smoothing/interpolation for subtle effects
- Apply reactivity to existing visuals:
  - Star twinkle intensity
  - Planet color/glow modulation
  - Moon orbit speed variation

**Rationale:** Final integration layer—both audio and animation must work independently before coupling them. Subtle reactivity is easier to tune when foundation is solid.

---

### Phase 6: UI/UX Polish
**Dependencies:** Phases 2, 3, 5 (all features working)
**Components:**
- Splash screen design
- Track info display
- Custom-styled controls (replace browser defaults)
- Loading states and error handling
- Keyboard shortcuts (spacebar = play/pause, arrow keys = skip)

**Rationale:** Polish after functionality is proven. Easier to design UI around working features than to build features around designed UI.

---

### Build Order Summary

```
Phase 1 (State)
    ↓
Phase 2 (Audio) ──┐
    ↓             │
Phase 3 (Canvas)  │
    ↓             │
Phase 4 (Animation) ──┐
                      │
Phase 5 (Audio + Visuals) ← Requires both branches
    ↓
Phase 6 (UI Polish)
```

**Key Principle:** Build in layers of increasing complexity. Each phase should produce a working, testable artifact. Avoid working on audio and visuals simultaneously until both work independently.

## Sources

- [Visualizations with Web Audio API - MDN](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Visualizations_with_Web_Audio_API) (HIGH confidence - official docs)
- [Web Audio API Best Practices - MDN](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Best_practices) (HIGH confidence - official docs)
- [Autoplay Guide for Media and Web Audio APIs - MDN](https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Autoplay) (HIGH confidence - official docs)
- [Optimizing Canvas - MDN](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Optimizing_canvas) (HIGH confidence - official docs)
- [Modern State Management in Vanilla JavaScript: 2026 Patterns and Beyond](https://medium.com/@orami98/modern-state-management-in-vanilla-javascript-2026-patterns-and-beyond-ce00425f7ac5) (MEDIUM confidence - 2026 patterns)
- [State Management in Vanilla JS: 2026 Trends](https://medium.com/@chirag.dave/state-management-in-vanilla-js-2026-trends-f9baed7599de) (MEDIUM confidence - contemporary practices)
- [Near-Realtime Animations with Synchronized Audio in JavaScript](https://medium.com/fender-engineering/near-realtime-animations-with-synchronized-audio-in-javascript-6d845afcf1c5) (MEDIUM confidence - timing coordination patterns)
- [Optimize HTML5 canvas rendering with layering - IBM](https://developer.ibm.com/tutorials/wa-canvashtml5layering/) (MEDIUM confidence - multi-layer patterns)
- [Using Multiple HTML5 Canvases as Layers](https://html5.litten.com/using-multiple-html5-canvases-as-layers/) (MEDIUM confidence - practical implementation)
- [Web Audio API Performance and Debugging Notes](https://padenot.github.io/web-audio-perf/) (MEDIUM confidence - performance insights)

---
*Architecture research for: Cosmic Player (Immersive Web Audio Player)*
*Researched: 2026-02-12*
