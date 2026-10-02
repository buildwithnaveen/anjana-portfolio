import CharacterHero from "./components/CharacterHero";

const NAV = [
  { href: "#portfolio", label: "Work" },
  { href: "#about", label: "About" },
  { href: "#contact", label: "Contact" },
];

// Placeholder project slots: replace with real work.
const PROJECTS = [
  { title: "Project one", tag: "Web app", blurb: "Short description of the problem, your role and the result." },
  { title: "Project two", tag: "Website", blurb: "Short description of the problem, your role and the result." },
  { title: "Project three", tag: "UI / Frontend", blurb: "Short description of the problem, your role and the result." },
];

export default function App() {
  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50">
        <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-[6vw]">
          <a href="#home" className="font-display text-lg text-rose-ink italic">
            Anjana Das
          </a>
          <ul className="flex gap-5 text-[0.72rem] tracking-[0.24em] text-rose-deep uppercase md:gap-9">
            {NAV.map((item) => (
              <li key={item.href}>
                <a href={item.href} className="transition-colors hover:text-rose-ink">
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </header>

      <main>
        <CharacterHero />

        <section id="portfolio" className="mx-auto max-w-6xl scroll-mt-16 px-4 py-24 md:px-[6vw]">
          <p className="text-[0.72rem] tracking-[0.3em] text-rose-accent uppercase">Selected work</p>
          <h2 className="mt-3 font-display text-[clamp(2rem,4vw,3rem)] font-light">Things I&apos;ve built</h2>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {PROJECTS.map((p) => (
              <article
                key={p.title}
                className="rounded-2xl border border-rose-accent/15 bg-white/70 p-6 shadow-[0_20px_50px_-30px_rgba(107,58,66,0.35)]"
              >
                <div className="aspect-[4/3] rounded-xl bg-gradient-to-br from-rose-mist to-white" />
                <p className="mt-5 text-[0.68rem] tracking-[0.24em] text-rose-accent uppercase">{p.tag}</p>
                <h3 className="mt-1 font-display text-xl">{p.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-rose-deep/80">{p.blurb}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="about" className="mx-auto max-w-3xl scroll-mt-16 px-4 py-20 text-center md:px-[6vw]">
          <p className="text-[0.72rem] tracking-[0.3em] text-rose-accent uppercase">About</p>
          <p className="mt-5 font-display text-[clamp(1.3rem,2.2vw,1.75rem)] leading-relaxed font-light">
            A short introduction goes here: what you build, the tools you love and what you&apos;re looking for next.
          </p>
        </section>

        <section id="contact" className="scroll-mt-16 px-4 pt-10 pb-24 text-center">
          <p className="text-[0.72rem] tracking-[0.3em] text-rose-accent uppercase">Contact</p>
          <a
            href="mailto:hello@example.com"
            className="mt-4 inline-block font-display text-[clamp(1.5rem,3vw,2.25rem)] italic underline decoration-rose-accent/30 underline-offset-8 hover:decoration-rose-accent"
          >
            hello@example.com
          </a>
        </section>
      </main>
    </>
  );
}
