/**
 * LA VIVIENDA DE LOS JÓVENES. Con 16-21 años nadie compra una casa: se vive en la residencia del club, en una residencia de
 * estudiantes, en un piso compartido con compañeros, en un estudio pequeño o, si el club está cerca, en casa de tus padres.
 * La escena aparece al llegar a cada club mientras eres joven (una vez por club) y deja un alquiler de verdad (flags.alquiler)
 * o una vida de residencia sin coste, con su efecto en el vestuario, el míster y el ánimo.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { GameEvent } from "@/types/career";
import { playerAge } from "@/types/career";
import type { Player } from "@/types/player";
import { NO_CLUB_YET } from "@/lib/constants";
import { getOrCreatePropertyPhoto } from "@/lib/images/property-photos";
import { readProperties } from "@/lib/finance/mortgage";
import { readRent } from "@/lib/finance/rent";
import { playerMonthlyNet } from "@/lib/narrative/transfer-terms";
import { cityOfClub, localizeListing } from "@/lib/narrative/events";

interface Place {
  name: string;
  min: number;
  max: number;
  prompt: string;
}

const place = (name: string, min: number, max: number, desc: string): Place => ({
  name,
  min,
  max,
  prompt: `Real estate photography, ${desc}, daylight, professional listing photo, photorealistic, no people`,
});

export const STUDENT_RESIDENCES: Place[] = [
  place("Residencia universitaria con habitación individual", 380, 520, "modern university residence building with balconies and a green courtyard"),
  place("Colegio mayor histórico con comedor", 450, 600, "historic university hall of residence with a stone facade and a cloister"),
  place("Residencia de estudiantes con sala de estudio y lavandería", 320, 450, "student residence building with a bright entrance and bicycles parked outside"),
  place("Residencia deportiva para jóvenes promesas", 300, 420, "sports residence for young athletes next to training pitches"),
  place("Residencia moderna con coworking y cocina común", 400, 540, "modern student residence with large windows and a communal terrace"),
  place("Residencia con pistas de pádel y gimnasio", 480, 650, "student residence with a padel court and a gym building in the garden"),
  place("Residencia en un antiguo convento reformado", 350, 480, "renovated former convent turned into a student residence with arched windows"),
  place("Residencia de estudiantes frente al campus", 330, 460, "student residence directly across from a university campus with trees"),
];

export const SHARED_FLATS: Place[] = [
  place("Piso compartido con dos compañeros del club", 280, 400, "apartment building in a lively neighbourhood with balconies and a bakery on the ground floor"),
  place("Piso de estudiantes con balcón y vistas", 300, 420, "older apartment building with a long balcony and a view over rooftops"),
  place("Casa compartida con jardín y barbacoa", 330, 460, "shared terraced house with a small garden and a barbecue"),
  place("Piso de cuatro habitaciones cerca del estadio", 290, 400, "large apartment building near a football stadium, flags on the balconies"),
  place("Ático compartido con terraza", 380, 520, "top-floor flat with a terrace shared by young people, string lights, city view"),
  place("Piso compartido en el centro, ruidoso pero animado", 270, 380, "busy city centre building with cafés and bicycles below the windows"),
];

export const YOUTH_FLATS: Place[] = [
  place("Estudio pequeño y luminoso para ti solo", 600, 850, "small bright studio apartment building with a French balcony"),
  place("Piso de una habitación cerca de la ciudad deportiva", 650, 900, "modern apartment block near a sports training centre"),
  place("Loft diminuto en un edificio reformado", 620, 880, "small loft in a renovated brick building with big windows"),
  place("Apartamento amueblado con vistas al parque", 700, 950, "furnished apartment building facing a green park"),
  place("Buhardilla con encanto en un edificio antiguo", 550, 780, "charming attic apartment with skylights in an old stone building"),
  place("Piso en una urbanización tranquila a las afueras", 600, 840, "quiet residential complex on the outskirts with small gardens"),
];

const slug = (s: string) => s.normalize("NFD").replace(/[^a-zA-Z0-9]+/g, "-").toLowerCase().replace(/^-|-$/g, "");

function hash(value: string): number {
  let h = 2166136261;
  for (let i = 0; i < value.length; i++) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  h ^= h >>> 15;
  return h >>> 0;
}

const pickOne = (list: Place[], seed: string): Place => [...list].sort((a, b) => hash(`${seed}:${a.name}`) - hash(`${seed}:${b.name}`))[0];
const round10 = (n: number) => Math.round(n / 10) * 10;

export const youthHousingId = (club: string) => `vid-joven-${slug(club)}`;

/** ¿Toca preguntar dónde vivir? Solo siendo joven, una vez por club, sin casa propia ni alquiler ya firmado. */
export function shouldTriggerYouthHousing(player: Player, usedEventIds: readonly string[]): boolean {
  if (player.club === NO_CLUB_YET || player.status !== "active" || player.club.startsWith("SELECCIÓN:")) return false;
  if (playerAge(player.week) > 21 || player.week < 11) return false;
  const f = player.flags ?? {};
  if (f.vivienda_joven_club === player.club || usedEventIds.includes(youthHousingId(player.club))) return false;
  if (readRent(f) || readProperties(f).some((p) => (p.kind ?? "casa") === "casa" || p.kind === "mansion")) return false;
  const since = parseInt(String(f.club_since ?? "0"), 10) || 0;
  const here = player.week - (since || 9);
  return here >= 2 && here <= 16;
}

export async function buildYouthHousingEvent(player: Player, supabase: SupabaseClient): Promise<GameEvent> {
  const club = player.club;
  const city = cityOfClub(club);
  const age = playerAge(player.week);
  const seed = `${player.id}:${city}:joven`;
  const net = Math.max(300, playerMonthlyNet(player));
  const cap = Math.max(250, Math.round(net * 0.55));
  const clubChanges = parseInt(String(player.flags?.club_changes ?? "0"), 10) || 0;
  const closeToHome = clubChanges <= 1 && age <= 19;

  const resi = localizeListing(pickOne(STUDENT_RESIDENCES, seed), city);
  const shared = localizeListing(pickOne(SHARED_FLATS, seed), city);
  const own = localizeListing(pickOne(YOUTH_FLATS, seed), city);
  const price = (p: Place, offset: number) => Math.min(cap, round10(p.min + ((hash(`${seed}:${p.name}:${offset}`) % 1000) / 1000) * (p.max - p.min)));
  const rResi = price(resi, 1);
  const rShared = price(shared, 2);
  const rOwn = Math.min(Math.max(cap, 400), price(own, 3));
  const [pResi, pShared, pOwn] = await Promise.all([resi, shared, own].map((l) => getOrCreatePropertyPhoto(supabase, player.user_id, l.name, l.prompt)));
  const rentFlag = (name: string, monthly: number) => JSON.stringify({ name, monthly, city, since: player.week });
  const mark = { vivienda_joven_club: club };
  const euros = (n: number) => `${n.toLocaleString("es")} €`;

  return {
    id: youthHousingId(club),
    category: "vida",
    title: `Dónde vivir en ${city}, con ${age} años`,
    description: `Tienes ${age} años, una maleta grande y un sueldo de los que se gastan en un mes. En ${city} nadie te va a regalar un piso, y comprar una casa ni se te pasa por la cabeza todavía. Tu representante reúne las opciones sobre la mesa del bar del club: «Elige con la cabeza, pero también con el estómago. Aquí vas a pasar los años en los que más cambias».`,
    options: [
      {
        id: "club",
        label: "La residencia del club",
        subtitle: "Sin coste, con horarios y con el míster cerca",
        consequences: { moral: 3, rel_entrenador: 3, rel_vestuario: 3, forma: 1, flags: { ...mark, vivienda_joven: "residencia_club", alquiler: "" } },
        outcomeText: `Te dan la llave de una habitación pequeña con una cama, un escritorio y una ventana al campo de entrenamiento. Cenas con los demás chavales a las nueve y a las once se apagan las luces. No es glamuroso, pero el míster te ve entrar y salir, y eso, a tu edad, también cuenta.`,
      },
      {
        id: "resi",
        label: `${resi.name} — ${euros(rResi)}/mes`,
        subtitle: `Fianza de ${euros(rResi)} · comidas, estudio y gente de tu edad`,
        imageUrl: pResi ?? undefined,
        consequences: { patrimonio: -rResi, moral: 4, rel_vestuario: 1, flags: { ...mark, vivienda_joven: "residencia", alquiler: rentFlag(resi.name, rResi) } },
        outcomeText: `Subes tu maleta a una habitación individual con una cama estrecha y una ventana que da al patio. En el pasillo suena música de tres estilos distintos y alguien te ofrece tortilla antes de que te hayas presentado. Es ruidoso, es barato y por primera vez en meses no te sientes solo.`,
      },
      {
        id: "compartido",
        label: `${shared.name} — ${euros(rShared)}/mes`,
        subtitle: `Fianza de ${euros(rShared)} · compartir gastos y vestuario`,
        imageUrl: pShared ?? undefined,
        consequences: { patrimonio: -rShared, moral: 5, rel_vestuario: 4, flags: { ...mark, vivienda_joven: "compartido", alquiler: rentFlag(shared.name, rShared) } },
        outcomeText: `El piso huele a pasta, a botas mojadas y a una amistad que está empezando. Os repartís las habitaciones a pares o nones y el que pierde se queda con la que da a la calle. Esa noche cenáis los tres viendo un partido que no es el vuestro, discutiendo cada jugada como si os fuera la vida.`,
      },
      {
        id: "propio",
        label: `${own.name} — ${euros(rOwn)}/mes`,
        subtitle: `Fianza de ${euros(rOwn * 2)} · tu casa, tus normas… y tu nevera`,
        imageUrl: pOwn ?? undefined,
        consequences: { patrimonio: -rOwn * 2, moral: 7, flags: { ...mark, vivienda_joven: "propio", alquiler: rentFlag(own.name, rOwn) } },
        outcomeText: `Giras la llave en tu primera puerta y entras despacio, como en una película. Hay una cama, un sofá de segunda mano y una nevera que zumba. Es muy pequeño y es tuyo. Esa noche no pones música: te quedas escuchando el silencio de una casa que, por primera vez, nadie más ha pagado por ti.`,
      },
      ...(closeToHome
        ? [
            {
              id: "padres",
              label: "Seguir en casa de tus padres",
              subtitle: "Sin gastos, con tu madre cuidando de ti",
              consequences: { moral: 2, forma: 2, rel_vestuario: -1, flags: { ...mark, vivienda_joven: "padres", alquiler: "" } },
              outcomeText: `Tu madre no ha cambiado ni una sola sábana de tu cama. A las siete y media hay desayuno y a las diez y media, regañina si no has llegado. En el vestuario hay quien se ríe de que todavía vivas con tus padres. Tú piensas, comiendo el segundo plato de lentejas, que hay peores cosas.`,
            },
          ]
        : []),
    ],
    minWeek: 11,
  };
}
