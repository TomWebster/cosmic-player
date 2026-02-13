/**
 * Main — wires canvas, audio, splash, and controls
 */

import { initCanvas, setWarp } from './canvasRenderer.js';
import { createAudioPlayer } from './audioPlayer.js';
import { initSplash } from './splashScreen.js';

initCanvas();

const audioEl = document.getElementById('audio-player');
const controls = document.getElementById('controls');
const volumeSlider = document.getElementById('volume-slider');
const player = createAudioPlayer(audioEl);

try { await player.loadPlaylist(); } catch {}

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

// Volume helpers
function getUserVolume() { return parseFloat(volumeSlider.value); }
function duckVolume(level) { player.setVolume(getUserVolume() * level); }
function restoreVolume() { player.setVolume(getUserVolume()); }

// ── Whoosh SFX — filtered white noise ──
let noiseBuffer = null;

function ensureNoiseBuffer(ctx) {
  if (noiseBuffer) return;
  const len = ctx.sampleRate * 2;
  noiseBuffer = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = noiseBuffer.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
}

/**
 * @param {number} dir - 1 forward, -1 backward
 * @param {number} duration - seconds
 * @param {number} volume - peak gain (0–1)
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

  const freqStart = dir > 0 ? 300 : 3000;
  const freqEnd = dir > 0 ? 3000 : 300;
  filter.frequency.setValueAtTime(freqStart, now);
  filter.frequency.exponentialRampToValueAtTime(freqEnd, end);

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

// ── Track skip — 1 second, scrub + whoosh, track audible underneath ──
const SKIP_DURATION = 1;
let skipInterval = null;
let skipTimeout = null;

function beginSkip(dir, targetIndex) {
  if (skipInterval) return;
  const dur = audioEl.duration || 0;
  const t = audioEl.currentTime || 0;
  if (!dur) {
    if (targetIndex != null) player.playTrack(targetIndex);
    else dir > 0 ? player.nextTrack() : player.previousTrack();
    return;
  }

  const timeToSkip = dir > 0 ? (dur - t) : t;
  const scrubRate = timeToSkip / SKIP_DURATION;

  setWarp(dir > 0 ? 12 : -10);
  duckVolume(0.25);
  playWhoosh(dir, SKIP_DURATION, 0.12);

  skipInterval = setInterval(() => {
    const step = scrubRate * 0.05 * dir;
    const next = audioEl.currentTime + step;
    if (dir > 0 && next >= dur) { finishSkip(dir, targetIndex); return; }
    if (dir < 0 && next <= 0) { finishSkip(dir, targetIndex); return; }
    audioEl.currentTime = Math.max(0, Math.min(next, dur));
  }, 50);

  skipTimeout = setTimeout(() => finishSkip(dir, targetIndex), SKIP_DURATION * 1000 + 100);
}

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

document.getElementById('prev-btn').addEventListener('click', () => beginSkip(-1));
document.getElementById('next-btn').addEventListener('click', () => beginSkip(1));

// ── Shuffle — warp to random track ──
document.getElementById('shuffle-btn').addEventListener('click', () => {
  const state = player.getState();
  if (state.playlist.length < 2) return;
  let target;
  do { target = Math.floor(Math.random() * state.playlist.length); }
  while (target === state.currentIndex);
  // Always warp forward for shuffle
  beginSkip(1, target);
});

// Volume slider
volumeSlider.addEventListener('input', (e) => {
  player.setVolume(parseFloat(e.target.value));
});

// ── Scrub — hold to scrub + sustained warp + quiet whoosh ──
const SCRUB_RATE = 10;
let scrubInterval = null;
let scrubWhooshSrc = null;
let scrubWhooshGain = null;

function beginScrub(dir) {
  if (scrubInterval) return;
  audioEl.currentTime = Math.max(0, Math.min(audioEl.currentTime + 5 * dir, audioEl.duration || 0));
  setWarp(dir > 0 ? 4 : -3);
  duckVolume(0.35);

  // Sustained quiet whoosh while scrubbing
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

  scrubInterval = setInterval(() => {
    const t = audioEl.currentTime + (SCRUB_RATE * 0.05) * dir;
    audioEl.currentTime = Math.max(0, Math.min(t, audioEl.duration || 0));
  }, 50);
}

function endScrub() {
  if (!scrubInterval) return;
  clearInterval(scrubInterval);
  scrubInterval = null;
  setWarp(1);
  restoreVolume();

  // Fade out scrub whoosh
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

const scrubBack = document.getElementById('scrub-back-btn');
const scrubFwd = document.getElementById('scrub-fwd-btn');
scrubBack.addEventListener('pointerdown', (e) => { e.preventDefault(); beginScrub(-1); });
scrubBack.addEventListener('pointerup', endScrub);
scrubBack.addEventListener('pointerleave', endScrub);
scrubBack.addEventListener('pointercancel', endScrub);
scrubFwd.addEventListener('pointerdown', (e) => { e.preventDefault(); beginScrub(1); });
scrubFwd.addEventListener('pointerup', endScrub);
scrubFwd.addEventListener('pointerleave', endScrub);
scrubFwd.addEventListener('pointercancel', endScrub);

player.onTrackChange((track) => {
  console.log(`Now playing: ${track.title} - ${track.artist}`);
});
