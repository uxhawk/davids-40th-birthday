import { isAdmin } from "@/lib/auth";
import { listGuests } from "@/lib/guests";

// Quote every cell, and neutralise values a spreadsheet would run as a formula.
const cell = (v: string) => `"${(/^[=+\-@]/.test(v) ? `'${v}` : v).replace(/"/g, '""')}"`;

export async function GET() {
  if (!(await isAdmin())) return new Response("Not signed in", { status: 401 });
  const rows = [
    ["First name", "Last name", "Email", "Response", "Party size", "Additional guests", "Note", "Invited", "Replied"],
    ...(await listGuests()).map((g) => [
      g.firstName,
      g.lastName,
      g.email,
      g.status,
      String(g.status === "yes" || g.status === "maybe" ? 1 + g.additionalGuests.length : 0),
      g.additionalGuests.join("; "),
      g.note,
      g.invitedAt?.toISOString() ?? "",
      g.respondedAt?.toISOString() ?? "",
    ]),
  ];
  return new Response(rows.map((r) => r.map(cell).join(",")).join("\r\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="guests.csv"',
    },
  });
}
