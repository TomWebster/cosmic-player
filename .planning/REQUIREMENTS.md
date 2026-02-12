# Requirements: Cosmic Player

**Defined:** 2026-02-12
**Core Value:** The moment you enter, you're transported — music and visuals fuse into a single immersive experience that holds you.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Entry

- [ ] **ENTR-01**: Visitor sees a click-to-enter splash screen on page load
- [ ] **ENTR-02**: Clicking the splash triggers AudioContext creation and begins playback
- [ ] **ENTR-03**: After entry, the full-viewport Canvas space scene is revealed

### Audio Playback

- [ ] **PLAY-01**: Audio player loads a single playlist of local audio files (mp3, m4a, wav, aiff, and other browser-supported formats) and begins playing the first track
- [ ] **PLAY-02**: Player auto-advances to the next track when the current track ends
- [ ] **PLAY-03**: Player loops back to the first track after the last track finishes
- [ ] **PLAY-04**: User can skip to the next track
- [ ] **PLAY-05**: User can skip to the previous track
- [ ] **PLAY-06**: User can adjust volume via a slider control
- [ ] **PLAY-07**: User can mute/unmute audio

### Visual Scene

Visual style blends the vast sparse emptiness of 80s Elite (BBC Micro) with the smooth ambient motion of macOS screensavers, informed by The Designers Republic's clean futuristic graphic aesthetic.

- [ ] **SCNE-01**: Full-viewport 2D Canvas renders an infinite black space backdrop
- [ ] **SCNE-02**: Sparse bright starfield rendered across the background layer
- [ ] **SCNE-03**: A large Saturn-colored planet rendered in the midground
- [ ] **SCNE-04**: Two subtle khaki-colored moons rendered in the foreground — understated, not dominant
- [ ] **SCNE-05**: A distant sun rendered as a light source
- [ ] **SCNE-06**: Scene elements drift with slow parallax motion at different layer speeds
- [ ] **SCNE-07**: Animation maintains smooth 60fps performance

### Audio Reactivity

- [ ] **REAC-01**: Web Audio API AnalyserNode extracts frequency data from the playing audio
- [ ] **REAC-02**: Stars subtly pulse in brightness in response to audio intensity
- [ ] **REAC-03**: Planet glow subtly modulates with bass frequency energy
- [ ] **REAC-04**: Visual reactions are very gentle and slow — atmospheric, not aggressive, never fast or twitchy
- [ ] **REAC-05**: Heavy smoothing/interpolation with long time constants prevents jittery visual changes — reactions evolve over seconds, not frames

### Track Info

- [ ] **INFO-01**: Current track title is displayed on screen during playback
- [ ] **INFO-02**: Current track artist is displayed on screen during playback

### Data

- [ ] **DATA-01**: Playlist is loaded from a JSON file containing track metadata and file paths
- [ ] **DATA-02**: JSON playlist is generated from Apple Music Library XML via the appleMusicTools pipeline

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Controls & Interaction

- **CTRL-01**: User can play/pause playback with a toggle button
- **CTRL-02**: Keyboard shortcuts for playback control (spacebar, arrows)
- **CTRL-03**: Controls overlay auto-hides after period of inactivity
- **CTRL-04**: Loading indicator displays while audio buffers

### Track Info

- **INFO-03**: Album art displayed alongside track info

### Visual Enhancements

- **VISU-01**: Mobile touch gestures for skip and volume
- **VISU-02**: Visual intensity slider to adjust reactivity level

### Playlist Management

- **LIST-01**: Session persistence — playlist and position survive page refresh
- **LIST-02**: Multiple playlist support with playlist switcher

## Out of Scope

| Feature | Reason |
|---------|--------|
| Scrubbing/seeking within track | Breaks immersive flow; encourages skipping vs listening |
| Real-time waveform display | Clutters immersive aesthetic, distracts from scene |
| User-customizable visualizer themes | Destroys curated aesthetic; quality over customization |
| Social sharing / playlist export | Adds backend infrastructure; keep it personal |
| Equalizer / audio DSP effects | Out of scope; respect artist's mix |
| Cloud-hosted audio files | Deferred to later iteration; local files first |
| OAuth / user accounts | Anonymous public access only |
| WebGL / 3D rendering | Canvas 2D chosen for balance of quality and simplicity |
| Multiple visual scenes | Focus on perfecting one cosmic scene first |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| ENTR-01 | — | Pending |
| ENTR-02 | — | Pending |
| ENTR-03 | — | Pending |
| PLAY-01 | — | Pending |
| PLAY-02 | — | Pending |
| PLAY-03 | — | Pending |
| PLAY-04 | — | Pending |
| PLAY-05 | — | Pending |
| PLAY-06 | — | Pending |
| PLAY-07 | — | Pending |
| SCNE-01 | — | Pending |
| SCNE-02 | — | Pending |
| SCNE-03 | — | Pending |
| SCNE-04 | — | Pending |
| SCNE-05 | — | Pending |
| SCNE-06 | — | Pending |
| SCNE-07 | — | Pending |
| REAC-01 | — | Pending |
| REAC-02 | — | Pending |
| REAC-03 | — | Pending |
| REAC-04 | — | Pending |
| REAC-05 | — | Pending |
| INFO-01 | — | Pending |
| INFO-02 | — | Pending |
| DATA-01 | — | Pending |
| DATA-02 | — | Pending |

**Coverage:**
- v1 requirements: 26 total
- Mapped to phases: 0
- Unmapped: 26 (pending roadmap creation)

---
*Requirements defined: 2026-02-12*
*Last updated: 2026-02-12 after initial definition*
