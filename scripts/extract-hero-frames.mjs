// Extracts the hero character video into optimized WebP frames.
// Usage: node scripts/extract-hero-frames.mjs [input=raw/hero.mp4] [fps=24] [width=1280]
import { spawnSync } from "node:child_process";
import { mkdirSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import ffmpeg from "ffmpeg-static";

const [input = "raw/hero.mp4", fps = "24", width = "1280"] = process.argv.slice(2);
const outDir = path.join("public", "hero-frames");

rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });

const result = spawnSync(
  ffmpeg,
  [
    "-hide_banner",
    "-loglevel", "error",
    "-i", input,
    // Curves lift only the highlights so the backdrop reads as white and blends into the hero glow.
    "-vf", `fps=${fps},curves=all='0/0 0.5/0.51 0.86/0.965 1/1',scale=${width}:-2:flags=lanczos`,
    "-c:v", "libwebp",
    "-quality", "78",
    "-compression_level", "6",
    path.join(outDir, "frame_%04d.webp"),
  ],
  { stdio: "inherit" },
);

if (result.status !== 0) process.exit(result.status ?? 1);

const frames = readdirSync(outDir).filter((f) => f.endsWith(".webp"));
writeFileSync(
  path.join(outDir, "manifest.json"),
  JSON.stringify({ count: frames.length, fps: Number(fps), width: Number(width) }, null, 2),
);
console.log(`Extracted ${frames.length} frames to ${outDir}`);
