import { forgetGuest } from "@/lib/auth";

// "Not you?": forget this browser's guest. A plain form POST, so the browser
// does a full page load and the RSVP form starts from scratch.
export async function POST(req: Request) {
  await forgetGuest();
  return Response.redirect(new URL("/rsvp", req.url), 303);
}
