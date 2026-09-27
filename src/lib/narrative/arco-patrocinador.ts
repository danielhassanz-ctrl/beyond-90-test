import type { GameEvent } from "@/types/career";
import { MODE_TARGET_WEEKS } from "@/types/career";
import type { Player } from "@/types/player";
import { NO_CLUB_YET } from "@/lib/constants";

/**
 * Arco narrativo: un patrocinador pequeño que va escalando de compromiso
 * contigo hasta que estalla un escándalo y tienes que decidir si le
 * proteges o le das la espalda en público. Patrón real de marketing
 * deportivo — la marca modesta que "crece contigo" y el riesgo
 * reputacional que trae ir de la mano de una empresa que no controlas.
 *
 * La marca es deliberadamente FICTICIA (a diferencia de sponsorships.ts,
 * que sí usa marcas reales para acuerdos normales de patrocinio): aquí
 * la marca protagoniza un escándalo inventado, y eso nunca se hace sobre
 * una empresa real, igual que un famoso que aparece en el juego nunca es
 * una persona real reconocible.
 *
 * 4 capítulos:
 *   0. Firmas con una marca pequeña, acuerdo modesto.
 *   1. La marca, tras ir bien, pide mucha más presencia tuya.
 *   2. Estalla un escándalo de la marca con tu cara en sus campañas.
 *   3. Cierre: romper en público o defenderla — cada uno con su precio.
 */

const FASE_MAX = 4;
const MARCAS = ["Rayztek", "Núcleo Sport", "Kaelo", "Vantia", "Orbex", "Fuerian"];

function getFase(player: Player): number {
  return Number(player.flags?.arco_patrocinador_fase ?? 0);
}

function getMarca(player: Player): string {
  const stored = player.flags?.arco_patrocinador_marca;
  if (typeof stored === "string" && stored) return stored;
  const idx = player.id.length % MARCAS.length;
  return MARCAS[idx];
}

function targetWeek(player: Player, fraction: number): number {
  return Math.round(MODE_TARGET_WEEKS[player.mode] * fraction);
}

export function shouldTriggerArcoPatrocinador(player: Player): boolean {
  if (player.club === NO_CLUB_YET) return false;
  // Igual que los otros arcos: en modo Express (20 semanas) no da tiempo
  // real a las 4 fases.
  if (player.mode === "express") return false;
  const fase = getFase(player);
  if (fase >= FASE_MAX) return false;

  const umbrales = [0.15, 0.4, 0.62, 0.8];
  if (player.week < targetWeek(player, umbrales[fase])) return false;

  const lastWeek = Number(player.flags?.arco_patrocinador_last_week ?? 0);
  const minGap = Math.max(4, Math.round(MODE_TARGET_WEEKS[player.mode] * 0.14));
  if (lastWeek > 0 && player.week - lastWeek < minGap) return false;

  if (fase === 0 && (player.fama ?? 0) < 10) return false;

  const chance = [0.14, 0.15, 0.15, 0.13][fase];
  return Math.random() < chance;
}

export function buildArcoPatrocinadorEvent(player: Player): GameEvent {
  const fase = getFase(player);
  const week = player.week;
  const marca = getMarca(player);
  const flags = { arco_patrocinador_fase: String(fase + 1), arco_patrocinador_last_week: String(week), arco_patrocinador_marca: marca };

  if (fase === 0) {
    return {
      id: `arco-patrocinador-1-${week}`,
      category: "representante",
      title: "Firmas con una marca que empieza a crecer",
      description: `${marca}, una marca deportiva pequeña pero con ambición, te ofrece un acuerdo modesto: ropa, algo de dinero y la promesa de "crecer juntos". No es nada espectacular, pero es tuyo.`,
      options: [
        { id: "0", label: "Firmar el acuerdo", subtitle: "Empezar la relación", consequences: { patrimonio: 3000, fama: 1, flags } },
        { id: "1", label: "Pedir que tu representante lo revise antes", subtitle: "Prudencia", consequences: { rel_representante: 2, flags } },
        {
          id: "2",
          label: "Rechazarlo, prefieres esperar algo mejor",
          subtitle: "No tener prisa",
          // No avanza de fase (puede volver a salir otra marca más
          // adelante), pero sí anota la semana para no repetir la misma
          // oferta la semana siguiente.
          consequences: { flags: { arco_patrocinador_last_week: String(week) } },
        },
      ],
    };
  }

  if (fase === 1) {
    return {
      id: `arco-patrocinador-2-${week}`,
      category: "representante",
      title: `${marca} quiere mucha más presencia tuya`,
      description: `Tras un año yendo bien para los dos, ${marca} pide subir de nivel: más apariciones, tu cara en la campaña principal y una cláusula de exclusividad bastante agresiva.`,
      options: [
        { id: "0", label: "Aceptar y volcarte en la campaña", subtitle: "Apostar fuerte por la marca", consequences: { patrimonio: 8000, fama: 3, forma: -1, flags } },
        { id: "1", label: "Negociar algo intermedio", subtitle: "Comprometerte solo hasta cierto punto", consequences: { patrimonio: 4000, rel_representante: 2, flags } },
        { id: "2", label: "Frenar el crecimiento del acuerdo", subtitle: "Mantener las distancias", consequences: { patrimonio: 1000, flags } },
      ],
    };
  }

  if (fase === 2) {
    return {
      id: `arco-patrocinador-3-${week}`,
      category: "prensa",
      title: `Estalla un escándalo de ${marca}`,
      description: `Una investigación periodística destapa irregularidades graves en ${marca}: proveedores en condiciones muy dudosas y cuentas que no cuadran. Tu cara lleva meses en todas sus vallas publicitarias.`,
      options: [
        { id: "0", label: "Pedir explicaciones directas a la marca", subtitle: "Antes de decidir nada", consequences: { moral: -1, flags } },
        { id: "1", label: "Guardar silencio de momento", subtitle: "Esperar a tener más información", consequences: { reputacion: -1, flags } },
        { id: "2", label: "Comentarlo con tu representante esa misma noche", subtitle: "Prepararte para lo que venga", consequences: { rel_representante: 2, flags } },
      ],
    };
  }

  // Fase 3: cierre — romper públicamente o defenderla, cada uno con precio.
  return {
    id: `arco-patrocinador-4-${week}`,
    category: "prensa",
    title: "Romper o defender",
    description: `La presión mediática no baja: todo el mundo espera que digas algo sobre ${marca}. Sea lo que decidas, va a quedar asociado a tu nombre durante mucho tiempo.`,
    options: [
      {
        id: "0",
        label: "Romper el contrato en público",
        subtitle: "Poner tu reputación por delante",
        consequences: {},
        resolve: {
          baseChance: 0.6,
          success: { text: `Tu comunicado se recibe como un gesto valiente y coherente. La prensa destaca que fuiste de los primeros en cortar con ${marca}.`, consequences: { reputacion: 5, fama: 3, patrimonio: -6000, flags } },
          fail: { text: `${marca} responde con una demanda por incumplimiento. Ganas reputación, pero el proceso te cuesta bastante más de lo que esperabas.`, consequences: { reputacion: 3, patrimonio: -15000, moral: -2, flags } },
        },
      },
      {
        id: "1",
        label: "Defenderla públicamente",
        subtitle: "Confiar en que se aclarará",
        consequences: {},
        resolve: {
          baseChance: 0.4,
          success: { text: "Con el tiempo se demuestra que la marca ha limpiado la situación y tu lealtad se valora como algo raro de ver.", consequences: { reputacion: 3, patrimonio: 4000, flags } },
          fail: { text: "El escándalo crece y tu nombre queda asociado a él durante meses. Tu representante no deja de repetir que te lo avisó.", consequences: { reputacion: -6, fama: 2, rel_representante: -2, flags } },
        },
      },
      { id: "2", label: "No pronunciarte y dejar que se apague solo", subtitle: "El silencio como estrategia", consequences: { reputacion: -2, flags } },
    ],
  };
}
