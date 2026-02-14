/**
 * Canvas Renderer — forward-flying starfield with warp speed
 *
 * Renders a 3D starfield using 2D Canvas with perspective projection.
 * Stars fly toward the camera (decreasing z). When they pass z=1 they
 * respawn at max depth. A warp multiplier stretches speed and trails
 * for hyperspace-style effects triggered by skip/scrub controls.
 *
 * Coordinate system:
 *   x, y = position in the star field plane (spread = 4× viewport)
 *   z    = depth (1 = nearest, maxDepth = farthest)
 *   Perspective: screen_pos = center + star_pos * (FOCAL_LENGTH / z)
 */

import { createScene } from './sceneData.js';

// Module state — canvas, context, animation, and scene data
let canvas, ctx, animationId, scene;
let lastTimestamp = 0;
let vw, vh; // Logical viewport dimensions (CSS pixels)

// Tuning constants
const TRAVEL_SPEED = 200;  // Base z-units per second at warp=1
const FOCAL_LENGTH = 300;  // Perspective projection focal length (higher = less fisheye)
const WARP_EASE = 5;       // Easing rate — higher = snappier transitions to target warp

// Warp state — target is set externally, current eases toward it each frame
let warpTarget = 1;
let warpCurrent = 1;

/**
 * Sizes the canvas to fill the viewport at native DPI.
 * Uses setTransform (non-cumulative) so repeated calls don't compound scaling.
 * Recreates the star field to match the new dimensions.
 */
function setupCanvas() {
  const dpr = window.devicePixelRatio || 1;
  const vp = window.visualViewport;
  vw = vp ? vp.width : document.documentElement.clientWidth;
  vh = vp ? vp.height : document.documentElement.clientHeight;

  // Physical pixels = logical × DPR
  canvas.width = vw * dpr;
  canvas.height = vh * dpr;

  // Scale drawing context to DPR, then set CSS size to logical pixels
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  canvas.style.width = `${vw}px`;
  canvas.style.height = `${vh}px`;

  scene = createScene(vw, vh);
}

/**
 * Renders one frame of the starfield.
 * Each star moves in z based on speed × dt, then gets projected to screen coordinates.
 * Stars that trail behind get a line drawn from tail to head for motion blur.
 *
 * @param {CanvasRenderingContext2D} c - The drawing context
 * @param {number} dt - Delta time in seconds since last frame
 */
function renderScene(c, dt) {
  const cx = vw / 2;
  const cy = vh / 2;
  const speed = TRAVEL_SPEED * warpCurrent;
  const trailZ = Math.abs(speed) * 0.035; // Trail length proportional to speed

  // Clear to black
  c.fillStyle = '#000';
  c.fillRect(0, 0, vw, vh);

  c.fillStyle = '#fff';
  c.strokeStyle = '#fff';
  c.lineCap = 'round';

  for (const star of scene.stars) {
    // Move star toward camera (decrease z)
    star.z -= speed * dt;

    // Respawn stars that pass the camera or go beyond max depth
    if (star.z <= 1) {
      star.z = scene.maxDepth;
      star.x = (Math.random() - 0.5) * vw * 4;
      star.y = (Math.random() - 0.5) * vh * 4;
    } else if (star.z > scene.maxDepth) {
      star.z = 1 + Math.random() * 50;
      star.x = (Math.random() - 0.5) * vw * 4;
      star.y = (Math.random() - 0.5) * vh * 4;
    }

    // Project 3D position to 2D screen via perspective division
    const scale = FOCAL_LENGTH / star.z;
    const sx = cx + star.x * scale;
    const sy = cy + star.y * scale;

    // Cull stars outside the visible area (small margin for trails)
    if (sx < -20 || sx > vw + 20 || sy < -20 || sy > vh + 20) continue;

    const radius = Math.max(0.3, 1.8 * scale);
    const alpha = star.brightness * Math.min(1, scale * 1.5);

    // Compute trail endpoint — where the star "was" one trail-length deeper in z
    const tailZ = star.z + trailZ;
    const tailScale = FOCAL_LENGTH / tailZ;
    const tx = cx + star.x * tailScale;
    const ty = cy + star.y * tailScale;

    // Screen distance between head and tail determines if trail is visible
    const dx = sx - tx;
    const dy = sy - ty;
    const lineLen = Math.sqrt(dx * dx + dy * dy);

    if (lineLen > 1.5) {
      // Draw motion trail (fainter, thinner than the star head)
      c.globalAlpha = alpha * 0.5;
      c.lineWidth = Math.max(0.4, radius * 0.6);
      c.beginPath();
      c.moveTo(tx, ty);
      c.lineTo(sx, sy);
      c.stroke();
    }

    // Draw star head — smaller when trailing to emphasize the streak
    c.globalAlpha = alpha;
    c.beginPath();
    c.arc(sx, sy, lineLen > 1.5 ? radius * 0.7 : radius, 0, Math.PI * 2);
    c.fill();
  }

  c.globalAlpha = 1;
}

/**
 * Main animation loop. Uses requestAnimationFrame for vsync.
 * Delta time is clamped to 100ms to prevent huge jumps when
 * the tab is backgrounded and then foregrounded.
 */
function animate(timestamp) {
  if (lastTimestamp === 0) lastTimestamp = timestamp;
  const dt = Math.min((timestamp - lastTimestamp) / 1000, 0.1);
  lastTimestamp = timestamp;

  // Ease warpCurrent toward warpTarget for smooth transitions
  warpCurrent += (warpTarget - warpCurrent) * Math.min(1, WARP_EASE * dt);

  renderScene(ctx, dt);
  animationId = requestAnimationFrame(animate);
}

/**
 * Sets the warp speed multiplier. The renderer eases toward this value.
 * @param {number} multiplier - 1 = normal, >1 = forward warp, <0 = reverse warp
 */
export function setWarp(multiplier) {
  warpTarget = multiplier;
}

/**
 * Initializes the canvas, sizes it, attaches resize listeners, and starts the animation loop.
 * @returns {{ canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D } | null}
 */
export function initCanvas() {
  canvas = document.getElementById('canvas');
  if (!canvas) return null;
  ctx = canvas.getContext('2d');
  setupCanvas();

  // Re-setup on window or visual viewport resize (covers pinch-zoom on mobile)
  window.addEventListener('resize', setupCanvas);
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', setupCanvas);
  }

  requestAnimationFrame(animate);
  return { canvas, ctx };
}

/** Stops the animation loop. */
export function stopAnimation() {
  if (animationId) {
    cancelAnimationFrame(animationId);
    animationId = null;
  }
}
