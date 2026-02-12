/**
 * Canvas Renderer
 * Handles DPI-aware canvas setup, resize, and animation loop
 */

let canvas;
let ctx;
let animationId;

/**
 * Setup canvas with correct DPI scaling
 */
function setupCanvas() {
  const dpr = window.devicePixelRatio || 1;

  // Set actual canvas buffer size to account for device pixel ratio
  canvas.width = window.innerWidth * dpr;
  canvas.height = window.innerHeight * dpr;

  // Set absolute transform to avoid cumulative scaling on resize
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  // Set CSS size to match viewport
  canvas.style.width = `${window.innerWidth}px`;
  canvas.style.height = `${window.innerHeight}px`;
}

/**
 * Animation loop - renders black space background
 */
function animate() {
  // Clear canvas
  ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

  // Fill with black (infinite space)
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);

  // Continue animation loop
  animationId = requestAnimationFrame(animate);
}

/**
 * Initialize canvas renderer
 * @returns {Object} - Canvas and context references
 */
export function initCanvas() {
  canvas = document.getElementById('canvas');

  if (!canvas) {
    console.error('Canvas element not found');
    return null;
  }

  ctx = canvas.getContext('2d');

  // Initial setup
  setupCanvas();

  // Handle window resize
  window.addEventListener('resize', setupCanvas);

  // Start animation loop
  animate();

  return { canvas, ctx };
}

/**
 * Stop animation loop (for cleanup if needed)
 */
export function stopAnimation() {
  if (animationId) {
    cancelAnimationFrame(animationId);
    animationId = null;
  }
}
