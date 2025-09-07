const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const svgPath = path.resolve(__dirname, '../docs/performance-controls-wireframe.svg');
const outPath = path.resolve(__dirname, '../docs/performance-controls-wireframe.png');

if (!fs.existsSync(svgPath)) {
  console.error('SVG not found:', svgPath);
  process.exit(2);
}

const svg = fs.readFileSync(svgPath);

(async () => {
  try {
    await sharp(svg).png().toFile(outPath);
    console.log('Wrote PNG:', outPath);
  } catch (err) {
    console.error('Conversion failed:', err);
    process.exit(1);
  }
})();

