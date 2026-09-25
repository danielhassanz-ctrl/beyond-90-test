import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUserAndPlayer } from "@/lib/player";
import { LifeThreads } from "@/components/LifeThreads";
import { BottomNav } from "@/components/BottomNav";
import { getNpcName, describeRelationshipLevel, NPC_ROLE_LABELS } from "@/lib/narrative/npcs";
import { NO_CLUB_YET } from "@/lib/constants";

function Stat({ label, value }: { label: string; value: number }) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div className="min-w-0">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-kicker truncate">{label}</span>
        <span className="font-num text-sm font-semibold text-foreground/90">{value}</span>
      </div>
      <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-surface-2">
        <div className="pitch-fill h-full rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default async function VidaPage() {
  const { user, player } = await getCurrentUserAndPlayer();

  if (!user) {
    redirect("/login");
  }

  if (!player) {
    redirect("/crear-jugador");
  }

  const pareja = typeof player.flags?.pareja === "string" ? player.flags.pareja : null;

  // Sin club todavía no existe entrenador, capitán, rival por el puesto
  // ni fisio — son roles de la plantilla de un club real, no genéricos
  // del jugador. Antes salían igual desde el segundo 1 de crear el
  // jugador (deterministas por player.id, sin depender de nada) — un
  // "3 patas" recién creado, sin equipo, ya tenía opinión de un
  // entrenador que nunca había conocido. Visto en vivo jugando: el
  // entorno tiene que ir apareciendo según avanza la carrera, no todo de
  // golpe desde el principio.
  const hasClub = player.club !== NO_CLUB_YET;

  // Cada personaje del entorno se ata a la relación numérica más
  // parecida que ya llevamos: el entrenador a rel_entrenador, el capitán
  // y la competencia por el puesto (compañeros de vestuario) a
  // rel_vestuario. Fisio y prensa no tienen un número propio en el
  // juego — se muestran con un tono neutro fijo, igual que hacía el
  // prototipo de referencia con los roles que tampoco rastreaba.
  const entorno = [
    ...(hasClub
      ? [
          {
            role: "entrenador" as const,
            name: getNpcName(player, "entrenador"),
            detail: describeRelationshipLevel(player.rel_entrenador),
          },
          {
            role: "capitan" as const,
            name: getNpcName(player, "capitan"),
            detail: describeRelationshipLevel(player.rel_vestuario),
          },
          {
            role: "rival_puesto" as const,
            name: getNpcName(player, "rival_puesto"),
            detail: "Compite contigo por los mismos minutos.",
          },
          {
            role: "fisio" as const,
            name: getNpcName(player, "fisio"),
            detail: "Cuida de ti cada semana, gane o pierda el equipo.",
          },
          {
            role: "director_deportivo" as const,
            name: getNpcName(player, "director_deportivo"),
            detail: "Manda en los fichajes y en las renovaciones.",
          },
          {
            role: "presidente" as const,
            name: getNpcName(player, "presidente"),
            detail: "Firma los contratos y da la cara ante la afición.",
          },
          {
            role: "utillero" as const,
            name: getNpcName(player, "utillero"),
            detail: "Lo ha visto todo en este club, y no cuenta ni la mitad.",
          },
        ]
      : []),
    {
      role: "prensa" as const,
      name: getNpcName(player, "prensa"),
      detail: hasClub ? "Sigue tu carrera de cerca para su medio." : "Vigila a los agentes libres con proyección.",
    },
    { role: "madre" as const, name: getNpcName(player, "madre"), detail: "Te llama los domingos, tengas o no noticias." },
    { role: "padre" as const, name: getNpcName(player, "padre"), detail: "Opina de fútbol más de lo que debería." },
    { role: "hermano" as const, name: getNpcName(player, "hermano"), detail: "Quiere ser como tú (y ganarte a la consola)." },
    { role: "amigo" as const, name: getNpcName(player, "amigo"), detail: "El de siempre: te conoció antes de ser futbolista." },
    ...(typeof player.flags?.pareja === "string" && player.flags.pareja
      ? [
          {
            role: "pareja" as const,
            name: player.flags.pareja === "Lucía" ? getNpcName(player, "pareja") : (player.flags.pareja as string),
            detail: "Lo que hay fuera del campo cuando el campo se acaba.",
          },
        ]
      : []),
    ...(player.agent_name
      ? [
          {
            role: "representante" as const,
            name: player.agent_name,
            detail: describeRelationshipLevel(player.rel_representante),
          },
        ]
      : []),
  ];

  return (
    <main className="flex flex-1 flex-col items-center gap-6 p-6 pb-24">
      <div className="w-full max-w-md space-y-1">
        <Link href="/mi-jugador" className="font-cond text-xs uppercase tracking-wide text-muted-foreground hover:text-gold">
          ‹ Mi jugador
        </Link>
        <h1 className="font-display text-2xl">
          <span className="gold-text">Vida</span>
        </h1>
        <p className="text-sm text-muted-foreground">Tu estado personal y quién te rodea.</p>
      </div>

      <div className="grid w-full max-w-md grid-cols-3 gap-4 rounded-2xl border border-panel-border bg-surface p-4">
        <Stat label="Moral" value={player.moral} />
        <Stat label="Forma" value={player.forma} />
        <Stat label="Fama" value={player.fama} />
      </div>

      <div className="w-full max-w-md space-y-3 rounded-2xl border border-panel-border bg-surface p-4">
        <p className="text-kicker">Tu entorno</p>
        <div className="space-y-3">
          {entorno.map((npc) => (
            <div key={npc.role} className="flex items-start justify-between gap-3 border-b border-panel-border/60 pb-3 last:border-0 last:pb-0">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-foreground">{npc.name}</p>
                <p className="font-cond text-[10px] uppercase tracking-wide text-gold-soft">
                  {npc.role === "representante" ? "Representante" : NPC_ROLE_LABELS[npc.role]}
                </p>
              </div>
              <p className="max-w-[55%] shrink-0 text-right text-xs text-muted-foreground">{npc.detail}</p>
            </div>
          ))}
        </div>
      </div>

      {(hasClub || player.agent_name) && (
        <div className="grid w-full max-w-md grid-cols-2 gap-4 rounded-2xl border border-panel-border bg-surface p-4">
          {hasClub && (
            <>
              <Stat label="Entrenador" value={player.rel_entrenador} />
              <Stat label="Afición" value={player.rel_aficion} />
              <Stat label="Vestuario" value={player.rel_vestuario} />
            </>
          )}
          {player.agent_name && <Stat label="Representante" value={player.rel_representante} />}
        </div>
      )}

      <div className="w-full max-w-md">
        <LifeThreads flags={player.flags} />
        {pareja && (
          <p className="mt-2 text-center text-xs text-muted-foreground">Vida sentimental: en pareja con {pareja}.</p>
        )}
      </div>

      <BottomNav active="vida" />
    </main>
  );
}
