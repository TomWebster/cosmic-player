/**
 * Scene Data Model
 * Starfield with forward-flying camera through space
 */

/**
 * Create the starfield scene
 * @param {number} width - Logical viewport width (CSS pixels)
 * @param {number} height - Logical viewport height (CSS pixels)
 * @returns {Object} Scene data with stars positioned in 3D space
 */
export function createScene(width, height) {
  const STAR_COUNT = 400;
  const MAX_DEPTH = 1500;

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
