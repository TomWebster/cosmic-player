/**
 * Main entry point
 * Wires together canvas, audio player, splash screen, and controls
 */

import { initCanvas } from './canvasRenderer.js';
import { createAudioPlayer } from './audioPlayer.js';
import { initSplash } from './splashScreen.js';

// Initialize application when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
  // Initialize canvas renderer
  initCanvas();

  // Get DOM elements
  const audioElement = document.getElementById('audio-player');
  const enterButton = document.getElementById('enter-button');
  const splashElement = document.getElementById('splash');
  const prevBtn = document.getElementById('prev-btn');
  const nextBtn = document.getElementById('next-btn');
  const volumeSlider = document.getElementById('volume-slider');
  const muteBtn = document.getElementById('mute-btn');
  const controlsContainer = document.getElementById('controls');

  // Create audio player instance
  const player = createAudioPlayer(audioElement);

  // Load playlist eagerly (before user clicks, for instant playback)
  try {
    await player.loadPlaylist();
    console.log('Playlist preloaded successfully');
  } catch (error) {
    console.error('Failed to preload playlist:', error);
    return;
  }

  // Initialize splash screen with onEnter callback
  initSplash(enterButton, splashElement, async () => {
    // Create AudioContext inside user gesture (required for autoplay policy)
    player.initAudio();

    // Load first track
    player.loadTrack(0);

    // Start playback
    await player.play();

    // Show controls
    controlsContainer.classList.remove('hidden');

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

  // Wire mute button
  muteBtn.addEventListener('click', () => {
    const muted = player.toggleMute();

    // Update button text to reflect state
    muteBtn.textContent = muted ? 'Unmute' : 'Mute';

    // Update slider visual when muted
    if (muted) {
      volumeSlider.value = '0';
    } else {
      // Restore slider to actual volume
      const state = player.getState();
      // Note: We can't directly get gainNode value, so we'll use a reasonable default
      volumeSlider.value = '0.5';
    }
  });

  // Register track change callback
  player.onTrackChange((track) => {
    console.log(`Now playing: ${track.title} - ${track.artist}`);
  });

  console.log('Application initialized');
});
