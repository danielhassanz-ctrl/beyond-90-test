import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUserAndPlayer } from "@/lib/player";
import { LifeThreads } from "@/components/LifeThreads";
import { BottomNav } from "@/components/BottomNav";
import { getNpcName, describeRelationshipLevel, type NpcRole } from "@/lib/narrative/npcs";
import { getCachedNpcFace } from "@/lib/images/npcFaces";
import { LifeCircle, type LifeMember } from "@/components/LifeCircle";
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

  const pareja = typeof player.flags?.pareja === "string" && player.flags.pareja ? player.flags.pareja : null;

  // Sin club todavía no existe entrenador, capitán, rival por el puesto
  // ni fisio — son roles de la plantilla de un club real. El entorno tiene
  // que ir apareciendo según avanza la carrera, no todo de golpe.
  const hasClub = player.club !== NO_CLUB_YET;

  const face = (role: NpcRole) => getCachedNpcFace(player, role);
  const parejaName = pareja ? (pareja === "Lucía" ? getNpcName(player, "pareja") : pareja) : null;

  const familia: LifeMember[] = [
    { key: "madre", name: getNpcName(player, "madre"), label: "Tu madre", detail: "Te llama los domingos, tengas o no noticias.", face: face("madre") },
    { key: "padre", name: getNpcName(player, "padre"), label: "Tu padre", detail: "Opina de fútbol más de lo que debería.", face: face("padre") },
    { key: "hermano", name: getNpcName(player, "hermano"), label: "Tu hermano pequeño", detail: "Quiere ser como tú (y ganarte a la consola)." },
    ...(parejaName
      ? [
          {
            key: "pareja",
            name: parejaName,
            label: player.flags?.convivencia ? "Tu pareja · vivís juntos" : "Tu pareja",
            detail: "Lo que hay fuera del campo cuando el campo se acaba.",
            face: face("pareja"),
          },
        ]
      : []),
  ];

  const amigos: LifeMember[] = [
    { key: "amigo", name: getNpcName(player, "amigo"), label: "Amigo de la infancia", detail: "El de siempre: te conoció antes de ser futbolista." },
    ...(hasClub
      ? [
          { key: "capitan", name: getNpcName(player, "capitan"), label: "Capitán", detail: describeRelationshipLevel(player.rel_vestuario), value: player.rel_vestuario, face: face("capitan") },
          { key: "rival", name: getNpcName(player, "rival_puesto"), label: "Competencia por el puesto", detail: "Compite contigo por los mismos minutos." },
          { key: "utillero", name: getNpcName(player, "utillero"), label: "Utillero", detail: "Lo ha visto todo en este club, y no cuenta ni la mitad." },
        ]
      : []),
  ];

  const club: LifeMember[] = [
    ...(hasClub
      ? [
          { key: "entrenador", name: getNpcName(player, "entrenador"), label: "Entrenador", detail: describeRelationshipLevel(player.rel_entrenador), value: player.rel_entrenador, face: face("entrenador") },
          { key: "fisio", name: getNpcName(player, "fisio"), label: "Fisioterapeuta", detail: "Cuida de ti cada semana, gane o pierda el equipo." },
          { key: "director", name: getNpcName(player, "director_deportivo"), label: "Director deportivo", detail: "Manda en los fichajes y en las renovaciones." },
          { key: "presidente", name: getNpcName(player, "presidente"), label: "Presidente", detail: "Firma los contratos y da la cara ante la afición." },
        ]
      : []),
    ...(player.agent_name
      ? [{ key: "agente", name: player.agent_name, label: "Representante", detail: describeRelationshipLevel(player.rel_representante), value: player.rel_representante, face: face("agente") }]
      : []),
    { key: "prensa", name: getNpcName(player, "prensa"), label: "Prensa", detail: hasClub ? "Sigue tu carrera de cerca para su medio." : "Vigila a los agentes libres con proyección." },
  ];

  return (
    <main className="flex flex-1 flex-col items-center gap-5 p-6 pb-24">
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

      <LifeCircle icon="🏠" title="Familia" subtitle="Los que estaban antes de la fama" members={familia} defaultOpen />
      <LifeCircle icon="🤝" title="Amigos y compañeros" subtitle="Vestuario, barrio y quien te disputa el puesto" members={amigos} />
      <LifeCircle icon="🏟️" title="Club y cuerpo técnico" subtitle="Míster, médicos, directivos y tu representante" members={club} />

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
      </div>

      <BottomNav active="vida" />
    </main>
  );
}
