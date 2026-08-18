import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import cover from "@/assets/hero-cover.jpg";
import { useGame } from "@/game/store";
import { clubById } from "@/game/data";
import { seasonLabel } from "@/game/engine";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "BEYOND 90 — Simulador narrativo de carrera futbolística" },
      {
        name: "description",
        content:
          "Vive la carrera de un futbolista desde los 16 años: cantera, decisiones, lesiones, representante y debut profesional.",
      },
      { property: "og:title", content: "BEYOND 90 — Tu historia, más allá del 90" },
      {
        property: "og:description",
        content: "Simulador narrativo de vida y carrera futbolística. Elige tu cantera y escribe tu leyenda.",
      },
    ],
  }),
  component: Cover,
});

function Cover() {
  const { state, ready, reset } = useGame();
  const navigate = useNavigate();
  const [confirming, setConfirming] = useState(false);

  const startNew = () => {
    reset();
    void navigate({ to: "/onboarding" });
  };

  const onNew = () => {
    if (state && !confirming) {
      setConfirming(true);
      return;
    }
    startNew();
  };

  const onContinue = () => {
    if (!state) return;
    void navigate({ to: state.clubId ? "/historia" : "/cantera" });
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <img
        src={cover}
        alt="Futbolista en la penumbra de un estadio"
        width={1024}
        height={1536}
        className="absolute inset-0 h-full w-full object-cover opacity-70"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/70 to-background" />

      <div className="relative mx-auto flex min-h-screen max-w-md flex-col justify-between px-6 py-12 safe-top">
        <div>
          <p className="text-kicker">Simulador narrativo de carrera</p>
          <h1 className="mt-3 font-display text-6xl leading-[0.88] tracking-tight">
            BEYOND
            <br />
            <span className="gold-text">90</span>
          </h1>
          <p className="mt-4 max-w-[16rem] font-cond text-base uppercase tracking-[0.2em] text-foreground/80">
            Tu historia. Más allá del 90.
          </p>
        </div>

        <div className="space-y-3">
          {state && (
            <div className="panel px-4 py-3">
              <p className="text-kicker">Partida guardada</p>
              <p className="mt-1 truncate font-display text-lg">
                {state.player.nickname || state.player.name}
              </p>
              <p className="font-cond text-sm uppercase tracking-[0.14em] text-muted-foreground">
                {state.age} años · {state.clubId ? clubById(state.clubId).short : "sin club"} ·{" "}
                {seasonLabel(state.seasonIndex)} · media {state.overall}
              </p>
            </div>
          )}

          <button
            onClick={onContinue}
            disabled={!ready || !state}
            className="w-full rounded-xl border border-gold/40 bg-surface/80 px-5 py-4 font-cond text-lg font-semibold uppercase tracking-[0.18em] text-gold backdrop-blur transition-colors disabled:opacity-35"
          >
            Continuar
          </button>

          <button
            onClick={onNew}
            className="gold-fill w-full rounded-xl px-5 py-4 font-cond text-lg font-bold uppercase tracking-[0.18em] shadow-[var(--shadow-gold)] transition-transform active:scale-[0.98]"
          >
            {confirming ? "¿Seguro? Borrar y empezar" : "Nueva carrera"}
          </button>

          {confirming && (
            <button
              onClick={() => setConfirming(false)}
              className="w-full py-2 font-cond text-sm uppercase tracking-[0.16em] text-muted-foreground"
            >
              Cancelar
            </button>
          )}

          <p className="pt-2 text-center font-cond text-xs uppercase tracking-[0.2em] text-muted-foreground">
            16 años · cantera · filial · primer equipo
          </p>
        </div>
      </div>
    </div>
  );
}
