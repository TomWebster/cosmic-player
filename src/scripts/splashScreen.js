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
  const handleClick = async (event) => {
    // Prevent default and stop propagation
    event.preventDefault();

    try {
      // Execute the enter callback (creates AudioContext, starts playback)
      await onEnter();

      // Hide the splash screen
      splashElement.classList.add('hidden');

      // Remove the event listener to prevent double-clicks
      enterButton.removeEventListener('click', handleClick);
    } catch (error) {
      console.error('Failed to enter:', error);
      // Keep splash visible if entry fails
    }
  };

  // Attach click listener
  enterButton.addEventListener('click', handleClick);
}
