import type { CareerMode, GameEvent, PlayerStatus, SecondCareerRole } from "./career";

export interface Player {
  id: string;
  user_id: string;
  last_name: string;
  number: number;
  foot: string;
  nation: string;
  position: string;
  personality: string;
  photo_url: string | null;
  club: string;
  created_at: string;
  mode: CareerMode;
  week: number;
  status: PlayerStatus;
  liga: string | null;
  forma: number;
  moral: number;
  fama: number;
  media: number;
  patrimonio: number;
  rel_entrenador: number;
  rel_vestuario: number;
  rel_aficion: number;
  rel_representante: number;
  second_career: SecondCareerRole | null;
  second_week: number;
  second_club: string | null;
  reputacion: number;
  pending_event: GameEvent | null;
  current_photo_url: string | null;
  agent_name: string | null;
  flags: Record<string, string | boolean>;

  // Estadísticas de carrera (career stats)
  stats_matches_played?: number; // Total partidos jugados
  stats_goals?: number; // Total goles marcados
  stats_assists?: number; // Total asistencias
  stats_minutes_played?: number; // Total minutos
  stats_red_cards?: number; // Tarjetas rojas
  stats_yellow_cards?: number; // Tarjetas amarillas
  stats_titles?: number; // Títulos ganados (Liga, Copa, Champions)
  stats_clean_sheets?: number; // Solo porterías (para porteros)
}
