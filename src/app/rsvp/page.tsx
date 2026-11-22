import type { Metadata } from "next";
import Link from "next/link";
import { rsvpIsOpen, site } from "@/content/site";
import { currentGuest } from "@/lib/auth";
import { STATUS_LABEL } from "@/lib/guests";
import { CLOSED_MESSAGE } from "@/lib/notify";
import { RsvpForm } from "./rsvp-form";

export const metadata: Metadata = { title: `RSVP · ${site.title}` };

export default async function RsvpPage() {
  const guest = await currentGuest();
  const open = rsvpIsOpen();
  const responded = guest && guest.status !== "pending";

  return (
    <main className="mx-auto max-w-md px-5 pb-16 pt-8">
      <Link href="/" className="eyebrow">
        ← {site.title}
      </Link>
      <h1 className="display mt-4 text-5xl text-gold drop-shadow-[3px_3px_0_var(--color-rose)]">RSVP</h1>
      <p className="mt-3 text-cream/90">
        {site.country} · {site.dateLabel}
      </p>

      {responded && (
        <section className="card mt-6 !border-teal">
          <p className="eyebrow">Your current answer</p>
          <p className="display mt-1 text-2xl text-cream">{STATUS_LABEL[guest.status]}</p>
          {guest.status !== "no" && guest.additionalGuests.length > 0 && (
            <p className="mt-1 text-sm text-cream/90">Bringing {guest.additionalGuests.join(", ")}</p>
          )}
        </section>
      )}

      <section className="card mt-6">
        {open ? (
          <>
            <p className="mb-5 text-sm text-mute">
              {responded
                ? `Plans changed? Update your answer any time before ${site.rsvpDeadlineLabel}.`
                : `Please reply by ${site.rsvpDeadlineLabel}. You can change your answer until then.`}
            </p>
            <RsvpForm
              guest={
                guest && {
                  firstName: guest.firstName,
                  lastName: guest.lastName,
                  email: guest.email,
                  status: guest.status,
                  additionalGuests: guest.additionalGuests,
                  note: guest.note,
                }
              }
              maxAdditionalGuests={site.maxAdditionalGuests}
              turnstileSiteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || undefined}
            />
          </>
        ) : (
          <p className="text-cream">{CLOSED_MESSAGE}</p>
        )}
      </section>

      {guest && (
        <form action="/rsvp/forget" method="post" className="mt-5 text-center text-sm text-mute">
          Not {guest.firstName}?{" "}
          <button type="submit" className="cursor-pointer underline">
            Use a different email
          </button>
        </form>
      )}
    </main>
  );
}
