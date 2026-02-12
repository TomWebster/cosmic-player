/**
 * Canvas Renderer
 * Handles DPI-aware canvas setup, resize, and animation loop
 */

import { createScene } from './sceneData.js';

let canvas;
let ctx;
let animationId;
let scene = null;
let lastTimestamp = 0;
let elapsedTime = 0;

const BASE_SPEED = 15; // pixels per second (slow ambient drift)

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
 * Update scene element positions based on parallax drift
 * @param {number} deltaTime - Time elapsed since last frame (seconds)
 */
function updateScene(deltaTime) {
  if (!scene) return;

  const vw = window.innerWidth;
  const vh = window.innerHeight;

  // Stars drift (slowest)
  const starSpeed = BASE_SPEED * scene.layers.stars.depth * deltaTime;
  scene.stars.forEach(star => {
    star.x -= starSpeed;
    // Wrap: if star moves off left edge, reappear on right
    if (star.x < -5) {
      star.x = vw * 1.5 + Math.random() * 50;
      star.y = Math.random() * vh;
    }
  });

  // Sun drifts
  const sunSpeed = BASE_SPEED * scene.layers.sun.depth * deltaTime;
  scene.sun.x -= sunSpeed;
  if (scene.sun.x < -scene.sun.radius * 2) {
    scene.sun.x = vw + scene.sun.radius * 2;
  }

  // Planet drifts (midground)
  const planetSpeed = BASE_SPEED * scene.layers.planet.depth * deltaTime;
  scene.planet.x -= planetSpeed;
  if (scene.planet.x < -scene.planet.radius * 2) {
    scene.planet.x = vw + scene.planet.radius * 2;
  }

  // Moons drift (fastest - foreground)
  const moonSpeed = BASE_SPEED * scene.layers.moons.depth * deltaTime;
  scene.moons.forEach(moon => {
    moon.x -= moonSpeed;
    if (moon.x < -moon.radius * 2) {
      moon.x = vw + moon.radius * 2;
    }
  });
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

  // 4. Planet (midground with 3D sphere effect + subtle vertical drift)
  const planetYOffset = Math.sin(elapsedTime * 0.3) * 5; // 5px amplitude, very slow
  const highlightOffsetX = scene.planet.x - scene.planet.radius * 0.3;
  const highlightOffsetY = scene.planet.y + planetYOffset - scene.planet.radius * 0.3;
  const planetGradient = ctx.createRadialGradient(
    highlightOffsetX, highlightOffsetY, scene.planet.radius * 0.2,
    scene.planet.x, scene.planet.y + planetYOffset, scene.planet.radius
  );
  planetGradient.addColorStop(0, scene.planet.colors[0]);    // highlight
  planetGradient.addColorStop(0.5, scene.planet.colors[1]);  // midtone
  planetGradient.addColorStop(1.0, scene.planet.colors[2]);  // shadow
  ctx.fillStyle = planetGradient;
  ctx.beginPath();
  ctx.arc(Math.floor(scene.planet.x), Math.floor(scene.planet.y + planetYOffset), scene.planet.radius, 0, Math.PI * 2);
  ctx.fill();

  // 5. Moons (foreground with subtle gradients + subtle vertical drift)
  scene.moons.forEach((moon, index) => {
    // Different frequency for each moon to avoid synchronized motion
    const moonYOffset = Math.sin(elapsedTime * (0.4 + index * 0.1)) * 5;
    const moonHighlightX = moon.x - moon.radius * 0.3;
    const moonHighlightY = moon.y + moonYOffset - moon.radius * 0.3;
    const moonGradient = ctx.createRadialGradient(
      moonHighlightX, moonHighlightY, 0,
      moon.x, moon.y + moonYOffset, moon.radius
    );
    moonGradient.addColorStop(0, '#a09070');     // lighter khaki highlight
    moonGradient.addColorStop(1.0, moon.color);  // darker khaki edge
    ctx.fillStyle = moonGradient;
    ctx.beginPath();
    ctx.arc(Math.floor(moon.x), Math.floor(moon.y + moonYOffset), moon.radius, 0, Math.PI * 2);
    ctx.fill();
  });
}

/**
 * Animation loop - updates and renders the complete cosmic scene
 * @param {number} timestamp - High-resolution timestamp from requestAnimationFrame
 */
function animate(timestamp) {
  // Initialize timestamp on first frame
  if (lastTimestamp === 0) {
    lastTimestamp = timestamp;
  }

  // Calculate delta time, clamped to prevent large spikes from tab backgrounding
  const deltaTime = Math.min((timestamp - lastTimestamp) / 1000, 0.1); // seconds, max 100ms
  lastTimestamp = timestamp;

  // Accumulate elapsed time for vertical drift
  elapsedTime += deltaTime;

  // Update element positions
  updateScene(deltaTime);

  // Render the scene
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
