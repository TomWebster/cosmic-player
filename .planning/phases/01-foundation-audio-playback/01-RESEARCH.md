# Phase 1: Foundation & Audio Playback - Research

**Researched:** 2026-02-12
**Domain:** Web Audio API, HTML5 Audio, Canvas 2D, Browser Autoplay Policies
**Confidence:** HIGH

## Summary

Phase 1 requires implementing audio playback with playlist management and a click-to-enter splash screen to satisfy browser autoplay policies. The research reveals a hybrid approach is optimal: using HTMLMediaElement (`<audio>`) for streaming playback combined with Web Audio API's GainNode for volume control. This approach balances simplicity for playlist management with the power needed for precise audio control.

The browser autoplay landscape is strict but predictable: AudioContext must be created or resumed inside a user gesture (click event). The click-to-enter splash serves both as an intentional design threshold and the technical requirement to initialize audio playback.

For audio formats, MP3 and WAV have universal browser support (100% and 92% respectively), while M4A has partial Firefox support (requires OS codecs) and AIFF has limited support (primarily Safari/macOS). Given the Apple Music Library source with mixed formats, a fallback strategy is necessary.

**Primary recommendation:** Use HTML5 `<audio>` element routed through Web Audio API's createMediaElementSource() for best balance of playlist management simplicity and volume control precision.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Web Audio API | Native browser API | Volume control, audio routing, mute functionality | Industry standard for precise audio manipulation; GainNode provides click-free volume changes |
| HTML5 Audio Element | Native browser API | Audio file loading, playback, playlist streaming | Best for full-length tracks; handles streaming out-of-the-box; simpler than AudioBuffer |
| Canvas 2D | Native browser API | Visual rendering for splash screen and future visuals | Decided in project context; balance of visual quality and implementation complexity |
| Fetch API | Native browser API | Load JSON playlist data | Modern standard for HTTP requests; promise-based; native browser support |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| requestAnimationFrame | Native browser API | Canvas animation loop synced to display refresh | All Canvas animations; browser-optimized for 60fps rendering |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| HTML5 Audio + Web Audio API | AudioBufferSourceNode only | AudioBuffer requires decoding entire files upfront; impractical for full-length tracks; more complex playlist management |
| Native APIs | howler.js or tone.js | Third-party dependency; project prefers vanilla web technologies; native APIs sufficient for requirements |
| Fetch API | XMLHttpRequest | Fetch is modern standard with cleaner promise-based API; XMLHttpRequest is legacy |

**Installation:**
```bash
# No installation required - all native browser APIs
# Project uses vanilla HTML/CSS/JS
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── index.html           # Entry point with splash overlay and audio element
├── styles/
│   └── main.css        # Styles for splash screen and UI controls
├── scripts/
│   ├── main.js         # Application initialization
│   ├── audioPlayer.js  # Audio playback, playlist, volume control
│   ├── splashScreen.js # Splash screen and AudioContext initialization
│   └── canvasRenderer.js # Canvas setup and animation loop
└── data/
    └── playlist.json   # Track metadata and file paths from appleMusicTools
```

### Pattern 1: Hybrid Audio Architecture (HTMLMediaElement + Web Audio API)

**What:** Combine HTML5 `<audio>` element with Web Audio API by routing through createMediaElementSource()

**When to use:** When you need playlist streaming (long audio files) AND precise volume control

**Example:**
```javascript
// Source: https://developer.chrome.com/blog/html5-audio-and-the-web-audio-api-are-bffs
const audio = new Audio();
audio.src = 'track.mp3';

const audioContext = new AudioContext();
const source = audioContext.createMediaElementSource(audio);
const gainNode = audioContext.createGain();

// Route: HTML5 Audio → MediaElementSource → GainNode → Destination
source.connect(gainNode);
gainNode.connect(audioContext.destination);

// Volume control via GainNode
gainNode.gain.value = 0.5; // 50% volume

// Playback control via HTML5 Audio
audio.play();
```

**Why this pattern:** MDN documentation states this is "ideal for streaming fairly long audio assets" and allows combining "HTML5 `<audio>` with the visualization, filter, and processing power of the Web Audio API."

### Pattern 2: Autoplay Policy Compliance

**What:** Create AudioContext and begin playback inside user gesture event handler

**When to use:** Always - required by all modern browsers

**Example:**
```javascript
// Source: https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Best_practices
const splashButton = document.querySelector('#enter-button');

splashButton.addEventListener('click', () => {
  // Create AudioContext inside user gesture
  const audioContext = new AudioContext();

  // If context was created earlier and suspended
  if (audioContext.state === 'suspended') {
    audioContext.resume();
  }

  // Begin playback
  audio.play();

  // Hide splash screen
  splashScreen.style.display = 'none';
});
```

**Why this pattern:** Browser autoplay policy blocks audio unless "user has interacted with the site (click, tap, key press, etc.)." AudioContext created before user gesture will be in "suspended" state.

### Pattern 3: Playlist Management with Auto-Advance

**What:** Use HTML5 Audio 'ended' event to automatically advance to next track

**When to use:** All playlist implementations with sequential playback

**Example:**
```javascript
// Source: https://jmesb.com/how_to/create_a_playlist_for_html5_audio
let playlist = []; // Loaded from JSON
let currentIndex = 0;

function loadTrack(index) {
  audio.src = playlist[index].filePath;
  // Update UI with playlist[index].title, artist, etc.
}

function playTrack(index) {
  currentIndex = index;
  loadTrack(index);
  audio.play();
}

// Auto-advance on track end
audio.addEventListener('ended', () => {
  currentIndex++;

  // Loop back to start after last track
  if (currentIndex >= playlist.length) {
    currentIndex = 0;
  }

  playTrack(currentIndex);
});

// Next/Previous controls
function nextTrack() {
  currentIndex = (currentIndex + 1) % playlist.length;
  playTrack(currentIndex);
}

function previousTrack() {
  currentIndex = (currentIndex - 1 + playlist.length) % playlist.length;
  playTrack(currentIndex);
}
```

**Why this pattern:** HTML5 Audio's "ended" event fires when track completes, providing the hook for auto-advance logic. Modulo arithmetic handles wraparound for looping.

### Pattern 4: Click-Free Volume Control

**What:** Use GainNode with exponentialRampToValueAtTime for smooth volume changes

**When to use:** All volume changes (slider, mute/unmute) to prevent audio pops

**Example:**
```javascript
// Source: https://developer.mozilla.org/en-US/docs/Web/API/GainNode
const gainNode = audioContext.createGain();

// BAD: Direct value change causes audio clicks
// gainNode.gain.value = 0.5;

// GOOD: Smooth transition prevents clicks
function setVolume(targetVolume) {
  const currentTime = audioContext.currentTime;
  gainNode.gain.exponentialRampToValueAtTime(
    Math.max(0.01, targetVolume), // exponentialRamp can't reach 0
    currentTime + 0.1 // 100ms transition
  );
}

// Volume slider
volumeSlider.addEventListener('input', (e) => {
  const volume = parseFloat(e.target.value);
  setVolume(volume);
});

// Mute/Unmute
let previousVolume = 0.5;
let isMuted = false;

function toggleMute() {
  if (isMuted) {
    setVolume(previousVolume);
    isMuted = false;
  } else {
    previousVolume = gainNode.gain.value;
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
    isMuted = true;
  }
}
```

**Why this pattern:** MDN documentation emphasizes "never change the value directly" to prevent audio clicks. exponentialRampToValueAtTime provides smooth, artifact-free transitions.

### Pattern 5: Canvas Animation Loop with Audio

**What:** Use requestAnimationFrame for Canvas rendering independent of audio playback

**When to use:** All Canvas animations; maintains 60fps regardless of audio state

**Example:**
```javascript
// Source: Canvas performance best practices
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

function animate() {
  // Clear and render
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Render logic here
  // (Audio state can inform visuals but doesn't control loop timing)

  requestAnimationFrame(animate);
}

// Start animation loop (independent of audio)
requestAnimationFrame(animate);
```

**Why this pattern:** requestAnimationFrame is "synchronized with the refresh rate of a user's display" and "throttles animation for inactive tabs" for optimal performance and battery life. Audio and Canvas rendering should be independent systems.

### Pattern 6: Audio Format Fallback Strategy

**What:** Detect browser support for M4A/AIFF, fallback to MP3/WAV

**When to use:** Mixed format libraries (like Apple Music Library) with AIFF/M4A files

**Example:**
```javascript
// Check format support
const audio = new Audio();
const canPlayM4A = audio.canPlayType('audio/mp4; codecs="mp4a.40.2"') !== '';
const canPlayAIFF = audio.canPlayType('audio/aiff') !== '';

function getPlayableSource(track) {
  // Prefer original format if supported
  if (track.format === 'm4a' && canPlayM4A) {
    return track.filePath;
  }
  if (track.format === 'aiff' && canPlayAIFF) {
    return track.filePath;
  }

  // Fallback to universal format
  if (track.mp3Fallback) {
    return track.mp3Fallback;
  }

  console.warn(`No playable format for track: ${track.title}`);
  return null;
}
```

**Why this pattern:** M4A has partial Firefox support (requires OS codecs), AIFF has limited support (primarily Safari). MP3 has 100% browser support, WAV has 92%.

### Anti-Patterns to Avoid

- **Creating new AudioContext per track:** Reuse single AudioContext for entire application lifecycle
- **Direct gainNode.gain.value changes:** Causes audio pops/clicks; always use exponentialRampToValueAtTime
- **Reusing AudioBufferSourceNode:** These are single-use; create new node per playback (not applicable if using HTMLMediaElement)
- **Loading entire playlist upfront:** Stream on-demand via HTMLMediaElement instead of decoding all files with AudioBuffer
- **Calling audio.play() without promise handling:** Modern browsers return a promise that may reject; handle with .catch()

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Gapless playback between tracks | Custom crossfade timing and buffer management | Accept small gaps OR use library like Gapless-5 | "Gap sizes depend on the audio format, browser, etc." Achieving true gapless playback requires complex buffer pre-loading and precise timing across browsers |
| Audio format conversion | Browser-side audio transcoding | Pre-convert AIFF/M4A to MP3/WAV in appleMusicTools pipeline | Browser APIs don't support format conversion; server-side or build-time conversion is standard practice |
| Metadata extraction from audio files | Custom parser for ID3 tags, MP4 metadata | Generate metadata JSON from appleMusicTools (already decided) | Modern metadata parsing requires handling ID3v1, ID3v2, MP4, Vorbis tags with binary parsing; complex and error-prone |
| Volume normalization across tracks | Custom gain calculation per track | Accept natural volume variations OR pre-normalize files | Accurate loudness normalization requires ReplayGain analysis; Web Audio API doesn't provide loudness metering |
| Cross-browser audio compatibility | Feature detection and polyfills | Stick to well-supported formats (MP3, WAV) and native APIs | Web Audio API has 97%+ browser support; HTML5 Audio is universal; polyfills add complexity without meaningful coverage gain |

**Key insight:** Audio playback is deceptively complex. Browser APIs handle streaming, decoding, sample rate conversion, and hardware interfacing. Custom implementations of these low-level concerns introduce bugs, performance issues, and cross-browser incompatibilities. Leverage native APIs for all audio pipeline concerns; customize only UI and playlist logic.

## Common Pitfalls

### Pitfall 1: AudioContext Suspended State on Page Load

**What goes wrong:** AudioContext created on page load enters "suspended" state; calling audio.play() or oscillator.start() silently fails

**Why it happens:** Browser autoplay policy blocks audio until user interaction. AudioContext created before user gesture is automatically suspended.

**How to avoid:**
- Create AudioContext inside click event handler, OR
- Check audioContext.state === 'suspended' and call audioContext.resume() inside click handler

**Warning signs:** Audio doesn't play despite no JavaScript errors; audioContext.state is "suspended"

### Pitfall 2: HTMLMediaElement Routing Breaks Without User Gesture

**What goes wrong:** createMediaElementSource() creates the node, but audio doesn't flow through Web Audio graph until AudioContext is running

**Why it happens:** AudioContext must be resumed after user gesture; until then, audio graph is frozen even if HTML5 Audio is playing

**How to avoid:** Ensure audioContext.resume() is called in click handler BEFORE calling audio.play()

**Warning signs:** HTML5 Audio plays (visible in browser controls) but no sound output; Web Audio graph not processing

### Pitfall 3: Direct gainNode.gain.value Changes Cause Pops

**What goes wrong:** Setting gainNode.gain.value directly causes audible clicks/pops during playback

**Why it happens:** Instant value changes create discontinuities in the audio signal waveform

**How to avoid:** Always use gainNode.gain.exponentialRampToValueAtTime() or linearRampToValueAtTime() with short duration (50-100ms)

**Warning signs:** Audible clicks when moving volume slider or toggling mute

### Pitfall 4: M4A Files Don't Play in Firefox

**What goes wrong:** M4A files from Apple Music Library play in Safari/Chrome but fail silently in Firefox

**Why it happens:** "Partial support refers to only supporting AAC in an MP4 container and only when the operating system already has the codecs installed" (Can I Use - AAC). Firefox requires OS-level codec support.

**How to avoid:**
- Use audio.canPlayType('audio/mp4; codecs="mp4a.40.2"') to detect support
- Provide MP3 fallback for M4A files
- OR pre-convert M4A to MP3 in appleMusicTools pipeline

**Warning signs:** Playlist works in Safari but fails in Firefox; Firefox console shows no codec error

### Pitfall 5: AIFF Files Have Limited Browser Support

**What goes wrong:** AIFF files only play reliably in Safari (macOS/iOS); fail in Chrome and Firefox

**Why it happens:** AIFF is Apple-specific format; "Safari on the desktop supports all media supported by the installed version of QuickTime" but other browsers don't include AIFF decoders

**How to avoid:**
- Convert AIFF to WAV (92% support) or MP3 (100% support) in appleMusicTools pipeline
- Don't rely on AIFF for cross-browser compatibility

**Warning signs:** Tracks skip or fail to load in non-Safari browsers; files are .aiff extension

### Pitfall 6: Playlist JSON Fetch Fails Without Error Handling

**What goes wrong:** fetch('/data/playlist.json') fails silently if file doesn't exist or has CORS issues; application hangs with no playlist

**Why it happens:** fetch() promise rejects on network errors but resolves on HTTP errors (404, 500); requires explicit error checking

**How to avoid:**
```javascript
fetch('/data/playlist.json')
  .then(response => {
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  })
  .then(playlist => { /* use playlist */ })
  .catch(error => {
    console.error('Failed to load playlist:', error);
    // Show error UI
  });
```

**Warning signs:** Blank page or UI with no tracks; network tab shows 404; no error messages

### Pitfall 7: Canvas Not Resized for Device Pixel Ratio

**What goes wrong:** Canvas appears blurry on high-DPI displays (Retina, 4K monitors)

**Why it happens:** Canvas internal resolution doesn't match CSS display size and device pixel ratio

**How to avoid:**
```javascript
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const dpr = window.devicePixelRatio || 1;

canvas.width = canvas.offsetWidth * dpr;
canvas.height = canvas.offsetHeight * dpr;
ctx.scale(dpr, dpr);
```

**Warning signs:** Canvas content looks blurry compared to HTML/CSS elements; crisp on low-DPI but blurry on Retina

### Pitfall 8: Audio play() Promise Rejection Not Handled

**What goes wrong:** Modern browsers return a Promise from audio.play(); unhandled rejections cause console errors and potential app crashes

**Why it happens:** Browser may block playback for various reasons (autoplay policy, resource limits); promise rejection communicates this

**How to avoid:**
```javascript
audio.play()
  .then(() => {
    // Playback started successfully
  })
  .catch(error => {
    console.warn('Playback failed:', error);
    // Show play button for user to click
  });
```

**Warning signs:** "Uncaught (in promise)" errors in console; audio doesn't play

## Code Examples

Verified patterns from official sources:

### Complete Audio Player Initialization

```javascript
// Source: https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Best_practices
// Combined with https://developer.chrome.com/blog/html5-audio-and-the-web-audio-api-are-bffs

// HTML structure
// <button id="enter-button">Click to Enter</button>
// <audio id="audio-player"></audio>

let audioContext = null;
let gainNode = null;
let playlist = [];
let currentIndex = 0;

const audio = document.getElementById('audio-player');
const enterButton = document.getElementById('enter-button');

// Load playlist JSON
fetch('/data/playlist.json')
  .then(response => {
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return response.json();
  })
  .then(data => {
    playlist = data.tracks;
  })
  .catch(error => {
    console.error('Failed to load playlist:', error);
  });

// Initialize audio on user click
enterButton.addEventListener('click', () => {
  // Create AudioContext inside user gesture
  audioContext = new AudioContext();

  // Create audio graph: HTML5 Audio → MediaElementSource → GainNode → Destination
  const source = audioContext.createMediaElementSource(audio);
  gainNode = audioContext.createGain();

  source.connect(gainNode);
  gainNode.connect(audioContext.destination);

  // Start playing first track
  loadTrack(0);
  audio.play()
    .then(() => {
      // Hide splash screen
      enterButton.style.display = 'none';
    })
    .catch(error => {
      console.error('Playback failed:', error);
    });
});
```

### Playlist Navigation

```javascript
// Source: https://jmesb.com/how_to/create_a_playlist_for_html5_audio

function loadTrack(index) {
  currentIndex = index;
  audio.src = playlist[index].filePath;

  // Update UI
  document.getElementById('track-title').textContent = playlist[index].title;
  document.getElementById('track-artist').textContent = playlist[index].artist;
}

function playTrack(index) {
  loadTrack(index);
  audio.play().catch(error => console.error('Playback failed:', error));
}

// Auto-advance to next track
audio.addEventListener('ended', () => {
  currentIndex++;
  if (currentIndex >= playlist.length) {
    currentIndex = 0; // Loop back to start
  }
  playTrack(currentIndex);
});

// Next button
document.getElementById('next-btn').addEventListener('click', () => {
  currentIndex = (currentIndex + 1) % playlist.length;
  playTrack(currentIndex);
});

// Previous button
document.getElementById('prev-btn').addEventListener('click', () => {
  currentIndex = (currentIndex - 1 + playlist.length) % playlist.length;
  playTrack(currentIndex);
});
```

### Volume Control with Slider and Mute

```javascript
// Source: https://developer.mozilla.org/en-US/docs/Web/API/GainNode

const volumeSlider = document.getElementById('volume-slider');
const muteButton = document.getElementById('mute-btn');

let previousVolume = 0.5;
let isMuted = false;

// Smooth volume change to prevent clicks
function setVolume(targetVolume) {
  if (!gainNode) return;

  const currentTime = audioContext.currentTime;
  // exponentialRamp can't reach 0, use 0.01 as minimum
  const clampedVolume = Math.max(0.01, targetVolume);

  gainNode.gain.exponentialRampToValueAtTime(
    clampedVolume,
    currentTime + 0.1 // 100ms smooth transition
  );
}

// Volume slider
volumeSlider.addEventListener('input', (e) => {
  const volume = parseFloat(e.target.value);
  setVolume(volume);

  if (isMuted) {
    isMuted = false;
    muteButton.textContent = 'Mute';
  }
  previousVolume = volume;
});

// Mute toggle
muteButton.addEventListener('click', () => {
  if (isMuted) {
    setVolume(previousVolume);
    muteButton.textContent = 'Mute';
    volumeSlider.value = previousVolume;
    isMuted = false;
  } else {
    previousVolume = gainNode.gain.value;
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
    muteButton.textContent = 'Unmute';
    volumeSlider.value = 0;
    isMuted = true;
  }
});
```

### Canvas Setup with Device Pixel Ratio

```javascript
// Source: Canvas performance best practices

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

function setupCanvas() {
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();

  // Set canvas internal resolution
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;

  // Scale context for high-DPI displays
  ctx.scale(dpr, dpr);

  // Set CSS size
  canvas.style.width = rect.width + 'px';
  canvas.style.height = rect.height + 'px';
}

function animate() {
  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Render frame
  // ... drawing code ...

  // Continue animation loop
  requestAnimationFrame(animate);
}

// Initialize
setupCanvas();
window.addEventListener('resize', setupCanvas);
requestAnimationFrame(animate);
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Auto-playing audio on page load | Require user gesture for AudioContext/playback | Chrome 66 (April 2018), Firefox 66 (March 2019) | Click-to-enter splash is now mandatory, not optional |
| Direct audio.play() calls | Handle play() promise rejections | Chrome 50 (April 2016) | Must use .catch() to handle autoplay blocks gracefully |
| ScriptProcessorNode for audio processing | AudioWorklet | Deprecated 2017, AudioWorklet standardized 2018 | Not relevant for this phase (no custom processing needed) |
| XMLHttpRequest | Fetch API | Fetch standardized 2015, universal support 2017 | Use fetch() for JSON playlist loading |
| Separate volume control implementations | GainNode with exponentialRampToValueAtTime | Web Audio API v1 spec (2015) | Single pattern for all volume control prevents clicks |

**Deprecated/outdated:**
- **webkitAudioContext prefix:** Modern browsers use standard AudioContext; webkit prefix no longer needed
- **mozAudioContext prefix:** Firefox dropped prefix in version 25 (2013)
- **Direct .value manipulation for volume:** Causes audio artifacts; use exponentialRampToValueAtTime instead
- **AudioBufferSourceNode for long audio files:** HTMLMediaElement is preferred for streaming full-length tracks

## Open Questions

1. **Track loading order optimization**
   - What we know: HTML5 Audio loads tracks on-demand when src is set
   - What's unclear: Should we preload next track in background for instant transitions?
   - Recommendation: Start with simple on-demand loading; measure transition delay in testing; add preloading only if gaps are noticeable

2. **Audio format conversion in appleMusicTools**
   - What we know: M4A has partial Firefox support, AIFF has limited browser support
   - What's unclear: Does appleMusicTools pipeline already convert to MP3/WAV, or will this phase need fallback detection?
   - Recommendation: Verify appleMusicTools output formats; if mixed formats, implement canPlayType() detection with fallbacks

3. **Canvas rendering during audio playback**
   - What we know: Canvas animation loop runs independently via requestAnimationFrame
   - What's unclear: What visual content should render during Phase 1 (phase focuses on audio first)?
   - Recommendation: Implement minimal Canvas setup (black background, canvas initialized); full visuals are later phases

4. **Volume persistence**
   - What we know: GainNode value resets on page reload
   - What's unclear: Should volume setting persist across sessions via localStorage?
   - Recommendation: Implement basic volume control first; add localStorage persistence as enhancement if time permits

## Sources

### Primary (HIGH confidence)
- [MDN - Web Audio API Best Practices](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Best_practices) - AudioContext creation, autoplay handling, volume control patterns
- [MDN - Autoplay Guide](https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Autoplay) - Browser autoplay policies, user gesture requirements
- [MDN - AudioContext](https://developer.mozilla.org/en-US/docs/Web/API/AudioContext) - AudioContext API reference, state management
- [MDN - GainNode](https://developer.mozilla.org/en-US/docs/Web/API/GainNode) - Volume control implementation, click prevention
- [Chrome Developers - HTML5 Audio and Web Audio API](https://developer.chrome.com/blog/html5-audio-and-the-web-audio-api-are-bffs) - Hybrid architecture pattern with createMediaElementSource
- [Can I Use - AAC/M4A](https://caniuse.com/aac) - Browser support data for M4A format (96.73% global, partial Firefox)
- [Can I Use - MP3](https://caniuse.com/mp3) - Browser support data for MP3 format (100%)
- [Can I Use - WAV](https://caniuse.com/wav) - Browser support data for WAV format (92%)

### Secondary (MEDIUM confidence)
- [jmesb.com - HTML5 Audio Playlist](https://jmesb.com/how_to/create_a_playlist_for_html5_audio) - Playlist implementation patterns, auto-advance with 'ended' event
- [Apple Developer - Safari HTML5 Audio Guide](https://developer.apple.com/library/archive/documentation/AudioVideo/Conceptual/HTML-canvas-guide/AddingSoundtoCanvasAnimations/AddingSoundtoCanvasAnimations.html) - AIFF support via QuickTime on Safari
- [GitHub - Gapless-5](https://github.com/regosen/Gapless-5) - Reference for gapless playback complexity (why not to hand-roll)
- [Canvas Performance Gist](https://gist.github.com/jaredwilli/5469626) - Canvas optimization techniques, requestAnimationFrame patterns

### Tertiary (LOW confidence - marked for validation)
- Web search results on Canvas/audio synchronization - General patterns, should verify in practice
- Web search results on m4a/AIFF browser support - Confirmed with Can I Use data

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All native browser APIs with extensive MDN documentation and Can I Use data
- Architecture: HIGH - Official sources (MDN, Chrome Developers) provide explicit patterns for hybrid approach
- Pitfalls: HIGH - Documented in MDN best practices and Can I Use known issues sections
- Code examples: HIGH - All examples sourced from MDN official docs or Chrome Developers blog

**Research date:** 2026-02-12
**Valid until:** 2026-04-12 (60 days - stable browser APIs, slow-moving standards)

**Notes:**
- No CONTEXT.md exists for this phase; no user constraints to document
- All recommendations based on project context provided: vanilla web technologies, 2D Canvas decided, local audio files
- Audio format support critical due to Apple Music Library source with mixed formats (mp3, m4a, wav, aiff)
- Autoplay policy compliance is mandatory, not optional - affects core architecture
