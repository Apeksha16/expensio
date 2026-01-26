# PWA Icons Setup

This directory should contain the following PWA icon files. The vite-plugin-pwa will automatically generate these during build, but you can also create them manually for better control.

## Required Icon Files

1. **pwa-64x64.png** - 64x64 pixels
2. **pwa-192x192.png** - 192x192 pixels  
3. **pwa-512x512.png** - 512x512 pixels (also used as maskable)
4. **apple-touch-icon.png** - 180x180 pixels (for iOS)

## Quick Setup Options

### Option 1: Use Online Icon Generator
1. Visit https://realfavicongenerator.net/ or https://www.pwabuilder.com/imageGenerator
2. Upload a 512x512 PNG image with your app logo (💰 emoji on dark background)
3. Generate and download all required sizes
4. Place them in this `public` directory

### Option 2: Use ImageMagick (if installed)
```bash
# Convert SVG to PNG at different sizes
convert icon.svg -resize 64x64 pwa-64x64.png
convert icon.svg -resize 192x192 pwa-192x192.png
convert icon.svg -resize 512x512 pwa-512x512.png
convert icon.svg -resize 180x180 apple-touch-icon.png
```

### Option 3: Use Node.js script
Create a simple script using `sharp` or `jimp` to generate icons from the SVG file.

## Icon Design Guidelines

- Use a simple, recognizable icon (the 💰 emoji works well)
- Ensure good contrast for visibility on various backgrounds
- For maskable icons, keep important content within the safe zone (80% of the icon)
- Use the app's theme colors: #0F172A (dark) and #F97316 (orange)

## Current Status

The app will work without these PNG files, but they're recommended for:
- Better app icon display on home screens
- Proper iOS installation experience
- Professional appearance in app stores/browsers

The vite-plugin-pwa will generate placeholder icons if these files don't exist, but custom icons will look much better.
