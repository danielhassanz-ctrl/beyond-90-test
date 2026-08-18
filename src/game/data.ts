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

export const CLUBS: ClubInfo[] = [
  {
    id: "betis",
    name: "Real Betis",
    short: "Betis",
    city: "Sevilla",
    colors: "Verdiblanco",
    development: "Cantera con identidad: mucho balón, mucho trabajo técnico y entrenadores que apuestan por la casa.",
    competition: "Alta. Hay dos jugadores de tu edad muy valorados en tu puesto.",
    minutes: "Pocos al principio; si convences, el filial está cerca.",
    risk: "La presión del entorno es enorme: un mal mes se nota en la calle.",
    devBonus: 2,
    minutesBonus: -1,
    prestige: 4,
  },
  {
    id: "villarreal",
    name: "Villarreal CF",
    short: "Villarreal",
    city: "Vila-real",
    colors: "Amarillo",
    development: "Metodología de élite, plan individual, gimnasio y vídeo desde el primer día.",
    competition: "Media. Compites con chicos muy formados pero hay hueco.",
    minutes: "Progresivos y bien medidos. Nada regalado, nada quemado.",
    risk: "Ciudad pequeña y lejos de casa: la soledad pesa.",
    devBonus: 3,
    minutesBonus: 0,
    prestige: 4,
  },
  {
    id: "sevilla",
    name: "Sevilla FC",
    short: "Sevilla",
    city: "Sevilla",
    colors: "Blanquirrojo",
    development: "Exigencia máxima y ojo constante de la secretaría técnica.",
    competition: "Brutal. Fichan a los mejores de cada provincia cada verano.",
    minutes: "Escasos hasta que demuestres estar por encima.",
    risk: "Si no explotas rápido, te cruzan de la lista sin avisar.",
    devBonus: 4,
    minutesBonus: -2,
    prestige: 5,
  },
  {
    id: "malaga",
    name: "Málaga CF",
    short: "Málaga",
    city: "Málaga",
    colors: "Blanquiazul",
    development: "Menos recursos, más responsabilidad: aquí se aprende jugando.",
    competition: "Baja. El club necesita canteranos y lo sabe.",
    minutes: "Muchos y pronto, incluso con 17 años.",
    risk: "El club es inestable: hoy te quieren, mañana cambia todo.",
    devBonus: 1,
    minutesBonus: 3,
    prestige: 2,
  },
];

export function clubById(id: string): ClubInfo {
  return CLUBS.find((c) => c.id === id) ?? CLUBS[0];
}

export const YOUTH_OPPONENTS = [
  "Cádiz CF", "UD Almería", "Recreativo", "Córdoba CF", "Elche CF", "Levante UD",
  "Granada CF", "Xerez", "Écija", "Utrera", "San Fernando", "Antequera",
];

export const RESERVE_OPPONENTS = [
  "Alcorcón B", "Linares", "CD Badajoz", "Mérida AD", "Atlético Sanluqueño",
  "Yeclano", "UCAM Murcia", "CD Eldense", "Real Murcia", "Algeciras CF",
];

export const FIRST_OPPONENTS = [
  "Getafe CF", "Rayo Vallecano", "RCD Espanyol", "Celta de Vigo", "Osasuna",
  "Deportivo Alavés", "Valencia CF", "Real Sociedad", "Athletic Club", "Girona FC",
];

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
  { id: "superviviente", name: "Superviviente", desc: "Volver de una lesión larga." },
];
