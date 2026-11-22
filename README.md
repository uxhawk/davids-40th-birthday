# David's 40th · Morocco 2027

Invite-only RSVP site for David's 40th birthday in Taghazout, Morocco (November 13–21, 2027).

## What's here

| Route | What it does |
| --- | --- |
| `/` | Home page: hero, placeholder details, Google Map of each location |
| `/rsvp` | RSVP form (captcha-protected). Only invited emails can reply. Locks after the deadline. |
| `/r/<token>` | Personal link from emails. Remembers the guest in a cookie and opens their RSVP. |
| `/admin` | Password-protected: stats, send invitations, edit or add RSVPs, send reminders and updates, CSV export |
| `/admin/emails/<name>` | Preview of each email template (`invitation`, `confirmation`, `notification`, `reminder`, `update`) |

Stack: Next.js (App Router) · Tailwind · Postgres via Drizzle (Neon in production, PGlite locally) ·
Resend + React Email · Cloudflare Turnstile.

## Run it locally

```bash
npm install
cp .env.example .env.local   # set ADMIN_PASSWORD at minimum
npm run dev
```

Nothing else is needed locally. With the other variables unset, the app stores data in
`.data/`, prints emails to the terminal instead of sending them, and skips the captcha.

## Editing content

Party details live in [`src/content/site.ts`](src/content/site.ts): dates, RSVP deadline,
tagline, the home page sections, and the list of map locations. Email wording lives in
[`src/emails/templates.tsx`](src/emails/templates.tsx).

## Going live

1. **Vercel**: import this repo as a new project.
2. **Database**: in the Vercel project, add a Neon Postgres database from the Storage tab.
   It sets `DATABASE_URL` for you. The table is created automatically on first use.
3. **Admin**: set `ADMIN_PASSWORD` (long and random) and `SESSION_SECRET` (another random string).
4. **Captcha**: create a Turnstile widget in Cloudflare for your domain and set
   `NEXT_PUBLIC_TURNSTILE_SITE_KEY` and `TURNSTILE_SECRET_KEY`.
5. **Email**: create a Resend account and set `RESEND_API_KEY` and `ADMIN_EMAIL`.
   Until a domain is verified in Resend, email can only be delivered to your own address.
   Once you have a domain, verify it in Resend and set `EMAIL_FROM` to an address on it.
6. **Site URL**: set `SITE_URL` to the public address so links in emails point to the right place.
7. **Maps** (optional): set `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` to use the Maps Embed API.
   Without it the maps use Google's keyless embed.

See [`.env.example`](.env.example) for every variable.

## How RSVPs work

- You add guests on `/admin` (one per line: `First, Last, email`). Each gets an invitation
  email containing a personal link.
- A guest who opens their link, or types their invited email into the form, can reply
  yes / maybe / no and name any additional guests. Their browser remembers them, and every
  confirmation email carries the same personal link, so they can change their answer later
  from any device.
- Each reply sends a confirmation to the guest and a notification to `ADMIN_EMAIL`.
- After the deadline the form shows a "contact David directly" message. The admin page can
  still change any RSVP.
