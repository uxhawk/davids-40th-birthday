import { site, siteUrl } from "@/content/site";
import {
  invitationEmail,
  rsvpConfirmationEmail,
  rsvpNotificationEmail,
} from "@/emails/templates";
import { sendEmails, type Outgoing } from "./email";
import type { Guest } from "./guests";

// A guest's personal link: sets their cookie, then lands on the RSVP form.
export function guestLink(guest: Pick<Guest, "token">) {
  return `${siteUrl()}/r/${guest.token}`;
}

export function invitationFor(guest: Guest): Outgoing {
  return { to: guest.email, ...invitationEmail({ firstName: guest.firstName, rsvpUrl: guestLink(guest) }) };
}

// Confirmation to the guest and a heads-up to the host.
export async function sendRsvpEmails(guest: Guest, opts: { toGuest: boolean; toHost: boolean }) {
  const messages: Outgoing[] = [];
  if (opts.toGuest) {
    messages.push({ to: guest.email, ...rsvpConfirmationEmail({ guest, rsvpUrl: guestLink(guest) }) });
  }
  const host = process.env.ADMIN_EMAIL;
  if (opts.toHost && host) {
    messages.push({ to: host, ...rsvpNotificationEmail({ guest, adminUrl: `${siteUrl()}/admin` }) });
  }
  return sendEmails(messages);
}

export const CLOSED_MESSAGE = `RSVPs closed on ${site.rsvpDeadlineLabel}. Please contact ${site.host} directly for an update.`;
