import { render } from "@react-email/render";
import { Resend } from "resend";
import type { Email } from "@/emails/templates";

export type Outgoing = Email & { to: string };
export type SendResult = { sent: number; failed: number; logged: boolean; error?: string };

const DEFAULT_FROM = "David's 40th <onboarding@resend.dev>";

// Sends through Resend. With no RESEND_API_KEY the emails are printed to the
// server log instead, so every flow can be exercised locally.
export async function sendEmails(messages: Outgoing[]): Promise<SendResult> {
  if (messages.length === 0) return { sent: 0, failed: 0, logged: false };

  const rendered = await Promise.all(
    messages.map(async (m) => ({
      to: m.to,
      subject: m.subject,
      html: await render(m.react),
      text: await render(m.react, { plainText: true }),
    })),
  );

  const key = process.env.RESEND_API_KEY;
  if (!key) {
    for (const m of rendered) {
      console.log(`\n--- email (not sent: RESEND_API_KEY unset) ---\nTo: ${m.to}\nSubject: ${m.subject}\n\n${m.text}\n---`);
    }
    return { sent: rendered.length, failed: 0, logged: true };
  }

  const resend = new Resend(key);
  const from = process.env.EMAIL_FROM || DEFAULT_FROM;
  const replyTo = process.env.ADMIN_EMAIL || undefined;
  let sent = 0;
  let failed = 0;
  let error: string | undefined;

  // The batch endpoint accepts up to 100 emails per call.
  for (let i = 0; i < rendered.length; i += 100) {
    const chunk = rendered.slice(i, i + 100);
    try {
      const res = await resend.batch.send(chunk.map((m) => ({ ...m, from, replyTo })));
      if (res.error) {
        failed += chunk.length;
        error = res.error.message;
      } else {
        sent += chunk.length;
      }
    } catch (err) {
      failed += chunk.length;
      error = err instanceof Error ? err.message : String(err);
    }
  }
  if (error) console.error("Email send failed:", error);
  return { sent, failed, logged: false, error };
}

export function describeSend(r: SendResult) {
  if (r.sent + r.failed === 0) return "No emails to send.";
  if (r.logged) return `${r.sent} email(s) printed to the server log (RESEND_API_KEY not set).`;
  if (r.failed) return `${r.sent} sent, ${r.failed} failed: ${r.error}`;
  return `${r.sent} email(s) sent.`;
}
