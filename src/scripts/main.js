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

// Track skip — always 1 second, scrub through remaining/elapsed time
const SKIP_DURATION = 1; // seconds
let skipInterval = null;
let skipTimeout = null;

function beginSkip(dir) {
  if (skipInterval) return;
  const dur = audioEl.duration || 0;
  const t = audioEl.currentTime || 0;
  if (!dur) { dir > 0 ? player.nextTrack() : player.previousTrack(); return; }

  const timeToSkip = dir > 0 ? (dur - t) : t;
  const scrubRate = timeToSkip / SKIP_DURATION;

  // Fixed high warp — always dramatic
  setWarp(dir > 0 ? 12 : -10);
  duckVolume(0.08);

  skipInterval = setInterval(() => {
    const step = scrubRate * 0.05 * dir;
    const next = audioEl.currentTime + step;
    if (dir > 0 && next >= dur) { finishSkip(dir); return; }
    if (dir < 0 && next <= 0) { finishSkip(dir); return; }
    audioEl.currentTime = Math.max(0, Math.min(next, dur));
  }, 50);

  skipTimeout = setTimeout(() => finishSkip(dir), SKIP_DURATION * 1000 + 100);
}

function finishSkip(dir) {
  clearInterval(skipInterval);
  clearTimeout(skipTimeout);
  skipInterval = null;
  skipTimeout = null;
  setWarp(1);
  restoreVolume();
  dir > 0 ? player.nextTrack() : player.previousTrack();
}

document.getElementById('prev-btn').addEventListener('click', () => beginSkip(-1));
document.getElementById('next-btn').addEventListener('click', () => beginSkip(1));

// Volume slider
volumeSlider.addEventListener('input', (e) => {
  player.setVolume(parseFloat(e.target.value));
});

// Scrub — hold to scrub + sustained warp + gentle volume duck
const SCRUB_RATE = 10;
let scrubInterval = null;

function beginScrub(dir) {
  if (scrubInterval) return;
  audioEl.currentTime = Math.max(0, Math.min(audioEl.currentTime + 5 * dir, audioEl.duration || 0));
  setWarp(dir > 0 ? 4 : -3);
  duckVolume(0.35);
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
}

const scrubBack = document.getElementById('scrub-back-btn');
const scrubFwd = document.getElementById('scrub-fwd-btn');
scrubBack.addEventListener('mousedown', () => beginScrub(-1));
scrubBack.addEventListener('mouseup', endScrub);
scrubBack.addEventListener('mouseleave', endScrub);
scrubFwd.addEventListener('mousedown', () => beginScrub(1));
scrubFwd.addEventListener('mouseup', endScrub);
scrubFwd.addEventListener('mouseleave', endScrub);

player.onTrackChange((track) => {
  console.log(`Now playing: ${track.title} - ${track.artist}`);
});
