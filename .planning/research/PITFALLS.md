# Pitfalls Research

**Domain:** Immersive Web Audio/Visual Player
**Researched:** 2026-02-12
**Confidence:** HIGH

## Critical Pitfalls

### Pitfall 1: Autoplay Policy Violation Leading to Suspended AudioContext

**What goes wrong:**
Creating an AudioContext outside of a user gesture results in the context being created in a `suspended` state. Audio will not play, and developers often don't realize the context needs explicit resumption.

**Why it happens:**
Browsers block autoplay to prevent unwanted audio from surprising users. Developers create the AudioContext during page load or initialization, before any user interaction occurs.

**How to avoid:**
Always create the AudioContext inside a user gesture handler (click, tap, keydown). For the Cosmic Player, this means creating or resuming the AudioContext inside the splash screen click handler.

```javascript
// CORRECT: Create context on user interaction
splashButton.addEventListener('click', () => {
  const audioCtx = new AudioContext();
  // Context state is automatically 'running'
});

// OR: Create early but resume on interaction
const audioCtx = new AudioContext(); // State: 'suspended'
splashButton.addEventListener('click', async () => {
  if (audioCtx.state === 'suspended') {
    await audioCtx.resume();
  }
});
```

**Warning signs:**
- No audio plays despite code executing without errors
- AudioContext.state logs as `'suspended'` instead of `'running'`
- Console shows no error but audio visualization doesn't respond

**Phase to address:**
Phase 1 (Core Audio Playback) - The splash screen interaction must initialize or resume the AudioContext before attempting any audio operations.

**Sources:**
- [MDN Web Audio API Best Practices](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Best_practices)
- [Chrome Autoplay Policy](https://developer.chrome.com/blog/autoplay)

---

### Pitfall 2: Garbage Collection Causing Audio Glitches

**What goes wrong:**
Creating new objects (arrays, buffers) inside the animation loop or audio processing callback triggers frequent garbage collection, which blocks the audio thread and causes audible clicks, pops, or stuttering.

**Why it happens:**
JavaScript is garbage-collected. Allocating memory in hot paths (code running 60+ times per second) creates garbage that must be cleaned up. Garbage collection is synchronous and blocks execution, causing dropped audio callbacks.

**How to avoid:**
Pre-allocate all typed arrays and reuse them. Never create new arrays inside `requestAnimationFrame` or audio processing callbacks.

```javascript
// WRONG: Creates new array every frame (60fps = 60 allocations/sec)
function animate() {
  const freqData = new Uint8Array(analyser.frequencyBinCount);
  analyser.getByteFrequencyData(freqData);
  requestAnimationFrame(animate);
}

// CORRECT: Allocate once, reuse forever
const freqData = new Uint8Array(analyser.frequencyBinCount);
function animate() {
  analyser.getByteFrequencyData(freqData);
  requestAnimationFrame(animate);
}
```

**Warning signs:**
- Audible clicks or pops during playback
- Frame rate drops or stuttering despite low CPU usage
- Audio glitches worsen over time as garbage accumulates
- Chrome DevTools Performance tab shows frequent GC pauses

**Phase to address:**
Phase 2 (Audio Analysis & Visualization) - When implementing the AnalyserNode and frequency data extraction, establish the reusable array pattern from the start.

**Sources:**
- [Web Audio Performance and Debugging Notes](https://padenot.github.io/web-audio-perf/)
- [Profiling Web Audio Apps in Chrome](https://web.dev/profiling-web-audio-apps-in-chrome/)
- [Real-Time Audio in the Browser: Making AudioWorklet Fast](https://engineering.videocall.rs/posts/how-to-make-javascript-audio-not-suck/)

---

### Pitfall 3: Audio-Visual Desynchronization (Two Clocks Problem)

**What goes wrong:**
Using `requestAnimationFrame` timestamps to drive audio scheduling causes audio and visuals to drift out of sync. Audio plays early/late relative to visual animations, especially noticeable during track transitions.

**Why it happens:**
`requestAnimationFrame` runs on the display's refresh clock (typically 60Hz, ~16.67ms precision). Web Audio API runs on its own high-precision audio clock (`AudioContext.currentTime`). These clocks drift independently. Developers assume rAF is the source of truth for timing.

**How to avoid:**
Always use `AudioContext.currentTime` as the source of truth for timing. Use `requestAnimationFrame` only to trigger visual updates, not to schedule audio events.

```javascript
// WRONG: Scheduling audio based on rAF timestamp
function animate(timestamp) {
  if (timestamp > nextBeatTime) {
    playSound(); // Audio scheduling imprecise
  }
  requestAnimationFrame(animate);
}

// CORRECT: Query audio clock, update visuals accordingly
function animate() {
  const currentTime = audioCtx.currentTime;
  if (currentTime >= nextBeatTime) {
    // Audio was already scheduled at precise time
    triggerBeatVisual(); // Update visuals to match
  }
  requestAnimationFrame(animate);
}
```

**Warning signs:**
- Visual effects trigger slightly before/after audio events
- Drift increases over time (seconds → minutes)
- Sync issues worsen when tab is backgrounded then foregrounded
- Beat-synced visuals feel "off" despite correct math

**Phase to address:**
Phase 2 (Audio Analysis & Visualization) - When connecting audio analysis to visual reactivity, establish audio clock as the timing authority.

**Sources:**
- [A Tale of Two Clocks - web.dev](https://web.dev/articles/audio-scheduling)
- [Synchronize Animation to Audio File with Web Audio](https://hansgaron.com/articles/web_audio/animation_sync_with_audio/part_one/)

---

### Pitfall 4: AnalyserNode FFT Size Misconfiguration

**What goes wrong:**
Setting `fftSize` too high (e.g., 32768) for real-time visualization causes performance issues and lag. Setting it too low (e.g., 32) provides insufficient frequency resolution for visuals.

**Why it happens:**
Developers assume "higher is better" or blindly copy values from tutorials without understanding the performance vs. resolution tradeoff. FFT computation cost scales with size.

**How to avoid:**
For 60fps music visualization, use `fftSize` between 256-2048. Start at 1024 (default 2048) and adjust based on visual needs and performance testing.

```javascript
// For responsive visuals at 60fps
analyser.fftSize = 1024; // frequencyBinCount = 512
analyser.smoothingTimeConstant = 0.8; // Smooths jitter

// Allocate matching buffer
const freqData = new Uint8Array(analyser.frequencyBinCount);
```

**Trade-offs:**
- **256-512**: Fast, low latency, coarse frequency detail (good for beat detection)
- **1024-2048**: Balanced, suitable for most music visualization
- **4096-32768**: Slow, high latency, fine frequency detail (not recommended for real-time)

**Warning signs:**
- Frame rate drops below 60fps
- Noticeable input lag between audio and visual response
- CPU usage spikes when audio analysis is active
- Visuals feel "sluggish" despite animation code being optimized

**Phase to address:**
Phase 2 (Audio Analysis & Visualization) - During AnalyserNode setup, choose appropriate FFT size and validate performance.

**Sources:**
- [MDN AnalyserNode.fftSize](https://developer.mozilla.org/en-US/docs/Web/API/AnalyserNode/fftSize)
- [MDN Visualizations with Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Visualizations_with_Web_Audio_API)

---

### Pitfall 5: Memory Leaks from Undisconnected AudioNodes

**What goes wrong:**
Creating AudioNodes (especially `AudioBufferSourceNode` for each track) without properly disconnecting them causes memory to grow unbounded. Mobile browsers eventually crash or force reload.

**Why it happens:**
AudioNodes aren't garbage collected until explicitly disconnected from the audio graph. Developers create new source nodes for each track but forget to call `.disconnect()` on the previous one after playback ends.

**How to avoid:**
Always call `.disconnect()` on source nodes after they finish playing. Track active nodes and clean them up during track transitions.

```javascript
let currentSourceNode = null;

function playTrack(audioBuffer) {
  // Disconnect previous source
  if (currentSourceNode) {
    currentSourceNode.disconnect();
    currentSourceNode = null;
  }

  // Create new source
  const source = audioCtx.createBufferSource();
  source.buffer = audioBuffer;
  source.connect(gainNode);
  source.start();

  currentSourceNode = source;

  // Clean up when finished
  source.onended = () => {
    source.disconnect();
    if (currentSourceNode === source) {
      currentSourceNode = null;
    }
  };
}
```

**Warning signs:**
- Memory usage grows with each track change (check DevTools Memory tab)
- Mobile browser crashes after playing 10-20 tracks
- Performance degrades over extended listening sessions
- iOS Safari shows "This webpage is using significant memory"

**Phase to address:**
Phase 3 (Track Transitions) - When implementing track switching, establish cleanup pattern from the start.

**Sources:**
- [MediaStreamAudioSourceNode Memory Leak Issue](https://github.com/WebAudio/web-audio-api/issues/2484)
- [AudioNode stop/disconnect doesn't free memory](https://github.com/WebAudio/web-audio-api/issues/904)

---

### Pitfall 6: Sub-Pixel Canvas Rendering Overhead

**What goes wrong:**
Using floating-point coordinates for `drawImage()` or `fillRect()` forces the browser to perform anti-aliasing calculations, dramatically slowing canvas rendering and preventing 60fps.

**Why it happens:**
Parallax animations often calculate positions using floats (e.g., `x * 0.3`). Developers pass these directly to Canvas methods without rounding. The browser must blend pixels for sub-pixel positioning.

**How to avoid:**
Always use `Math.floor()` or `Math.round()` on coordinates before passing to Canvas drawing methods.

```javascript
// WRONG: Sub-pixel coordinates force anti-aliasing
const offset = time * 0.3;
ctx.drawImage(starLayer, offset, 0);

// CORRECT: Integer coordinates enable fast pixel-aligned rendering
const offset = Math.floor(time * 0.3);
ctx.drawImage(starLayer, offset, 0);
```

**Warning signs:**
- Frame rate stuck at 30fps instead of 60fps
- Chrome DevTools Performance shows excessive "Paint" time
- Visuals appear slightly blurry despite crisp source images
- CPU usage high despite simple drawings

**Phase to address:**
Phase 4 (Parallax Space Scene) - During parallax layer implementation, enforce integer coordinates.

**Sources:**
- [MDN Optimizing Canvas](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Optimizing_canvas)

---

### Pitfall 7: Single Canvas for Everything (No Layering)

**What goes wrong:**
Drawing static background, dynamic parallax layers, and reactive visuals on a single canvas forces complete redraws every frame (60fps = redrawing everything 60 times/second). Massive performance waste.

**Why it happens:**
Tutorials often show single-canvas examples for simplicity. Developers don't realize browsers can composite multiple canvases efficiently using GPU acceleration.

**How to avoid:**
Use multiple stacked canvases with CSS `position: absolute` and `z-index`. Redraw only layers that change.

```html
<!-- Static background: redraw rarely -->
<canvas id="bg-layer" style="position: absolute; z-index: 1;"></canvas>

<!-- Parallax stars: redraw every frame -->
<canvas id="parallax-layer" style="position: absolute; z-index: 2;"></canvas>

<!-- Audio-reactive visuals: redraw every frame -->
<canvas id="reactive-layer" style="position: absolute; z-index: 3;"></canvas>
```

```javascript
// Background drawn once or on resize
function drawBackground() {
  bgCtx.fillStyle = '#000';
  bgCtx.fillRect(0, 0, bgCanvas.width, bgCanvas.height);
}
drawBackground(); // Only once

// Parallax redrawn every frame
function animateParallax() {
  parallaxCtx.clearRect(0, 0, w, h);
  drawStars();
  requestAnimationFrame(animateParallax);
}

// Reactive redrawn every frame based on audio
function animateReactive() {
  reactiveCtx.clearRect(0, 0, w, h);
  drawFrequencyBars();
  requestAnimationFrame(animateReactive);
}
```

**Warning signs:**
- Drawing 1000+ stars every frame despite most being static
- Canvas clearing entire screen causes brief flicker
- Frame rate varies wildly (30-60fps) based on visual complexity
- Performance tab shows excessive "Rasterize Paint"

**Phase to address:**
Phase 4 (Parallax Space Scene) - Establish multi-canvas architecture before implementing complex visuals.

**Sources:**
- [MDN Optimizing Canvas - Layering](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Optimizing_canvas)

---

### Pitfall 8: Continuous Parallax Without Wrapping

**What goes wrong:**
Parallax layers scroll infinitely in one direction, eventually exceeding canvas bounds or causing coordinate overflow. Background disappears or jumps erratically.

**Why it happens:**
Developers implement parallax as `x += speed` without considering bounds. After several minutes, `x` becomes a huge number, exceeding JavaScript's safe integer range or canvas dimensions.

**How to avoid:**
Use modulo operator to wrap coordinates, creating seamless infinite scrolling.

```javascript
// WRONG: Coordinates grow unbounded
function updateParallax() {
  starX += speed;
  ctx.drawImage(stars, starX, 0);
}

// CORRECT: Wrap using modulo
function updateParallax() {
  starX = (starX + speed) % canvas.width;

  // Draw twice for seamless wrap
  ctx.drawImage(stars, starX, 0);
  ctx.drawImage(stars, starX - canvas.width, 0);
}
```

**Warning signs:**
- Background stops moving after several minutes
- Visual "jump" or discontinuity when coordinates reset
- Background elements suddenly disappear
- Coordinates show extreme values (> 1,000,000) in debugger

**Phase to address:**
Phase 4 (Parallax Space Scene) - Implement wrapping logic during parallax calculation.

---

### Pitfall 9: No Fallback for Unsupported Audio Formats

**What goes wrong:**
Loading M4A files from Apple Music Library fails in Firefox, which doesn't support AAC in Web Audio API's `decodeAudioData()`. User sees error or silent failure.

**Why it happens:**
Apple Music exports M4A (AAC). Chrome/Safari support AAC in Web Audio API, but Firefox only supports MP3/OGG/WAV. Developers test in Chrome/Safari and miss the incompatibility.

**How to avoid:**
Detect decode errors and provide user feedback. Consider transcoding M4A to MP3 server-side or in-browser using WebAssembly (FFmpeg.wasm).

```javascript
async function loadAudio(url) {
  const response = await fetch(url);
  const arrayBuffer = await response.arrayBuffer();

  try {
    const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
    return audioBuffer;
  } catch (error) {
    // Firefox can't decode M4A
    console.error('Decode failed:', error);
    showError('This audio format is not supported in your browser. Please use MP3 files.');
    return null;
  }
}
```

**Warning signs:**
- Audio works in Safari/Chrome but not Firefox
- Console shows "DOMException: Unable to decode audio data"
- Playlist loads but tracks don't play
- Different behavior across browsers with same files

**Phase to address:**
Phase 1 (Core Audio Playback) - Implement decode error handling during initial audio loading.

**Sources:**
- [Decoding MP3/OGG/AAC to Fix Web Audio API decodeAudioData Shortcomings](https://github.com/w3c/webcodecs/issues/366)
- [MDN Audio and Video Delivery](https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Audio_and_video_delivery)

---

### Pitfall 10: iOS Safari AudioContext "Interrupted" State

**What goes wrong:**
On iOS, when a user switches tabs, minimizes Safari, or receives a phone call, the AudioContext enters `"interrupted"` state (not `"suspended"`). Calling `resume()` doesn't always restore playback.

**Why it happens:**
iOS Safari uses non-standard `"interrupted"` state for system-level audio interruptions (calls, Siri, Control Center). This state isn't in the Web Audio API spec, so standard recovery patterns fail.

**How to avoid:**
Listen for `visibilitychange` and `focus` events to detect tab switches. Attempt resume on interaction and provide user-facing play button as fallback.

```javascript
// Handle iOS interruptions
audioCtx.addEventListener('statechange', () => {
  if (audioCtx.state === 'interrupted') {
    console.log('Audio interrupted (iOS)');
  }
});

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && audioCtx.state !== 'running') {
    audioCtx.resume().catch(err => {
      console.log('Resume failed, user interaction needed');
      showPlayButton(); // Let user manually resume
    });
  }
});

window.addEventListener('focus', () => {
  if (audioCtx.state === 'interrupted' || audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
});
```

**Warning signs:**
- Audio stops when user switches tabs on iOS
- `audioCtx.state` shows `"interrupted"` instead of `"suspended"`
- `resume()` promise resolves but audio doesn't play
- Works on desktop Safari but not iOS Safari

**Phase to address:**
Phase 5 (Polish & Cross-Browser Testing) - Test on actual iOS devices and implement state recovery.

**Sources:**
- [Context Stuck in Suspended State on iOS](https://github.com/WebAudio/web-audio-api/issues/790)
- [AudioContext Stuck on "Interrupted" in Safari](https://github.com/WebAudio/web-audio-api/issues/2585)
- [Unlock Web Audio in Safari for iOS](https://www.mattmontag.com/web/unlock-web-audio-in-safari-for-ios-and-macos)

---

## Technical Debt Patterns

Shortcuts that seem reasonable but create long-term problems.

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Skip autoplay policy handling | Faster initial dev, works when testing manually | Breaks for real users, requires full refactor of initialization | Never |
| Allocate arrays in animation loop | Simpler code, no upfront planning | Audio glitches, performance degradation | Never in production |
| Use single canvas for all layers | Easier to reason about, less HTML | Forces full redraws, prevents 60fps at scale | Prototyping only, refactor before polish |
| Hardcode FFT size to 2048 | Follows tutorial defaults | May be too slow for mobile or too coarse for visuals | MVP testing only, tune in Phase 2 |
| Ignore AudioNode cleanup | Faster to ship features | Memory leaks, crashes on mobile | Never |
| Skip error handling for audio decode | Works with test MP3s | Breaks with user's M4A files, no feedback | Local testing only, add before release |
| Use `setInterval` instead of `requestAnimationFrame` | Familiar timer API | Jank, battery drain, not synced to display | Never for animations |

## Integration Gotchas

Common mistakes when connecting to external services.

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Apple Music Library | Assuming M4A works in all browsers | Detect decode errors, transcode M4A to MP3 or show error message |
| Fullscreen API | Not handling ESC key exit | Listen for `fullscreenchange` event to detect user exit |
| File Upload | Loading entire audio file into memory at once | Stream via HTMLMediaElement or chunk fetch for large files |

## Performance Traps

Patterns that work at small scale but fail as usage grows.

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Creating new typed arrays every frame | Audio clicks, frame drops | Pre-allocate reusable buffers | Immediately at 60fps |
| Sub-pixel canvas coordinates | Blurry visuals, low frame rate | Use `Math.floor()` on all coordinates | Any animation |
| Single canvas for all layers | Excessive redraw time | Use stacked canvases, redraw only changed layers | 500+ visual elements |
| High FFT size (8192+) | Input lag, frame drops | Use 1024-2048 for real-time | Real-time visualization |
| Not disconnecting AudioNodes | Memory grows over time | Call `.disconnect()` on old nodes | After 10-20 track changes |
| Parallax without wrapping | Coordinates overflow, visuals disappear | Use modulo operator for bounds | After 5-10 minutes continuous playback |

## Security Mistakes

Domain-specific security issues beyond general web security.

| Mistake | Risk | Prevention |
|---------|------|------------|
| Loading audio from unvalidated URLs | XSS via crafted URLs, CORS errors | Validate URLs, use Content Security Policy, handle CORS properly |
| Exposing user's music library paths | Privacy leak (filesystem paths contain username) | Strip paths before logging/analytics, use blob URLs |
| No rate limiting on audio decode | DoS via malicious file upload | Limit concurrent decode operations, validate file size |

## UX Pitfalls

Common user experience mistakes in this domain.

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| No loading indicator for audio decode | App feels frozen for 2-10 seconds | Show progress bar during `decodeAudioData()` |
| Audio plays without user interaction | Violates autoplay policy, audio doesn't play | Require splash screen click before any audio |
| No volume control | Users can't adjust level, audio may be too loud | Provide visual volume slider connected to GainNode |
| Fullscreen exit not communicated | Users don't know how to exit | Show "Press ESC to exit" hint for 3 seconds on enter |
| Track change has no visual feedback | User doesn't know what's playing | Display track name, artist, progress bar |
| No error message for unsupported formats | Silent failure, user confused | Show clear error: "This format is not supported. Use MP3 files." |
| Audio continues when tab backgrounded | Battery drain, unexpected behavior on mobile | Pause or reduce volume when tab hidden (or intentionally continue for music player) |

## "Looks Done But Isn't" Checklist

Things that appear complete but are missing critical pieces.

- [ ] **Autoplay Implementation:** Demo works when you click around, but often missing the critical `AudioContext.resume()` call inside the first user gesture — verify context state is `"running"` before playback
- [ ] **Memory Management:** Playing 3 tracks works fine, but often missing `.disconnect()` on old AudioNodes — verify memory doesn't grow with devtools Memory tab after playing 20+ tracks
- [ ] **Canvas Performance:** Looks smooth on desktop, but often missing `Math.floor()` on coordinates — verify 60fps on mobile and low-end devices
- [ ] **Audio Format Support:** Works with test MP3s, but often missing decode error handling for M4A — verify error message appears when loading unsupported format
- [ ] **iOS Testing:** Works on Safari desktop, but often missing `"interrupted"` state handling — verify audio resumes after tab switch on actual iOS device
- [ ] **Fullscreen Edge Cases:** Enters fullscreen successfully, but often missing exit event handlers — verify UI updates correctly when user presses ESC or clicks browser UI
- [ ] **Track Transitions:** Next track plays, but often missing crossfade or gap handling — verify no click/pop between tracks
- [ ] **Long Session Stability:** Works for 5 minutes, but often leaks memory or accumulates GC pressure — verify no performance degradation after 30+ minutes continuous playback
- [ ] **Error Recovery:** Happy path works, but often missing user-facing error messages — verify clear feedback when audio load fails, decode fails, or format unsupported
- [ ] **Browser Compatibility:** Tested in Chrome only, often breaks in Firefox/Safari due to format support or API differences — verify in Chrome, Firefox, Safari (desktop + iOS)

## Recovery Strategies

When pitfalls occur despite prevention, how to recover.

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Autoplay violation (suspended context) | LOW | Add `audioCtx.resume()` call inside existing click handler, no architecture change |
| Garbage collection glitches | MEDIUM | Refactor animation loop to allocate buffers once, reuse them; requires testing to verify |
| Audio-visual desync | HIGH | Rewrite timing logic to use `AudioContext.currentTime` instead of rAF timestamps; affects multiple systems |
| Memory leak from AudioNodes | LOW | Add `.disconnect()` calls in track transition logic, add `onended` cleanup handlers |
| Sub-pixel rendering | LOW | Wrap coordinate calculations in `Math.floor()`, immediate fix |
| Single canvas performance | HIGH | Refactor to multi-canvas architecture, significant DOM/CSS changes, re-test rendering logic |
| Missing format error handling | LOW | Add try/catch around `decodeAudioData()`, show user-facing error message |
| iOS interrupted state | MEDIUM | Add event listeners for `visibilitychange` and context `statechange`, test on device |
| Parallax coordinate overflow | LOW | Add modulo wrapping to position calculations, adjust drawing logic for seamless wrap |
| FFT size too high/low | LOW | Adjust `fftSize` value, test visuals and performance, no architecture change |

## Pitfall-to-Phase Mapping

How roadmap phases should address these pitfalls.

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Autoplay policy violation | Phase 1: Core Audio Playback | Verify context state is `"running"` after splash click |
| Format decode errors | Phase 1: Core Audio Playback | Verify error message appears for M4A in Firefox |
| Garbage collection glitches | Phase 2: Audio Analysis & Visualization | Verify no audio glitches after 5 minutes, no GC pauses in Performance tab |
| Audio-visual desync | Phase 2: Audio Analysis & Visualization | Verify visuals sync to audio across 3+ tracks, no drift over time |
| AnalyserNode FFT misconfiguration | Phase 2: Audio Analysis & Visualization | Verify 60fps with chosen FFT size on mobile device |
| Memory leak from AudioNodes | Phase 3: Track Transitions | Verify memory stable after playing 20 tracks in Memory tab |
| Sub-pixel rendering | Phase 4: Parallax Space Scene | Verify 60fps with integer coordinates, no blur |
| Single canvas (no layering) | Phase 4: Parallax Space Scene | Verify multi-canvas architecture, measure redraw performance |
| Parallax coordinate overflow | Phase 4: Parallax Space Scene | Verify seamless wrapping after 10+ minutes continuous playback |
| iOS interrupted state | Phase 5: Polish & Testing | Verify audio resumes on iOS after tab switch, call interruption |

## Sources

**Official Documentation:**
- [MDN Web Audio API Best Practices](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Best_practices)
- [MDN Optimizing Canvas](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Optimizing_canvas)
- [MDN Autoplay Guide for Media and Web Audio](https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Autoplay)
- [MDN AnalyserNode.fftSize](https://developer.mozilla.org/en-US/docs/Web/API/AnalyserNode/fftSize)
- [Chrome Autoplay Policy](https://developer.chrome.com/blog/autoplay)

**Performance & Debugging:**
- [Web Audio Performance and Debugging Notes (Paul Adenot)](https://padenot.github.io/web-audio-perf/)
- [Profiling Web Audio Apps in Chrome](https://web.dev/profiling-web-audio-apps-in-chrome/)
- [A Tale of Two Clocks - Audio Scheduling](https://web.dev/articles/audio-scheduling)

**Community Knowledge:**
- [Real-Time Audio in the Browser: Making AudioWorklet Fast](https://engineering.videocall.rs/posts/how-to-make-javascript-audio-not-suck/)
- [Synchronize Animation to Audio with Web Audio](https://hansgaron.com/articles/web_audio/animation_sync_with_audio/part_one/)
- [Unlock Web Audio in Safari iOS](https://www.mattmontag.com/web/unlock-web-audio-in-safari-for-ios-and-macos)
- [Parallax Done Right](https://medium.com/@dhg/parallax-done-right-82ced812e61c)
- [Fixing Parallax Scrolling to Run at 60 FPS](https://kristerkari.github.io/adventures-in-webkit-land/blog/2013/08/30/fixing-a-parallax-scrolling-website-to-run-in-60-fps/)

**Issue Trackers & Discussions:**
- [WebAudio/web-audio-api Issues (GitHub)](https://github.com/WebAudio/web-audio-api/issues)
- [Context Stuck in Suspended State on iOS](https://github.com/WebAudio/web-audio-api/issues/790)
- [MediaStreamAudioSourceNode Memory Leak](https://github.com/WebAudio/web-audio-api/issues/2484)
- [AudioNode Disconnect Memory Issue](https://github.com/WebAudio/web-audio-api/issues/904)

---
*Pitfalls research for: Cosmic Player (Immersive Web Audio/Visual Player)*
*Researched: 2026-02-12*
*Confidence: HIGH - Verified with official MDN docs, Chrome/web.dev articles, and multiple community sources*
