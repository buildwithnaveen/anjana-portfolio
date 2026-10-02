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
  // Head turns from the working pose to the left-looking peak.
  leftPeak: 54,
  // Right reaction starts with her head near center and turns to the right-looking peak.
  rightStart: 69,
  rightPeak: 87,
  // Notice the viewer -> headset off -> wave -> point down (holds on the clearest pointing frame).
  greet: [102, 222] as const,

  // Greeting captions keyed by the frame they appear on.
  greetCaptions: [
    { from: 105, text: "Hey, it's you!" },
    { from: 174, text: "Hiiii!" },
    { from: 204, text: "Check out the portfolio" },
  ],

  // Area of the frame the character + laptop occupy (normalized), used to size her on screen.
  subject: { x: 0.25, y: 0.1, w: 0.5, h: 0.86 },
  // Tighter crop for narrow screens (hands stay inside it even mid-wave).
  subjectCompact: { x: 0.28, y: 0.1, w: 0.44, h: 0.86 },
} as const;

export const HERO_COPY = {
  name: "Anjana Das",
  role: "Web Developer",
  instruction: "Move cursor to call me !",
  left: "Anyone here on the left?",
  right: "Anyone here on the right?",
  cue: "Explore the portfolio",
};
