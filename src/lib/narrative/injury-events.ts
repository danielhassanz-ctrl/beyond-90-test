/**
 * Escenas con el fisioterapeuta durante una lesión: la baja deja de ser un
 * contador mudo. Una lesión larga dura como mucho 3 meses (turnos de
 * calendario) y en ese tiempo hay hasta 3 escenas: el plan del fisio, un
 * punto medio donde la cosa se complica o va mejor de lo previsto, y la
 * prueba de esfuerzo final. Lo que decides acorta la baja o te cuesta forma y ánimo (nunca la alarga)
 * (cambian los turnos que quedan). Todo en código: cero llamadas a la IA.
 */
import type { Consequences, EventOption, GameEvent } from "@/types/career";
import type { Player } from "@/types/player";
import { getInjuryRemaining } from "@/lib/narrative/career-dynamics";
import { getNpcName } from "@/lib/narrative/npcs";

/** Duración máxima de cualquier lesión larga, en turnos (meses). */
export const INJURY_MAX_MONTHS = 3;

function injuryFlagKey(flags: Record<string, string | boolean> | null | undefined): string | null {
  return Object.keys(flags ?? {}).find((k) => k.startsWith("injury_duration_")) ?? null;
}

/** Escenas con el fisio ya vividas en esta lesión. */
function shownScenes(player: Player): number {
  return parseInt(String(player.flags?.physio_stage ?? "0"), 10) || 0;
}

/**
 * Cuántas escenas deberían haberse vivido ya según los meses que quedan:
 * 3 meses restantes → 1 (el plan), 2 → 2 (punto medio), 1 → 3 (el alta).
 */
function scenesTarget(remaining: number): number {
  return Math.min(3, Math.max(1, INJURY_MAX_MONTHS - remaining + 1));
}

export function shouldTriggerPhysioScene(player: Player): boolean {
  const remaining = getInjuryRemaining(player.flags);
  if (remaining <= 0) return false;
  return shownScenes(player) < scenesTarget(remaining);
}

export function buildPhysioEvent(player: Player): GameEvent {
  const remaining = getInjuryRemaining(player.flags);
  const key = injuryFlagKey(player.flags) ?? "injury_duration_physio";
  const shown = shownScenes(player);
  const fisio = getNpcName(player, "fisio");
  const diligent = player.flags?.physio_diligent === "1";

  /** Flags para fijar los meses que quedan (mín. 1, máx. 3) y contar la escena como vista. */
  const setLeft = (n: number, extra: Record<string, string | boolean> = {}): Consequences["flags"] => ({
    [key]: String(Math.max(1, Math.min(INJURY_MAX_MONTHS, n))),
    physio_stage: String(shown + 1),
    ...extra,
  });
  const keep = (extra: Record<string, string | boolean> = {}) => setLeft(remaining, extra);

  const stage = Math.min(2, shown);
  let title: string;
  let description: string;
  let options: EventOption[];

  if (stage === 0) {
    title = `${fisio} te presenta el plan de recuperación`;
    description = `${fisio}, el fisio del club, te sienta en la camilla con un calendario impreso: ${remaining} ${remaining === 1 ? "mes" : "meses"} por delante, sesiones diarias y un último día marcado en rojo. "Esto depende de ti tanto como de mí", te dice sin sonreír.`;
    options = [
      {
        id: "a",
        label: "Seguir el protocolo al pie de la letra",
        subtitle: "Sin atajos, con paciencia",
        consequences: { moral: 2, forma: 1, flags: keep({ physio_diligent: "1" }) },
        outcomeText: `${fisio} asiente y tacha el primer día del calendario. "Con esa cabeza, vamos bien."`,
      },
      {
        id: "b",
        label: "Pedirle acelerar con un tratamiento intensivo",
        subtitle: "Arriesgar para volver antes",
        consequences: {},
        resolve: {
          baseChance: 0.5,
          statModifier: "forma",
          success: {
            text: `El cuerpo responde mejor de lo previsto. ${fisio} cambia el calendario: ganas casi un mes.`,
            consequences: { moral: 3, flags: setLeft(remaining - 1, { physio_diligent: "0" }) },
          },
          fail: {
            text: `Tras dos sesiones duras aparece una molestia nueva. ${fisio} frena en seco: "Te lo dije. A mi ritmo."`,
            consequences: { moral: -4, forma: -2, flags: keep({ physio_diligent: "0" }) },
          },
        },
      },
      {
        id: "c",
        label: "Tomártelo con calma, sin forzar nada",
        subtitle: "Cuidar la cabeza también",
        consequences: { moral: 3, flags: keep({ physio_diligent: "1" }) },
        outcomeText: `${fisio} te deja descansar la tarde entera. "A veces, lo mejor es no hacer nada bien hecho."`,
      },
    ];
  } else if (stage === 1) {
    const complication = Math.random() < (diligent ? 0.25 : 0.55);
    if (complication) {
      title = "La rehabilitación se complica";
      description = `A mitad de recuperación, el músculo se carga tras una sesión normal y la zona se te hincha por la noche. ${fisio} te mira la pierna en silencio un buen rato: "Esto no estaba en el plan."`;
      options = [
        {
          id: "a",
          label: "Parar dos semanas y dejar que el fisio mande",
          subtitle: "Prudencia ante todo",
          consequences: { moral: -2, flags: keep() },
          outcomeText: `${fisio} te quita las cargas y te pone a trabajar solo el equilibrio. Duele en el orgullo, pero la hinchazón baja en una semana.`,
        },
        {
          id: "b",
          label: "Insistir: seguir con las cargas por tu cuenta",
          subtitle: "No perder el ritmo",
          consequences: {},
          resolve: {
            baseChance: 0.4,
            statModifier: "forma",
            success: {
              text: "Aguantas y la molestia desaparece. No se lo cuentas a nadie, y el fisio finge no darse cuenta.",
              consequences: { moral: 3, flags: keep() },
            },
            fail: {
              text: `Empeora. ${fisio} te lo echa en cara con la mirada y te devuelve a un tratamiento más suave: pierdes semanas de trabajo y todo el margen que habías ganado, aunque el alta sigue en su fecha.`,
              consequences: { moral: -6, forma: -6, flags: keep({ physio_diligent: "0" }) },
            },
          },
        },
        {
          id: "c",
          label: "Pedir una segunda opinión a un especialista",
          subtitle: "Pagarlo de tu bolsillo",
          consequences: { patrimonio: -2500, moral: 2, flags: keep({ physio_diligent: "1" }) },
          outcomeText: "El especialista confirma el plan y ajusta una pauta. Te vas con menos miedo y 2.500 € menos.",
        },
      ];
    } else {
      title = "Vas por delante del plan";
      description = `${fisio} revisa los números de la semana y levanta la vista, medio sorprendido: tu pierna responde mejor de lo que esperaba. "Si sigues así, tendremos que mover la fecha del alta."`;
      options = [
        {
          id: "a",
          label: "Pedirle adelantar el alta",
          subtitle: "Aprovechar el buen momento",
          consequences: {},
          resolve: {
            baseChance: 0.55,
            statModifier: "forma",
            success: {
              text: `${fisio} lo medita y te da el visto bueno: pasas a la fase de campo. Casi un mes menos de baja.`,
              consequences: { moral: 4, flags: setLeft(remaining - 1) },
            },
            fail: {
              text: "La prueba de campo sale peor de lo que esperabas. Te toca esperar al calendario original, sin más.",
              consequences: { moral: -2, flags: keep() },
            },
          },
        },
        {
          id: "b",
          label: "Mantener el calendario, sin arriesgar",
          subtitle: "Volver al cien por cien",
          consequences: { moral: 3, forma: 2, flags: keep({ physio_diligent: "1" }) },
          outcomeText: `${fisio} sonríe por primera vez en semanas. "Eso es madurez."`,
        },
        {
          id: "c",
          label: "Volver a tocar balón con el grupo (sin contacto)",
          subtitle: "Un empujón de moral",
          consequences: { moral: 5, rel_vestuario: 3, flags: keep() },
          outcomeText: "El primer pase con tus compañeros, aunque sea suave, te devuelve una sensación que ya habías olvidado.",
        },
      ];
    }
  } else {
    title = "La prueba de esfuerzo: ¿alta médica?";
    description = `Último día marcado en rojo. ${fisio} te prepara la prueba final: saltos, cambios de ritmo, cargas completas. Medio equipo mira por la ventana del gimnasio. Todo depende de cómo salga hoy.`;
    options = [
      {
        id: "a",
        label: "Pedir el alta hoy mismo",
        subtitle: "Estás listo, lo sientes",
        consequences: {},
        resolve: {
          baseChance: diligent ? 0.7 : 0.5,
          statModifier: "forma",
          success: {
            text: `${fisio} cierra el informe y firma el alta. "Ve a por ello, campeón." El gimnasio te aplaude.`,
            consequences: { moral: 8, forma: 3, rel_vestuario: 3, flags: setLeft(1) },
          },
          fail: {
            text: `Un cambio de dirección te devuelve la molestia. ${fisio} niega con la cabeza: te da el alta con cautela, pero una semana más sin contacto, sin discusión.`,
            consequences: { moral: -3, forma: -3, flags: setLeft(1, { physio_stage: "3" }) },
          },
        },
      },
      {
        id: "b",
        label: "Esperar unos días más por seguridad",
        subtitle: "Cero riesgos",
        consequences: { moral: 1, forma: 3, rel_entrenador: 1, flags: keep() },
        outcomeText: `${fisio} lo respeta: "Nadie ha perdido una temporada por esperar tres días de más."`,
      },
      {
        id: "c",
        label: "Preguntar al míster si te quiere ya en la convocatoria",
        subtitle: "Que decida el club",
        consequences: { rel_entrenador: 3, moral: 2, flags: keep() },
        outcomeText: "El míster llega, mira la prueba desde la puerta y asiente: \"Cuando tú digas, aquí te esperamos.\"",
      },
    ];
  }

  return {
    id: `fisio-${stage}-${Date.now()}`,
    category: "vida",
    title,
    description,
    options,
  };
}
