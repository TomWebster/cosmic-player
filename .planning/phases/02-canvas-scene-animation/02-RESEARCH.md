# Phase 2: Canvas Scene & Animation - Research

**Researched:** 2026-02-12
**Domain:** HTML5 Canvas 2D rendering with parallax animation
**Confidence:** HIGH

## Summary

Phase 2 builds upon the existing DPI-aware canvas infrastructure (from Phase 1) to render a sparse cosmic scene with smooth parallax motion. The domain is mature and well-documented: HTML5 Canvas 2D API is baseline widely available since 2015, with extensive official documentation and established performance patterns.

The core technical challenge is achieving smooth 60fps animation (16.67ms budget per frame) while rendering multiple scene layers with different parallax speeds. Research confirms the existing `requestAnimationFrame` + delta time approach is the correct foundation. Key findings focus on: (1) proper delta-time calculations for frame-rate independence, (2) batch rendering optimizations to minimize draw calls, (3) radial gradients for planet sphere effects, and (4) pre-rendering/caching techniques for static elements.

**Primary recommendation:** Use time-based animation with `requestAnimationFrame` timestamp parameter for frame-rate independence, organize scene as data-driven layer arrays with velocity multipliers, batch all drawing operations per layer, and leverage radial gradients for planet rendering. Avoid floating-point coordinates (triggers anti-aliasing overhead) and unnecessary canvas state changes.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Canvas 2D API | Native | 2D graphics rendering | Baseline widely available since 2015; phase decision prioritized it over WebGL for implementation simplicity |
| requestAnimationFrame | Native | Animation loop synchronization | Recommended by MDN; syncs with browser refresh rate (60-144Hz); auto-pauses in background tabs |
| DOMHighResTimeStamp | Native | Precise timing for delta calculations | Sub-millisecond precision via `performance.now()`; provided as rAF callback parameter |

### Supporting
None required — Phase 2 extends existing vanilla JS canvas renderer from Phase 1.

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| requestAnimationFrame | setInterval() | setInterval doesn't sync with display refresh; causes tearing and stuttering (MDN explicitly advises against it) |
| Canvas 2D | WebGL | WebGL adds GPU power for 3D/particles but increases complexity; Phase decision already locked Canvas 2D |
| Manual timestamp tracking | Date.now() | Date.now() has millisecond precision vs. rAF's sub-millisecond; also not synced to repaint |

**Installation:**
No packages needed — all native browser APIs.

## Architecture Patterns

### Recommended Project Structure
```
src/scripts/
├── canvasRenderer.js    # Extended with scene rendering (existing from Phase 1)
├── sceneData.js         # NEW: Layer definitions (stars, planet, moons, sun)
└── main.js              # Existing orchestrator
```

### Pattern 1: Time-Based Animation Loop with Delta Time

**What:** Calculate time elapsed since last frame and scale movement by delta time to achieve frame-rate independent animation.

**When to use:** Always — required for smooth animation across different refresh rates (60Hz vs 120Hz vs 144Hz displays).

**Example:**
```javascript
// Source: https://developer.mozilla.org/en-US/docs/Web/API/Window/requestAnimationFrame
let lastTimestamp = 0;

function animate(timestamp) {
  // Initialize on first frame
  if (lastTimestamp === 0) {
    lastTimestamp = timestamp;
  }

  // Calculate delta time in seconds
  const deltaTime = (timestamp - lastTimestamp) / 1000;
  lastTimestamp = timestamp;

  // Update scene (movement scaled by deltaTime)
  updateScene(deltaTime);

  // Render
  renderScene();

  // Continue loop
  requestAnimationFrame(animate);
}

requestAnimationFrame(animate);
```

### Pattern 2: Data-Driven Layer Architecture

**What:** Define scene elements as data structures with position, velocity, and rendering properties; iterate over layers to render.

**When to use:** Parallax scenes with multiple elements moving at different speeds.

**Example:**
```javascript
// Source: Research synthesis from starfield patterns
const layers = [
  {
    name: 'starfield',
    depth: 0.2,        // Parallax multiplier (slower = further away)
    elements: [
      { x: 100, y: 50, radius: 1.5 },
      { x: 300, y: 200, radius: 1.2 },
      // ... more stars
    ]
  },
  {
    name: 'planet',
    depth: 0.5,
    elements: [
      { x: 400, y: 300, radius: 80, colors: ['#c4a24d', '#8b7355'] }
    ]
  },
  {
    name: 'moons',
    depth: 0.8,        // Faster movement (closer to viewer)
    elements: [
      { x: 200, y: 150, radius: 15, color: '#8a7a5e' },
      { x: 600, y: 400, radius: 12, color: '#8a7a5e' }
    ]
  }
];

function updateScene(deltaTime) {
  const baseSpeed = 20; // pixels per second

  layers.forEach(layer => {
    const speed = baseSpeed * layer.depth;
    layer.elements.forEach(element => {
      element.x -= speed * deltaTime; // Drift left

      // Wrap around when off-screen
      if (element.x < -element.radius) {
        element.x = canvas.width + element.radius;
      }
    });
  });
}
```

### Pattern 3: Radial Gradient for Sphere/Planet Rendering

**What:** Use `createRadialGradient()` with offset circles to create 3D sphere effect through lighting simulation.

**When to use:** Rendering planets, moons, or any spherical objects that need depth.

**Example:**
```javascript
// Source: https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/createRadialGradient
function drawPlanet(ctx, x, y, radius, colors) {
  // Offset inner circle to create "light from top-left" effect
  const highlightOffsetX = -radius * 0.3;
  const highlightOffsetY = -radius * 0.3;

  const gradient = ctx.createRadialGradient(
    x + highlightOffsetX, y + highlightOffsetY, radius * 0.3,  // Highlight circle
    x, y, radius                                                // Outer circle
  );

  gradient.addColorStop(0, colors[0]);      // Bright highlight
  gradient.addColorStop(0.7, colors[1]);    // Mid-tone
  gradient.addColorStop(1, colors[2]);      // Dark edge/shadow

  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
}
```

### Pattern 4: Batch Rendering by Layer

**What:** Group all draw calls for similar elements together; minimize `fillStyle`, `strokeStyle`, and `beginPath` state changes.

**When to use:** Rendering many similar objects (e.g., hundreds of stars).

**Example:**
```javascript
// Source: https://web.dev/canvas-performance/ + MDN optimization guide
function renderStars(ctx, stars) {
  // Set style ONCE for all stars
  ctx.fillStyle = '#ffffff';

  // Draw all stars in one batch
  stars.forEach(star => {
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
    ctx.fill();
  });
}

// BAD: Changes style per star
stars.forEach(star => {
  ctx.fillStyle = '#ffffff';  // Redundant state change!
  ctx.beginPath();
  ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
  ctx.fill();
});
```

### Pattern 5: Integer Coordinates for Performance

**What:** Round all coordinates to integers using `Math.floor()` before drawing to avoid sub-pixel rendering overhead.

**When to use:** Performance-critical rendering loops.

**Example:**
```javascript
// Source: https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Optimizing_canvas
// GOOD: Integer coordinates
ctx.arc(Math.floor(x), Math.floor(y), radius, 0, Math.PI * 2);

// BAD: Float coordinates trigger anti-aliasing
ctx.arc(x, y, radius, 0, Math.PI * 2);
```

### Anti-Patterns to Avoid

- **Floating-point coordinates:** Sub-pixel rendering forces extra anti-aliasing calculations (MDN optimization guide)
- **Per-frame canvas resizing:** Resizing clears canvas and is expensive; handle via resize listener only
- **clearRect() without fillRect():** For black backgrounds, `fillRect()` is often faster than `clearRect()` + separate fill
- **Missing `beginPath()`:** Accumulated path operations cause unexpected rendering and performance degradation
- **State thrashing:** Alternating `fillStyle` colors per shape; batch by style instead

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Animation timing | Manual Date.now() delta tracking | `requestAnimationFrame` timestamp parameter | rAF provides DOMHighResTimeStamp synced to repaint; handles background tab pausing automatically |
| High-DPI scaling | Custom devicePixelRatio logic | Existing Phase 1 `setupCanvas()` with `setTransform()` | Already implemented; non-cumulative scaling on resize |
| Gradient caching | Custom gradient object pool | Native `createRadialGradient()` per frame | Modern browsers optimize internally; premature optimization adds complexity |
| Parallax math | Custom matrix transformations | Simple velocity multipliers (`speed * depth * deltaTime`) | Sufficient for 2D drift; matrices add cognitive overhead |

**Key insight:** Canvas 2D performance comes from minimizing draw calls and state changes, not complex caching systems. The bottleneck is GPU upload, so batch operations and reuse styles.

## Common Pitfalls

### Pitfall 1: Ignoring requestAnimationFrame Timestamp

**What goes wrong:** Using `Date.now()` or no delta time makes animation run faster on high-refresh displays (120Hz+).

**Why it happens:** Developers assume 60fps is universal; `requestAnimationFrame` actually matches display refresh rate.

**How to avoid:** Always use the `timestamp` parameter passed to rAF callback; calculate delta time as `(timestamp - lastTimestamp) / 1000`.

**Warning signs:** Reports of "animation too fast" on gaming monitors; inconsistent speed across devices.

**Source:** [MDN requestAnimationFrame documentation](https://developer.mozilla.org/en-US/docs/Web/API/Window/requestAnimationFrame), [Aleksandr Hovhannisyan game loop article](https://www.aleksandrhovhannisyan.com/blog/javascript-game-loop/)

### Pitfall 2: Forgetting beginPath() Before New Shapes

**What goes wrong:** Previous path operations accumulate, causing overlapping fills and massive performance degradation.

**Why it happens:** Canvas path state persists between draw calls unless explicitly reset.

**How to avoid:** Always call `ctx.beginPath()` before starting a new shape (arc, rect, etc.).

**Warning signs:** Shapes rendering with unexpected fills; performance declining as scene runs.

**Source:** [Optimizing HTML5 Canvas Rendering](https://blog.ag-grid.com/optimising-html5-canvas-rendering-best-practices-and-techniques/), [MDN beginPath()](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/beginPath)

### Pitfall 3: Memory Leaks from ImageData Operations

**What goes wrong:** Repeatedly calling `getImageData()` / `putImageData()` in animation loops leaks gigabytes of memory within seconds.

**Why it happens:** Browser retains references to pixel buffers; garbage collection can't keep pace.

**How to avoid:** Avoid `getImageData()` / `putImageData()` in animation loops. For Phase 2, render vector shapes directly (arc, fillRect) instead of manipulating pixels.

**Warning signs:** Browser tab memory usage climbing steadily; eventual crash after minutes of animation.

**Source:** [Konva memory leak guide](https://konvajs.org/docs/performance/Avoid_Memory_Leaks.html), [Mozilla bug #1012386](https://bugzilla.mozilla.org/show_bug.cgi?id=1012386)

### Pitfall 4: Excessive State Changes

**What goes wrong:** Changing `fillStyle`, `strokeStyle`, `lineWidth` per shape destroys performance at scale.

**Why it happens:** Each state change forces GPU pipeline flush and rebinding.

**How to avoid:** Batch all shapes with same style together; set style once per batch.

**Warning signs:** Frame rate dropping below 60fps with <1000 shapes; Chrome DevTools Performance showing high paint times.

**Source:** [web.dev Canvas Performance](https://web.dev/canvas-performance/), [HTML5 Canvas Performance Gist](https://gist.github.com/jaredwilli/5469626)

### Pitfall 5: Canvas Resizing in Animation Loop

**What goes wrong:** Setting `canvas.width` or `canvas.height` clears the canvas and resets all context state.

**Why it happens:** Developers mistakenly resize every frame instead of once on window resize.

**How to avoid:** Handle resizing via `window.addEventListener('resize', setupCanvas)` only (already implemented in Phase 1).

**Warning signs:** Flickering; context state (fillStyle, transforms) resetting unexpectedly.

**Source:** [MDN Optimizing Canvas](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Optimizing_canvas)

## Code Examples

Verified patterns from official sources:

### Sparse Starfield Generation

```javascript
// Source: https://excessivelyadequate.com/posts/starfield.html
// Biased random distribution concentrates stars toward center
function generateStars(count, width, height) {
  const stars = [];
  const cx = width / 2;
  const cy = height / 2;

  // Biased random: stronger concentration toward 0
  const biasedRand = () => (Math.random() - 0.5) * (Math.random() - 0.5) * Math.random();

  for (let i = 0; i < count; i++) {
    const x = cx + biasedRand() * width;
    const y = cy + biasedRand() * height;

    // Vary star size based on distance from center (perspective depth)
    const dx = x - cx;
    const dy = y - cy;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const radius = 0.5 + (distance / width) * 1.5;

    stars.push({ x, y, radius });
  }

  return stars;
}
```

### Complete Animation Loop Structure

```javascript
// Source: MDN + research synthesis
let lastTimestamp = 0;

function animate(timestamp) {
  // Calculate delta time
  if (lastTimestamp === 0) {
    lastTimestamp = timestamp;
  }
  const deltaTime = (timestamp - lastTimestamp) / 1000;
  lastTimestamp = timestamp;

  // Update positions
  updateScene(deltaTime);

  // Clear and render
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  renderScene();

  // Continue loop
  requestAnimationFrame(animate);
}

// Start animation
requestAnimationFrame(animate);
```

### Saturn-Colored Planet with Gradient

```javascript
// Source: https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/createRadialGradient
function drawSaturnPlanet(ctx, x, y, radius) {
  // Offset highlight for 3D sphere effect
  const gradient = ctx.createRadialGradient(
    x - radius * 0.3, y - radius * 0.3, radius * 0.2,  // Highlight
    x, y, radius                                         // Shadow
  );

  // Saturn-like colors (yellowish-tan)
  gradient.addColorStop(0, '#e6d5a8');    // Bright highlight
  gradient.addColorStop(0.5, '#c4a24d');  // Mid-tone ochre
  gradient.addColorStop(1, '#8b7355');    // Dark edge

  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
}
```

### Optimized Multi-Layer Rendering

```javascript
// Source: Research synthesis from performance guides
function renderScene() {
  // Layer 1: Background starfield (furthest, slowest)
  ctx.fillStyle = '#ffffff';
  backgroundStars.forEach(star => {
    ctx.beginPath();
    ctx.arc(Math.floor(star.x), Math.floor(star.y), star.radius, 0, Math.PI * 2);
    ctx.fill();
  });

  // Layer 2: Distant sun (simple radial gradient)
  const sunGradient = ctx.createRadialGradient(
    sunX, sunY, 0,
    sunX, sunY, sunRadius
  );
  sunGradient.addColorStop(0, '#fffacd');
  sunGradient.addColorStop(1, '#ffd700');
  ctx.fillStyle = sunGradient;
  ctx.beginPath();
  ctx.arc(Math.floor(sunX), Math.floor(sunY), sunRadius, 0, Math.PI * 2);
  ctx.fill();

  // Layer 3: Saturn planet
  drawSaturnPlanet(ctx, Math.floor(planetX), Math.floor(planetY), planetRadius);

  // Layer 4: Foreground moons (closest, fastest)
  ctx.fillStyle = '#8a7a5e';  // Khaki color
  moons.forEach(moon => {
    ctx.beginPath();
    ctx.arc(Math.floor(moon.x), Math.floor(moon.y), moon.radius, 0, Math.PI * 2);
    ctx.fill();
  });
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| setInterval(fn, 16) | requestAnimationFrame(fn) | ~2011 | Syncs to display refresh; auto-pauses in background |
| Date.now() for timing | rAF timestamp parameter | ~2013 | Sub-millisecond precision; prevents high-refresh issues |
| Manual DPI scaling | CSS + setTransform() | ~2015 | Non-cumulative scaling; Phase 1 implemented this |
| Shadow/blur effects | Radial gradients | Ongoing | shadowBlur is extremely expensive; gradients are GPU-accelerated |

**Deprecated/outdated:**
- `mozRequestAnimationFrame`: Vendor prefixes removed; use unprefixed `requestAnimationFrame` (baseline since 2015)
- Manual pixel ratio detection without devicePixelRatio API (now universally supported)

## Open Questions

1. **Exact parallax speed multipliers for "slow drift"**
   - What we know: Requirement SCNE-06 specifies "slow parallax motion at different layer speeds"
   - What's unclear: Specific pixel-per-second velocities; "slow" is subjective
   - Recommendation: Start with 10-30 px/sec range for base layer; multiply by depth (0.2-1.0); tune visually during implementation

2. **Star count for "sparse" starfield**
   - What we know: Requirement SCNE-02 specifies "sparse bright starfield"; visual style references "80s Elite (BBC Micro)"
   - What's unclear: Exact count (50? 100? 200?)
   - Recommendation: Start with ~100 stars; reference images show very sparse distribution (Elite had ~30-50 visible at once)

3. **Saturn planet position: centered or off-center?**
   - What we know: SCNE-03 says "large Saturn-colored planet rendered in the midground"
   - What's unclear: Exact position (center? offset?)
   - Recommendation: Offset slightly right/down for visual interest (centered feels static); The Designers Republic aesthetic favors asymmetry

4. **Moon "subtle" size guideline**
   - What we know: SCNE-04 specifies "subtle khaki-colored moons... understated, not dominant"
   - What's unclear: Size relative to planet
   - Recommendation: 15-20% of planet radius; smaller than typical sci-fi moon depictions

## Sources

### Primary (HIGH confidence)
- [MDN: Window.requestAnimationFrame()](https://developer.mozilla.org/en-US/docs/Web/API/Window/requestAnimationFrame) - Animation loop timing and timestamp usage
- [MDN: CanvasRenderingContext2D.createRadialGradient()](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/createRadialGradient) - Planet sphere rendering technique
- [MDN: Optimizing Canvas](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Optimizing_canvas) - Performance best practices
- [web.dev: Improving HTML5 Canvas Performance](https://web.dev/canvas-performance/) - Batch operations and state management

### Secondary (MEDIUM confidence)
- [Excessively Adequate: Recreating the Starfield Screensaver](https://excessivelyadequate.com/posts/starfield.html) - Starfield distribution techniques (biased random, respawning)
- [ag-grid blog: Optimizing HTML5 Canvas Rendering](https://blog.ag-grid.com/optimising-html5-canvas-rendering-best-practices-and-techniques/) - Batch rendering patterns verified against MDN
- [Konva: Avoid Memory Leaks](https://konvajs.org/docs/performance/Avoid_Memory_Leaks.html) - Memory management for long-running animations
- [Aleksandr Hovhannisyan: JavaScript Game Loop](https://www.aleksandrhovhannisyan.com/blog/javascript-game-loop/) - Delta time calculations

### Tertiary (LOW confidence - for awareness)
- [jsPerf: Canvas Fill Arc vs FillRect](https://jsperf.com/canvas-fill-arc-vs-fillrect) - Performance benchmarks (needs validation; benchmarks vary by browser)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Canvas 2D API is baseline widely available (2015); official MDN documentation comprehensive
- Architecture: HIGH - requestAnimationFrame + delta time is established pattern; MDN and web.dev confirm approach
- Pitfalls: HIGH - Memory leaks documented in Mozilla bugzilla; performance anti-patterns verified across multiple authoritative sources
- Specific values (star count, speeds): MEDIUM - Requirements specify behavior but not exact numbers; needs visual tuning

**Research date:** 2026-02-12
**Valid until:** ~2026-03-14 (30 days) - Canvas 2D is stable; unlikely to change
