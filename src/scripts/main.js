/**
 * Main entry point
 * Wires together canvas, audio player, splash screen, and controls
 */

import { initCanvas } from './canvasRenderer.js';
import { createAudioPlayer } from './audioPlayer.js';
import { initSplash } from './splashScreen.js';

// Module scripts are deferred — DOM is ready when this executes
// Initialize canvas renderer
initCanvas();

// Get DOM elements
const audioElement = document.getElementById('audio-player');
const enterButton = document.getElementById('enter-button');
const splashElement = document.getElementById('splash');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');
const volumeSlider = document.getElementById('volume-slider');
const scrubBackBtn = document.getElementById('scrub-back-btn');
const scrubFwdBtn = document.getElementById('scrub-fwd-btn');
const controlsContainer = document.getElementById('controls');

// Create audio player instance
const player = createAudioPlayer(audioElement);

// Load playlist eagerly (before user clicks, for instant playback)
try {
  await player.loadPlaylist();
  console.log('Playlist preloaded successfully');
} catch (error) {
  console.error('Failed to preload playlist:', error);
}

// Initialize splash screen with onEnter callback
initSplash(enterButton, splashElement, async () => {
  // Create AudioContext inside user gesture (required for autoplay policy)
  player.initAudio();

  // Show controls immediately
  controlsContainer.classList.remove('hidden');

  // Load first track and start playback
  player.loadTrack(0);
  await player.play();

  console.log('Entered immersive experience');
});

// Wire control buttons
prevBtn.addEventListener('click', () => {
  player.previousTrack();
});

nextBtn.addEventListener('click', () => {
  player.nextTrack();
});

// Wire volume slider
volumeSlider.addEventListener('input', (e) => {
  const volume = parseFloat(e.target.value);
  player.setVolume(volume);
});

// Wire scrub buttons — hold to scrub smoothly
const SCRUB_RATE = 10; // seconds per second of scrubbing
const SCRUB_INTERVAL = 50; // ms between updates

function startScrub(direction) {
  const step = (SCRUB_RATE * SCRUB_INTERVAL) / 1000;
  return setInterval(() => {
    const newTime = audioElement.currentTime + (step * direction);
    audioElement.currentTime = Math.max(0, Math.min(newTime, audioElement.duration || 0));
  }, SCRUB_INTERVAL);
}

let scrubTimer = null;

function beginScrub(direction) {
  if (scrubTimer) return;
  // Immediate first jump
  audioElement.currentTime = Math.max(0, Math.min(audioElement.currentTime + (5 * direction), audioElement.duration || 0));
  scrubTimer = startScrub(direction);
}

function endScrub() {
  if (scrubTimer) {
    clearInterval(scrubTimer);
    scrubTimer = null;
  }
}

scrubBackBtn.addEventListener('mousedown', () => beginScrub(-1));
scrubBackBtn.addEventListener('mouseup', endScrub);
scrubBackBtn.addEventListener('mouseleave', endScrub);
scrubFwdBtn.addEventListener('mousedown', () => beginScrub(1));
scrubFwdBtn.addEventListener('mouseup', endScrub);
scrubFwdBtn.addEventListener('mouseleave', endScrub);

// Register track change callback
player.onTrackChange((track) => {
  console.log(`Now playing: ${track.title} - ${track.artist}`);
});

console.log('Application initialized');
