/**
 * Scene Data Model — generates the starfield.
 *
 * Stars are positioned in 3D space with random x/y spread (4× viewport)
 * and random z depth (0 to maxDepth). Each star has a brightness value
 * that stays fixed — the renderer uses depth-based alpha for fading.
 *
 * The spread factor (4×) ensures stars fill the screen at all depths
 * even with perspective projection narrowing the visible field.
 */

const STAR_COUNT = 400;
const MAX_DEPTH = 1500;

/**
 * Creates a new starfield with randomly positioned stars.
 * Called on init and on resize (stars are regenerated to fit new viewport).
 *
 * @param {number} width - Logical viewport width (CSS pixels)
 * @param {number} height - Logical viewport height (CSS pixels)
 * @returns {{ stars: Array<{x: number, y: number, z: number, brightness: number}>, maxDepth: number }}
 */
export function createScene(width, height) {
  const stars = [];
  for (let i = 0; i < STAR_COUNT; i++) {
    stars.push({
      x: (Math.random() - 0.5) * width * 4,
      y: (Math.random() - 0.5) * height * 4,
      z: Math.random() * MAX_DEPTH,
      brightness: 0.4 + Math.random() * 0.6
    });
  }
  return { stars, maxDepth: MAX_DEPTH };
}
