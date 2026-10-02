// Extracts the hero character clips into one continuous run of optimized WebP frames.
// Usage: node scripts/extract-hero-frames.mjs [fps=24] [width=1280]
// Clips are numbered in order: raw/hero.mp4 -> frames 1-240, raw/lookup.mp4 -> 241-480, ...
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import ffmpeg from "ffmpeg-static";

const CLIPS = ["raw/hero.mp4", "raw/lookup.mp4"];
const [fps = "24", width = "1280"] = process.argv.slice(2);
const outDir = path.join("public", "hero-frames");

rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });

const clips = [];
for (const input of CLIPS) {
  if (!existsSync(input)) {
    console.error(`Missing ${input}`);
    process.exit(1);
  }
  const start = readdirSync(outDir).filter((f) => f.endsWith(".webp")).length + 1;
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
      "-start_number", String(start),
      path.join(outDir, "frame_%04d.webp"),
    ],
    { stdio: "inherit" },
  );
  if (result.status !== 0) process.exit(result.status ?? 1);
  const end = readdirSync(outDir).filter((f) => f.endsWith(".webp")).length;
  clips.push({ input, first: start - 1, last: end - 1 }); // 0-based, inclusive
}

const count = readdirSync(outDir).filter((f) => f.endsWith(".webp")).length;
writeFileSync(
  path.join(outDir, "manifest.json"),
  JSON.stringify({ count, fps: Number(fps), width: Number(width), clips }, null, 2),
);
console.log(`Extracted ${count} frames to ${outDir}`, clips);
