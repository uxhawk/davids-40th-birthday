import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { rsvpIsOpen, site } from "@/content/site";
import { isAdmin } from "@/lib/auth";
import { fullName, listGuests, STATUS_LABEL, type Guest, type Status } from "@/lib/guests";
import { guestLink } from "@/lib/notify";
import { ActionForm } from "./action-form";
import { addGuest, addGuestList, logout, removeGuest, resendInvite, saveGuest, sendBroadcast, sendInvitations } from "./actions";

// Depends on cookies and env vars, so never prerender at build time.
export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Admin" };

const STATUS_COLOR: Record<Status, string> = {
  yes: "text-teal",
  maybe: "text-gold",
  no: "text-[#ff9cc4]",
  pending: "text-mute",
};

const day = (d: Date | null) =>
  d ? d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—";

export default async function AdminPage() {
  if (!(await isAdmin())) redirect("/admin/login");
  const guests = await listGuests();

  const notInvited = guests.filter((g) => !g.invitedAt).length;
  const count = (s: Status) => guests.filter((g) => g.status === s).length;
  const heads = (s: Status) =>
    guests.filter((g) => g.status === s).reduce((n, g) => n + 1 + g.additionalGuests.length, 0);
  const stats: [string, number | string][] = [
    ["Coming (people)", heads("yes")],
    ["Maybe (people)", heads("maybe")],
    ["Declined", count("no")],
    ["No reply", count("pending")],
    ["Invited", guests.filter((g) => g.invitedAt).length],
    ["On the list", guests.length],
  ];

  return (
    <main className="mx-auto max-w-3xl px-5 pb-20 pt-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="eyebrow">Mission control</p>
          <h1 className="display mt-2 text-4xl text-gold">Guest list</h1>
          <p className="mt-2 text-sm text-mute">
            RSVPs {rsvpIsOpen() ? "close" : "closed"} {site.rsvpDeadlineLabel}. You can always edit here.
          </p>
        </div>
        <form action={logout}>
          <button type="submit" className="btn btn-quiet whitespace-nowrap">
            Sign out
          </button>
        </form>
      </div>

      <dl className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {stats.map(([label, value]) => (
          <div key={label} className="card !p-4">
            <dt className="label !mb-0">{label}</dt>
            <dd className="display mt-1 text-3xl text-cream">{value}</dd>
          </div>
        ))}
      </dl>

      <section className="mt-10">
        <h2 className="display text-2xl text-sun">Add guests</h2>
        <div className="card mt-3">
          <p className="mb-4 text-sm text-mute">
            Adding someone only puts them on the list. Nothing is emailed until you send invitations below.
          </p>
          <ActionForm action={addGuest}>
            <div className="grid grid-cols-2 gap-3">
              <label>
                <span className="label">First name</span>
                <input name="firstName" required autoComplete="off" className="field" />
              </label>
              <label>
                <span className="label">Last name</span>
                <input name="lastName" autoComplete="off" className="field" />
              </label>
            </div>
            <label className="mt-3 block">
              <span className="label">Email</span>
              <input name="email" type="email" required autoComplete="off" inputMode="email" className="field" />
            </label>
            <button type="submit" className="btn mt-4 w-full sm:w-auto">
              Add guest
            </button>
          </ActionForm>

          <details className="mt-5 border-t-2 border-haze pt-4">
            <summary className="cursor-pointer text-sm text-mute underline">Or paste a list</summary>
            <ActionForm action={addGuestList} className="mt-3">
              <label className="label" htmlFor="list">
                One guest per line: First, Last, email
              </label>
              <textarea
                id="list"
                name="list"
                rows={5}
                required
                className="field font-mono !text-sm"
                placeholder={"Amina, Benali, amina@example.com\nSam, Okafor, sam@example.com"}
              />
              <button type="submit" className="btn btn-quiet mt-3">
                Add list
              </button>
            </ActionForm>
          </details>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="display text-2xl text-sun">Send invitations</h2>
        <div className="card mt-3 !border-sun">
          <p className="display text-3xl text-cream">
            {notInvited} <span className="text-base text-mute">of {guests.length} not invited yet</span>
          </p>
          <p className="mt-2 text-sm text-mute">
            Emails the invitation, with a personal RSVP link, to everyone who hasn&apos;t been sent one.
            People already invited are skipped, so it is safe to use again after adding more guests.{" "}
            <a className="underline" href="/admin/emails/invitation" target="_blank">
              Preview the invitation
            </a>
          </p>
          <ActionForm action={sendInvitations} className="mt-4">
            <label className="flex items-center gap-2 text-sm text-cream">
              <input type="checkbox" name="confirm" className="size-5 accent-[var(--color-sun)]" />
              Yes, email {notInvited} {notInvited === 1 ? "guest" : "guests"} now
            </label>
            <div className="mt-4 flex flex-wrap gap-3">
              <button type="submit" name="intent" value="send" className="btn">
                Send invitations
              </button>
              <button type="submit" name="intent" value="test" className="btn btn-quiet">
                Send a test to me
              </button>
            </div>
          </ActionForm>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="display text-2xl text-sun">Send a reminder or update</h2>
        <div className="card mt-3">
          <ActionForm action={sendBroadcast}>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="label" htmlFor="template">
                  Template
                </label>
                <select id="template" name="template" className="field" defaultValue="reminder">
                  <option value="reminder">RSVP reminder</option>
                  <option value="update">Planning update (uses subject + message)</option>
                </select>
              </div>
              <div>
                <label className="label" htmlFor="audience">
                  Send to (invited guests only)
                </label>
                <select id="audience" name="audience" className="field" defaultValue="pending">
                  <option value="pending">Haven&apos;t replied</option>
                  <option value="coming">Coming</option>
                  <option value="coming-maybe">Coming + maybe</option>
                  <option value="not-declined">Everyone except declined</option>
                  <option value="everyone">Everyone</option>
                </select>
              </div>
            </div>
            <label className="label mt-3" htmlFor="subject">
              Subject (updates only)
            </label>
            <input id="subject" name="subject" className="field" maxLength={150} />
            <label className="label mt-3" htmlFor="message">
              Message (updates only; blank line = new paragraph)
            </label>
            <textarea id="message" name="message" rows={6} className="field" />
            <p className="mt-2 text-xs text-mute">
              Preview:{" "}
              <a className="underline" href="/admin/emails/reminder" target="_blank">reminder</a>
              {" · "}
              <a className="underline" href="/admin/emails/update" target="_blank">update</a>
              {" · "}
              <a className="underline" href="/admin/emails/confirmation" target="_blank">RSVP confirmation</a>
              {" · "}
              <a className="underline" href="/admin/emails/notification" target="_blank">RSVP notification to you</a>
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <button type="submit" name="intent" value="send" className="btn">
                Send to guests
              </button>
              <button type="submit" name="intent" value="test" className="btn btn-quiet">
                Send a test to me
              </button>
            </div>
          </ActionForm>
        </div>
      </section>

      <section className="mt-10">
        <div className="flex items-end justify-between gap-3">
          <h2 className="display text-2xl text-sun">Guests ({guests.length})</h2>
          <a href="/admin/export" className="text-sm text-mute underline">
            Download CSV
          </a>
        </div>
        {guests.length === 0 && <p className="mt-3 text-sm text-mute">Nobody yet. Add your first guests above.</p>}
        <ul className="mt-3 space-y-3">
          {guests.map((g) => (
            <GuestRow key={g.id} guest={g} />
          ))}
        </ul>
      </section>
    </main>
  );
}

function GuestRow({ guest: g }: { guest: Guest }) {
  return (
    <li className="card !p-0">
      <details>
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-4">
          <span className="min-w-0">
            <span className="block truncate font-medium text-cream">{fullName(g)}</span>
            <span className="block truncate text-xs text-mute">{g.email}</span>
            {g.additionalGuests.length > 0 && (
              <span className="block truncate text-xs text-cream/80">+ {g.additionalGuests.join(", ")}</span>
            )}
          </span>
          <span className="shrink-0 text-right">
            <span className={`pill ${STATUS_COLOR[g.status]}`}>{STATUS_LABEL[g.status]}</span>
            {!g.invitedAt && <span className="mt-1 block text-[0.65rem] uppercase tracking-wider text-mute">Not invited</span>}
          </span>
        </summary>

        <div className="border-t-2 border-haze p-4">
          {g.note && (
            <p className="mb-4 rounded-lg bg-night p-3 text-sm text-cream">
              <span className="label">Note</span>
              {g.note}
            </p>
          )}
          <p className="mb-4 text-xs text-mute">
            Invited {day(g.invitedAt)} · Replied {day(g.respondedAt)} ·{" "}
            <a className="break-all underline" href={guestLink(g)}>
              personal link
            </a>
          </p>

          <ActionForm action={saveGuest}>
            <input type="hidden" name="id" value={g.id} />
            <div className="grid grid-cols-2 gap-3">
              <label>
                <span className="label">First name</span>
                <input name="firstName" defaultValue={g.firstName} required className="field" />
              </label>
              <label>
                <span className="label">Last name</span>
                <input name="lastName" defaultValue={g.lastName} className="field" />
              </label>
            </div>
            <label className="mt-3 block">
              <span className="label">Email</span>
              <input name="email" type="email" defaultValue={g.email} required className="field" />
            </label>
            <label className="mt-3 block">
              <span className="label">Response</span>
              {/* Keyed so the menu shows the saved value after the form resets. */}
              <select key={g.status} name="status" defaultValue={g.status} className="field">
                <option value="pending">No reply yet</option>
                <option value="yes">Coming</option>
                <option value="maybe">Maybe</option>
                <option value="no">Can&apos;t make it</option>
              </select>
            </label>
            <label className="mt-3 block">
              <span className="label">Additional guests (one name per line)</span>
              <textarea name="additionalGuests" rows={2} defaultValue={g.additionalGuests.join("\n")} className="field" />
            </label>
            <label className="mt-3 block">
              <span className="label">Note</span>
              <textarea name="note" rows={2} defaultValue={g.note} className="field" />
            </label>
            <label className="mt-3 flex items-center gap-2 text-sm text-cream">
              <input type="checkbox" name="notify" className="size-5 accent-[var(--color-sun)]" />
              Email {g.firstName} a confirmation of this RSVP
            </label>
            <button type="submit" className="btn mt-4">
              Save
            </button>
          </ActionForm>

          <div className="mt-5 flex flex-wrap items-start gap-4 border-t-2 border-haze pt-4">
            <ActionForm action={resendInvite}>
              <input type="hidden" name="id" value={g.id} />
              <button type="submit" className="btn btn-quiet">
                {g.invitedAt ? "Resend invite" : "Send invite"}
              </button>
            </ActionForm>
            <ActionForm action={removeGuest}>
              <input type="hidden" name="id" value={g.id} />
              <div className="flex items-center gap-3">
                <button type="submit" className="btn btn-quiet">
                  Remove guest
                </button>
                <label className="flex items-center gap-2 text-xs text-mute">
                  <input type="checkbox" name="confirm" className="size-4" /> Yes, remove
                </label>
              </div>
            </ActionForm>
          </div>
        </div>
      </details>
    </li>
  );
}
