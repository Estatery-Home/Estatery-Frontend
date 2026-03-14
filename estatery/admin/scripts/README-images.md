# Image Conversion

All images in this project use WebP format for better performance. Images are stored locally in `public/images/`.

## Generate WebP Images

Run this once (or when adding new images):

```bash
npm install
npm run convert-images
```

This will:
1. Convert `public/HomeLogo.png` → `public/images/HomeLogo.webp`
2. Download Unsplash property images and convert to `public/images/property-1.webp` through `property-10.webp`
3. Create `public/images/login_home.webp` (copy of property-1)

## Requirements

- `sharp` (dev dependency) for image conversion
- `public/HomeLogo.png` must exist before running
