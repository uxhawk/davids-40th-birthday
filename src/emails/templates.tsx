import type { ReactElement } from "react";
import { site } from "@/content/site";
import { fullName, STATUS_LABEL, type Guest } from "@/lib/guests";
import { Cta, Facts, P, Shell } from "./components";

export type Email = { subject: string; react: ReactElement };

type GuestInfo = Pick<Guest, "firstName" | "lastName" | "email" | "status" | "additionalGuests" | "note">;

function rsvpFacts(guest: GuestInfo): [string, string][] {
  const rows: [string, string][] = [["Response", STATUS_LABEL[guest.status]]];
  if (guest.status !== "no" && guest.additionalGuests.length > 0) {
    rows.push(["Bringing", guest.additionalGuests.join(", ")]);
  }
  if (guest.note) rows.push(["Note", guest.note]);
  return rows;
}

// Sent from the admin page when a guest is first invited.
export function invitationEmail(p: { firstName: string; rsvpUrl: string }): Email {
  return {
    subject: `You're invited: ${site.title} in ${site.country}`,
    react: (
      <Shell preview={`${site.dateLabel}. RSVP by ${site.rsvpDeadlineLabel}.`}>
        <P>Hi {p.firstName},</P>
        <P>
          I&apos;m turning 40 and I&apos;d love for you to be there. We&apos;re heading to{" "}
          {site.locations[0].name}, {site.country} from {site.dateLabel}.
        </P>
        <P>
          Details will keep landing on the site as plans firm up. For now, please let me know if you
          can make it by <strong>{site.rsvpDeadlineLabel}</strong>.
        </P>
        <Cta href={p.rsvpUrl}>RSVP now</Cta>
        <P>— {site.host}</P>
      </Shell>
    ),
  };
}

// Sent to the guest after they (or the host) save an RSVP.
export function rsvpConfirmationEmail(p: { guest: GuestInfo; rsvpUrl: string }): Email {
  const opening =
    p.guest.status === "yes"
      ? "You're in! Can't wait to see you in Morocco."
      : p.guest.status === "maybe"
        ? "Got it, you're a maybe. Update your answer whenever you know more."
        : "Sorry you can't make it. If plans change, you can update your answer.";
  return {
    subject: `RSVP received: ${site.title}`,
    react: (
      <Shell preview={`Your RSVP: ${STATUS_LABEL[p.guest.status]}`}>
        <P>Hi {p.guest.firstName},</P>
        <P>{opening}</P>
        <Facts rows={rsvpFacts(p.guest)} />
        <P>
          You can change your response until {site.rsvpDeadlineLabel} using your personal link below.
        </P>
        <Cta href={p.rsvpUrl}>View or change RSVP</Cta>
      </Shell>
    ),
  };
}

// Sent to the host whenever an RSVP is created or changed.
export function rsvpNotificationEmail(p: { guest: GuestInfo; adminUrl: string }): Email {
  const name = fullName(p.guest);
  return {
    subject: `RSVP: ${name} — ${STATUS_LABEL[p.guest.status]}`,
    react: (
      <Shell preview={`${name} responded: ${STATUS_LABEL[p.guest.status]}`}>
        <P>
          {name} ({p.guest.email}) just saved an RSVP.
        </P>
        <Facts rows={rsvpFacts(p.guest)} />
        <Cta href={p.adminUrl}>Open guest list</Cta>
      </Shell>
    ),
  };
}

// Nudge for guests who have not replied yet.
export function reminderEmail(p: { firstName: string; rsvpUrl: string }): Email {
  return {
    subject: `Reminder: RSVP for ${site.title} by ${site.rsvpDeadlineLabel}`,
    react: (
      <Shell preview={`RSVPs close ${site.rsvpDeadlineLabel}.`}>
        <P>Hi {p.firstName},</P>
        <P>
          Quick nudge: I haven&apos;t heard from you yet about {site.country}, {site.dateLabel}. RSVPs
          close on <strong>{site.rsvpDeadlineLabel}</strong>.
        </P>
        <P>It takes under a minute, and a &quot;maybe&quot; is fine for now.</P>
        <Cta href={p.rsvpUrl}>RSVP now</Cta>
        <P>— {site.host}</P>
      </Shell>
    ),
  };
}

// Free-form planning update written in the admin page. Blank lines split paragraphs.
export function updateEmail(p: { firstName: string; subject: string; message: string; siteUrl: string }): Email {
  const paragraphs = p.message.split(/\n\s*\n/).map((s) => s.trim()).filter(Boolean);
  return {
    subject: p.subject,
    react: (
      <Shell preview={paragraphs[0]?.slice(0, 120) ?? p.subject}>
        <P>Hi {p.firstName},</P>
        {paragraphs.map((text, i) => (
          <P key={i}>
            {text.split("\n").map((line, j) => (
              <span key={j}>
                {j > 0 && <br />}
                {line}
              </span>
            ))}
          </P>
        ))}
        <Cta href={p.siteUrl}>See the latest details</Cta>
        <P>— {site.host}</P>
      </Shell>
    ),
  };
}
