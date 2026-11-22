import { randomBytes, randomUUID } from "node:crypto";
import { asc, eq } from "drizzle-orm";
import { getDb } from "./db";
import { guests, type Guest, type Status } from "./schema";

export type { Guest, Status };

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function fullName(g: Pick<Guest, "firstName" | "lastName">) {
  return `${g.firstName} ${g.lastName}`.trim();
}

export async function listGuests(): Promise<Guest[]> {
  const db = await getDb();
  return db.select().from(guests).orderBy(asc(guests.lastName), asc(guests.firstName));
}

export async function getGuestById(id: string) {
  const db = await getDb();
  const rows = await db.select().from(guests).where(eq(guests.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function getGuestByToken(token: string) {
  if (!token) return null;
  const db = await getDb();
  const rows = await db.select().from(guests).where(eq(guests.token, token)).limit(1);
  return rows[0] ?? null;
}

export async function getGuestByEmail(email: string) {
  const db = await getDb();
  const rows = await db
    .select()
    .from(guests)
    .where(eq(guests.email, normalizeEmail(email)))
    .limit(1);
  return rows[0] ?? null;
}

export async function createGuest(input: { firstName: string; lastName: string; email: string }) {
  const db = await getDb();
  const rows = await db
    .insert(guests)
    .values({
      id: randomUUID(),
      token: randomBytes(24).toString("base64url"),
      firstName: input.firstName.trim(),
      lastName: input.lastName.trim(),
      email: normalizeEmail(input.email),
    })
    .returning();
  return rows[0];
}

type GuestPatch = Partial<
  Pick<
    Guest,
    "firstName" | "lastName" | "email" | "status" | "additionalGuests" | "note" | "invitedAt" | "respondedAt"
  >
>;

export async function updateGuest(id: string, patch: GuestPatch) {
  const db = await getDb();
  const rows = await db
    .update(guests)
    .set({ ...patch, updatedAt: new Date() })
    .where(eq(guests.id, id))
    .returning();
  return rows[0] ?? null;
}

export async function deleteGuest(id: string) {
  const db = await getDb();
  await db.delete(guests).where(eq(guests.id, id));
}

export const STATUS_LABEL: Record<Status, string> = {
  pending: "No reply yet",
  yes: "Coming",
  no: "Can't make it",
  maybe: "Maybe",
};

// Drops blanks, trims, and caps the list.
export function cleanNames(names: string[], max: number) {
  return names
    .map((n) => n.trim())
    .filter(Boolean)
    .slice(0, max);
}
