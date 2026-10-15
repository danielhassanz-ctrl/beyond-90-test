/**
 * MARCAS Y MERCHANDISING. Antes había una docena de ofertas fijas (Nike, Adidas, una startup…) y la misma marca volvía una y otra
 * vez. Ahora hay un catálogo de marcas inventadas por categorías (botas, colonias, relojes, bebidas, tecnología, motor…), ofertas que
 * se generan según tu fama, pujas en las que varias marcas se pelean por ti, líneas de producto con tu nombre (colonia, cromos,
 * muñecos…) con su resultado de ventas meses después, y campañas en pantallas gigantes de ciudades míticas (Times Square, Shibuya,
 * Piccadilly…) que dejan un hito con tu cara en la pantalla. Todo en código, sin llamadas a la IA.
 *
 * Los ids empiezan por «sponsor-»: resolveEvent convierte la prima de la firma en un contrato que paga cada mes (ver
 * finance/sponsorship-income.ts), y la renovación llega sola cuando vence (sponsor-renewal.ts).
 */
import type { EventOption, GameEvent } from "@/types/career";
import type { Player } from "@/types/player";
import { displayName } from "@/types/player";
import { readSponsorships, activeSponsorships } from "@/lib/finance/sponsorship-income";

export type BrandCategory =
  | "botas" | "ropa" | "colonia" | "reloj" | "bebida" | "tecnologia" | "videojuegos" | "motor"
  | "banca" | "aerolinea" | "alimentacion" | "gafas" | "auriculares" | "cuidado" | "juguetes";

interface CategoryInfo {
  label: string;
  /** Prima de firma base (con fama 65); se multiplica según tu fama y tu media. */
  base: number;
  /** Fama mínima para que se interesen. */
  minFama: number;
  brands: { name: string; note: string }[];
  intro: (brand: string, you: string) => string;
  accept: (brand: string) => string;
  flag: string;
}

export const CATEGORIES: Record<BrandCategory, CategoryInfo> = {
  botas: {
    label: "botas de fútbol", base: 20000, minFama: 65, flag: "sponsor_botas",
    brands: [{ name: "Vektra", note: "la marca de moda entre los delanteros jóvenes" }, { name: "Ignis Sport", note: "botas ligeras y colores imposibles" }, { name: "Tramontana", note: "tradición artesana y piel de canguro" }, { name: "Halcón Athletic", note: "la apuesta española que quiere comerse el mercado" }, { name: "Zenit", note: "tecnología de tacos con patente propia" }],
    intro: (b, y) => `${b} te propone convertirte en su cara de botas. Quieren que ${y} las lleve en todos los partidos, una edición con tu nombre en el talón y tu dorsal en la lengüeta.`,
    accept: (b) => `Firmas con ${b} y el diseñador te enseña el primer boceto: tu apellido bordado en el talón, el color que tú elijas en la suela. Esa noche sueñas con ver a un niño con tus botas en el patio del colegio.`,
  },
  ropa: {
    label: "ropa deportiva y de calle", base: 12000, minFama: 65, flag: "sponsor_ropa",
    brands: [{ name: "Costa Norte", note: "ropa casual con aire de puerto" }, { name: "Urbano", note: "streetwear de barrio con colecciones cortas" }, { name: "Pampa Wear", note: "ropa de abrigo y de campo para la ciudad" }, { name: "Linaje", note: "moda de autor que quiere vestir al vestuario" }],
    intro: (b, y) => `${b} quiere vestir tu día a día. Te ofrecen una cápsula de ropa con tu nombre y un acuerdo para que ${y} aparezca con sus prendas fuera del campo.`,
    accept: (b) => `Firmas con ${b} y el primer pedido llega a tu casa en cajas con tu nombre. Te pruebas la chaqueta frente al espejo y no puedes evitar sonreír: ahora tienes una colección.`,
  },
  colonia: {
    label: "perfumes y colonias", base: 15000, minFama: 68, flag: "sponsor_colonia",
    brands: [{ name: "Aurea", note: "perfumería de lujo con frascos de cristal soplado" }, { name: "Noir Sur", note: "fragancias oscuras y marineras" }, { name: "Maré", note: "colonias frescas de verano" }, { name: "Oud Real", note: "esencias de maderas nobles" }, { name: "Cuero & Sal", note: "una colonia con olor a vestuario limpio, ironías incluidas" }],
    intro: (b, y) => `${b} te llama con una idea que no esperabas: una colonia con tu nombre. Un frasco, un olor que defina tu estilo y una campaña con ${y} en blanco y negro.`,
    accept: (b) => `Pasas dos tardes oliendo muestras con el perfumista de ${b}, que te mira con cara de catador de vinos. Al final eliges la que huele a hierba recién cortada y a noche de estadio. Tu madre dice que le recuerda a ti.`,
  },
  reloj: {
    label: "relojes de lujo", base: 25000, minFama: 72, flag: "sponsor_reloj",
    brands: [{ name: "Meridian", note: "relojería suiza de siempre" }, { name: "Chronos & Hale", note: "relojes de colección con historia" }, { name: "Vantor", note: "diseño atrevido y esfera de carbono" }, { name: "Orlov", note: "alta relojería para coleccionistas" }],
    intro: (b, y) => `${b} te propone ser imagen de su nueva colección: un reloj de edición limitada y una campaña en revistas donde ${y} aparece con el brazo apoyado en un coche que no es tuyo.`,
    accept: (b) => `Te ponen el reloj en la muñeca y pesa más de lo que parece. El relojero de ${b} te explica cada engranaje con una devoción casi religiosa. Sales con la sensación de que acabas de entrar en otra liga.`,
  },
  bebida: {
    label: "bebidas", base: 12000, minFama: 65, flag: "sponsor_bebida",
    brands: [{ name: "Voltio", note: "energética con anuncios muy ruidosos" }, { name: "Kraken Energy", note: "la bebida de los gamers y de los gimnasios" }, { name: "Frescor", note: "agua mineral y zumos naturales" }, { name: "Nitro Lima", note: "isotónica de sabor cítrico" }, { name: "Tormenta", note: "refresco con aires de verano eterno" }],
    intro: (b, y) => `${b} quiere que ${y} salga en sus latas: un spot de quince segundos, una edición con tu cara y el compromiso de que beberás su producto delante de una cámara, con cara de felicidad.`,
    accept: (b) => `Rodáis el anuncio en un solo día. A la décima toma, estás ya hasta las cejas de ${b}, pero sonríes, que es lo que cuenta. Tu madre pregunta si de verdad te lo bebes.`,
  },
  tecnologia: {
    label: "tecnología", base: 18000, minFama: 68, flag: "sponsor_tecnologia",
    brands: [{ name: "Nexa", note: "móviles con cámara de cine" }, { name: "Orbit", note: "relojes inteligentes y pulseras de actividad" }, { name: "Pixelon", note: "televisores enormes y pantallas curvas" }, { name: "Lumen", note: "portátiles y tablets de diseño" }],
    intro: (b, y) => `${b} presenta un producto nuevo y quiere que ${y} sea la cara del lanzamiento: una campaña, un evento de presentación y un modelo especial con tu firma grabada.`,
    accept: (b) => `Subes al escenario de la presentación de ${b} con un guion que no recuerdas ni un minuto después. El público aplaude cuando enseñas el aparato. Esa noche, en redes, tu foto con él supera a la del propio producto.`,
  },
  videojuegos: {
    label: "videojuegos", base: 14000, minFama: 70, flag: "sponsor_videojuego",
    brands: [{ name: "Kickoff Legends", note: "el simulador de fútbol de moda" }, { name: "Pixel Arena", note: "un juego de cartas de futbolistas" }, { name: "Bravo Games", note: "shooters y competitivos en consola" }],
    intro: (b, y) => `${b} te ofrece aparecer en su próximo juego, con tu cara, tu nombre y tu celebración de gol incluida. Quieren que ${y} haga captura de movimientos en un estudio.`,
    accept: (b) => `Pasas un día entero en un estudio de captura con un traje lleno de bolitas, celebrando goles imaginarios ante una pantalla verde. Meses después, un niño te enseña el juego en su consola y ahí estás, igual que tú, con sus mismos gestos.`,
  },
  motor: {
    label: "motor", base: 30000, minFama: 75, flag: "sponsor_motor",
    brands: [{ name: "Veloce", note: "deportivos de lujo hechos a mano" }, { name: "Aster Motors", note: "coches de gran turismo con aire británico" }, { name: "Brisa Electric", note: "eléctricos premium de diseño nórdico" }],
    intro: (b, y) => `${b} quiere a ${y} como embajador: un coche a tu disposición, una campaña en televisión y un acuerdo que incluye cenas de gala con sus clientes más ricos.`,
    accept: (b) => `Te dan las llaves de un coche que no sabes ni cómo arrancar. El de la marca te lo explica dos veces con una paciencia infinita. Al día siguiente, todo el vestuario sabe de qué marca eres.`,
  },
  banca: {
    label: "banca y seguros", base: 22000, minFama: 70, flag: "sponsor_banca",
    brands: [{ name: "Banco Atlántica", note: "la banca de siempre con ropa nueva" }, { name: "Fintra", note: "una aplicación de pagos que quiere ser el futuro" }, { name: "Credex", note: "hipotecas y tarjetas premium" }],
    intro: (b, y) => `${b} te quiere como imagen. Anuncios serios con ${y} y un traje, una tarjeta personalizada y un acuerdo para que tu patrimonio se gestione con ellos.`,
    accept: (b) => `Firmas con ${b} en un despacho con cuadros caros. Te dan una tarjeta negra con tu nombre grabado y una carpeta con folletos que no abrirás nunca. Tu representante, eso sí, los lee todos.`,
  },
  aerolinea: {
    label: "aerolíneas", base: 20000, minFama: 72, flag: "sponsor_aerolinea",
    brands: [{ name: "Aerolíneas Meridiana", note: "la bandera de tu país en el aire" }, { name: "SkyBravo", note: "vuelos baratos con humor" }, { name: "Cóndor Air", note: "rutas largas y asientos de cuero" }],
    intro: (b, y) => `${b} busca cara para su campaña de verano: ${y} en un anuncio dentro de un avión, un pase de por vida para volar con ellos y tu cara en el fuselaje de uno de sus aviones.`,
    accept: (b) => `Rodáis en un avión parado en una pista, con un centenar de extras que fingen estar felices a cuatro grados. Meses después, ves tu cara pintada en la cola de un avión de ${b}. Se te encoge el estómago de orgullo.`,
  },
  alimentacion: {
    label: "alimentación", base: 8000, minFama: 65, flag: "sponsor_comida",
    brands: [{ name: "Doña Lola", note: "conservas y platos preparados de siempre" }, { name: "Crujiente", note: "cereales y barritas energéticas" }, { name: "Sol de Campo", note: "aceite y productos de huerta" }],
    intro: (b, y) => `${b} quiere que ${y} salga en sus cajas. Una edición con tu cara, un anuncio en familia y un acuerdo para repartir producto en el comedor de varios colegios.`,
    accept: (b) => `Rodáis un anuncio en una cocina con toda tu familia. Tu madre, nerviosa, repite la frase de la receta cinco veces. En el supermercado, semanas después, ves tu cara en una caja de ${b} y le haces una foto para mandarla a casa.`,
  },
  gafas: {
    label: "gafas de sol", base: 10000, minFama: 66, flag: "sponsor_gafas",
    brands: [{ name: "Lynx Optics", note: "gafas deportivas ultra ligeras" }, { name: "Solana", note: "monturas de diseño" }, { name: "Bruma", note: "gafas con estilo retro" }],
    intro: (b, y) => `${b} te propone una colección de gafas de sol con tu nombre y que ${y} las lleves en la llegada al estadio, ante las cámaras de los fotógrafos.`,
    accept: (b) => `Llegas al estadio con unas gafas de ${b} y los fotógrafos no paran. Al día siguiente, tu foto con ellas se vende más que la de tu último gol. Tu agente lo resume: «El mejor autógrafo es una buena montura».`,
  },
  auriculares: {
    label: "auriculares", base: 9000, minFama: 66, flag: "sponsor_auriculares",
    brands: [{ name: "Sonar", note: "auriculares de cancelación de ruido" }, { name: "Kraftwave", note: "auriculares de gaming y fútbol" }],
    intro: (b, y) => `${b} quiere que ${y} entre al túnel de vestuarios con sus auriculares puestos: una foto icónica, una edición con tu dorsal y cinco imágenes en redes.`,
    accept: (b) => `Entras al estadio con unos auriculares de ${b}, la mirada perdida y la música a tope. La foto se vuelve viral: «el concentrado». Medio vestuario pide unos iguales.`,
  },
  cuidado: {
    label: "cuidado personal", base: 7000, minFama: 65, flag: "sponsor_cuidado",
    brands: [{ name: "Barba Real", note: "ceras y aceites para barba" }, { name: "Filo", note: "maquinillas y cuchillas" }, { name: "Cuarzo", note: "cremas y cuidado de la piel" }],
    intro: (b, y) => `${b} te quiere como imagen de su nueva línea: ${y} en un baño blanquísimo, mirándose al espejo con cara de perfecto control de uno mismo.`,
    accept: (b) => `Rodáis con una luz tan suave que te sientes un anuncio. Al terminar, te llevas una caja enorme de ${b} que tu pareja usa más que tú.`,
  },
  juguetes: {
    label: "juguetes y colecciones", base: 6000, minFama: 65, flag: "sponsor_juguetes",
    brands: [{ name: "Mini Crack", note: "figuras articuladas de futbolistas" }, { name: "Cromos Gol", note: "álbumes y cromos de la liga" }, { name: "FigurArte", note: "muñecos de colección y peluches" }],
    intro: (b, y) => `${b} quiere sacar una figura de colección de ${y}: un muñeco con tu pose de celebración, tu equipación y una caja con tu firma.`,
    accept: (b) => `Te escanean la cara y el cuerpo con una cámara que parece un robot. Meses después, un niño te enseña tu figura de ${b} y te pide que se la firmes con rotulador. Es una de las firmas más difíciles de tu vida.`,
  },
};

const ALL = Object.keys(CATEGORIES) as BrandCategory[];
const eur = (n: number) => `${Math.round(n).toLocaleString("es")} €`;
const round500 = (n: number) => Math.round(n / 500) * 500;
const num = (v: string | boolean | undefined) => parseInt(String(v ?? "0"), 10) || 0;
const pick = <T,>(list: readonly T[], rng: () => number): T => list[Math.floor(rng() * list.length)];

/** Cuánto se multiplica la prima base: con fama 65 vale 1; con 100 y buena media, hasta ~4,5. */
export function fameScale(player: Pick<Player, "fama" | "media">): number {
  const fama = player.fama ?? 65;
  const media = player.media ?? 60;
  return Math.max(0.8, 1 + Math.pow(Math.max(0, fama - 65) / 35, 1.3) * 3 + Math.max(0, media - 75) / 60);
}

/** Marcas con las que ya has firmado (o rechazado): no se repiten pronto. */
function brandsUsed(flags: Record<string, string | boolean> | null | undefined): string[] {
  return String(flags?.brands_used ?? "").split("|").filter(Boolean);
}
const markBrands = (flags: Record<string, string | boolean> | null | undefined, names: string[]): string => [...brandsUsed(flags), ...names].slice(-24).join("|");

/** Categorías con contrato en vigor o tratadas hace poco. */
function busyCategories(player: Player): Set<BrandCategory> {
  const out = new Set<BrandCategory>();
  const f = player.flags ?? {};
  for (const cat of ALL) {
    if (activeSponsorships(f, player.week).some((s) => s.name && CATEGORIES[cat].brands.some((b) => b.name === s.name))) out.add(cat);
    if (num(f[`brand_last_${cat}`]) > 0 && player.week - num(f[`brand_last_${cat}`]) < 20) out.add(cat);
  }
  return out;
}

function freshBrands(cat: BrandCategory, player: Player, n: number, rng: () => number): { name: string; note: string }[] {
  const used = new Set(brandsUsed(player.flags));
  const fresh = CATEGORIES[cat].brands.filter((b) => !used.has(b.name));
  const pool = fresh.length >= n ? fresh : CATEGORIES[cat].brands;
  return [...pool].sort(() => rng() - 0.5).slice(0, n);
}

function eligibleCategories(player: Player): BrandCategory[] {
  const busy = busyCategories(player);
  return ALL.filter((c) => !busy.has(c) && (player.fama ?? 0) >= CATEGORIES[c].minFama);
}

/** La oferta de UNA marca para una categoría. */
export function buildBrandOffer(player: Player, rng: () => number = Math.random): GameEvent | null {
  const cats = eligibleCategories(player);
  if (cats.length === 0) return null;
  const cat = pick(cats, rng);
  const info = CATEGORIES[cat];
  const [brand] = freshBrands(cat, player, 1, rng);
  const week = player.week;
  const you = displayName(player);
  const bonus = round500(info.base * fameScale(player) * (0.9 + rng() * 0.25));
  const better = round500(bonus * 1.3);
  const agent = player.agent_name && player.agent_name !== "sin representante" ? player.agent_name : "Tu representante";
  const marked = { brands_used: markBrands(player.flags, [brand.name]), [`brand_last_${cat}`]: String(week) };
  const options: EventOption[] = [
    {
      id: "firmar",
      label: `Firmar con ${brand.name} (${eur(bonus)} de prima)`,
      subtitle: `Una temporada · cobras cada mes mientras dura`,
      consequences: { patrimonio: bonus, fama: 4, rel_representante: 2, flags: { ...marked, [info.flag]: brand.name } },
      outcomeText: info.accept(brand.name),
    },
    {
      id: "negociar",
      label: `Pedir más: ${eur(better)} de prima`,
      subtitle: "Arriesgas que se echen atrás",
      consequences: {},
      resolve: {
        baseChance: Math.min(0.75, 0.35 + (player.fama ?? 0) / 220),
        statModifier: "fama",
        success: { text: `${brand.name} se lo piensa una noche y vuelve con ${eur(better)}. ${agent} sale del despacho en silencio, con una sonrisa que no puede ocultar. ${info.accept(brand.name)}`, consequences: { patrimonio: better, fama: 5, rel_representante: 3, flags: { ...marked, [info.flag]: brand.name } } },
        fail: { text: `${brand.name} contesta con un comunicado educado y frío: han decidido apostar por otro deportista. ${agent} te mira: «Era una buena oferta». Tiene razón, y lo sabéis los dos.`, consequences: { moral: -3, rel_representante: -2, flags: marked } },
      },
    },
    {
      id: "rechazar",
      label: "No firmar: prefiero mantener la imagen limpia",
      subtitle: "Ahora no",
      consequences: { reputacion: 1, flags: marked },
      outcomeText: `Dices que ahora no. ${brand.name} lo acepta con educación y se lleva la propuesta a otro. En el fondo, algo se te revuelve: ¿y si era la buena?`,
    },
  ];
  return {
    id: `sponsor-oferta-${cat}-${week}`,
    category: "representante",
    title: `${brand.name} quiere ser tu marca de ${info.label}`,
    description: `${agent} entra con el móvil en la mano: «${brand.name}, ${brand.note}. Te quieren». ${info.intro(brand.name, you)} Ofrecen ${eur(bonus)} de prima por la firma.`,
    options,
    isMilestone: bonus >= 30000,
    milestoneType: bonus >= 30000 ? "sponsor" : undefined,
    imageScene: bonus >= 30000 ? "Photorealistic photo of a footballer at a brand signing ceremony in a modern showroom, holding a pen over a contract and smiling at the cameras, flashbulbs, staff applauding, no readable text, no logos" : undefined,
  };
}

/** Varias marcas se pelean por ti: eliges con quién firmas y las demás se quedan sin ti. */
export function buildBrandBidding(player: Player, rng: () => number = Math.random): GameEvent | null {
  if ((player.fama ?? 0) < 76) return null;
  const cats = eligibleCategories(player).filter((c) => freshBrands(c, player, 3, rng).length >= 3);
  if (cats.length === 0) return null;
  const cat = pick(cats, rng);
  const info = CATEGORIES[cat];
  const week = player.week;
  const trio = freshBrands(cat, player, 3, rng);
  const scale = fameScale(player);
  const bonuses = trio.map((_, i) => round500(info.base * scale * (1.1 + i * 0.12 + rng() * 0.2)));
  // Cada marca tiene su carácter: la que más paga exige exclusividad, la del medio es la más cómoda y la humilde, la que menos ruido hace.
  const order = [...trio.keys()].sort((a, b) => bonuses[b] - bonuses[a]);
  const [top, mid, low] = order;
  const agent = player.agent_name && player.agent_name !== "sin representante" ? player.agent_name : "Tu representante";
  const marked = (names: string[]) => ({ brands_used: markBrands(player.flags, names), [`brand_last_${cat}`]: String(week) });
  const all = trio.map((b) => b.name);
  const options: EventOption[] = [
    {
      id: "top",
      label: `${trio[top].name}: ${eur(bonuses[top])}`,
      subtitle: "La que más paga, con exclusividad total",
      consequences: { patrimonio: bonuses[top], fama: 5, reputacion: -1, rel_representante: 2, flags: { ...marked(all), [info.flag]: trio[top].name } },
      outcomeText: `Firmas con ${trio[top].name}, que paga más y lo deja por escrito: ninguna otra marca de ${info.label} podrá tocarte. ${agent} te recuerda que eso también significa decir que no a ofertas que aún no existen. ${info.accept(trio[top].name)}`,
    },
    {
      id: "mid",
      label: `${trio[mid].name}: ${eur(bonuses[mid])}`,
      subtitle: "Menos dinero, más libertad creativa y mejor trato",
      consequences: { patrimonio: bonuses[mid], fama: 4, moral: 3, rel_representante: 3, flags: { ...marked(all), [info.flag]: trio[mid].name } },
      outcomeText: `${trio[mid].name} paga algo menos, pero te deja opinar en la campaña y te trata como a una persona, no como a un cartel. ${agent} lo resume: «Es la que mejor me cae de las tres». ${info.accept(trio[mid].name)}`,
    },
    {
      id: "low",
      label: `${trio[low].name}: ${eur(bonuses[low])}`,
      subtitle: "La más modesta, pero la que mejor encaja con tu imagen",
      consequences: { patrimonio: bonuses[low], fama: 3, reputacion: 3, rel_representante: 1, flags: { ...marked(all), [info.flag]: trio[low].name } },
      outcomeText: `${trio[low].name} no es la que más paga, pero encaja con quien eres y no te pide nada raro. En las redes se nota: la afición ve algo auténtico en ese acuerdo. ${info.accept(trio[low].name)}`,
    },
    {
      id: "esperar",
      label: "Dejarlas pelearse una semana más",
      subtitle: "Puede subir la oferta… o llevarse el interés",
      consequences: {},
      resolve: {
        baseChance: 0.5,
        statModifier: "fama",
        success: { text: `Las tres suben la oferta en cuanto se enteran de que las demás esperan. ${trio[top].name} se pasa a ${eur(bonuses[top] * 1.35)} y ${agent} no se lo cree. Firmas con ella. ${info.accept(trio[top].name)}`, consequences: { patrimonio: round500(bonuses[top] * 1.35), fama: 7, rel_representante: 3, flags: { ...marked(all), [info.flag]: trio[top].name } } },
        fail: { text: `Te pasas de listo: ${trio[top].name} y ${trio[mid].name} se cansan de esperar y cierran con otro jugador. Solo queda ${trio[low].name}, con la mitad de lo que ofrecía. ${agent} suspira: «Esto lo hablaremos».`, consequences: { patrimonio: round500(bonuses[low] * 0.6), moral: -4, rel_representante: -3, flags: { ...marked(all), [info.flag]: trio[low].name } } },
      },
    },
  ];
  return {
    id: `sponsor-puja-${cat}-${week}`,
    category: "representante",
    title: `Tres marcas de ${info.label} se pelean por ti`,
    description: `${agent} llega con una sonrisa que da miedo: ${trio.map((b) => `${b.name} (${b.note})`).join(", ")}. Las tres quieren ser tu cara de ${info.label} y, al enterarse de que las otras también, se han puesto a subir la oferta por teléfono. «Esto es lo mejor que me ha pasado como representante», admite. Ahora te toca elegir.`,
    options,
    isMilestone: true,
    milestoneType: "sponsor",
    imageScene: "Photorealistic photo of a footballer sitting at a long conference table with three groups of well-dressed executives on both sides competing for his attention, contracts and pens in front of him, a confident smile, dramatic office light, no readable text, no logos",
  };
}

interface Product {
  key: string;
  name: (you: string) => string;
  verb: string;
  flavor: string;
  cost: number;
  minFama: number;
  scene: string;
}

const PRODUCTS: Product[] = [
  { key: "colonia", name: (y) => `Colonia ${y}`, verb: "lanzar una colonia con tu nombre", flavor: "un frasco con tu dorsal grabado y un olor que bautizas tú", cost: 9000, minFama: 70, scene: "a footballer holding a perfume bottle with a minimalist label in a luxury perfume shop window" },
  { key: "cromos", name: (y) => `Cromos de ${y}`, verb: "sacar una colección de cromos y un álbum propio", flavor: "una serie de 50 cromos en los que apareces en 50 momentos de tu carrera", cost: 5000, minFama: 66, scene: "a footballer smiling and holding a printed sticker album with his own face on the cover next to a pile of stickers" },
  { key: "figura", name: (y) => `Figura de colección de ${y}`, verb: "producir una figura de colección", flavor: "un muñeco de 25 cm con tu pose de celebración y una caja numerada", cost: 7000, minFama: 70, scene: "a footballer next to a shelf full of small collectible figures of himself in a toy shop" },
  { key: "peluche", name: (y) => `Mascota de ${y}`, verb: "crear una mascota de peluche con tu nombre", flavor: "un peluche con tu camiseta que cabe en la mochila de cualquier niño", cost: 4000, minFama: 66, scene: "a footballer hugging a giant plush mascot wearing his jersey in a bright toy store" },
  { key: "snack", name: (y) => `Barritas ${y}`, verb: "lanzar una línea de barritas energéticas con tu nombre", flavor: "una caja de seis barritas con sabores que eliges tú", cost: 3500, minFama: 65, scene: "a footballer in a supermarket aisle holding a cereal bar box with his portrait on it" },
  { key: "zapatillas", name: (y) => `Zapatillas ${y} Edición 1`, verb: "diseñar unas zapatillas de calle con tu nombre", flavor: "una edición limitada de 1.000 pares con tu firma en la suela", cost: 11000, minFama: 74, scene: "a footballer kneeling and showing a pair of limited-edition sneakers with a sketch on the shoebox" },
  { key: "mochila", name: (y) => `Mochila ${y}`, verb: "lanzar una línea de mochilas y accesorios", flavor: "mochilas para el cole, bolsas de viaje y neceseres con tu dorsal", cost: 3500, minFama: 65, scene: "a footballer carrying a sports backpack with his number on it through an airport hall" },
  { key: "auriculares", name: (y) => `Auriculares ${y}`, verb: "sacar unos auriculares con tu nombre", flavor: "unos auriculares con el color de tu club y un sonido de estadio", cost: 8000, minFama: 72, scene: "a footballer entering a stadium tunnel wearing large headphones and a hoodie with his number" },
];

/** Una línea de producto con tu nombre: te cuesta una inversión y puede salir muy bien o muy mal (lo cuenta una escena de ventas después). */
export function buildMerchOffer(player: Player, rng: () => number = Math.random): GameEvent | null {
  const f = player.flags ?? {};
  const fresh = PRODUCTS.filter((p) => (player.fama ?? 0) >= p.minFama && !f[`merch_${p.key}`]);
  if (fresh.length === 0) return null;
  const prod = pick(fresh, rng);
  const you = displayName(player);
  const name = prod.name(you);
  const week = player.week;
  const agent = player.agent_name && player.agent_name !== "sin representante" ? player.agent_name : "Tu representante";
  const scale = fameScale(player);
  const bonus = round500(prod.cost * scale * 0.9);
  const invest = Math.round((prod.cost * scale * 1.4) / 500) * 500;
  const mark = { [`merch_${prod.key}`]: String(week), [`merch_${prod.key}_nombre`]: name };
  const options: EventOption[] = [
    {
      id: "licencia",
      label: `Ceder la licencia a una empresa (${eur(bonus)})`,
      subtitle: "Dinero seguro, sin riesgo, pero menos control",
      consequences: { patrimonio: bonus, fama: 3, flags: { ...mark, [`merch_${prod.key}_modo`]: "licencia" } },
      outcomeText: `Firmas la licencia. Una empresa se encarga de todo: tú solo apareces en la foto de presentación y firmas la primera unidad. ${agent} te asegura que el dinero es seguro y que, si todo va bien, habrá una segunda edición.`,
    },
    {
      id: "propio",
      label: `Producirlo con tu propia marca (invertir ${eur(invest)})`,
      subtitle: "Más ganancia si funciona… y pierdes lo invertido si no",
      consequences: { patrimonio: -invest, fama: 3, flags: { ...mark, [`merch_${prod.key}_modo`]: "propio", [`merch_${prod.key}_inversion`]: String(invest) } },
      outcomeText: `Pones el dinero tú y firmas con un fabricante pequeño. ${agent} te lo advierte: «Esto es un negocio de verdad». Sale la primera tirada y ves tu nombre en las cajas, apiladas hasta el techo del almacén. Ahora toca venderlas.`,
    },
    {
      id: "no",
      label: "No: no es lo mío",
      subtitle: "Quizá más adelante",
      consequences: { flags: { [`merch_${prod.key}`]: String(week), [`merch_${prod.key}_modo`]: "no" } },
      outcomeText: `Dices que no. ${agent} se encoge de hombros: «Habrá más ofertas». Pero tardas un par de días en dejar de pensar en cómo habría quedado.`,
    },
  ];
  return {
    id: `sponsor-merch-${prod.key}-${week}`,
    category: "representante",
    title: `Tu propio producto: ${name}`,
    description: `${agent} te cita en una cafetería con una carpeta llena de bocetos. «Quieren ${prod.verb}: ${prod.flavor}». Es la primera vez que tu apellido va a salir en un producto que no es una camiseta. Hay dos maneras de hacerlo: ceder la licencia (dinero seguro) o producirlo tú (más ganancia, más riesgo).`,
    options,
    isMilestone: true,
    milestoneType: "sponsor",
    imageScene: `Photorealistic photo of ${prod.scene}, proud smile, warm light, no readable text, no logos`,
  };
}

/** Meses después, cuánto ha vendido el producto: sorpresa buena o mala (solo los que produjiste tú o licenciaste). */
export function dueMerchResult(player: Player): { key: string; modo: string } | null {
  const f = player.flags ?? {};
  for (const p of PRODUCTS) {
    const w = num(f[`merch_${p.key}`]);
    const modo = String(f[`merch_${p.key}_modo`] ?? "");
    if (w <= 0 || !modo || modo === "no" || f[`merch_${p.key}_resultado`]) continue;
    if (player.week - w >= 12 && player.week - w <= 40) return { key: p.key, modo };
  }
  return null;
}

export function buildMerchResult(player: Player, rng: () => number = Math.random): GameEvent | null {
  const due = dueMerchResult(player);
  if (!due) return null;
  const prod = PRODUCTS.find((p) => p.key === due.key) as Product;
  const f = player.flags ?? {};
  const name = String(f[`merch_${prod.key}_nombre`] ?? prod.name(displayName(player)));
  const agent = player.agent_name && player.agent_name !== "sin representante" ? player.agent_name : "Tu representante";
  const roll = rng();
  const invest = num(f[`merch_${prod.key}_inversion`]);
  const week = player.week;
  const mark = { [`merch_${prod.key}_resultado`]: String(week) };
  const hit = roll < 0.55 + Math.min(0.2, (player.fama ?? 0) / 500);
  const big = hit && roll < 0.2;
  const profit = due.modo === "propio" ? round500(invest * (big ? 3.4 : hit ? 1.9 : 0)) : round500(prod.cost * fameScale(player) * (big ? 1.6 : hit ? 0.8 : 0.2));
  const flops = !hit;
  const verdict = big
    ? `${name} arrasa. Se agota en tres semanas, los revendedores se frotan las manos y tu madre recibe la llamada de una vecina para preguntar si queda alguna.`
    : hit
      ? `${name} se vende mejor de lo que decía el plan. No es el pelotazo del siglo, pero cuadra: ${agent} te enseña la hoja de cálculo con una sonrisa moderada.`
      : `${name} no despega. Las cajas se acumulan en un almacén y ${agent} te explica, con la paciencia de un médico, que a veces el público decide otra cosa.`;
  return {
    id: `sponsor-merch-resultado-${prod.key}-${week}`,
    category: "representante",
    title: big ? `${name}: éxito de ventas` : hit ? `${name}: las cuentas salen` : `${name}: no ha funcionado`,
    description: verdict,
    options: [
      {
        id: "a",
        label: big ? "Celebrarlo con tu equipo de trabajo" : hit ? "Quedarte con el dinero y pensar en la segunda edición" : "Asumir el golpe sin dramas",
        subtitle: flops ? "Se aprende más de los fallos" : "Cobrar lo que toca",
        consequences: { patrimonio: flops ? (due.modo === "propio" ? 0 : profit) : profit, moral: big ? 8 : hit ? 4 : -4, fama: big ? 4 : hit ? 1 : -1, reputacion: flops ? -1 : 1, flags: mark },
        outcomeText: flops
          ? due.modo === "propio"
            ? `Pierdes lo invertido, pero te quedas con un montón de cajas y una lección. En el vestuario alguien se compra una por cariño y te pide la firma.`
            : `La empresa asume las pérdidas y tú te quedas con la parte fija del contrato. Aun así, ves tu nombre en una caja rebajada y sonríes con tristeza.`
          : big
            ? `Cobras una cifra que no esperabas. ${agent} te propone una segunda edición y tú, por una vez, no pones pegas.`
            : `Cobras lo previsto. No es la fortuna de tu vida, pero da gusto ver una idea propia en la tienda de al lado de casa.`,
      },
    ],
  };
}

interface Spot {
  key: string;
  city: string;
  place: string;
  minFama: number;
  scene: string;
  line: string;
}

export const BILLBOARDS: Spot[] = [
  { key: "times-square", city: "Nueva York", place: "Times Square", minFama: 88, scene: "Times Square in New York at night with a gigantic LED billboard showing the footballer's face and a bold brand logo mark, yellow taxis and crowds looking up, neon lights", line: "entre las luces donde solo aparecen las estrellas más grandes del planeta" },
  { key: "shibuya", city: "Tokio", place: "el cruce de Shibuya", minFama: 82, scene: "Shibuya Crossing in Tokyo at night with a huge LED screen above the crowd showing the footballer's face in an advertisement, neon signs and thousands of pedestrians", line: "sobre el cruce de peatones más famoso del mundo" },
  { key: "piccadilly", city: "Londres", place: "Piccadilly Circus", minFama: 80, scene: "Piccadilly Circus in London at dusk with the giant curved LED screens showing the footballer's face in an advertisement, red buses and crowds below", line: "en las pantallas curvas de Piccadilly Circus" },
  { key: "gran-via", city: "Madrid", place: "la Gran Vía", minFama: 74, scene: "Gran Vía in Madrid at night with a giant screen on an old building showing the footballer's face in an advertisement, lit facades, taxis and pedestrians", line: "sobre uno de los edificios más fotografiados de Madrid" },
  { key: "burj", city: "Dubái", place: "la fachada del Burj Khalifa", minFama: 92, scene: "the giant illuminated facade of the Burj Khalifa in Dubai at night displaying the footballer's face in an advertisement, fountains and crowds watching from below", line: "en la fachada del edificio más alto del mundo" },
  { key: "potsdamer", city: "Berlín", place: "Potsdamer Platz", minFama: 78, scene: "Potsdamer Platz in Berlin at dusk with a large LED screen showing the footballer's face in an advertisement between glass towers, trams and pedestrians", line: "entre las torres de cristal de la ciudad" },
];

/** Una campaña con tu cara en una pantalla gigante: un hito con la foto de la pantalla. */
export function buildBillboardEvent(player: Player, usedEventIds: readonly string[], rng: () => number = Math.random): GameEvent | null {
  const f = player.flags ?? {};
  if ((player.fama ?? 0) < 74) return null;
  const options = BILLBOARDS.filter((b) => (player.fama ?? 0) >= b.minFama && !usedEventIds.includes(`sponsor-pantalla-${b.key}`) && !usedEventIds.includes(`sponsor-${b.key}`));
  if (options.length === 0) return null;
  // Con una marca en vigor, la campaña es de esa marca; si no, de una nueva de las categorías grandes.
  const active = activeSponsorships(f, player.week).sort((a, b) => b.monthly - a.monthly)[0];
  const known = Object.values(CATEGORIES).flatMap((c) => c.brands);
  const brand = (active && known.find((b) => b.name === active.name)) ?? pick(["tecnologia", "reloj", "motor", "bebida", "ropa"].map((c) => pick(CATEGORIES[c as BrandCategory].brands, rng)), rng);
  const spot = pick(options, rng);
  const week = player.week;
  const bonus = round500(30000 * fameScale(player) * 0.7);
  const agent = player.agent_name && player.agent_name !== "sin representante" ? player.agent_name : "Tu representante";
  const you = displayName(player);
  return {
    id: `sponsor-pantalla-${spot.key}`,
    category: "especial",
    title: `Tu cara en una pantalla gigante de ${spot.place}`,
    description: `${brand.name} cierra la campaña más grande de tu carrera hasta ahora: tu imagen ocupará durante un mes una pantalla gigante en ${spot.place} (${spot.city}), ${spot.line}. ${agent} te enseña la maqueta con una sonrisa temblorosa: «Mira cómo sale el ${you} de dos metros de alto». Te invitan a la inauguración, con las cámaras de medio mundo esperando.`,
    isMilestone: true,
    milestoneType: "sponsor",
    imageScene: `Photorealistic night photo of ${spot.scene}, a clean abstract logo mark only (no readable text), vibrant colours, cinematic wide shot, iconic atmosphere`,
    options: [
      {
        id: "ir",
        label: `Viajar a ${spot.city} y verlo con tus propios ojos`,
        subtitle: `Prima de ${eur(bonus)} y fama de icono`,
        consequences: { patrimonio: bonus, fama: 10, moral: 6, rel_representante: 3, flags: { [`sponsor_${spot.key}`]: brand.name, brands_used: markBrands(f, [brand.name]) } },
        outcomeText: `Estás en ${spot.city} la noche en que tu cara se enciende en ${spot.place}. Miles de personas pasan por debajo sin saber quién eres… excepto una niña, que te señala con el dedo y tira de la manga de su madre. Esa foto, tuya mirando hacia arriba, dará la vuelta al mundo.`,
      },
      {
        id: "familia",
        label: "Llevar a tu familia a la inauguración",
        subtitle: "Que lo vean los tuyos",
        consequences: { patrimonio: bonus, fama: 8, moral: 9, flags: { [`sponsor_${spot.key}`]: brand.name, brands_used: markBrands(f, [brand.name]) } },
        outcomeText: `Llevas a tu madre y a tu padre a ${spot.city}. Cuando se enciende la pantalla y tu cara ocupa el cielo, tu madre se agarra a tu brazo y tu padre, que no llora nunca, se quita las gafas para limpiarlas. Es la mejor foto de la campaña.`,
      },
      {
        id: "humilde",
        label: "Quitarle importancia: «solo es una pantalla»",
        subtitle: "Mantener los pies en el suelo",
        consequences: { patrimonio: bonus, fama: 6, reputacion: 5, flags: { [`sponsor_${spot.key}`]: brand.name, brands_used: markBrands(f, [brand.name]) } },
        outcomeText: `Dices en una entrevista que sigues siendo el mismo y la frase se hace viral. Tus excompañeros de la cantera te escriben: «Eso es lo que esperábamos de ti». La pantalla sigue ahí, enorme, y tú sigues siendo tú.`,
      },
    ],
  };
}

/** Qué escena de marcas toca ahora (o null): oferta de una marca, puja, línea de producto o pantalla gigante. */
export function pickSponsorEvent(player: Player, usedEventIds: readonly string[], rng: () => number = Math.random): GameEvent | null {
  const f = player.flags ?? {};
  const last = num(f.sponsor_event_last);
  if (last > 0 && player.week - last < 3) return null;
  // Resultado de ventas de un producto con tu nombre, cuando toca.
  const result = buildMerchResult(player, rng);
  if (result && rng() < 0.7) return result;
  const roll = rng();
  let ev: GameEvent | null = null;
  if (roll < 0.18) ev = buildBillboardEvent(player, usedEventIds, rng);
  else if (roll < 0.36) ev = buildBrandBidding(player, rng);
  else if (roll < 0.52) ev = buildMerchOffer(player, rng);
  if (!ev) ev = buildBrandOffer(player, rng);
  return ev;
}

/** Cuántos contratos de marca tienes ahora (para las escenas que quieran saberlo). */
export function activeBrandCount(player: Player): number {
  return readSponsorships(player.flags).filter((s) => player.week <= s.until).length;
}
