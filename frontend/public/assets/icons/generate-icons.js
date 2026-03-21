#!/usr/bin/env node
/**
 * Generate placeholder PNG icons for CBC Learning Ecosystem
 * Requires: npm install sharp
 */

const fs = require('fs');
const path = require('path');

const sizes = [72, 96, 128, 144, 152, 167, 192, 256, 384, 512];
const navy = '#1B3A6B';
const gold = '#E8C840';

// Try using sharp if available, otherwise create SVG placeholders
try {
  const sharp = require('sharp');
  
  sizes.forEach(size => {
    const svg = `
      <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
        <rect width="${size}" height="${size}" fill="${navy}"/>
        <text x="50%" y="50%" font-size="${Math.floor(size * 0.4)}" font-weight="bold" 
              fill="${gold}" text-anchor="middle" dominant-baseline="middle" 
              font-family="Arial, sans-serif">CBC</text>
      </svg>
    `;
    
    sharp(Buffer.from(svg))
      .png()
      .toFile(`icon-${size}.png`)
      .then(() => console.log(`✓ Created icon-${size}.png`))
      .catch(err => console.error(`✗ Failed to create icon-${size}.png:`, err.message));
  });
  
} catch (e) {
  // Fallback: create SVG files
  console.log('sharp not available, creating SVG placeholders instead...');
  
  sizes.forEach(size => {
    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" fill="${navy}"/>
  <text x="50%" y="50%" font-size="${Math.floor(size * 0.4)}" font-weight="bold" 
        fill="${gold}" text-anchor="middle" dominant-baseline="middle" 
        font-family="Arial, sans-serif">CBC</text>
</svg>`;
    
    fs.writeFileSync(`icon-${size}.svg`, svg);
    console.log(`✓ Created icon-${size}.svg`);
  });
}
