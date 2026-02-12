/**
 * Canvas Renderer
 * Handles DPI-aware canvas setup, resize, and animation loop
 */

import { createScene } from './sceneData.js';

let canvas;
let ctx;
let animationId;
let scene = null;

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

  // Regenerate scene at new viewport dimensions
  scene = createScene(window.innerWidth, window.innerHeight);
}

/**
 * Render the complete cosmic scene
 * @param {CanvasRenderingContext2D} ctx - Canvas 2D context
 */
function renderScene(ctx) {
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  // 1. Black background (infinite space)
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, vw, vh);

  // 2. Stars (background layer)
  ctx.fillStyle = '#ffffff';
  for (const star of scene.stars) {
    ctx.globalAlpha = star.brightness;
    ctx.beginPath();
    ctx.arc(Math.floor(star.x), Math.floor(star.y), star.radius, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1.0;

  // 3. Sun (distant light source with glow)
  const sunGradient = ctx.createRadialGradient(
    scene.sun.x, scene.sun.y, 0,
    scene.sun.x, scene.sun.y, scene.sun.radius
  );
  sunGradient.addColorStop(0, scene.sun.colors[0]);    // core
  sunGradient.addColorStop(0.4, scene.sun.colors[1]);  // mid
  sunGradient.addColorStop(1.0, scene.sun.colors[2]);  // outer (transparent)
  ctx.fillStyle = sunGradient;
  ctx.beginPath();
  ctx.arc(Math.floor(scene.sun.x), Math.floor(scene.sun.y), scene.sun.radius, 0, Math.PI * 2);
  ctx.fill();

  // 4. Planet (midground with 3D sphere effect)
  const highlightOffsetX = scene.planet.x - scene.planet.radius * 0.3;
  const highlightOffsetY = scene.planet.y - scene.planet.radius * 0.3;
  const planetGradient = ctx.createRadialGradient(
    highlightOffsetX, highlightOffsetY, scene.planet.radius * 0.2,
    scene.planet.x, scene.planet.y, scene.planet.radius
  );
  planetGradient.addColorStop(0, scene.planet.colors[0]);    // highlight
  planetGradient.addColorStop(0.5, scene.planet.colors[1]);  // midtone
  planetGradient.addColorStop(1.0, scene.planet.colors[2]);  // shadow
  ctx.fillStyle = planetGradient;
  ctx.beginPath();
  ctx.arc(Math.floor(scene.planet.x), Math.floor(scene.planet.y), scene.planet.radius, 0, Math.PI * 2);
  ctx.fill();

  // 5. Moons (foreground with subtle gradients)
  for (const moon of scene.moons) {
    const moonHighlightX = moon.x - moon.radius * 0.3;
    const moonHighlightY = moon.y - moon.radius * 0.3;
    const moonGradient = ctx.createRadialGradient(
      moonHighlightX, moonHighlightY, 0,
      moon.x, moon.y, moon.radius
    );
    moonGradient.addColorStop(0, '#a09070');     // lighter khaki highlight
    moonGradient.addColorStop(1.0, moon.color);  // darker khaki edge
    ctx.fillStyle = moonGradient;
    ctx.beginPath();
    ctx.arc(Math.floor(moon.x), Math.floor(moon.y), moon.radius, 0, Math.PI * 2);
    ctx.fill();
  }
}

/**
 * Animation loop - renders the complete cosmic scene
 */
function animate() {
  renderScene(ctx);

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

  // Initialize scene data
  scene = createScene(window.innerWidth, window.innerHeight);

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
