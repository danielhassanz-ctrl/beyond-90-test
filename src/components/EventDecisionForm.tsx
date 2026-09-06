"use client";

import { useTransition } from "react";
import type { ReactNode } from "react";
import { resolveEvent } from "@/app/carrera/actions";

export function EventDecisionForm({ children }: { children: ReactNode }) {
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      await resolveEvent(formData);
    });
  }

  return (
    <form action={handleSubmit} className="space-y-2 pt-1">
      {isPending ? (
        <>
          <div className="space-y-2 opacity-50 pointer-events-none">
            {children}
          </div>
          <div className="flex items-center justify-center gap-2 py-4">
            <div className="w-2 h-2 bg-gold rounded-full animate-bounce" style={{animationDelay: '0s'}} />
            <div className="w-2 h-2 bg-gold rounded-full animate-bounce" style={{animationDelay: '0.2s'}} />
            <div className="w-2 h-2 bg-gold rounded-full animate-bounce" style={{animationDelay: '0.4s'}} />
          </div>
          <p className="text-xs text-center text-gold">Procesando tu decisión...</p>
        </>
      ) : (
        children
      )}
    </form>
  );
}
