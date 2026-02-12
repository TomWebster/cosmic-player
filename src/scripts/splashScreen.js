/**
 * Splash Screen Module
 * Handles the click-to-enter transition and AudioContext initialization trigger
 */

/**
 * Initializes the splash screen with click-to-enter behavior
 * @param {HTMLElement} enterButton - The button element to click
 * @param {HTMLElement} splashElement - The splash container element
 * @param {Function} onEnter - Async callback to invoke on enter (handles AudioContext creation)
 */
export function initSplash(enterButton, splashElement, onEnter) {
  // One-time click handler
  const handleClick = (event) => {
    event.preventDefault();

    // Remove listener immediately to prevent double-clicks
    enterButton.removeEventListener('click', handleClick);

    // Hide splash and show controls immediately on click
    splashElement.classList.add('hidden');

    // Execute the enter callback (creates AudioContext, starts playback)
    // Errors are non-fatal — we've already transitioned past the splash
    Promise.resolve(onEnter()).catch(error => {
      console.warn('Enter callback error (non-fatal):', error);
    });
  };

  // Attach click listener
  enterButton.addEventListener('click', handleClick);
}
