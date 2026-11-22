"use client";

import { useActionState, type ReactNode } from "react";
import type { ActionState } from "./actions";

type Props = {
  action: (prev: ActionState, form: FormData) => Promise<ActionState>;
  children: ReactNode;
  className?: string;
};

// Wraps an admin server action in a form and shows its result message.
// Put <SubmitButton> elements inside as children.
export function ActionForm({ action, children, className }: Props) {
  const [state, formAction, pending] = useActionState(action, null);
  return (
    <form action={formAction} className={className} aria-busy={pending}>
      <fieldset disabled={pending} className="contents">
        {children}
      </fieldset>
      {state && (
        <p
          role="status"
          className={`mt-3 rounded-xl border-2 px-3 py-2 text-sm ${
            state.ok ? "border-teal text-teal" : "border-rose text-[#ff9cc4]"
          }`}
        >
          {state.message}
        </p>
      )}
    </form>
  );
}
