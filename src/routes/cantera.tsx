import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AlertTriangle, BriefcaseBusiness, Clock, HeartHandshake, ShieldCheck, TrendingUp, Users } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { clubById } from "@/game/data";
import { useGame, type OpeningSetup } from "@/game/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/cantera")({
  head: () => ({
    meta: [
      { title: "Empieza tu carrera — BEYOND 90" },
      { name: "description", content: "Antes del fútbol vienen tu familia, quién llevará tu carrera y el primer acuerdo con un club." },
      { property: "og:title", content: "Empieza tu carrera — BEYOND 90" },
      { property: "og:description", content: "Con 16 años todavía no eres futbolista profesional. Primero tienes que decidir con quién vas a recorrer el camino." },
    ],
  }),
  component: Academy,
});

type Step = "family" | "adviser" | "clubs" | "contract";

const FAMILY_COPY: Record<OpeningSetup["familyChoice"], string> = {
  support: "En casa están orgullosos, pero te recuerdan que todavía no has conseguido nada.",
  grounded: "Tu familia te pide que mantengas los pies en el suelo y que nadie decida por ti.",
  study: "Tus padres celebran la oportunidad, aunque insisten en que no abandones tu vida de golpe.",
};

function adviserLabel(kind: OpeningSetup["adviserKind"]): string {
  if (kind === "father") return "Papá";
  if (kind === "friend") return "Álex";
  return "Álvaro Montes";
}

function adviserRole(kind: OpeningSetup["adviserKind"]): string {
  if (kind === "father") return "tu padre y asesor";
  if (kind === "friend") return "tu amigo de confianza";
  return "tu representante";
}

function Academy() {
  const { state, ready, pickClub } = useGame();
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("family");
  const [familyChoice, setFamilyChoice] = useState<OpeningSetup["familyChoice"] | null>(null);
  const [adviserKind, setAdviserKind] = useState<OpeningSetup["adviserKind"] | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [contractChoice, setContractChoice] = useState<OpeningSetup["contractChoice"] | null>(null);

  const offers = useMemo(
    () => (state?.offers ?? []).map((o) => ({ ...clubById(o.clubId), pitch: o.pitch })),
    [state?.offers],
  );
  const selectedClub = offers.find((club) => club.id === selected) ?? null;

  useEffect(() => {
    if (ready && !state) void navigate({ to: "/onboarding" });
    if (ready && state?.clubId) void navigate({ to: "/historia" });
  }, [ready, state, navigate]);

  const finish = () => {
    if (!selected || !familyChoice || !adviserKind || !contractChoice) return;
    pickClub(selected, { familyChoice, adviserKind, contractChoice });
    void navigate({ to: "/historia" });
  };

  if (step === "family") {
    return (
      <OpeningShell kicker="Verano · 16 años" title="Esta noche todavía eres el de siempre">
        <p className="text-sm leading-relaxed text-foreground/80">
          Han llamado de varios clubes. Mañana tendrás que escuchar propuestas, pero esta noche cenas en casa. Nadie habla de millones ni de Champions: tu familia habla de estudios, de amigos y de lo rápido que puede cambiar todo si alguien se equivoca contigo.
        </p>
        <div className="mt-6 space-y-3">
          <Choice
            active={familyChoice === "support"}
            title="Escuchar y disfrutarlo con ellos"
            text="Quieres compartir la ilusión sin creerte todavía futbolista."
            onClick={() => setFamilyChoice("support")}
          />
          <Choice
            active={familyChoice === "grounded"}
            title="Decir que no quieres que nadie decida por ti"
            text="Agradeces los consejos, pero marcas desde el principio que la carrera será tuya."
            onClick={() => setFamilyChoice("grounded")}
          />
          <Choice
            active={familyChoice === "study"}
            title="Prometer que intentarás mantener una vida normal"
            text="Fútbol sí, pero sin borrar de golpe estudios, amigos y familia."
            onClick={() => setFamilyChoice("study")}
          />
        </div>
        <Continue disabled={!familyChoice} onClick={() => setStep("adviser")}>Seguir</Continue>
      </OpeningShell>
    );
  }

  if (step === "adviser") {
    return (
      <OpeningShell kicker="Día siguiente · 18:42" title="Alguien quiere llevar tu carrera">
        <p className="text-sm leading-relaxed text-foreground/80">
          {familyChoice ? FAMILY_COPY[familyChoice] : "En casa quieren que elijas con calma."} Esa tarde aparece la primera decisión seria: quién estará a tu lado cuando haya que negociar, rechazar una oferta o decirle que no a un club.
        </p>
        <div className="mt-6 space-y-3">
          <Choice
            active={adviserKind === "agent"}
            icon={BriefcaseBusiness}
            title="Álvaro Montes · representante profesional"
            text="Conoce contratos, clubes y mercado. Cobra comisión y tendrá opinión propia."
            onClick={() => setAdviserKind("agent")}
          />
          <Choice
            active={adviserKind === "father"}
            icon={HeartHandshake}
            title="Que lo lleve tu padre"
            text="Confías en él por encima de cualquiera. Tendrá que aprender el negocio contigo."
            onClick={() => setAdviserKind("father")}
          />
          <Choice
            active={adviserKind === "friend"}
            icon={Users}
            title="Álex · persona de confianza"
            text="No es agente profesional, pero te conoce desde antes de que hubiera ofertas."
            onClick={() => setAdviserKind("friend")}
          />
        </div>
        <Continue disabled={!adviserKind} onClick={() => setStep("clubs")}>Escuchar ofertas</Continue>
      </OpeningShell>
    );
  }

  if (step === "contract") {
    return (
      <OpeningShell kicker="Primera negociación" title={`La mesa del ${selectedClub?.name ?? "club"}`}>
        <p className="text-sm leading-relaxed text-foreground/80">
          {adviserKind && `${adviserLabel(adviserKind)}, ${adviserRole(adviserKind)}, se sienta contigo.`} El club explica el plan deportivo. No hay una fortuna: eres un chico de 16 años entrando en cantera. Lo importante es qué queréis dejar claro antes de firmar.
        </p>
        <div className="mt-5 rounded-2xl border border-gold/30 bg-surface p-4">
          <p className="text-kicker">Consejo de {adviserKind ? adviserLabel(adviserKind) : "tu entorno"}</p>
          <p className="mt-2 text-sm italic text-foreground/80">
            “No firmes pensando en el escudo. Firma pensando en qué necesitas para estar más cerca del primer equipo dentro de dos años.”
          </p>
        </div>
        <div className="mt-5 space-y-3">
          <Choice
            active={contractChoice === "minutes"}
            title="Pedir un camino claro hacia minutos"
            text="Quieres saber qué tendría que pasar para subir de categoría y competir de verdad."
            onClick={() => setContractChoice("minutes")}
          />
          <Choice
            active={contractChoice === "development"}
            title="Priorizar el plan de desarrollo"
            text="Aceptas paciencia si el club concreta entrenador, posición y objetivos de evolución."
            onClick={() => setContractChoice("development")}
          />
          <Choice
            active={contractChoice === "security"}
            title="Buscar estabilidad para ti y tu familia"
            text="Prefieres un acuerdo sencillo y seguro antes que promesas agresivas sobre llegar arriba."
            onClick={() => setContractChoice("security")}
          />
        </div>
        <Continue disabled={!contractChoice} onClick={finish}>Firmar y conocer al míster</Continue>
      </OpeningShell>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-md px-5 py-8 safe-top">
        <p className="text-kicker">Verano · 16 años</p>
        <h1 className="mt-2 font-display text-3xl leading-tight">Ahora sí: cuatro canteras te quieren</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {adviserKind ? `${adviserLabel(adviserKind)} revisa contigo las propuestas.` : "Revisas las propuestas con tu entorno."} Ninguna garantiza que llegues al primer equipo.
        </p>

        <ul className="mt-6 space-y-4">
          {offers.map((c) => {
            const active = selected === c.id;
            return (
              <li key={c.id}>
                <button
                  onClick={() => setSelected(c.id)}
                  className={cn(
                    "w-full rounded-2xl border p-4 text-left transition-all",
                    active ? "border-gold/70 bg-surface-2 shadow-[var(--shadow-gold)]" : "border-border bg-surface",
                  )}
                >
                  <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
                    <div className="min-w-0">
                      <h2 className="truncate font-display text-xl">{c.name}</h2>
                      <p className="font-cond text-xs uppercase tracking-[0.16em] text-muted-foreground">{c.city} · {c.colors}</p>
                    </div>
                    <span className="font-num shrink-0 rounded-lg border border-gold/40 px-2 py-1 text-xs text-gold">Nivel {c.prestige}/5</span>
                  </div>
                  <p className="mt-2 text-sm italic leading-snug text-foreground/70">{c.pitch}</p>
                  <dl className="mt-3 space-y-2 text-sm">
                    <Row Icon={TrendingUp} label="Desarrollo" text={c.development} />
                    <Row Icon={Users} label="Competencia" text={c.competition} />
                    <Row Icon={Clock} label="Minutos" text={c.minutes} />
                    <Row Icon={AlertTriangle} label="Riesgo" text={c.risk} tone="warn" />
                  </dl>
                </button>
              </li>
            );
          })}
        </ul>

        <button
          onClick={() => selected && setStep("contract")}
          disabled={!selected}
          className="gold-fill mt-6 w-full rounded-xl px-5 py-4 font-cond text-lg font-bold uppercase tracking-[0.18em] disabled:opacity-35"
        >
          Sentarnos a negociar
        </button>
        <div className="h-10" />
      </div>
    </div>
  );
}

function OpeningShell({ kicker, title, children }: { kicker: string; title: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-md px-5 py-8 safe-top">
        <p className="text-kicker">{kicker}</p>
        <h1 className="mt-2 font-display text-3xl leading-tight">{title}</h1>
        <div className="mt-5">{children}</div>
        <div className="h-10" />
      </div>
    </div>
  );
}

function Choice({ active, title, text, onClick, icon: Icon = ShieldCheck }: { active: boolean; title: string; text: string; onClick: () => void; icon?: typeof Users }) {
  return (
    <button
      onClick={onClick}
      className={cn("w-full rounded-2xl border p-4 text-left transition-all", active ? "border-gold/70 bg-surface-2 shadow-[var(--shadow-gold)]" : "border-border bg-surface")}
    >
      <div className="flex gap-3">
        <Icon className={cn("mt-0.5 h-5 w-5 shrink-0", active ? "text-gold" : "text-muted-foreground")} aria-hidden />
        <div>
          <h2 className="font-display text-lg leading-tight">{title}</h2>
          <p className="mt-1 text-sm leading-snug text-foreground/70">{text}</p>
        </div>
      </div>
    </button>
  );
}

function Continue({ disabled, onClick, children }: { disabled: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} disabled={disabled} className="gold-fill mt-6 w-full rounded-xl px-5 py-4 font-cond text-lg font-bold uppercase tracking-[0.18em] disabled:opacity-35">
      {children}
    </button>
  );
}

function Row({ Icon, label, text, tone = "normal" }: { Icon: typeof Users; label: string; text: string; tone?: "normal" | "warn" }) {
  return (
    <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-2">
      <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", tone === "warn" ? "text-destructive" : "text-accent")} aria-hidden />
      <div className="min-w-0">
        <dt className="text-kicker">{label}</dt>
        <dd className="text-sm leading-snug text-foreground/85">{text}</dd>
      </div>
    </div>
  );
}
