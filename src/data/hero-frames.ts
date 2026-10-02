// Frame map for the interactive character hero.
// Frames are 0-based indices into /hero-frames/frame_0001.webp … (24fps, 1280x720).
// Regenerate frames with: node scripts/extract-hero-frames.mjs

export const HERO_FRAMES = {
  count: 240,
  fps: 24,
  width: 1280,
  height: 720,
  path: (i: number) => `/hero-frames/frame_${String(i + 1).padStart(4, "0")}.webp`,

  // Typing loop (ping-pong), ends just before a blink.
  working: [0, 33] as const,
  // Head turns from the working pose to the left-looking peak (scrubbed by cursor position).
  leftPeak: 54,
  // Right turn starts with her head near center and turns to the right-looking peak (scrubbed by cursor position).
  rightStart: 69,
  rightPeak: 87,
  // Wave only (headset already around her neck): hand rises at the start, eyes open throughout.
  greet: [168, 196] as const,
  // The waving part is played back to here and forward again so the wave lasts a little longer.
  waveRepeatFrom: 176,

  // Area of the frame the character + laptop occupy (normalized), used to size her on screen.
  subject: { x: 0.25, y: 0.1, w: 0.5, h: 0.86 },
  // Tighter crop for narrow screens (hands stay inside it even mid-wave).
  subjectCompact: { x: 0.28, y: 0.1, w: 0.44, h: 0.86 },
} as const;

export const HERO_COPY = {
  name: "Anjana Das",
  role: "Web Developer",
  instruction: "Move your cursor, click to say hi",
  left: "Anyone here on the left?",
  right: "Anyone here on the right?",
  wave: "Hiiii!",
  afterWave: "Check out the portfolio",
  cue: "Explore the portfolio",
  cueHref: "https://naveenpeter.com",
};
