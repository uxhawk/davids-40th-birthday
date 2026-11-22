"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

// Days until the trip. Rendered on the client only so it is never stale.
export function Countdown({ to }: { to: string }) {
  const days = useSyncExternalStore(
    subscribe,
    () => Math.ceil((new Date(to).getTime() - Date.now()) / 86_400_000),
    () => null,
  );
  if (days === null || days <= 0) return null;
  return (
    <p className="eyebrow">
      T-minus {days.toLocaleString("en-US")} {days === 1 ? "day" : "days"}
    </p>
  );
}
