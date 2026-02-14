/**
 * Audio Player Module
 *
 * Hybrid HTML5 Audio + Web Audio API architecture:
 * - HTML5 <audio> handles format negotiation, streaming, and playback control
 * - Web Audio GainNode provides smooth volume ramping (avoids pops/clicks)
 *
 * The AudioContext MUST be created inside a user gesture (click) to satisfy
 * browser autoplay policy. Call initAudio() from a click handler.
 *
 * Audio graph: <audio> → MediaElementSource → GainNode → destination
 */

/**
 * Creates an audio player instance with playlist management and Web Audio API integration.
 * Uses the revealing module pattern — all state is private, public API returned at the end.
 *
 * @param {HTMLAudioElement} audioElement - The HTML audio element to use for playback
 * @returns {Object} Player API: loadPlaylist, initAudio, loadTrack, play, playTrack,
 *                   nextTrack, previousTrack, setVolume, getState, onTrackChange, getContext
 */
export function createAudioPlayer(audioElement) {
  let playlist = [];
  let currentIndex = 0;
  let audioContext = null;
  let gainNode = null;
  let source = null;
  const trackChangeCallbacks = [];

  /**
   * Fetches playlist data from the server.
   * Expected format: { tracks: [{ title, artist, album, duration, filePath }] }
   * @returns {Promise<Array>} The loaded track list
   */
  async function loadPlaylist() {
    try {
      const response = await fetch('/data/playlist.json');
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to load playlist`);
      }
      const data = await response.json();
      playlist = data.tracks;
      console.log(`Playlist loaded: ${playlist.length} tracks`);
      return playlist;
    } catch (error) {
      console.error('Failed to load playlist:', error);
      throw error;
    }
  }

  /**
   * Initializes Web Audio API — creates AudioContext and wires the audio graph.
   * MUST be called inside a user gesture handler (click/tap) or the browser will block it.
   * @returns {AudioContext} The created audio context
   */
  function initAudio() {
    audioContext = new AudioContext();

    // Bridge HTML5 audio into Web Audio graph
    source = audioContext.createMediaElementSource(audioElement);

    // GainNode provides smooth volume control with ramp functions
    gainNode = audioContext.createGain();
    gainNode.gain.value = 0.5;

    // Wire: source → gain → speakers
    source.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // Auto-advance: when a track ends, play the next one (wraps around)
    audioElement.addEventListener('ended', () => {
      currentIndex = (currentIndex + 1) % playlist.length;
      loadTrack(currentIndex);
      play();
    });

    console.log('Audio context initialized');
    return audioContext;
  }

  /**
   * Sets the audio source to a specific track and notifies listeners.
   * @param {number} index - Track index in playlist
   * @returns {Object} The loaded track object
   */
  function loadTrack(index) {
    currentIndex = index;
    const track = playlist[currentIndex];
    audioElement.src = track.filePath;

    // Notify all registered track-change listeners
    for (const cb of trackChangeCallbacks) {
      try { cb(track); } catch (e) { console.error('Track change callback error:', e); }
    }
    return track;
  }

  /**
   * Starts or resumes playback. Handles AudioContext suspension (happens when
   * the browser suspends audio after a period of inactivity).
   */
  async function play() {
    try {
      if (audioContext?.state === 'suspended') await audioContext.resume();
      await audioElement.play();
    } catch (error) {
      console.warn('Playback failed:', error.message);
      throw error;
    }
  }

  /** Loads and plays a specific track by index. */
  async function playTrack(index) {
    loadTrack(index);
    await play();
  }

  /** Advances to the next track (wraps to first after last). */
  async function nextTrack() {
    currentIndex = (currentIndex + 1) % playlist.length;
    await playTrack(currentIndex);
  }

  /** Goes to the previous track (wraps to last before first). */
  async function previousTrack() {
    currentIndex = (currentIndex - 1 + playlist.length) % playlist.length;
    await playTrack(currentIndex);
  }

  /**
   * Sets volume with smooth ramping to prevent audible pops.
   * Uses exponentialRamp for normal values and linearRamp near zero
   * because exponentialRamp mathematically cannot reach 0.
   *
   * @param {number} value - Volume level 0.0 (silent) to 1.0 (full)
   */
  function setVolume(value) {
    if (!gainNode || !audioContext) return;
    const rampTime = audioContext.currentTime + 0.1;
    if (value <= 0.005) {
      gainNode.gain.linearRampToValueAtTime(0, rampTime);
    } else {
      gainNode.gain.exponentialRampToValueAtTime(Math.min(1.0, value), rampTime);
    }
  }

  /** Returns a snapshot of the current player state. */
  function getState() {
    return {
      currentIndex,
      currentTrack: playlist[currentIndex] || null,
      playlist
    };
  }

  /**
   * Registers a callback invoked whenever the track changes.
   * @param {Function} callback - Receives the new track object
   */
  function onTrackChange(callback) {
    trackChangeCallbacks.push(callback);
  }

  // Public API
  return {
    loadPlaylist,
    initAudio,
    loadTrack,
    play,
    playTrack,
    nextTrack,
    previousTrack,
    setVolume,
    getState,
    onTrackChange,
    getContext: () => audioContext
  };
}
