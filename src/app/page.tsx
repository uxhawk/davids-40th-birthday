import Link from "next/link";
import { Countdown } from "@/components/countdown";
import { LocationMap } from "@/components/location-map";
import { rsvpIsOpen, site } from "@/content/site";

export const dynamic = "force-dynamic";

export default function Home() {
  const open = rsvpIsOpen();
  return (
    <main>
      <section className="relative isolate overflow-hidden px-5 pt-14 text-center">
        <div className="retro-sun absolute left-1/2 top-24 -z-10 w-[min(88vw,26rem)] -translate-x-1/2" aria-hidden />
        <p className="eyebrow">
          {site.country} · {site.dateLabel}
        </p>
        <h1 className="display mt-40 text-cream drop-shadow-[0_3px_0_var(--color-night)]">
          <span className="block text-4xl sm:text-5xl">David&apos;s</span>
          <span className="block text-[9.5rem] leading-[0.85] text-gold drop-shadow-[5px_5px_0_var(--color-rose)] sm:text-[13rem]">
            40
          </span>
        </h1>
        <p className="mx-auto mt-6 max-w-sm text-lg text-cream">{site.tagline}</p>
        <div className="mt-4">
          <Countdown to={site.start.toISOString()} />
        </div>
        <div className="mt-7">
          <Link href="/rsvp" className="btn">
            {open ? "RSVP" : "View my RSVP"}
          </Link>
          <p className="mt-4 font-mono text-xs uppercase tracking-widest text-mute">
            {open ? `Reply by ${site.rsvpDeadlineLabel}` : "RSVPs are closed"}
          </p>
        </div>
        {/* Dunes */}
        <svg viewBox="0 0 600 90" preserveAspectRatio="none" className="mt-10 block h-20 w-[calc(100%+2.5rem)] -mx-5" aria-hidden>
          <path d="M0 60 C120 10 220 80 340 45 S520 20 600 55 V90 H0Z" fill="#3b2f7a" />
          <path d="M0 75 C150 35 260 95 400 62 S540 50 600 70 V90 H0Z" fill="#221850" />
        </svg>
      </section>

      <div className="bg-dusk px-5 pb-16">
        <div className="mx-auto max-w-2xl space-y-12 pt-6">
          <section aria-labelledby="brief">
            <p className="eyebrow">Mission brief</p>
            <h2 id="brief" className="display mt-2 text-3xl text-gold">
              The details
            </h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-3">
              {site.sections.map((s) => (
                <article key={s.title} className="card !bg-night">
                  <h3 className="display text-xl text-sun">{s.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-cream/90">{s.body}</p>
                </article>
              ))}
            </div>
          </section>

          <section aria-labelledby="where">
            <p className="eyebrow">Coordinates</p>
            <h2 id="where" className="display mt-2 text-3xl text-gold">
              Where
            </h2>
            <div className="mt-5 space-y-8">
              {site.locations.map((loc) => (
                <div key={loc.name}>
                  <h3 className="display text-xl text-sun">{loc.name}</h3>
                  <p className="mb-3 mt-1 text-sm text-cream/90">{loc.blurb}</p>
                  <LocationMap name={loc.name} query={loc.query} zoom={loc.zoom} />
                </div>
              ))}
            </div>
          </section>

          <section className="card text-center !border-sun">
            <h2 className="display text-3xl text-gold">{open ? "Are you in?" : "RSVPs are closed"}</h2>
            <p className="mx-auto mt-2 max-w-xs text-sm text-cream/90">
              {open
                ? `Let ${site.host} know by ${site.rsvpDeadlineLabel}. You can change your answer any time before then.`
                : `Contact ${site.host} directly if your plans have changed.`}
            </p>
            <Link href="/rsvp" className="btn mt-5">
              {open ? "RSVP" : "View my RSVP"}
            </Link>
          </section>
        </div>
      </div>

      <footer className="bg-dusk px-5 pb-10 text-center font-mono text-[0.7rem] uppercase tracking-widest text-mute">
        {site.title} · {site.country} {site.start.getUTCFullYear()}
      </footer>
    </main>
  );
}
