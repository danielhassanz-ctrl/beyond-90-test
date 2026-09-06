"use client";

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { resolveEvent } from "@/app/carrera/actions";

export function EventDecisionForm({ children }: { children: ReactNode }) {
  const router = useRouter();

  async function handleSubmit(formData: FormData) {
    await resolveEvent(formData);
    // Después de que la Server Action completa (o hace redirect),
    // fuerza refresh del cliente
    router.refresh();
  }

  return (
    <form action={handleSubmit} className="space-y-2 pt-1">
      {children}
    </form>
  );
}
