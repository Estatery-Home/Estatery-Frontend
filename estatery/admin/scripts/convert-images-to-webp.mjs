#!/usr/bin/env node
/**
 * Converts all project images to WebP and downloads external images locally.
 * Run: npm run convert-images
 */

import { mkdirSync, existsSync, readFileSync, copyFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const PUBLIC = join(ROOT, "public");
const IMAGES_DIR = join(PUBLIC, "images");

const UNSPLASH_IMAGES = [
  "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&h=500&fit=crop",
  "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&h=500&fit=crop",
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&h=500&fit=crop",
  "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800&h=500&fit=crop",
  "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=800&h=500&fit=crop",
  "https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?w=800&h=500&fit=crop",
  "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&h=500&fit=crop",
  "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800&h=500&fit=crop",
  "https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?w=800&h=500&fit=crop",
  "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&h=500&fit=crop",
];

async function ensureDir(dir) {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
    console.log(`Created ${dir}`);
  }
}

async function fetchBuffer(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

async function convertToWebP(inputBuffer, outputPath) {
  try {
    const sharp = (await import("sharp")).default;
    await sharp(inputBuffer)
      .webp({ quality: 85 })
      .toFile(outputPath);
    console.log(`  → ${outputPath}`);
  } catch (err) {
    console.error(`  ✗ sharp not installed. Run: npm install sharp --save-dev`);
    throw err;
  }
}

async function main() {
  console.log("Converting images to WebP...\n");

  await ensureDir(IMAGES_DIR);

  // 1. Convert HomeLogo.png to WebP
  const homeLogoPath = join(PUBLIC, "HomeLogo.png");
  if (existsSync(homeLogoPath)) {
    console.log("1. HomeLogo.png → WebP");
    const buf = readFileSync(homeLogoPath);
    await convertToWebP(buf, join(IMAGES_DIR, "HomeLogo.webp"));
  } else {
    console.log("1. HomeLogo.png not found, skipping");
  }

  // 2. Download Unsplash property images and convert to WebP
  console.log("\n2. Downloading & converting property images...");
  for (let i = 0; i < UNSPLASH_IMAGES.length; i++) {
    const url = UNSPLASH_IMAGES[i];
    const name = `property-${i + 1}.webp`;
    const buf = await fetchBuffer(url);
    await convertToWebP(buf, join(IMAGES_DIR, name));
  }

  // 3. Create login_home.webp (use first property image)
  console.log("\n3. Creating login_home.webp (from property-1)...");
  const prop1 = join(IMAGES_DIR, "property-1.webp");
  if (existsSync(prop1)) {
    copyFileSync(prop1, join(IMAGES_DIR, "login_home.webp"));
    console.log("  → images/login_home.webp");
  }

  console.log("\n✓ Done. Update your code to use /images/*.webp paths.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
