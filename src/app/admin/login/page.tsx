import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { adminConfigured, isAdmin } from "@/lib/auth";
import { ActionForm } from "../action-form";
import { login } from "../actions";

// Depends on cookies and env vars, so never prerender at build time.
export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Admin sign in" };

export default async function LoginPage() {
  if (await isAdmin()) redirect("/admin");
  return (
    <main className="mx-auto max-w-sm px-5 pt-16">
      <p className="eyebrow">Mission control</p>
      <h1 className="display mt-2 text-4xl text-gold">Admin</h1>
      <div className="card mt-6">
        {adminConfigured() ? (
          <ActionForm action={login}>
            <label className="label" htmlFor="password">
              Password
            </label>
            <input id="password" name="password" type="password" required autoComplete="current-password" className="field" />
            <button type="submit" className="btn mt-4 w-full">
              Sign in
            </button>
          </ActionForm>
        ) : (
          <p className="text-sm text-cream">
            Set the <code className="font-mono text-teal">ADMIN_PASSWORD</code> environment variable to
            enable the admin area.
          </p>
        )}
      </div>
    </main>
  );
}
