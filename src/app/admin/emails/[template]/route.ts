import { render } from "@react-email/render";
import { siteUrl } from "@/content/site";
import {
  invitationEmail,
  reminderEmail,
  rsvpConfirmationEmail,
  rsvpNotificationEmail,
  updateEmail,
  type Email,
} from "@/emails/templates";
import { isAdmin } from "@/lib/auth";

const sampleGuest = {
  firstName: "Amina",
  lastName: "Benali",
  email: "amina@example.com",
  status: "yes" as const,
  additionalGuests: ["Youssef Benali"],
  note: "Arriving a day early!",
};

// Renders each email template with sample data so it can be checked in a browser.
const previews: Record<string, () => Email> = {
  invitation: () => invitationEmail({ firstName: sampleGuest.firstName, rsvpUrl: `${siteUrl()}/rsvp` }),
  confirmation: () => rsvpConfirmationEmail({ guest: sampleGuest, rsvpUrl: `${siteUrl()}/rsvp` }),
  notification: () => rsvpNotificationEmail({ guest: sampleGuest, adminUrl: `${siteUrl()}/admin` }),
  reminder: () => reminderEmail({ firstName: sampleGuest.firstName, rsvpUrl: `${siteUrl()}/rsvp` }),
  update: () =>
    updateEmail({
      firstName: sampleGuest.firstName,
      subject: "Flights and where we're staying",
      message: "Your message goes here.\n\nBlank lines start a new paragraph.",
      siteUrl: siteUrl(),
    }),
};

export async function GET(_req: Request, ctx: RouteContext<"/admin/emails/[template]">) {
  if (!(await isAdmin())) return new Response("Not signed in", { status: 401 });
  const { template } = await ctx.params;
  const build = previews[template];
  if (!build) return new Response("Unknown template", { status: 404 });
  return new Response(await render(build().react), {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
