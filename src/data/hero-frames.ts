// Frame map for the interactive character hero.
// Frames are 0-based indices into /hero-frames/frame_0001.webp … (24fps, 980x720).
// Regenerate frames with: node scripts/extract-hero-frames.mjs

export const HERO_FRAMES = {
  count: 720,
  fps: 24,
  width: 980, // source frames are cropped to 980x720 (150px off each side of the 1280x720 clips)
  height: 720,
  path: (i: number) => `/hero-frames/frame_${String(i + 1).padStart(4, "0")}.webp`,
  // Separate source clips (inclusive ranges); frames are never borrowed across clips.
  clips: [
    [0, 239], // raw/hero.mp4: typing, look left/right, headset off, wave, point
    [240, 479], // raw/lookup.mp4: typing, glance up-right, look up-left, look up
    [480, 719], // raw/lookup2.mp4: typing, look up-right, slow turn to full left profile
  ] as const,

  // Typing loop (ping-pong), ends just before a blink.
  working: [0, 33] as const,

  // Head/eye paths scrubbed by the cursor: [near-neutral start, full look].
  // A start equal to its end is a single held pose.
  gaze: {
    left: [33, 54], // head turns left (continues straight on from the typing loop)
    right: [69, 87], // head turns right
    upRight: [513, 540], // looks up and to the right (third clip)
    upLeft: [296, 320], // looks up and to the left
    up: [372, 372], // eyes straight up
  },

  // Wave only (headset already around her neck): hand rises at the start, eyes open throughout.
  greet: [168, 196] as const,

  // Area of the frame the character + laptop occupy (normalized), used to size her on screen.
  subject: { x: 0.1735, y: 0.1, w: 0.6531, h: 0.86 },
  // Tighter crop for narrow screens (hands stay inside it even mid-wave).
  subjectCompact: { x: 0.2127, y: 0.1, w: 0.5747, h: 0.86 },
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
