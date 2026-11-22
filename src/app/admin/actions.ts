"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { site, siteUrl } from "@/content/site";
import { reminderEmail, updateEmail } from "@/emails/templates";
import { checkAdminPassword, endAdminSession, isAdmin, startAdminSession } from "@/lib/auth";
import { describeSend, sendEmails, type Outgoing } from "@/lib/email";
import {
  cleanNames,
  createGuest,
  deleteGuest,
  getGuestByEmail,
  getGuestById,
  isValidEmail,
  listGuests,
  normalizeEmail,
  updateGuest,
  type Guest,
  type Status,
} from "@/lib/guests";
import { guestLink, invitationFor, sendRsvpEmails } from "@/lib/notify";
import { STATUSES } from "@/lib/schema";

export type ActionState = { ok: boolean; message: string } | null;

const str = (v: FormDataEntryValue | null) => (typeof v === "string" ? v.trim() : "");
const DENIED: ActionState = { ok: false, message: "Your admin session expired. Please sign in again." };

export async function login(_prev: ActionState, form: FormData): Promise<ActionState> {
  // Slow down password guessing a little.
  await new Promise((r) => setTimeout(r, 600));
  if (!checkAdminPassword(str(form.get("password")))) {
    return { ok: false, message: "Wrong password." };
  }
  await startAdminSession();
  redirect("/admin");
}

export async function logout() {
  await endAdminSession();
  redirect("/admin/login");
}

// Accepts "First, Last, email", "First Last, email" or "First Last <email>".
function parseInviteLine(line: string) {
  const angle = line.match(/^(.*)<([^>]+)>\s*$/);
  const parts = angle
    ? [angle[1].replace(/,\s*$/, ""), angle[2]]
    : line.split(/[,\t;]/).map((p) => p.trim());
  const email = normalizeEmail(parts[parts.length - 1] ?? "");
  let firstName = "";
  let lastName = "";
  if (parts.length >= 3) {
    firstName = parts[0].trim();
    lastName = parts.slice(1, -1).join(" ").trim();
  } else if (parts.length === 2) {
    const [first, ...rest] = parts[0].trim().split(/\s+/);
    firstName = first ?? "";
    lastName = rest.join(" ");
  }
  if (!firstName || !isValidEmail(email)) return null;
  return { firstName, lastName, email };
}

// Adds each listed person to the guest list and (optionally) emails their invitation.
export async function inviteGuests(_prev: ActionState, form: FormData): Promise<ActionState> {
  if (!(await isAdmin())) return DENIED;
  const sendNow = form.get("send") === "on";
  const lines = str(form.get("list")).split("\n").map((l) => l.trim()).filter(Boolean);
  if (lines.length === 0) return { ok: false, message: "Paste at least one guest." };

  const bad: string[] = [];
  let added = 0;
  let existing = 0;
  const toInvite: Guest[] = [];

  for (const line of lines) {
    const parsed = parseInviteLine(line);
    if (!parsed) {
      bad.push(line);
      continue;
    }
    let guest = await getGuestByEmail(parsed.email);
    if (guest) existing++;
    else {
      guest = await createGuest(parsed);
      added++;
    }
    // Never re-send an invitation from here; use "Resend invite" on the guest.
    if (!guest.invitedAt && !toInvite.some((g) => g.id === guest.id)) toInvite.push(guest);
  }

  let emailNote = "";
  if (sendNow && toInvite.length > 0) {
    const result = await sendEmails(toInvite.map(invitationFor));
    if (result.failed === 0) {
      const now = new Date();
      await Promise.all(toInvite.map((g) => updateGuest(g.id, { invitedAt: now })));
    }
    emailNote = ` Invitations: ${describeSend(result)}`;
  }

  revalidatePath("/admin");
  const summary = `${added} added, ${existing} already on the list.${emailNote}`;
  if (bad.length > 0) {
    return { ok: false, message: `${summary} Couldn't read ${bad.length} line(s): ${bad.join(" | ")}` };
  }
  return { ok: true, message: summary };
}

// Edit a guest and their RSVP on their behalf.
export async function saveGuest(_prev: ActionState, form: FormData): Promise<ActionState> {
  if (!(await isAdmin())) return DENIED;
  const id = str(form.get("id"));
  const before = await getGuestById(id);
  if (!before) return { ok: false, message: "Guest not found." };

  const firstName = str(form.get("firstName"));
  const email = normalizeEmail(str(form.get("email")));
  const status = str(form.get("status")) as Status;
  if (!firstName) return { ok: false, message: "First name is required." };
  if (!isValidEmail(email)) return { ok: false, message: "That email doesn't look right." };
  if (!STATUSES.includes(status)) return { ok: false, message: "Unknown status." };
  if (email !== before.email && (await getGuestByEmail(email))) {
    return { ok: false, message: "Another guest already uses that email." };
  }

  const additionalGuests =
    status === "yes" || status === "maybe"
      ? cleanNames(str(form.get("additionalGuests")).split("\n"), 20)
      : [];
  const statusChanged = status !== before.status;

  const saved = await updateGuest(id, {
    firstName,
    lastName: str(form.get("lastName")),
    email,
    status,
    additionalGuests,
    note: str(form.get("note")),
    respondedAt: statusChanged ? (status === "pending" ? null : new Date()) : before.respondedAt,
  });
  if (!saved) return { ok: false, message: "Guest not found." };

  let emailNote = "";
  if (form.get("notify") === "on" && saved.status !== "pending") {
    emailNote = ` ${describeSend(await sendRsvpEmails(saved, { toGuest: true, toHost: false }))}`;
  }
  revalidatePath("/admin");
  return { ok: true, message: `Saved.${emailNote}` };
}

export async function resendInvite(_prev: ActionState, form: FormData): Promise<ActionState> {
  if (!(await isAdmin())) return DENIED;
  const guest = await getGuestById(str(form.get("id")));
  if (!guest) return { ok: false, message: "Guest not found." };
  const result = await sendEmails([invitationFor(guest)]);
  if (result.failed === 0) await updateGuest(guest.id, { invitedAt: new Date() });
  revalidatePath("/admin");
  return { ok: result.failed === 0, message: describeSend(result) };
}

export async function removeGuest(_prev: ActionState, form: FormData): Promise<ActionState> {
  if (!(await isAdmin())) return DENIED;
  if (form.get("confirm") !== "on") return { ok: false, message: "Tick the box to confirm." };
  await deleteGuest(str(form.get("id")));
  revalidatePath("/admin");
  return { ok: true, message: "Guest removed." };
}

const AUDIENCES: Record<string, (g: Guest) => boolean> = {
  pending: (g) => g.status === "pending",
  coming: (g) => g.status === "yes",
  "coming-maybe": (g) => g.status === "yes" || g.status === "maybe",
  "not-declined": (g) => g.status !== "no",
  everyone: () => true,
};

// Sends the reminder or a free-form update to a slice of the guest list.
export async function sendBroadcast(_prev: ActionState, form: FormData): Promise<ActionState> {
  if (!(await isAdmin())) return DENIED;
  const template = str(form.get("template"));
  const subject = str(form.get("subject"));
  const message = str(form.get("message"));
  const testOnly = form.get("intent") === "test";
  const filter = AUDIENCES[str(form.get("audience"))];
  if (!filter) return { ok: false, message: "Choose who to send to." };
  if (template === "update" && (!subject || !message)) {
    return { ok: false, message: "An update needs a subject and a message." };
  }
  if (template !== "update" && template !== "reminder") {
    return { ok: false, message: "Choose a template." };
  }

  const build = (g: Pick<Guest, "firstName" | "token">) =>
    template === "reminder"
      ? reminderEmail({ firstName: g.firstName, rsvpUrl: guestLink(g) })
      : updateEmail({ firstName: g.firstName, subject, message, siteUrl: siteUrl() });

  if (testOnly) {
    const to = process.env.ADMIN_EMAIL;
    if (!to) return { ok: false, message: "Set ADMIN_EMAIL to send yourself a test." };
    const result = await sendEmails([{ to, ...build({ firstName: site.host, token: "test" }) }]);
    return { ok: result.failed === 0, message: `Test to ${to}: ${describeSend(result)}` };
  }

  // Only guests who have actually been invited should hear about the party.
  const recipients = (await listGuests()).filter((g) => g.invitedAt && filter(g));
  if (recipients.length === 0) return { ok: false, message: "Nobody matches that audience." };
  const messages: Outgoing[] = recipients.map((g) => ({ to: g.email, ...build(g) }));
  const result = await sendEmails(messages);
  return { ok: result.failed === 0, message: describeSend(result) };
}
