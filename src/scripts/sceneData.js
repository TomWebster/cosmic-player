/**
 * Scene Data Model
 * Defines all cosmic elements — stars, sun, planet, moons — and their parallax layers
 */

/**
 * Create the complete cosmic scene with all layers
 * @param {number} width - Logical viewport width (CSS pixels)
 * @param {number} height - Logical viewport height (CSS pixels)
 * @returns {Object} Scene data with all cosmic elements and layer depth definitions
 */
export function createScene(width, height) {
  // Generate extended canvas area for parallax drift (1.5x width to prevent edge gaps)
  const extendedWidth = width * 1.5;
  const extendedHeight = height * 1.5;
  const offsetX = (extendedWidth - width) / 2;
  const offsetY = (extendedHeight - height) / 2;

  // Star generation — sparse scattered feel (80s Elite aesthetic)
  const starCount = 100;
  const stars = [];
  for (let i = 0; i < starCount; i++) {
    stars.push({
      x: Math.random() * extendedWidth - offsetX,
      y: Math.random() * extendedHeight - offsetY,
      radius: 0.5 + Math.random() * 1.5, // 0.5 to 2.0
      brightness: 0.5 + Math.random() * 0.5 // 0.5 to 1.0 (for alpha)
    });
  }

  // Planet — large Saturn-colored sphere with 3D gradient
  const minDimension = Math.min(width, height);
  const planetRadius = minDimension * 0.13; // ~13% of smaller dimension
  const planet = {
    x: width * 0.6,
    y: height * 0.55,
    radius: planetRadius,
    colors: ['#e6d5a8', '#c4a24d', '#5a4a30'] // highlight, midtone, shadow
  };

  // Moons — two subtle khaki spheres near the planet
  const moonBaseRadius = planetRadius * 0.17; // ~17% of planet radius
  const moons = [
    {
      x: planet.x - planetRadius * 1.5,
      y: planet.y - planetRadius * 0.8,
      radius: moonBaseRadius * 1.1, // Slightly larger
      color: '#8a7a5e'
    },
    {
      x: planet.x + planetRadius * 1.3,
      y: planet.y + planetRadius * 1.2,
      radius: moonBaseRadius * 0.9, // Slightly smaller
      color: '#8a7a5e'
    }
  ];

  // Sun — distant light source with glow
  const sunRadius = width * 0.04; // ~4% of viewport width
  const sun = {
    x: width * 0.15,
    y: height * 0.2,
    radius: sunRadius,
    colors: ['#fffacd', '#ffd700', 'rgba(255, 215, 0, 0)'] // core, mid, outer (transparent for glow)
  };

  // Parallax depth multipliers (for animation system in Plan 02)
  const layers = {
    stars: { depth: 0.2 },   // Slowest — furthest away
    sun: { depth: 0.3 },
    planet: { depth: 0.5 },  // Midground
    moons: { depth: 0.8 }    // Fastest — foreground
  };

  return {
    stars,
    sun,
    planet,
    moons,
    layers
  };
}
