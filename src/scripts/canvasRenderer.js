/**
 * Canvas Renderer — forward-flying starfield with warp
 */

import { createScene } from './sceneData.js';

let canvas, ctx, animationId, scene;
let lastTimestamp = 0;
let vw, vh;

const TRAVEL_SPEED = 200;
const FOCAL_LENGTH = 300;
const WARP_EASE = 5;

let warpTarget = 1;
let warpCurrent = 1;

function setupCanvas() {
  const dpr = window.devicePixelRatio || 1;
  vw = window.innerWidth;
  vh = window.innerHeight;
  canvas.width = vw * dpr;
  canvas.height = vh * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  canvas.style.width = `${vw}px`;
  canvas.style.height = `${vh}px`;
  scene = createScene(vw, vh);
}

function renderScene(c, dt) {
  const cx = vw / 2;
  const cy = vh / 2;
  const speed = TRAVEL_SPEED * warpCurrent;
  // Trail length in z-units — proportional to speed
  const trailZ = Math.abs(speed) * 0.035;

  c.fillStyle = '#000';
  c.fillRect(0, 0, vw, vh);

  c.fillStyle = '#fff';
  c.strokeStyle = '#fff';
  c.lineCap = 'round';

  for (const star of scene.stars) {
    star.z -= speed * dt;

    if (star.z <= 1) {
      star.z = scene.maxDepth;
      star.x = (Math.random() - 0.5) * vw * 4;
      star.y = (Math.random() - 0.5) * vh * 4;
    } else if (star.z > scene.maxDepth) {
      star.z = 1 + Math.random() * 50;
      star.x = (Math.random() - 0.5) * vw * 4;
      star.y = (Math.random() - 0.5) * vh * 4;
    }

    const scale = FOCAL_LENGTH / star.z;
    const sx = cx + star.x * scale;
    const sy = cy + star.y * scale;

    if (sx < -20 || sx > vw + 20 || sy < -20 || sy > vh + 20) continue;

    const radius = Math.max(0.3, 1.8 * scale);
    const alpha = star.brightness * Math.min(1, scale * 1.5);

    // Trail end — where the star "was" (further back in z)
    const tailZ = star.z + trailZ;
    const tailScale = FOCAL_LENGTH / tailZ;
    const tx = cx + star.x * tailScale;
    const ty = cy + star.y * tailScale;

    // Distance between head and tail on screen
    const dx = sx - tx;
    const dy = sy - ty;
    const lineLen = Math.sqrt(dx * dx + dy * dy);

    if (lineLen > 1.5) {
      // Draw trail line
      c.globalAlpha = alpha * 0.5;
      c.lineWidth = Math.max(0.4, radius * 0.6);
      c.beginPath();
      c.moveTo(tx, ty);
      c.lineTo(sx, sy);
      c.stroke();
    }

    // Draw star head
    c.globalAlpha = alpha;
    c.beginPath();
    c.arc(sx, sy, lineLen > 1.5 ? radius * 0.7 : radius, 0, Math.PI * 2);
    c.fill();
  }

  c.globalAlpha = 1;
}

function animate(timestamp) {
  if (lastTimestamp === 0) lastTimestamp = timestamp;
  const dt = Math.min((timestamp - lastTimestamp) / 1000, 0.1);
  lastTimestamp = timestamp;

  // Smooth warp easing
  warpCurrent += (warpTarget - warpCurrent) * Math.min(1, WARP_EASE * dt);

  renderScene(ctx, dt);
  animationId = requestAnimationFrame(animate);
}

/** Set warp speed multiplier (1 = normal, >1 = forward warp, <0 = reverse) */
export function setWarp(multiplier) {
  warpTarget = multiplier;
}

export function initCanvas() {
  canvas = document.getElementById('canvas');
  if (!canvas) return null;
  ctx = canvas.getContext('2d');
  setupCanvas();
  window.addEventListener('resize', setupCanvas);
  requestAnimationFrame(animate);
  return { canvas, ctx };
}

export function stopAnimation() {
  if (animationId) { cancelAnimationFrame(animationId); animationId = null; }
}
