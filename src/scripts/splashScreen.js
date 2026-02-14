/**
 * Splash Screen Module
 *
 * Handles the click-to-enter transition. This exists because browsers
 * require a user gesture before creating an AudioContext or playing audio.
 * The splash also creates an intentional "threshold" moment before immersion.
 */

/**
 * Attaches a one-time click handler that hides the splash and invokes the
 * enter callback (which creates the AudioContext and starts playback).
 *
 * @param {HTMLElement} enterButton - The button to click
 * @param {HTMLElement} splashElement - The splash overlay to hide
 * @param {Function} onEnter - Async callback invoked on enter (non-fatal if it throws)
 */
export function initSplash(enterButton, splashElement, onEnter) {
  const handleClick = (event) => {
    event.preventDefault();

    // Remove immediately to prevent double-triggers
    enterButton.removeEventListener('click', handleClick);

    // Transition past splash — even if audio init fails, we don't go back
    splashElement.classList.add('hidden');

    Promise.resolve(onEnter()).catch(error => {
      console.warn('Enter callback error (non-fatal):', error);
    });
  };

  enterButton.addEventListener('click', handleClick);
}
