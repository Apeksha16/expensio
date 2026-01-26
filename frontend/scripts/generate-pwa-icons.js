#!/usr/bin/env node

/**
 * Script to generate PWA icons from SVG
 * 
 * Requirements:
 * - Node.js with sharp package installed: npm install --save-dev sharp
 * 
 * Usage:
 * node scripts/generate-pwa-icons.js
 */

const fs = require('fs');
const path = require('path');

const sizes = [
    { name: 'pwa-64x64.png', size: 64 },
    { name: 'pwa-192x192.png', size: 192 },
    { name: 'pwa-512x512.png', size: 512 },
    { name: 'apple-touch-icon.png', size: 180 },
];

const publicDir = path.join(__dirname, '../public');
const svgPath = path.join(publicDir, 'icon.svg');

async function generateIcons() {
    try {
        // Check if sharp is available
        let sharp;
        try {
            sharp = require('sharp');
        } catch (e) {
            console.error('❌ Error: sharp package is not installed.');
            console.log('📦 Install it with: npm install --save-dev sharp');
            console.log('\nAlternatively, you can:');
            console.log('1. Use an online tool: https://realfavicongenerator.net/');
            console.log('2. Use ImageMagick: convert icon.svg -resize 192x192 pwa-192x192.png');
            process.exit(1);
        }

        // Check if SVG exists
        if (!fs.existsSync(svgPath)) {
            console.error(`❌ Error: ${svgPath} not found`);
            process.exit(1);
        }

        console.log('🎨 Generating PWA icons...\n');

        // Read SVG
        const svgBuffer = fs.readFileSync(svgPath);

        // Generate each size
        for (const { name, size } of sizes) {
            const outputPath = path.join(publicDir, name);
            
            await sharp(svgBuffer)
                .resize(size, size, {
                    fit: 'contain',
                    background: { r: 15, g: 23, b: 42, alpha: 1 } // #0F172A
                })
                .png()
                .toFile(outputPath);

            console.log(`✅ Generated ${name} (${size}x${size})`);
        }

        console.log('\n✨ All icons generated successfully!');
        console.log('📱 Your PWA is ready with custom icons.');
    } catch (error) {
        console.error('❌ Error generating icons:', error.message);
        process.exit(1);
    }
}

generateIcons();
