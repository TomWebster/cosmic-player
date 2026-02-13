# Cosmic Player

## What This Is

An immersive fullscreen music player website that plays a single curated playlist against a forward-flying starfield animation. Visitors click to enter, then are drawn into infinite blackness with stars streaming past — while breakbeat hardcore, Detroit techno, and experimental guitar wash over them. Track skip controls (<< / >>) trigger a warp-speed visual effect with whoosh sound, scrub controls let you hold to fast-forward/rewind with sustained warp, and shuffle warps to a random track. The starfield runs continuously with smooth delta-time animation.

## Core Value

The moment you enter, you're transported — music and visuals fuse into a single immersive experience that holds you. Skip a track and the stars streak past like hyperspace.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [x] Click-to-enter splash screen that triggers audio context and transitions to fullscreen immersion
- [x] Forward-flying starfield animation — stars stream toward camera with perspective projection and delta-time smoothing
- [x] Warp effect on track skip — << and >> buttons trigger high-speed starfield warp with directional whoosh sound effect
- [x] Hold-to-scrub with sustained warp — << / >> hold to fast-forward/rewind audio with visual warp and quiet sustained whoosh
- [x] Shuffle with warp — random track selection with forward warp transition
- [x] Audio player that loads and plays a single playlist continuously
- [x] Playlist data sourced from Apple Music Library XML via appleMusicTools pipeline (track name, artist, album, duration, file paths)
- [x] Audio files served locally from Apple Music Library file paths (cloud hosting deferred)
- [ ] Front-end polish — visual refinements, UX improvements, responsive behavior
- [ ] Auto-updating playlists — appleMusicTools pipeline auto-refreshes playlist data
- [ ] Cloudflare audio hosting — upload audio files to Cloudflare, serve remotely instead of locally
- [x] Skip controls — next/previous track (with warp visual + whoosh SFX)
- [x] Volume control
- [x] Continuous playback — auto-advances through playlist, loops when complete

### Out of Scope

- Multiple playlist selection — single playlist only for v1
- Play/pause button — music plays continuously after entry (may revisit)
- Mobile app — web only
- User accounts / authentication — anonymous public access
- Track info display — deferred, not needed for core experience
- Real-time playlist editing in the UI — playlist updated externally via appleMusicTools
- 3D WebGL rendering — 2D Canvas chosen for balance of visual quality and performance
- Layered cosmic scene (planet, moons, sun, parallax drift) — replaced with forward-flying starfield + warp
- Audio-reactive visuals — removed in favor of warp-on-skip interaction model

## Context

- **Music source:** Apple Music Library XML parsed by Python toolchain at `/Users/tomw/Claude/appleMusicTools`. This project extracts track metadata (name, artist, album, genre, duration, file paths) from iTunes/Music Library XML files.
- **Audio formats:** Mix of formats from Apple Music Library — mp3, m4a, wav, aiff, and potentially others. Player should handle any browser-supported audio format.
- **Music character:** Electronic/techno (606 drums, breaks, 150bpm), Detroit, 3rd wave UK hardcore, experimental guitar (Robert Fripp, Ozric Tentacles, Hendrix, Clapton, Miles Davis). Not dancefloor — atmospheric intensity.
- **Visual reference:** Forward-flying starfield (classic "warp speed" / Star Wars hyperspace). Stars stream toward camera with perspective projection. Skip/scrub triggers high-speed warp with motion trails. Sparse, dark, immersive — Elite-style emptiness of space.
- **Browser autoplay policy:** Requires user interaction before audio can play — solved by click-to-enter splash.
- **Web Audio API:** Needed for audio analysis (frequency/amplitude data) to drive subtle visual reactivity.

## Constraints

- **Tech stack:** Web technologies (HTML/CSS/JS/Canvas) — must work in modern browsers
- **Audio source:** Local files currently — migrating to Cloudflare-hosted audio
- **Performance:** 2D Canvas rendering must maintain smooth 60fps animation alongside audio playback
- **Accessibility:** Volume control and skip controls must be keyboard-accessible

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| 2D Canvas over WebGL | Balance of visual richness and implementation complexity | Shipped |
| Click-to-enter splash | Required by browser autoplay policy; also creates an intentional threshold moment | Shipped |
| Single playlist, externally managed | Keeps player simple; appleMusicTools handles playlist curation separately | Shipped |
| Local audio files first | Simplifies v1; architecture should abstract file source for later migration to cloud/CDN | Shipped |
| No play/pause control | Reinforces the immersive "you're in it" experience; music is continuous | Shipped |
| Forward-flying starfield over layered cosmic scene | Replaced planet/moons/sun parallax with classic warp-speed starfield — simpler, more dynamic, better synergy with skip/scrub controls | Shipped |
| Warp-on-skip interaction model over audio-reactive visuals | Visual responds to user action (skip/scrub) not audio analysis — clearer cause-and-effect, more satisfying, simpler architecture | Shipped |
| Drop track info display | Not needed for the core experience — focus on polish and infrastructure | Active |
| Cloudflare for audio hosting | Move audio files off local, serve from Cloudflare for real deployment | Active |

---
*Last updated: 2026-02-13 — basic working state reached, focus shifting to FE polish + Cloudflare backend*
