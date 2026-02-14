/**
 * Main — orchestrates canvas, audio, splash, and playback controls.
 *
 * This is the wiring layer: it imports the modules and connects them.
 * All user interactions (buttons, slider, pointer events) are bound here.
 *
 * Control features:
 *   - Skip (prev/next): 1-second warp with audible scrub and whoosh SFX
 *   - Shuffle: random track with forward warp
 *   - Scrub (hold << / >>): continuous fast-forward/rewind with sustained warp
 *   - Volume slider: direct gain control with smooth ramping
 */

import { initCanvas, setWarp } from './canvasRenderer.js';
import { createAudioPlayer } from './audioPlayer.js';
import { initSplash } from './splashScreen.js';

// ── Initialization ──────────────────────────────────────────────────────────

initCanvas();

const audioEl = document.getElementById('audio-player');
const controls = document.getElementById('controls');
const volumeSlider = document.getElementById('volume-slider');
const player = createAudioPlayer(audioEl);

// Load playlist early (before user clicks Enter) so tracks are ready
try { await player.loadPlaylist(); } catch {}

// Splash screen — clicking Enter creates AudioContext, reveals controls, starts playback
initSplash(
  document.getElementById('enter-button'),
  document.getElementById('splash'),
  async () => {
    player.initAudio();
    controls.classList.remove('hidden');
    player.loadTrack(0);
    await player.play();
  }
);

// ── Volume helpers ──────────────────────────────────────────────────────────

/** Returns the current slider position (0–1). */
function getUserVolume() { return parseFloat(volumeSlider.value); }

/** Ducks volume to a fraction of the user's slider setting (for warp effects). */
function duckVolume(level) { player.setVolume(getUserVolume() * level); }

/** Restores volume to the user's slider setting after ducking. */
function restoreVolume() { player.setVolume(getUserVolume()); }

// ── Whoosh SFX — filtered white noise ───────────────────────────────────────
//
// Generates a burst of band-pass filtered white noise with a frequency sweep.
// Forward whoosh sweeps 300Hz→3kHz, reverse sweeps 3kHz→300Hz.
// Uses a pre-generated 2-second noise buffer shared across all whoosh instances.

let noiseBuffer = null;

/** Creates the shared white noise buffer on first use. */
function ensureNoiseBuffer(ctx) {
  if (noiseBuffer) return;
  const len = ctx.sampleRate * 2;
  noiseBuffer = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = noiseBuffer.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
}

/**
 * Plays a one-shot whoosh sound effect.
 * Audio graph: BufferSource → BiquadFilter (bandpass) → GainNode → destination
 *
 * @param {number} dir - Direction: 1 = forward sweep, -1 = reverse sweep
 * @param {number} duration - Length in seconds
 * @param {number} volume - Peak gain (0–1)
 */
function playWhoosh(dir, duration, volume) {
  const ctx = player.getContext();
  if (!ctx) return;
  ensureNoiseBuffer(ctx);

  const src = ctx.createBufferSource();
  src.buffer = noiseBuffer;

  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.Q.value = 1.5;

  const gain = ctx.createGain();
  const now = ctx.currentTime;
  const end = now + duration;

  // Frequency sweep — direction determines start/end frequencies
  const freqStart = dir > 0 ? 300 : 3000;
  const freqEnd = dir > 0 ? 3000 : 300;
  filter.frequency.setValueAtTime(freqStart, now);
  filter.frequency.exponentialRampToValueAtTime(freqEnd, end);

  // Gain envelope: quick attack, sustained body, fade to silence
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(volume, now + duration * 0.15);
  gain.gain.linearRampToValueAtTime(volume * 0.85, now + duration * 0.7);
  gain.gain.linearRampToValueAtTime(0, end);

  src.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);

  src.start(now);
  src.stop(end);
}

// ── Track skip — 1-second warp with audible scrub ───────────────────────────
//
// When the user clicks prev/next, the audio scrubs rapidly through the
// remainder of the current track over 1 second while the starfield warps.
// The track remains faintly audible underneath (ducked to 25%).
// After the scrub completes, the target track loads and plays normally.

const SKIP_DURATION = 1; // seconds
let skipInterval = null;
let skipTimeout = null;

/**
 * Begins a skip animation: scrubs audio, warps starfield, plays whoosh.
 * @param {number} dir - Direction: 1 = forward (next), -1 = backward (prev)
 * @param {number|null} targetIndex - Specific track index (for shuffle), or null for next/prev
 */
function beginSkip(dir, targetIndex) {
  if (skipInterval) return; // Skip already in progress

  const dur = audioEl.duration || 0;
  const t = audioEl.currentTime || 0;

  // If no duration available (track not loaded), just switch immediately
  if (!dur) {
    if (targetIndex != null) player.playTrack(targetIndex);
    else dir > 0 ? player.nextTrack() : player.previousTrack();
    return;
  }

  // Calculate scrub rate: cover remaining time in SKIP_DURATION seconds
  const timeToSkip = dir > 0 ? (dur - t) : t;
  const scrubRate = timeToSkip / SKIP_DURATION;

  // Activate effects
  setWarp(dir > 0 ? 12 : -10);
  duckVolume(0.25);
  playWhoosh(dir, SKIP_DURATION, 0.12);

  // Scrub audio position every 50ms
  skipInterval = setInterval(() => {
    const step = scrubRate * 0.05 * dir;
    const next = audioEl.currentTime + step;
    if (dir > 0 && next >= dur) { finishSkip(dir, targetIndex); return; }
    if (dir < 0 && next <= 0) { finishSkip(dir, targetIndex); return; }
    audioEl.currentTime = Math.max(0, Math.min(next, dur));
  }, 50);

  // Safety timeout — finish skip even if scrub doesn't reach the end
  skipTimeout = setTimeout(() => finishSkip(dir, targetIndex), SKIP_DURATION * 1000 + 100);
}

/** Cleans up skip state, restores volume, and loads the target track. */
function finishSkip(dir, targetIndex) {
  clearInterval(skipInterval);
  clearTimeout(skipTimeout);
  skipInterval = null;
  skipTimeout = null;
  setWarp(1);
  restoreVolume();
  if (targetIndex != null) player.playTrack(targetIndex);
  else dir > 0 ? player.nextTrack() : player.previousTrack();
}

// ── Control bindings: skip & shuffle ────────────────────────────────────────

document.getElementById('prev-btn').addEventListener('click', () => beginSkip(-1));
document.getElementById('next-btn').addEventListener('click', () => beginSkip(1));

document.getElementById('shuffle-btn').addEventListener('click', () => {
  const state = player.getState();
  if (state.playlist.length < 2) return;
  // Pick a random track that isn't the current one
  let target;
  do { target = Math.floor(Math.random() * state.playlist.length); }
  while (target === state.currentIndex);
  beginSkip(1, target); // Always warp forward for shuffle
});

// ── Volume slider ───────────────────────────────────────────────────────────

volumeSlider.addEventListener('input', (e) => {
  player.setVolume(parseFloat(e.target.value));
});

// ── Scrub — hold to fast-forward/rewind with sustained warp ─────────────────
//
// Holding << or >> scrubs through the track at 10× speed with a sustained
// quiet whoosh and starfield warp. Releasing the button restores normal playback.
// Uses pointer events for reliable touch + mouse support.

const SCRUB_RATE = 10; // Playback time seconds per real second
let scrubInterval = null;
let scrubWhooshSrc = null;
let scrubWhooshGain = null;

/**
 * Begins sustained scrub: jumps ahead 5s, then scrubs continuously while held.
 * @param {number} dir - Direction: 1 = forward, -1 = backward
 */
function beginScrub(dir) {
  if (scrubInterval) return;

  // Initial 5-second jump for responsiveness
  audioEl.currentTime = Math.max(0, Math.min(audioEl.currentTime + 5 * dir, audioEl.duration || 0));
  setWarp(dir > 0 ? 4 : -3);
  duckVolume(0.35);

  // Start sustained quiet whoosh (looping filtered noise)
  const ctx = player.getContext();
  if (ctx) {
    ensureNoiseBuffer(ctx);
    scrubWhooshSrc = ctx.createBufferSource();
    scrubWhooshSrc.buffer = noiseBuffer;
    scrubWhooshSrc.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = dir > 0 ? 1200 : 800;
    filter.Q.value = 1.0;

    scrubWhooshGain = ctx.createGain();
    scrubWhooshGain.gain.setValueAtTime(0, ctx.currentTime);
    scrubWhooshGain.gain.linearRampToValueAtTime(0.04, ctx.currentTime + 0.15);

    scrubWhooshSrc.connect(filter);
    filter.connect(scrubWhooshGain);
    scrubWhooshGain.connect(ctx.destination);
    scrubWhooshSrc.start();
  }

  // Continuous scrub every 50ms
  scrubInterval = setInterval(() => {
    const t = audioEl.currentTime + (SCRUB_RATE * 0.05) * dir;
    audioEl.currentTime = Math.max(0, Math.min(t, audioEl.duration || 0));
  }, 50);
}

/** Stops scrubbing, fades out whoosh, restores normal playback. */
function endScrub() {
  if (!scrubInterval) return;
  clearInterval(scrubInterval);
  scrubInterval = null;
  setWarp(1);
  restoreVolume();

  // Fade out the sustained whoosh over 150ms then stop
  if (scrubWhooshGain && scrubWhooshSrc) {
    const ctx = player.getContext();
    if (ctx) {
      scrubWhooshGain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.15);
      scrubWhooshSrc.stop(ctx.currentTime + 0.2);
    }
    scrubWhooshSrc = null;
    scrubWhooshGain = null;
  }
}

// Pointer events for scrub buttons (works on both touch and mouse)
const scrubBack = document.getElementById('scrub-back-btn');
const scrubFwd = document.getElementById('scrub-fwd-btn');
for (const [btn, dir] of [[scrubBack, -1], [scrubFwd, 1]]) {
  btn.addEventListener('pointerdown', (e) => { e.preventDefault(); beginScrub(dir); });
  btn.addEventListener('pointerup', endScrub);
  btn.addEventListener('pointerleave', endScrub);
  btn.addEventListener('pointercancel', endScrub);
}

// Log track changes to console
player.onTrackChange((track) => {
  console.log(`Now playing: ${track.title} - ${track.artist}`);
});
