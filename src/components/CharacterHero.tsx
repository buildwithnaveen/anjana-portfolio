
import { useEffect, useRef } from "react";
import { HERO_COPY, HERO_FRAMES as F } from "../data/hero-frames";

const cx = (...classes: string[]) => classes.join(" ");

type Zone = "left" | "center" | "right";
type Mode = "working" | "left" | "right" | "greet" | "greeted";
type Step =
  | { kind: "play"; to: number }
  | { kind: "jump"; to: number } // crossfade to a non-adjacent frame
  | { kind: "hold"; ms: number }
  | { kind: "loop"; a: number; b: number } // ping-pong until replaced
  | { kind: "call"; fn: () => void }
  | { kind: "end" };

const HOLD_MS = 2600;
const FADE_MS = 280;
const LOOP_SPEED = 0.8;
const LOAD_CONCURRENCY = 6;
const ZONE_DWELL_MS = 180;

const ease = (t: number) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);

export default function CharacterHero() {
  const sectionRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const messageRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const canvas = canvasRef.current;
    const message = messageRef.current;
    const ctx = canvas?.getContext("2d");
    if (!section || !canvas || !message || !ctx) return;

    const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
    // Must match the `wide` variant in index.css.
    const wideLayout = matchMedia("(min-width: 768px) and (pointer: fine) and (min-aspect-ratio: 4/5)");
    let disposed = false;

    // ---- Frame loading: working loop + final pose first, then everything else ----
    const frames: (HTMLImageElement | null)[] = new Array(F.count).fill(null);
    const loadOrder = new Set<number>();
    if (reduceMotion) loadOrder.add(F.greet[1]);
    for (let i = F.working[0]; i <= F.working[1]; i++) loadOrder.add(i);
    loadOrder.add(F.greet[1]);
    for (let i = 0; i < F.count; i++) loadOrder.add(i);
    const pending = [...loadOrder];
    const loadNext = async (): Promise<void> => {
      while (!disposed && pending.length) {
        const i = pending.shift()!;
        const img = new Image();
        img.src = F.path(i);
        try {
          await img.decode();
          if (disposed) return;
          frames[i] = img;
          needsDraw = true;
        } catch {
          // A missing frame falls back to its nearest loaded neighbour.
        }
      }
    };
    for (let k = 0; k < LOAD_CONCURRENCY; k++) void loadNext();

    const nearestLoaded = (i: number) => {
      for (let d = 0; d < F.count; d++) {
        if (frames[i - d]) return i - d;
        if (frames[i + d]) return i + d;
      }
      return -1;
    };

    // ---- Playback state (kept out of React to avoid re-renders) ----
    let playhead: number = F.working[0];
    let queue: Step[] = [];
    let stepStart = performance.now();
    let loopDir = 1;
    let fadeFrom = -1;
    let fadeStart = 0;
    let mode: Mode = "working";
    let zone: Zone | null = null;
    let queuedZone: Zone | null = null;
    let needsDraw = true;
    let lastFrame = -1;

    const setQueue = (steps: Step[]) => {
      queue = steps;
      stepStart = performance.now();
    };
    const nextStep = (now: number) => {
      queue.shift();
      stepStart = now;
    };

    // ---- Caption (right-side message) ----
    let caption = "";
    let captionTimer: number | undefined;
    const setCaption = (text: string) => {
      if (text === caption) return;
      caption = text;
      window.clearTimeout(captionTimer);
      message.dataset.visible = "false";
      if (!text) return;
      captionTimer = window.setTimeout(() => {
        message.textContent = text;
        message.dataset.visible = "true";
      }, 220);
    };
    const greetCaptionFor = (frame: number) => {
      let text = "";
      for (const c of F.greetCaptions) if (frame >= c.from) text = c.text;
      return text;
    };

    // ---- Reactions ----
    const backToWorking = (): Step[] => [
      {
        kind: "call",
        fn: () => {
          mode = "working";
          setCaption("");
        },
      },
      { kind: "loop", a: F.working[0], b: F.working[1] },
    ];

    const react = (target: Zone) => {
      // Let the greeting play through; respond to wherever the cursor is afterwards.
      if (mode === "greet") {
        queuedZone = target;
        return;
      }
      if (target === "center") {
        if (mode === "greeted") return;
        mode = "greet";
        setCaption("");
        setQueue([
          { kind: "jump", to: F.greet[0] },
          { kind: "play", to: F.greet[1] },
          {
            kind: "call",
            fn: () => {
              mode = "greeted";
              const next = queuedZone;
              queuedZone = null;
              if (next && next !== "center") react(next);
            },
          },
          { kind: "end" },
        ]);
        return;
      }
      if (target === mode) return;

      if (target === "left") {
        mode = "left";
        setCaption(HERO_COPY.left);
        const onPath = playhead >= F.working[1] - 3 && playhead <= F.leftPeak;
        setQueue([
          ...(onPath ? [] : [{ kind: "jump", to: F.working[1] } as Step]),
          { kind: "play", to: F.leftPeak },
          { kind: "hold", ms: HOLD_MS },
          { kind: "play", to: F.working[1] },
          ...backToWorking(),
        ]);
      } else {
        mode = "right";
        setCaption(HERO_COPY.right);
        const onPath = playhead >= F.rightStart && playhead <= F.rightPeak;
        setQueue([
          ...(onPath ? [] : [{ kind: "jump", to: F.rightStart } as Step]),
          { kind: "play", to: F.rightPeak },
          { kind: "hold", ms: HOLD_MS },
          { kind: "play", to: F.rightStart },
          { kind: "jump", to: F.working[1] },
          ...backToWorking(),
        ]);
      }
    };

    const advance = (now: number, dt: number) => {
      for (let guard = 0; guard < 8; guard++) {
        const step = queue[0];
        if (!step || step.kind === "end") return;
        switch (step.kind) {
          case "jump":
            fadeFrom = Math.round(playhead);
            fadeStart = now;
            playhead = step.to;
            nextStep(now);
            continue;
          case "call":
            nextStep(now);
            step.fn();
            continue;
          case "hold":
            if (now - stepStart < step.ms) return;
            nextStep(now);
            continue;
          case "loop":
            playhead += loopDir * F.fps * LOOP_SPEED * dt;
            if (playhead >= step.b) [playhead, loopDir] = [step.b, -1];
            else if (playhead <= step.a) [playhead, loopDir] = [step.a, 1];
            return;
          case "play": {
            const dir = Math.sign(step.to - playhead);
            if (dir !== 0) playhead += dir * F.fps * dt;
            if (dir === 0 || (dir > 0 ? playhead >= step.to : playhead <= step.to)) {
              playhead = step.to;
              nextStep(now);
              continue;
            }
            return;
          }
        }
      }
    };

    // ---- Layout + drawing ----
    let dpr = 1;
    let cssW = 0;
    let cssH = 0;
    const box = { x: 0, y: 0, w: 0, h: 0 };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      cssW = rect.width;
      cssH = rect.height;
      canvas.width = Math.round(cssW * dpr);
      canvas.height = Math.round(cssH * dpr);

      const compact = !wideLayout.matches;
      const top = compact ? 160 : 84; // room for nav (+ name on mobile)
      const bottom = compact ? 150 : 110; // room for the caption and scroll cue
      const availW = compact ? cssW : Math.min(cssW * 0.5, 900);
      const availH = Math.max(220, cssH - top - bottom);
      const s = compact ? F.subjectCompact : F.subject;
      const scale = Math.min(availW / (s.w * F.width), availH / (s.h * F.height));
      box.w = F.width * scale;
      box.h = F.height * scale;
      box.x = cssW / 2 - (s.x + s.w / 2) * box.w;
      box.y = top + (availH - s.h * box.h) / 2 - s.y * box.h;
      needsDraw = true;
    };

    const paint = (index: number, alpha: number) => {
      const img = frames[index];
      if (!img) return;
      ctx.globalAlpha = alpha;
      ctx.drawImage(img, box.x, box.y, box.w, box.h);
    };

    // Feather the frame edges so the video backdrop melts into the hero gradient.
    const feather = () => {
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "destination-in";
      const h = ctx.createLinearGradient(box.x, 0, box.x + box.w, 0);
      h.addColorStop(0, "rgba(0,0,0,0)");
      h.addColorStop(0.26, "#000");
      h.addColorStop(0.74, "#000");
      h.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = h;
      ctx.fillRect(0, 0, cssW, cssH);
      const v = ctx.createLinearGradient(0, box.y, 0, box.y + box.h);
      v.addColorStop(0, "rgba(0,0,0,0)");
      v.addColorStop(0.13, "#000");
      v.addColorStop(0.92, "#000");
      v.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = v;
      ctx.fillRect(0, 0, cssW, cssH);
      ctx.globalCompositeOperation = "source-over";
    };

    const draw = (now: number) => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.globalCompositeOperation = "source-over";
      ctx.clearRect(0, 0, cssW, cssH);

      const base = Math.floor(playhead);
      const current = nearestLoaded(base);
      if (current < 0) return;

      const fadeT = fadeFrom >= 0 ? Math.min(1, (now - fadeStart) / FADE_MS) : 1;
      if (fadeT < 1) {
        const from = nearestLoaded(fadeFrom);
        if (from >= 0) paint(from, 1);
        paint(current, ease(fadeT));
      } else {
        fadeFrom = -1;
        paint(current, 1);
        // Blend toward the next frame for sub-frame smoothness at slow speeds.
        const frac = playhead - base;
        const next = Math.min(base + 1, F.count - 1);
        if (frac > 0.05 && frames[next] && current === base) paint(next, frac);
      }
      feather();

      if (current !== lastFrame) {
        lastFrame = current;
        section.dataset.frame = String(current);
      }
    };

    // ---- Main loop ----
    let raf = 0;
    let last = performance.now();
    let onScreen = true;
    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (!onScreen) return;
      const before = playhead;
      advance(now, dt);
      if (mode === "greet" || mode === "greeted") setCaption(greetCaptionFor(Math.round(playhead)));
      if (needsDraw || playhead !== before || fadeFrom >= 0) {
        needsDraw = false;
        draw(now);
      }
    };

    // ---- Input ----
    let dwellTimer: number | undefined;
    const onPointerMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" || !wideLayout.matches || reduceMotion) return;
      const rect = section.getBoundingClientRect();
      const ratio = (e.clientX - rect.left) / rect.width;
      const next: Zone = ratio < 1 / 3 ? "left" : ratio > 2 / 3 ? "right" : "center";
      if (next === zone) return;
      zone = next;
      section.dataset.zone = next;
      // React only once the cursor settles, so sweeping across the center doesn't trigger the greeting.
      window.clearTimeout(dwellTimer);
      dwellTimer = window.setTimeout(() => react(next), ZONE_DWELL_MS);
    };
    const onPointerLeave = () => {
      zone = null;
      window.clearTimeout(dwellTimer);
      delete section.dataset.zone;
    };
    const onTap = () => {
      if (wideLayout.matches || reduceMotion || mode === "greet") return;
      mode = "working";
      react("center");
    };

    // Mobile: greet once when the hero is mostly visible. Desktop: pause when off screen.
    let greetTimer: number | undefined;
    let autoGreeted = false;
    const observer = new IntersectionObserver(
      ([entry]) => {
        onScreen = entry.isIntersecting;
        if (
          !wideLayout.matches &&
          !reduceMotion &&
          !autoGreeted &&
          entry.intersectionRatio >= 0.6
        ) {
          autoGreeted = true;
          greetTimer = window.setTimeout(() => react("center"), 700);
        }
      },
      { threshold: [0, 0.6] },
    );

    if (reduceMotion) {
      playhead = F.greet[1];
      mode = "greeted";
      setQueue([{ kind: "end" }]);
      setCaption(F.greetCaptions[F.greetCaptions.length - 1].text);
    } else {
      setQueue(backToWorking());
    }

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);
    wideLayout.addEventListener("change", resize);
    observer.observe(section);
    section.addEventListener("pointermove", onPointerMove);
    section.addEventListener("pointerleave", onPointerLeave);
    section.addEventListener("click", onTap);
    resize();
    raf = requestAnimationFrame(tick);

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      window.clearTimeout(captionTimer);
      window.clearTimeout(greetTimer);
      window.clearTimeout(dwellTimer);
      resizeObserver.disconnect();
      observer.disconnect();
      wideLayout.removeEventListener("change", resize);
      section.removeEventListener("pointermove", onPointerMove);
      section.removeEventListener("pointerleave", onPointerLeave);
      section.removeEventListener("click", onTap);
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      id="home"
      aria-label="Introduction"
      className={cx(
        "font-body",
        "hero-bg relative isolate h-svh min-h-[620px] w-full overflow-hidden select-none",
      )}
    >
      {/* Bright glow behind the character */}
      <div
        aria-hidden
        className="pointer-events-none absolute top-[56%] left-1/2 -z-10 h-[72vh] w-[min(64vw,1000px)] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white blur-3xl"
      />

      <canvas ref={canvasRef} aria-hidden className="absolute inset-0 h-full w-full" />

      {/* Intro note */}
      <div className="absolute top-24 right-4 left-4 text-center wide:top-1/2 wide:right-auto wide:left-[6vw] wide:max-w-[22rem] wide:-translate-y-1/2 wide:text-left">
        <h1
          className={cx(
            "font-display",
            "text-[clamp(1.75rem,2.8vw,2.6rem)] leading-[1.08] font-light text-[#4a1f27]",
          )}
        >
          I&apos;m <em className="font-normal text-[#9e5a63] italic">{HERO_COPY.name}</em>
        </h1>
        <p className="mt-2 text-xs font-medium tracking-[0.28em] text-[#6b3a42] uppercase wide:text-[0.8rem]">
          {HERO_COPY.role}
        </p>

        <div className="mt-9 hidden items-center gap-3 text-[#6b3a42] wide:flex">
          <span aria-hidden className="relative grid size-9 place-items-center">
            <span className="absolute inset-0 animate-[hero-ring_2.4s_ease-out_infinite] rounded-full border border-[#9e5a63]/40" />
            <svg
              viewBox="0 0 24 24"
              className="size-[18px] animate-[hero-cursor_2.4s_ease-in-out_infinite] fill-[#4a1f27]"
            >
              <path d="M5 3.5 18.5 10l-6 1.6-2.9 5.6L5 3.5Z" />
            </svg>
          </span>
          <span className="text-sm tracking-wide">{HERO_COPY.instruction}</span>
        </div>
      </div>

      {/* Contextual message */}
      <div className="pointer-events-none absolute right-4 bottom-24 left-4 text-center wide:top-1/2 wide:right-[6vw] wide:bottom-auto wide:left-auto wide:max-w-[16rem] wide:-translate-y-1/2 wide:text-right">
        <p
          ref={messageRef}
          aria-live="polite"
          data-visible="false"
          className={cx(
            "font-display",
            "text-[clamp(1.15rem,1.7vw,1.6rem)] leading-snug text-[#6b3a42] italic transition duration-300 ease-out data-[visible=false]:translate-y-1.5 data-[visible=false]:opacity-0",
          )}
        />
      </div>

      {/* Exploration cue */}
      <a
        href="#portfolio"
        className="absolute bottom-8 left-1/2 flex -translate-x-1/2 flex-col items-center gap-1.5 text-[0.7rem] tracking-[0.3em] whitespace-nowrap text-[#6b3a42]/80 uppercase transition-colors hover:text-[#4a1f27]"
      >
        {HERO_COPY.cue}
        <svg
          aria-hidden
          viewBox="0 0 24 24"
          className="size-4 animate-[hero-cue_1.8s_ease-in-out_infinite] fill-none stroke-current stroke-2"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </a>
    </section>
  );
}
