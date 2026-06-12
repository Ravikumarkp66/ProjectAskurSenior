/**
 * Favicon generation script for AskUrSenior
 * Generates all required favicon variants from the AS logo source PNG
 * with brand colors: White "A" stroke, Purple "#8B5CF6" "S" stroke, transparent background
 */

import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(__dirname, 'public');
const sourceFile = path.join(publicDir, 'as-logo-source.png');

console.log('🎨 AskUrSenior Favicon Generator');
console.log('==================================');
console.log('Source:', sourceFile);

// Check source exists
if (!fs.existsSync(sourceFile)) {
  console.error('❌ Source file not found:', sourceFile);
  process.exit(1);
}

// Get source image info
const sourceInfo = await sharp(sourceFile).metadata();
console.log(`📐 Source dimensions: ${sourceInfo.width}x${sourceInfo.height} (${sourceInfo.format})`);

/**
 * Generate a PNG favicon variant at the specified size.
 * We process the image to ensure transparent background.
 */
async function generatePNG(size, outputName) {
  const outputPath = path.join(publicDir, outputName);
  
  await sharp(sourceFile)
    .resize(size, size, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 }  // transparent background
    })
    .png({ compressionLevel: 9, adaptiveFiltering: true })
    .toFile(outputPath);
  
  const stat = fs.statSync(outputPath);
  console.log(`✅ Generated ${outputName} (${size}x${size}) - ${(stat.size / 1024).toFixed(1)}KB`);
  return outputPath;
}

/**
 * Generate favicon.ico (multi-size ICO file).
 * Creates 16x16 and 32x32 PNGs then combines them.
 */
async function generateICO() {
  const outputPath = path.join(publicDir, 'favicon.ico');
  
  // For ICO, we create a 32x32 PNG and use it directly as ICO
  // Sharp doesn't support ICO natively, so we write a PNG with .ico extension
  // which modern browsers handle correctly as an ICO-compatible PNG
  await sharp(sourceFile)
    .resize(32, 32, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    })
    .png({ compressionLevel: 9 })
    .toFile(outputPath);
  
  const stat = fs.statSync(outputPath);
  console.log(`✅ Generated favicon.ico (32x32) - ${(stat.size / 1024).toFixed(1)}KB`);
}

// Generate all favicon variants
try {
  console.log('\n📦 Generating favicon variants...\n');
  
  await generatePNG(16, 'favicon-16x16.png');
  await generatePNG(32, 'favicon-32x32.png');
  await generatePNG(180, 'apple-touch-icon.png');
  await generatePNG(192, 'android-chrome-192x192.png');
  await generatePNG(512, 'android-chrome-512x512.png');
  await generateICO();
  
  // Generate site.webmanifest for PWA support
  const manifest = {
    name: "AskUrSenior",
    short_name: "AskUrSenior",
    description: "Academic Tracking Platform for College Students",
    icons: [
      {
        src: "/android-chrome-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any maskable"
      },
      {
        src: "/android-chrome-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any maskable"
      }
    ],
    theme_color: "#8B5CF6",
    background_color: "#0F0A1A",
    display: "standalone",
    start_url: "/",
    scope: "/"
  };
  
  const manifestPath = path.join(publicDir, 'site.webmanifest');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  console.log('✅ Generated site.webmanifest');
  
  console.log('\n🎉 All favicon variants generated successfully!');
  console.log('\nFiles created in:', publicDir);
  
} catch (err) {
  console.error('❌ Error generating favicons:', err.message);
  process.exit(1);
}
