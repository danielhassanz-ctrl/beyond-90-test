import { CLUB_POOL, clubInfoFor, defById, type ClubDef } from "./clubs";
import type { ClubInfo, Position, SceneKey, TraitId } from "./types";

import training from "@/assets/scene-training.jpg";
import locker from "@/assets/scene-locker.jpg";
import match from "@/assets/scene-match.jpg";
import agent from "@/assets/scene-agent.jpg";
import injury from "@/assets/scene-injury.jpg";
import family from "@/assets/scene-family.jpg";
import tunnel from "@/assets/scene-tunnel.jpg";

export const SCENES: Record<SceneKey, string> = {
  training,
  locker,
  match,
  agent,
  injury,
  family,
  tunnel,
};

export const POSITIONS: { id: Position; label: string; long: string }[] = [
  { id: "POR", label: "POR", long: "Portero" },
  { id: "DFC", label: "DFC", long: "Central" },
  { id: "LAT", label: "LAT", long: "Lateral" },
  { id: "MC", label: "MC", long: "Mediocentro" },
  { id: "MCO", label: "MCO", long: "Mediapunta" },
  { id: "EXT", label: "EXT", long: "Extremo" },
  { id: "DC", label: "DC", long: "Delantero" },
];

export const TRAITS: { id: TraitId; label: string; desc: string }[] = [
  { id: "ambicioso", label: "Ambicioso", desc: "Creces más rápido, pero la paciencia no es tu virtud." },
  { id: "leal", label: "Leal", desc: "La afición y el club te perdonan casi todo." },
  { id: "rebelde", label: "Rebelde", desc: "Carisma en la calle, dolor de cabeza en el despacho." },
  { id: "familiar", label: "Familiar", desc: "Tu casa te sostiene cuando todo se tuerce." },
  { id: "profesional", label: "Profesional", desc: "Menos lesiones, más confianza del cuerpo técnico." },
  { id: "carismatico", label: "Carismático", desc: "El vestuario y los focos te quieren." },
];

/** Compatibilidad: cuatro casas de referencia (las ofertas reales se generan). */
export const CLUBS: ClubInfo[] = ["betis", "villarreal", "sevilla", "malaga"]
  .map((id) => CLUB_POOL.find((c) => c.id === id))
  .filter((d): d is ClubDef => !!d)
  .map(clubInfoFor);

/** Definición completa del club (estadio, región, tier). */
export function clubDef(id: string): ClubDef {
  return defById(id) ?? CLUB_POOL.find((c) => c.id === "betis") ?? CLUB_POOL[0]!;
}

export function clubById(id: string): ClubInfo {
  return clubInfoFor(clubDef(id));
}

export const AGENT_NAMES = ["Nacho Arévalo", "Rubén Cifuentes", "Marta Ibarra"];


export const ACHIEVEMENTS: { id: string; name: string; desc: string }[] = [
  { id: "elige_cantera", name: "Primer paso", desc: "Elegir una cantera con 16 años." },
  { id: "primera_convocatoria", name: "En la lista", desc: "Entrar por primera vez en una convocatoria." },
  { id: "debut_juvenil", name: "Debut juvenil", desc: "Jugar tu primer partido oficial." },
  { id: "primer_gol", name: "El primero", desc: "Marcar (o dejar la puerta a cero) por primera vez." },
  { id: "titular_juvenil", name: "Fijo en el once", desc: "Ganarte la titularidad en el juvenil." },
  { id: "representante", name: "Con quien confiar", desc: "Firmar con un representante." },
  { id: "primer_contrato", name: "Tinta sobre papel", desc: "Firmar tu primer contrato profesional." },
  { id: "filial", name: "Un escalón más", desc: "Subir al filial." },
  { id: "entreno_mayores", name: "Entre los mayores", desc: "Entrenar con el primer equipo." },
  { id: "debut_pro", name: "Debut profesional", desc: "Debutar con el primer equipo." },
  { id: "media_70", name: "Media 70", desc: "Alcanzar una media de 70." },
  { id: "idolo", name: "Uno de los nuestros", desc: "Llegar a 80 de afición." },
  { id: "internacional", name: "Internacional", desc: "Ser convocado por tu selección." },
  { id: "superviviente", name: "Superviviente", desc: "Volver de una lesión larga." },
];
