import type { SupabaseClient } from "@supabase/supabase-js";
import type { Player } from "@/types/player";
import { displayName } from "@/types/player";
import { playerAge } from "@/types/career";

/**
 * Tarjeta pública de comparación — pedido explícito tras una auditoría
 * real: el juego tenía contenido compartible (tarjetas de hito, resumen
 * de temporada) pero ningún bucle social que trajera gente nueva. Esto es
 * la pieza mínima: un enlace público con SOLO los campos pensados para
 * enseñarse (ver migración 20261001_add_errors_streak_sharing.sql) —
 * nunca la fila entera de `players`, que sigue siendo privada.
 */
function randomShareCode(): string {
  // 8 caracteres alfanuméricos en minúscula, suficiente para que no
  // choquen por casualidad sin que la URL se vuelva ilegible.
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let code = "";
  for (let i = 0; i < 8; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

/**
 * Crea (la primera vez) o actualiza (las siguientes) la tarjeta pública de
 * este jugador, y devuelve su código para construir el enlace de
 * compartir/comparar. Se llama bajo demanda (al pulsar "Comparar"), no en
 * cada turno — no hace falta que esté siempre al día al segundo.
 */
export async function ensurePublicCareerCard(
  supabase: SupabaseClient,
  player: Player,
  userId: string,
): Promise<string | null> {
  try {
    const { data: existing } = await supabase
      .from("public_career_cards")
      .select("share_code")
      .eq("player_id", player.id)
      .maybeSingle();

    const shareCode = (existing?.share_code as string | undefined) ?? randomShareCode();

    const row = {
      share_code: shareCode,
      player_id: player.id,
      user_id: userId,
      display_name: displayName(player),
      club: player.club,
      nation: player.nation,
      media: player.media,
      age: playerAge(player.week),
      stats_matches_played: player.stats_matches_played ?? 0,
      stats_goals: player.stats_goals ?? 0,
      stats_assists: player.stats_assists ?? 0,
      stats_titles: player.stats_titles ?? 0,
      photo_url: player.current_photo_url ?? player.photo_url,
      updated_at: new Date().toISOString(),
    };

    const { error } = existing
      ? await supabase.from("public_career_cards").update(row).eq("player_id", player.id)
      : await supabase.from("public_career_cards").insert(row);

    if (error) {
      console.error("[ensurePublicCareerCard] no se pudo guardar:", error.message);
      return existing?.share_code ?? null;
    }

    return shareCode;
  } catch (err) {
    console.error("[ensurePublicCareerCard] threw:", err instanceof Error ? err.message : err);
    return null;
  }
}

export interface PublicCareerCard {
  share_code: string;
  player_id: string;
  display_name: string;
  club: string;
  nation: string | null;
  media: number;
  age: number;
  stats_matches_played: number;
  stats_goals: number;
  stats_assists: number;
  stats_titles: number;
  photo_url: string | null;
}

export async function getPublicCareerCard(supabase: SupabaseClient, shareCode: string): Promise<PublicCareerCard | null> {
  const { data, error } = await supabase.from("public_career_cards").select("*").eq("share_code", shareCode).maybeSingle();
  if (error || !data) return null;
  return data as PublicCareerCard;
}
