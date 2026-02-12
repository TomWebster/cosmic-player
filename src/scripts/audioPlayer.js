/**
 * Audio Player Module
 * Hybrid HTML5 Audio + Web Audio API architecture for streaming playback with precise volume control
 */

/**
 * Creates an audio player instance with playlist management and Web Audio API integration
 * @param {HTMLAudioElement} audioElement - The HTML audio element to use for playback
 * @returns {Object} Player instance with control methods
 */
export function createAudioPlayer(audioElement) {
  // Internal state
  let playlist = [];
  let currentIndex = 0;
  let audioContext = null;
  let gainNode = null;
  let source = null;
  let isMuted = false;
  let previousVolume = 0.5;
  const trackChangeCallbacks = [];

  /**
   * Loads the playlist from JSON file
   * @returns {Promise<Array>} The loaded playlist
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
   * Initializes Web Audio API components
   * MUST be called inside a user gesture handler (e.g., click event)
   * @returns {AudioContext} The created audio context
   */
  function initAudio() {
    // Create AudioContext (requires user gesture)
    audioContext = new AudioContext();

    // Create MediaElementSource from HTML audio element
    source = audioContext.createMediaElementSource(audioElement);

    // Create GainNode for volume control
    gainNode = audioContext.createGain();
    gainNode.gain.value = 0.5; // Start at 50% volume

    // Connect audio chain: source -> gainNode -> destination
    source.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // Setup auto-advance on track end
    audioElement.addEventListener('ended', () => {
      // Move to next track with wrap-around
      currentIndex = (currentIndex + 1) % playlist.length;
      loadTrack(currentIndex);
      play();
    });

    console.log('Audio context initialized');
    return audioContext;
  }

  /**
   * Loads a track by index
   * @param {number} index - Track index in playlist
   * @returns {Object} The loaded track object
   */
  function loadTrack(index) {
    currentIndex = index;
    const track = playlist[currentIndex];

    audioElement.src = track.filePath;

    // Notify listeners of track change
    trackChangeCallbacks.forEach(callback => {
      try {
        callback(track);
      } catch (error) {
        console.error('Track change callback error:', error);
      }
    });

    return track;
  }

  /**
   * Starts playback of the current track
   * @returns {Promise<void>}
   */
  async function play() {
    try {
      // Resume AudioContext if suspended
      if (audioContext && audioContext.state === 'suspended') {
        await audioContext.resume();
      }

      // Start playback
      await audioElement.play();
    } catch (error) {
      console.warn('Playback failed:', error.message);
      throw error;
    }
  }

  /**
   * Loads and plays a specific track
   * @param {number} index - Track index in playlist
   * @returns {Promise<void>}
   */
  async function playTrack(index) {
    loadTrack(index);
    await play();
  }

  /**
   * Advances to the next track
   * @returns {Promise<void>}
   */
  async function nextTrack() {
    currentIndex = (currentIndex + 1) % playlist.length;
    await playTrack(currentIndex);
  }

  /**
   * Goes back to the previous track
   * @returns {Promise<void>}
   */
  async function previousTrack() {
    currentIndex = (currentIndex - 1 + playlist.length) % playlist.length;
    await playTrack(currentIndex);
  }

  /**
   * Sets the volume with smooth ramping to avoid audio pops
   * @param {number} value - Volume level (0.0 to 1.0)
   */
  function setVolume(value) {
    if (!gainNode || !audioContext) return;

    // Clamp value to valid range
    const clampedValue = Math.max(0.01, Math.min(1.0, value));

    // Use exponentialRampToValueAtTime for smooth transitions
    // exponentialRamp cannot reach exactly 0, so minimum is 0.01
    const rampTime = audioContext.currentTime + 0.1;
    gainNode.gain.exponentialRampToValueAtTime(clampedValue, rampTime);

    // Update previous volume if not muted
    if (!isMuted) {
      previousVolume = clampedValue;
    }
  }

  /**
   * Toggles mute state
   * @returns {boolean} Current muted state
   */
  function toggleMute() {
    if (!gainNode || !audioContext) return isMuted;

    if (isMuted) {
      // Unmute: restore previous volume
      setVolume(previousVolume);
      isMuted = false;
    } else {
      // Mute: save current volume and ramp to near-zero
      previousVolume = gainNode.gain.value;
      const rampTime = audioContext.currentTime + 0.1;
      gainNode.gain.exponentialRampToValueAtTime(0.01, rampTime);
      isMuted = true;
    }

    return isMuted;
  }

  /**
   * Gets the current player state
   * @returns {Object} Current state including track info and settings
   */
  function getState() {
    return {
      currentIndex,
      currentTrack: playlist[currentIndex] || null,
      isMuted,
      playlist
    };
  }

  /**
   * Registers a callback for track changes
   * @param {Function} callback - Function to call when track changes
   */
  function onTrackChange(callback) {
    trackChangeCallbacks.push(callback);
  }

  // Return public API
  return {
    loadPlaylist,
    initAudio,
    loadTrack,
    play,
    playTrack,
    nextTrack,
    previousTrack,
    setVolume,
    toggleMute,
    getState,
    onTrackChange
  };
}
