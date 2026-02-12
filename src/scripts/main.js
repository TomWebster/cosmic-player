/**
 * Main entry point
 * Initializes canvas renderer on page load
 */

import { initCanvas } from './canvasRenderer.js';

// Initialize canvas when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  initCanvas();
});
