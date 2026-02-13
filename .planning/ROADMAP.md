# Roadmap: Cosmic Player

## Overview

The Cosmic Player roadmap delivers an immersive web audio player. Phases 1-2 are complete — the basic working state is reached: click-to-enter splash, forward-flying starfield with warp effects on skip/scrub, full audio playback with playlist, volume, and shuffle. Remaining work focuses on front-end polish and moving to Cloudflare-hosted audio with auto-updating playlists.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3, 4): Planned milestone work
- Decimal phases (e.g., 2.1): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Foundation & Audio Playback** - Entry mechanism, audio engine, playlist management, playback controls
- [x] **Phase 2: Starfield & Warp** - Forward-flying starfield animation, warp effects on skip/scrub/shuffle, whoosh SFX
- [ ] **Phase 3: Front-End Polish** - Visual refinements, UX improvements, responsive behavior
- [ ] **Phase 4: Cloudflare Audio & Auto-Playlists** - Upload audio to Cloudflare, auto-update playlist from appleMusicTools pipeline

## Phase Details

### Phase 1: Foundation & Audio Playback
**Goal**: Visitor can enter the experience and listen to music with full playback controls

**Depends on**: Nothing (first phase)

**Requirements**: ENTR-01, ENTR-02, ENTR-03, PLAY-01, PLAY-02, PLAY-03, PLAY-04, PLAY-05, PLAY-06, PLAY-07, DATA-01, DATA-02

**Success Criteria** (what must be TRUE):
  1. Visitor sees a click-to-enter splash screen on page load
  2. Clicking the splash creates AudioContext and begins playing the first track from the playlist
  3. User can skip to next/previous tracks and hear the correct audio play
  4. User can adjust volume with slider and mute/unmute audio
  5. Playlist auto-advances through tracks and loops back to start after the last track

**Plans:** 2 plans

Plans:
- [x] 01-01-PLAN.md — Project foundation: HTML scaffold, CSS layout, playlist JSON, DPI-aware canvas renderer
- [x] 01-02-PLAN.md — Audio playback engine, splash screen integration, control wiring, human verification

### Phase 2: Starfield & Warp
**Goal**: Forward-flying starfield with warp effects tied to playback controls

**Depends on**: Phase 1

**Status**: Complete (direction changed from original cosmic scene plan)

**What was built** (differs from original plan):
  - Forward-flying starfield with 3D perspective projection (400 stars, focal length projection)
  - Warp speed multiplier on track skip (<< / >>) — stars streak into hyperspace with directional whoosh SFX
  - Hold-to-scrub with sustained warp and quiet looping whoosh
  - Shuffle triggers forward warp to random track
  - Volume ducking during warp transitions
  - Delta-time animation, clamped to prevent tab-backgrounding jumps

**Original plan was**: Layered 2D cosmic scene (planet, moons, sun, parallax drift). Replaced with starfield + warp which better serves the interaction model.

Plans:
- [x] 02-01-PLAN.md — Initial scene data model and rendering (superseded by starfield rewrite)
- [x] 02-02-PLAN.md — Superseded: warp animation + skip/scrub integration built outside plan

### Phase 3: Front-End Polish
**Goal**: Refine the visual experience and UX to feel finished and polished

**Depends on**: Phase 2

**Success Criteria** (what must be TRUE):
  1. Visual experience feels polished and intentional
  2. Controls are intuitive and responsive
  3. Works well across screen sizes

**Plans**: TBD

Plans:
- [ ] TBD during phase planning

### Phase 4: Cloudflare Audio & Auto-Playlists
**Goal**: Audio files hosted on Cloudflare, playlist auto-updates from appleMusicTools pipeline

**Depends on**: Phase 3 (can potentially run in parallel)

**Success Criteria** (what must be TRUE):
  1. Audio files served from Cloudflare instead of local filesystem
  2. Playlist data auto-updates when appleMusicTools pipeline runs
  3. No manual file copying or playlist editing needed to update the site

**Plans**: TBD

Plans:
- [ ] TBD during phase planning

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation & Audio Playback | 2/2 | ✓ Complete | 2026-02-12 |
| 2. Starfield & Warp | 2/2 | ✓ Complete (direction changed) | 2026-02-13 |
| 3. Front-End Polish | 0/TBD | Not started | - |
| 4. Cloudflare Audio & Auto-Playlists | 0/TBD | Not started | - |
