"use client";

import { useFormStatus } from "react-dom";

export function SubmitButton({ children }: { children: string }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full cursor-pointer rounded-md bg-gold px-4 py-2 text-sm font-semibold text-neutral-950 hover:bg-gold-soft disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Subiendo, un momento…" : children}
    </button>
  );
}
