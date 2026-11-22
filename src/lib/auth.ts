import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { getGuestByToken } from "./guests";

const ADMIN_COOKIE = "admin_session";
const GUEST_COOKIE = "rsvp_token";
const ADMIN_TTL_SECONDS = 60 * 60 * 24 * 14;
const GUEST_TTL_SECONDS = 60 * 60 * 24 * 400;

const cookieBase = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
};

function safeEqual(a: string, b: string) {
  const ha = createHash("sha256").update(a).digest();
  const hb = createHash("sha256").update(b).digest();
  return timingSafeEqual(ha, hb);
}

function sign(expires: number) {
  const secret = process.env.SESSION_SECRET || process.env.ADMIN_PASSWORD || "";
  return createHmac("sha256", secret).update(`admin.${expires}`).digest("base64url");
}

export function adminConfigured() {
  return Boolean(process.env.ADMIN_PASSWORD);
}

export function checkAdminPassword(password: string) {
  const expected = process.env.ADMIN_PASSWORD;
  return Boolean(expected) && safeEqual(password, expected!);
}

export async function startAdminSession() {
  const expires = Math.floor(Date.now() / 1000) + ADMIN_TTL_SECONDS;
  (await cookies()).set(ADMIN_COOKIE, `${expires}.${sign(expires)}`, {
    ...cookieBase,
    maxAge: ADMIN_TTL_SECONDS,
  });
}

export async function endAdminSession() {
  (await cookies()).delete(ADMIN_COOKIE);
}

export async function isAdmin() {
  if (!adminConfigured()) return false;
  const value = (await cookies()).get(ADMIN_COOKIE)?.value;
  if (!value) return false;
  const [exp, sig] = value.split(".");
  const expires = Number(exp);
  if (!sig || !Number.isFinite(expires) || expires < Date.now() / 1000) return false;
  return safeEqual(sig, sign(expires));
}

// The guest cookie just holds their personal token, the same secret that is in
// their emailed link, so the browser remembers who they are.
export async function rememberGuest(token: string) {
  (await cookies()).set(GUEST_COOKIE, token, { ...cookieBase, maxAge: GUEST_TTL_SECONDS });
}

export async function forgetGuest() {
  (await cookies()).delete(GUEST_COOKIE);
}

export async function currentGuest() {
  const token = (await cookies()).get(GUEST_COOKIE)?.value;
  return token ? getGuestByToken(token) : null;
}
