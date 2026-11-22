"use client";

import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile";
import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { submitRsvp, type RsvpState } from "./actions";

type Props = {
  // Set when the browser is already recognised (cookie or personal link).
  guest: {
    firstName: string;
    lastName: string;
    email: string;
    status: string;
    additionalGuests: string[];
    note: string;
  } | null;
  maxAdditionalGuests: number;
  turnstileSiteKey?: string;
};

const CHOICES = [
  { value: "yes", label: "I'm in" },
  { value: "maybe", label: "Maybe" },
  { value: "no", label: "Can't make it" },
];

export function RsvpForm({ guest, maxAdditionalGuests, turnstileSiteKey }: Props) {
  const [state, action, pending] = useActionState<RsvpState, FormData>(submitRsvp, null);
  // Fields are controlled so nothing the guest typed is lost if the save fails.
  const [firstName, setFirstName] = useState(guest?.firstName ?? "");
  const [lastName, setLastName] = useState(guest?.lastName ?? "");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState(guest && guest.status !== "pending" ? guest.status : "");
  const [names, setNames] = useState<string[]>(guest?.additionalGuests ?? []);
  const [note, setNote] = useState(guest?.note ?? "");
  const captcha = useRef<TurnstileInstance>(null);
  const [, startTransition] = useTransition();

  // A captcha token is single-use, so get a fresh one after every attempt.
  useEffect(() => {
    if (state) captcha.current?.reset();
  }, [state]);

  const setCount = (n: number) =>
    setNames((prev) => Array.from({ length: n }, (_, i) => prev[i] ?? ""));

  return (
    <form
      action={action}
      // Submit by hand: React's automatic form reset after an action would
      // otherwise blank the controlled select and radios.
      onSubmit={(e) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        startTransition(() => action(data));
      }}
      className="space-y-5"
    >
      {guest ? (
        <div>
          <span className="label">Email</span>
          <p className="break-all text-cream">{guest.email}</p>
        </div>
      ) : (
        <div>
          <label className="label" htmlFor="email">
            Email your invitation was sent to
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            inputMode="email"
            className="field"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label" htmlFor="firstName">
            First name
          </label>
          <input
            id="firstName"
            name="firstName"
            required
            autoComplete="given-name"
            className="field"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
          />
        </div>
        <div>
          <label className="label" htmlFor="lastName">
            Last name
          </label>
          <input
            id="lastName"
            name="lastName"
            autoComplete="family-name"
            className="field"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
          />
        </div>
      </div>

      <fieldset>
        <legend className="label">Can you make it?</legend>
        <div className="grid gap-2 sm:grid-cols-3">
          {CHOICES.map((c) => (
            <label
              key={c.value}
              className={`flex min-h-12 cursor-pointer items-center justify-center rounded-xl border-2 px-3 text-center font-display text-lg transition-colors has-[:focus-visible]:outline has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-teal ${
                status === c.value ? "border-gold bg-gold text-night" : "border-haze bg-night text-cream"
              }`}
            >
              <input
                type="radio"
                name="status"
                value={c.value}
                required
                checked={status === c.value}
                onChange={() => setStatus(c.value)}
                className="sr-only"
              />
              {c.label}
            </label>
          ))}
        </div>
      </fieldset>

      {status !== "no" && status !== "" && (
        <div className="space-y-3">
          <div>
            <label className="label" htmlFor="count">
              Bringing anyone?
            </label>
            <select
              id="count"
              className="field"
              value={names.length}
              onChange={(e) => setCount(Number(e.target.value))}
            >
              {Array.from({ length: maxAdditionalGuests + 1 }, (_, n) => (
                <option key={n} value={n}>
                  {n === 0 ? "Just me" : `Me + ${n}`}
                </option>
              ))}
            </select>
          </div>
          {names.map((name, i) => (
            <div key={i}>
              <label className="label" htmlFor={`guest-${i}`}>
                Guest {i + 1} full name
              </label>
              <input
                id={`guest-${i}`}
                name="guestName"
                required
                className="field"
                value={name}
                onChange={(e) => setNames((prev) => prev.map((p, j) => (j === i ? e.target.value : p)))}
              />
            </div>
          ))}
        </div>
      )}

      <div>
        <label className="label" htmlFor="note">
          Note for David (optional)
        </label>
        <textarea
          id="note"
          name="note"
          rows={3}
          maxLength={1000}
          className="field"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </div>

      {turnstileSiteKey && (
        <Turnstile ref={captcha} siteKey={turnstileSiteKey} options={{ theme: "dark", size: "flexible" }} />
      )}

      {state && (
        <p
          role="status"
          className={`rounded-xl border-2 px-4 py-3 text-sm ${
            state.ok ? "border-teal text-teal" : "border-rose text-[#ff9cc4]"
          }`}
        >
          {state.message}
        </p>
      )}

      <button type="submit" className="btn w-full" disabled={pending}>
        {pending ? "Sending…" : guest && guest.status !== "pending" ? "Update RSVP" : "Send RSVP"}
      </button>
    </form>
  );
}
