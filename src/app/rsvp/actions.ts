"use server";

import { revalidatePath } from "next/cache";
import { rsvpIsOpen, site } from "@/content/site";
import { currentGuest, rememberGuest } from "@/lib/auth";
import { cleanNames, getGuestByEmail, isValidEmail, updateGuest, type Status } from "@/lib/guests";
import { CLOSED_MESSAGE, sendRsvpEmails } from "@/lib/notify";
import { verifyCaptcha } from "@/lib/turnstile";

export type RsvpState = { ok: boolean; message: string } | null;

const str = (v: FormDataEntryValue | null) => (typeof v === "string" ? v.trim() : "");

export async function submitRsvp(_prev: RsvpState, form: FormData): Promise<RsvpState> {
  if (!rsvpIsOpen()) return { ok: false, message: CLOSED_MESSAGE };

  const status = str(form.get("status")) as Status;
  if (!["yes", "no", "maybe"].includes(status)) {
    return { ok: false, message: "Please choose whether you can make it." };
  }

  if (!(await verifyCaptcha(str(form.get("cf-turnstile-response")) || null))) {
    return { ok: false, message: "Captcha check failed. Please try again." };
  }

  // A returning browser is identified by its cookie; otherwise match on email.
  let guest = await currentGuest();
  if (!guest) {
    const email = str(form.get("email"));
    if (!isValidEmail(email)) return { ok: false, message: "Please enter a valid email address." };
    guest = await getGuestByEmail(email);
    if (!guest) {
      return {
        ok: false,
        message: `That email isn't on the guest list. Use the address your invitation was sent to, or contact ${site.host}.`,
      };
    }
  }

  const firstName = str(form.get("firstName")).slice(0, 80);
  const lastName = str(form.get("lastName")).slice(0, 80);
  if (!firstName) return { ok: false, message: "Please enter your first name." };

  let additionalGuests: string[] = [];
  if (status !== "no") {
    const raw = form.getAll("guestName").map((v) => str(v).slice(0, 120));
    if (raw.some((n) => !n)) {
      return { ok: false, message: "Please add a name for each additional guest." };
    }
    additionalGuests = cleanNames(raw, site.maxAdditionalGuests);
  }

  const saved = await updateGuest(guest.id, {
    firstName,
    lastName,
    status,
    additionalGuests,
    note: str(form.get("note")).slice(0, 1000),
    respondedAt: new Date(),
  });
  if (!saved) return { ok: false, message: "Something went wrong. Please try again." };

  await rememberGuest(saved.token);
  await sendRsvpEmails(saved, { toGuest: true, toHost: true });
  revalidatePath("/rsvp");

  return { ok: true, message: `Saved. A confirmation is on its way to ${saved.email}.` };
}
