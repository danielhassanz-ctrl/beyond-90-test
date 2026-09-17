import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getCurrentUserAndPlayer } from "@/lib/player";
import { displayName } from "@/types/player";
import { PRESIDENT_CLUB_OPTIONS, COACH_CLUB_OPTIONS, AGENT_SPECIALTY_OPTIONS } from "@/lib/constants";
import {
  chooseSecondCareer,
  choosePresidentClub,
  chooseCoachClub,
  chooseAgentSpecialty,
} from "./actions";

// entrenador/agente/presidente tienen un paso extra (elegir banquillo,
// especialidad o club) — el resto arranca directo. Antes solo existían
// estos tres: el tipo SecondCareerRole y la IA (ver SECOND_LIFE_CONTEXT
// en ai.ts) ya soportaban las otras cuatro desde hace tiempo, pero esta
// pantalla nunca las ofrecía — más de la mitad de las segundas vidas que
// el juego sabe contar eran imposibles de elegir.
const ROLES = [
  {
    value: "entrenador",
    label: "Entrenador",
    description: "Dirige una plantilla, toma decisiones tácticas y sobrevive a la presión de los resultados.",
  },
  {
    value: "agente",
    label: "Agente",
    description: "Representa jugadores, negocia contratos y construye tu propia fortuna fuera del campo.",
  },
  {
    value: "presidente",
    label: "Presidente",
    description: "Gestiona un club entero: fichajes, presupuesto y la presión de los socios.",
  },
  {
    value: "comentarista",
    label: "Comentarista",
    description: "Analiza el fútbol desde el plató: comentarios en directo, análisis técnico, opinión pública.",
  },
  {
    value: "empresario",
    label: "Empresario",
    description: "Construyes un imperio fuera del campo: negocios, inversiones, startups deportivas.",
  },
  {
    value: "embajador",
    label: "Embajador del club",
    description: "Eres la cara visible de tu último club: eventos, caridad, relaciones públicas, legado vivo.",
  },
  {
    value: "privado",
    label: "Vida privada",
    description: "Te alejas del foco por completo: familia, tranquilidad, anonimato relativo.",
  },
] as const;

function ChoiceShell({
  title,
  subtitle,
  error,
  children,
}: {
  title: string;
  subtitle: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <div className="w-full max-w-md space-y-6 text-center">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-gold">{title}</h1>
          <p className="text-sm text-neutral-400">{subtitle}</p>
        </div>

        {error && (
          <p className="rounded-md border border-red-900/50 bg-red-950/50 px-3 py-2 text-sm text-red-300">
            {error}
          </p>
        )}

        {children}
      </div>
    </main>
  );
}

function OptionCard({
  name,
  value,
  label,
  description,
  tag,
}: {
  name: string;
  value: string;
  label: string;
  description: string;
  tag?: string;
}) {
  return (
    <label className="flex cursor-pointer flex-col gap-1 rounded-lg border border-panel-border bg-panel p-4 text-left has-[:checked]:border-gold has-[:checked]:bg-gold/10">
      <span className="flex items-center justify-between gap-2 font-semibold text-neutral-100">
        <span className="flex items-center gap-2">
          <input type="radio" name={name} value={value} required />
          {label}
        </span>
        {tag && <span className="text-xs font-normal text-gold">{tag}</span>}
      </span>
      <span className="text-sm text-neutral-400">{description}</span>
    </label>
  );
}

export default async function ElegirSegundaVidaPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { user, player } = await getCurrentUserAndPlayer();
  const params = await searchParams;

  if (!user) {
    redirect("/login");
  }

  if (!player) {
    redirect("/crear-jugador");
  }

  if (player.status !== "awaiting_second_life") {
    redirect("/mi-jugador");
  }

  if (player.second_career === "presidente") {
    // Los clubes fijos (Oviedo, Deportivo, Lecce) también pueden ser el
    // club real en el que jugó o se retiró — si coinciden, el jugador
    // vería el MISMO club ofrecido dos veces como si fueran opciones
    // distintas ("tu club de siempre" gratis, y "rescatar un club
    // histórico" de pago, siendo literalmente el mismo club). "propio" ya
    // cubre ese caso, así que se descarta el fijo que coincida.
    const presidentOptions = PRESIDENT_CLUB_OPTIONS.filter(
      (option) => !("club" in option) || option.club !== player.club,
    );
    return (
      <ChoiceShell
        title="¿Qué club coges?"
        subtitle={`Tienes ${player.patrimonio.toLocaleString("es")} € de patrimonio para invertir en el proyecto.`}
        error={params.error}
      >
        <form action={choosePresidentClub} className="space-y-3">
          {presidentOptions.map((option) => (
            <OptionCard
              key={option.value}
              name="club_option"
              value={option.value}
              label={option.label}
              description={option.description}
              tag={option.cost > 0 ? `${option.cost.toLocaleString("es")} €` : "Gratis"}
            />
          ))}
          <button
            type="submit"
            className="w-full rounded-md bg-gold px-4 py-2 text-sm font-semibold text-neutral-950 hover:bg-gold-soft"
          >
            Empezar esta nueva etapa
          </button>
        </form>
      </ChoiceShell>
    );
  }

  if (player.second_career === "entrenador") {
    // Mismo problema que con los clubes de presidente: "filial" ya
    // referencia el último club del jugador, así que si ese club
    // coincide con uno de los fijos (Villarreal, Betis, Sevilla,
    // Atlético), se descarta el fijo duplicado.
    const coachOptions = COACH_CLUB_OPTIONS.filter(
      (option) => !("club" in option) || option.club !== player.club,
    );
    return (
      <ChoiceShell
        title="¿Qué banquillo coges?"
        subtitle="Cuanto más grande el club, más presión desde el primer día."
        error={params.error}
      >
        <form action={chooseCoachClub} className="space-y-3">
          {coachOptions.map((option) => (
            <OptionCard
              key={option.value}
              name="club_option"
              value={option.value}
              label={option.label}
              description={option.description}
            />
          ))}
          <button
            type="submit"
            className="w-full rounded-md bg-gold px-4 py-2 text-sm font-semibold text-neutral-950 hover:bg-gold-soft"
          >
            Empezar esta nueva etapa
          </button>
        </form>
      </ChoiceShell>
    );
  }

  if (player.second_career === "agente") {
    return (
      <ChoiceShell
        title="¿En qué te especializas?"
        subtitle="Define el tipo de jugadores y contratos con los que vas a trabajar."
        error={params.error}
      >
        <form action={chooseAgentSpecialty} className="space-y-3">
          {AGENT_SPECIALTY_OPTIONS.map((option) => (
            <OptionCard
              key={option.value}
              name="specialty_option"
              value={option.value}
              label={option.label}
              description={option.description}
            />
          ))}
          <button
            type="submit"
            className="w-full rounded-md bg-gold px-4 py-2 text-sm font-semibold text-neutral-950 hover:bg-gold-soft"
          >
            Empezar esta nueva etapa
          </button>
        </form>
      </ChoiceShell>
    );
  }

  return (
    <ChoiceShell
      title="¿Qué quieres ser ahora?"
      subtitle={`${displayName(player)} colgó las botas. Tu historia en el fútbol no termina aquí.`}
    >
      <form action={chooseSecondCareer} className="space-y-3">
        {ROLES.map((role) => (
          <OptionCard
            key={role.value}
            name="role"
            value={role.value}
            label={role.label}
            description={role.description}
          />
        ))}
        <button
          type="submit"
          className="w-full rounded-md bg-gold px-4 py-2 text-sm font-semibold text-neutral-950 hover:bg-gold-soft"
        >
          Empezar esta nueva etapa
        </button>
      </form>
    </ChoiceShell>
  );
}
