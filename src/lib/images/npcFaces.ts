import type { SupabaseClient } from "@supabase/supabase-js";
import type { Player } from "@/types/player";
import type { NpcRole } from "@/lib/narrative/npcs";
import { generateNpcFace } from "@/lib/images/replicate";
import { uploadGeneratedImage } from "@/lib/images/upload";

/**
 * Roles del reparto fijo a los que se les pone cara — pedido explícito:
 * "poner cara a cada personaje... entrenador, padre, agente, etc, y
 * mantener dicha cara durante el juego". Solo los roles con vínculo
 * emocional real (decisión del usuario tras ver el coste de cubrir los 17
 * roles): fisio, utillero, presidente, cuñado... no llevan cara, el
 * jugador apenas los recuerda y no aportarían nada por el coste.
 */
export const NPC_FACE_ROLES: NpcRole[] = ["entrenador", "capitan", "agente", "madre", "padre", "pareja"];

/** Roles cuya cara cambia si cambias de club (coincide con CLUB_BOUND en npcs.ts). */
const CLUB_BOUND_FACE_ROLES = new Set<NpcRole>(["entrenador", "capitan"]);

function slugifyClub(club: string): string {
  return club
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/** Clave del flag donde se cachea la URL de la cara de este rol para este jugador. */
function faceFlagKey(role: NpcRole, player: Pick<Player, "club">): string {
  if (CLUB_BOUND_FACE_ROLES.has(role)) return `npc_face_${role}_${slugifyClub(player.club)}`;
  return `npc_face_${role}`;
}

function mix(value: string): number {
  let h = 2166136261;
  for (let i = 0; i < value.length; i++) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  h ^= h >>> 16;
  h = Math.imul(h, 2246822507);
  h ^= h >>> 13;
  h = Math.imul(h, 3266489909);
  h ^= h >>> 16;
  return h >>> 0;
}

function pick<T>(seed: string, pool: readonly T[]): T {
  return pool[mix(seed) % pool.length];
}

/**
 * Variación de rasgos por semilla dentro de cada rol, para que no todos
 * los entrenadores del juego tengan la misma cara por defecto. Genérico a
 * propósito (nada de rasgos de nadie real): edad, complexión y estilo,
 * nunca un nombre ni una referencia.
 */
const AGE_RANGES_VETERAN = ["mid-50s", "early 60s", "late 40s"];
const AGE_RANGES_PLAYER = ["mid-20s", "late 20s", "early 30s"];
const AGE_RANGES_PARENT = ["early 50s", "late 50s", "early 60s"];
const BUILDS = ["athletic build", "stocky build", "lean build"];
const HAIR = ["short dark hair", "greying hair", "shaved head", "short hair with some grey"];
const EXPRESSIONS = ["focused expression", "warm but serious expression", "calm confident expression"];

function buildFacePrompt(role: NpcRole, seed: string): string {
  const build = pick(seed + ":build", BUILDS);
  const hair = pick(seed + ":hair", HAIR);
  const expr = pick(seed + ":expr", EXPRESSIONS);
  const base = "Photorealistic portrait photo, headshot, natural light, plain neutral background, not a real identifiable person";

  switch (role) {
    case "entrenador": {
      const age = pick(seed + ":age", AGE_RANGES_VETERAN);
      return `${base}. A football head coach in his ${age}, ${build}, ${hair}, ${expr}, wearing a plain tracksuit with no visible club crest or sponsor logos.`;
    }
    case "capitan": {
      const age = pick(seed + ":age", AGE_RANGES_PLAYER);
      return `${base}. A football team captain in his ${age}, ${build}, ${hair}, confident expression, wearing a plain training shirt with no visible club crest or sponsor logos.`;
    }
    case "agente": {
      const age = pick(seed + ":age", AGE_RANGES_PARENT);
      return `${base}. A sports agent in his ${age}, ${build}, ${hair}, sharp professional expression, wearing a business suit.`;
    }
    case "madre": {
      const age = pick(seed + ":age", AGE_RANGES_PARENT);
      const hairF = pick(seed + ":hairf", ["shoulder-length dark hair", "short greying hair", "long hair tied back"]);
      return `${base}. A Spanish woman in her ${age}, warm gentle smile, ${hairF}, wearing casual everyday clothing.`;
    }
    case "padre": {
      const age = pick(seed + ":age", AGE_RANGES_PARENT);
      return `${base}. A Spanish man in his ${age}, ${build}, ${hair}, warm proud expression, wearing casual everyday clothing.`;
    }
    case "pareja": {
      const age = pick(seed + ":age", AGE_RANGES_PLAYER);
      const hairF = pick(seed + ":hairf", ["long dark hair", "short bob haircut", "wavy shoulder-length hair"]);
      return `${base}. A young woman in her ${age}, warm genuine smile, ${hairF}, wearing casual stylish clothing.`;
    }
    default:
      return `${base}. A person in their 40s, ${build}, ${expr}, wearing casual clothing.`;
  }
}

/**
 * Devuelve la URL de la cara de este personaje para este jugador,
 * generándola (y guardándola) la primera vez que se pide. Todas las
 * llamadas siguientes para el mismo jugador+rol (mismo club, si el rol es
 * de los que cambian al fichar) devuelven la misma URL cacheada — cero
 * llamadas nuevas a la API a partir de la primera vez que ese personaje
 * aparece.
 */
export async function getOrCreateNpcFace(
  supabase: SupabaseClient,
  player: Pick<Player, "id" | "club" | "flags">,
  role: NpcRole,
  userId: string,
): Promise<string | null> {
  const flagKey = faceFlagKey(role, player);
  const cached = player.flags?.[flagKey];
  if (typeof cached === "string" && cached) return cached;

  const seed = CLUB_BOUND_FACE_ROLES.has(role) ? `${player.id}:${role}:${player.club}` : `${player.id}:${role}`;
  const prompt = buildFacePrompt(role, seed);

  const buffer = await generateNpcFace(prompt);
  if (!buffer) return null;

  // La política de seguridad del bucket exige el id de AUTENTICACIÓN
  // (auth.uid(), igual que hace el resto del pipeline de imágenes en
  // carrera/actions.ts), no el id de la fila de `players` — son valores
  // distintos. Usar player.id aquí rompía la subida con "row-level
  // security policy", encontrado jugando una partida real en local.
  const url = await uploadGeneratedImage(supabase, userId, buffer, `npcface-${role}`);
  if (!url) return null;

  try {
    const flags = { ...(player.flags ?? {}), [flagKey]: url };
    await supabase.from("players").update({ flags }).eq("id", player.id);
    player.flags = flags;
  } catch (err) {
    console.error("[getOrCreateNpcFace] no se pudo cachear la cara:", err instanceof Error ? err.message : err);
  }

  return url;
}
