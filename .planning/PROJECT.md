# Cosmic Player

## What This Is

An immersive fullscreen music player website that plays a single curated playlist against a slowly animated deep-space scene. Visitors click to enter, then are enveloped in infinite blackness with a Saturn-colored planet, twin khaki moons, distant sun, and sparse rich starlight — while breakbeat hardcore, Detroit techno, and experimental guitar wash over them. The visuals respond very subtly to the music, drifting with the slow grandeur of Apple's Sequoia-era screensavers but darker and sparser.

## Core Value

The moment you enter, you're transported — music and visuals fuse into a single immersive experience that holds you.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Click-to-enter splash screen that triggers audio context and transitions to fullscreen immersion
- [ ] 2D layered Canvas space scene: infinite black backdrop, sparse rich starfield, distant sun, Saturn-colored planet with twin khaki moons
- [ ] Slow ambient animation — scene elements drift and glow with the feel of Apple Sequoia screensavers, but darker and sparser
- [ ] Very subtle music reactivity — stars pulse gently, planet glows softly in response to audio analysis
- [ ] Audio player that loads and plays a single playlist continuously
- [ ] Playlist data sourced from Apple Music Library XML via appleMusicTools pipeline (track name, artist, album, duration, file paths)
- [ ] Audio files served locally from Apple Music Library file paths (cloud hosting deferred)
- [ ] Track info display — current song title, artist, album art
- [ ] Skip controls — next/previous track
- [ ] Volume control
- [ ] Continuous playback — auto-advances through playlist, loops when complete

### Out of Scope

- Multiple playlist selection — single playlist only for v1
- Play/pause button — music plays continuously after entry (may revisit)
- Mobile app — web only
- User accounts / authentication — anonymous public access
- Cloud-hosted audio files — local files for now, cloud in later iteration
- Real-time playlist editing in the UI — playlist updated externally via appleMusicTools
- 3D WebGL rendering — 2D Canvas chosen for balance of visual quality and performance

## Context

- **Music source:** Apple Music Library XML parsed by Python toolchain at `/Users/tomw/Claude/appleMusicTools`. This project extracts track metadata (name, artist, album, genre, duration, file paths) from iTunes/Music Library XML files.
- **Audio formats:** Mix of MPEG and AAC files from Apple Music Library (mp3, m4a)
- **Music character:** Electronic/techno (606 drums, breaks, 150bpm), Detroit, 3rd wave UK hardcore, experimental guitar (Robert Fripp, Ozric Tentacles, Hendrix, Clapton, Miles Davis). Not dancefloor — atmospheric intensity.
- **Visual reference:** Apple Sequoia screensavers as a motion/pacing reference, but much darker. The space scene is not abstract generative art — it's a specific composition: infinite blackness, a large planet with Saturn's coloring, two khaki moons, a distant sun, and sparse bright stars. Slow parallax drift.
- **Browser autoplay policy:** Requires user interaction before audio can play — solved by click-to-enter splash.
- **Web Audio API:** Needed for audio analysis (frequency/amplitude data) to drive subtle visual reactivity.

## Constraints

- **Tech stack:** Web technologies (HTML/CSS/JS/Canvas) — must work in modern browsers
- **Audio source:** Local files for now — architecture should allow swapping to remote URLs later
- **Performance:** 2D Canvas rendering must maintain smooth 60fps animation alongside audio playback and analysis
- **Accessibility:** Volume control and skip controls must be keyboard-accessible

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| 2D Canvas over WebGL | Balance of visual richness and implementation complexity; parallax layers give depth without 3D overhead | — Pending |
| Click-to-enter splash | Required by browser autoplay policy; also creates an intentional threshold moment | — Pending |
| Single playlist, externally managed | Keeps player simple; appleMusicTools handles playlist curation separately | — Pending |
| Local audio files first | Simplifies v1; architecture should abstract file source for later migration to cloud/CDN | — Pending |
| No play/pause control | Reinforces the immersive "you're in it" experience; music is continuous | — Pending |

---
*Last updated: 2026-02-12 after initialization*
