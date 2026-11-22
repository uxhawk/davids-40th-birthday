import { redirect } from "next/navigation";
import { rememberGuest } from "@/lib/auth";
import { getGuestByToken } from "@/lib/guests";

// Personal link from an email: remember the guest in this browser, then show
// the RSVP form. Unknown tokens just land on the plain form.
export async function GET(_req: Request, ctx: RouteContext<"/r/[token]">) {
  const { token } = await ctx.params;
  const guest = await getGuestByToken(token);
  if (guest) await rememberGuest(guest.token);
  redirect("/rsvp");
}
