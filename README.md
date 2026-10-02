# Anjana Das: Portfolio

A single-page interactive hero: an animated character at her laptop that reacts to where the visitor's cursor is.

- **Cursor:** her head follows the cursor left and right. The further out the cursor, the further she turns. Near the middle she goes back to typing.
- **Click:** she waves hello, holds the pose for a moment, then goes back to typing and following the cursor.
- **"Explore the portfolio" cue:** links to https://naveenpeter.com (`cueHref` in `src/data/hero-frames.ts`).
- **Phones, touch and portrait screens:** a centered layout that plays the greeting once the hero is in view (tap to replay).
- `prefers-reduced-motion`: shows the final greeting pose without animation.

Built with Vite, React, TypeScript and Tailwind CSS v4. The output is fully static (`dist/`).

## Develop

```bash
npm install
npm run dev
```

## Build

```bash
npm run build   # outputs dist/
npm run preview # serve the production build locally
```

## How the animation works

The character video (`raw/hero.mp4`, gitignored) is split into WebP frames in `public/hero-frames/`. They are drawn to a `<canvas>` with `requestAnimationFrame`. All playback state lives in refs, so React does not re-render while it animates.

- `src/components/CharacterHero.tsx`: frame loader, playback queue (play / crossfade / hold / follow), cursor-driven head turn and captions.
- `src/data/hero-frames.ts`: which frames make up each beat (working loop, left look, right look, greeting) and all hero text.

### Replacing the video

1. Put the new clip at `raw/hero.mp4`. Keep the camera locked, 16:9, with the same beats in order: working, look left, look right, notice the viewer, headset off, wave, point down.
2. Run `node scripts/extract-hero-frames.mjs`. It writes 24fps, 1280px WebP frames and lifts the highlights so the backdrop reads as white.
3. Update the frame numbers in `src/data/hero-frames.ts`.
