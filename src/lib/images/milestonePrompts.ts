import { describeKit, describeNationalKit } from "@/lib/clubColors";
import { NO_CLUB_YET } from "@/lib/constants";

import { describeLook } from "@/lib/playerLook";
import { getContextualImagePrompt, pickSigningScene } from "@/lib/narrative/contextual-image-prompts";

/**
 * Extraído de carrera/actions.ts para poder reutilizarlo también desde el
 * script de pre-generación de plantillas (no puede importarse desde un
 * archivo "use server" fuera del ciclo de vida de una request de Next).
 */

/** Prompts contextuales para tarjetas compartibles — cinematografía deportiva de máximo impacto */
export const MILESTONE_IMAGE_PROMPTS: Record<string, string> = {
  "contrato-debut": "Epic cinematic photograph: [AGE] footballer in pristine [CLUB_KIT] football jersey, holding the jersey up with both hands in the center frame, absolutely beaming with pride and emotion. Club president shaking hands in sharp focus beside him. Background: blurred modern club office with floor-to-ceiling windows showing daylight, executive portraits on walls. Professional studio lighting casting perfect key light on face and jersey. Vibrant emerald-green field colors, crisp white jersey accents, golden morning light. Shot composition: dynamic diagonal lines, trophy visible on table behind, newspaper with headline visible on desk. Photojournalism award-winning sports photography, editorial fashion, emotional triumph captured in single frame, cinematic color grading, 8K detail",

  "contrato-fallback": "Golden hour cinematic sports photography: [AGE] footballer clutching his [CLUB_KIT] jersey like a trophy, eyes locked forward with determination and joy, contract papers and pen visible on mahogany table. Director in suit presenting official papers. Office background: expensive wooden panels, large club crest on wall, natural daylight flooding through windows. Warm golden hour light kissing his face, creating dramatic shadows that emphasize emotion. Color palette: deep burgundy, gold accents, crisp white papers. Ultra-sharp focus on expression and jersey details, shallow depth of field background. Professional sports portrait, Getty Images quality, raw emotion of beginning a dream career, cinematic lighting, premium photography",

  "par-hat-trick": "Explosive action photograph at night: [AGE] footballer mid-celebration with three fingers held high in the air, screaming with pure joy and ecstasy. Center frame dominance. Teammates rushing toward him in celebratory pile. Stadium background: dazzling LED lights creating vibrant color palette, massive crowd (thousands visible) creating bokeh of phone flashlights. Soccer ball visible in lower corner. Perfect lighting on face showing sweat, pure adrenaline, and triumph. Motion blur in background emphasizing the intensity. Ultra-vivid colors: neon green field markings, bright stadium whites, electric crowd energy. Sports moment that defines legacy, ESPN highlight reel quality, raw athletic ecstasy, 4K broadcast standards",

  "fork-titulo-liga": "Iconic trophy lift moment in golden stadium light: [AGE] footballer at apex of celebration, massive league trophy held high above head with both hands, pure joy radiating from face. Confetti explosion filling entire frame (photorealistic thick confetti clouds). Teammates surrounding, crowd visible going absolutely insane behind. Stadium floodlights creating perfect dramatic backlighting, golden hour glow, lens flare effects. Ground perspective: packed stadium seats, sea of supporters. Vibrant trophy gold reflections, field green, clear blue sky above stadium rim. This is the moment that wins sports photography awards — pure triumph, legacy-defining, family heirloom quality image. Cinematic sports moment, Getty Images iconic, museum-quality composition",

  "fork-champions": "Cinematic European grandeur: [AGE] footballer holding the enormous European club trophy (Champions League style) with both arms raised high, face glowing with historic achievement. MASSIVE fireworks exploding in sky behind him (real fireworks, not subtle). Confetti cannons firing in foreground. Packed stadium at night with thousands of phone lights creating magical bokeh. International crowd visible going insane. Perfect dramatic lighting: stadium floodlights + fireworks + golden trophy glow. Color palette: deep night blue sky, golden trophy reflections, white fireworks, vibrant crowd energy. This image is ICONIC — the kind that gets printed on sports posters, merchandise, coffee table books. Worldwide legacy moment. Cinematic masterpiece, Academy Awards level sports photography",

  "vid-boda": "Romantic wedding moment with athletic elegance: [AGE] footballer in crisp black tuxedo with white dress shirt, smiling warmly and genuinely. Standing with bride (or partner) by his side in wedding attire. Teammates visible in soft-focus background in formal wear, suggesting brotherhood witness. Elegant wedding venue: cathedral-style architecture, warm candlelight + natural golden hour sunlight streaming through tall windows. Floral arrangements in muted tones. Perfectly balanced lighting that emphasizes the couple's joy. Warm color palette: golden hour amber, champagne tones, white accents, deep blacks. Moment that transcends sport — human connection, love, legacy beyond football. High-fashion wedding photography standards, premium quality, emotional and genuine, sophisticated and timeless",

  "par-mvp-partido-clave": "Triumphant award moment under stadium lights: [AGE] footballer holding the man-of-the-match trophy at chest level, beaming with pride, facing camera directly. On-field setting: grass visible, stadium lights creating dramatic key lighting on face. Teammates applauding in background (some with hands up), coach nodding approvingly. Camera flashes visible (bokeh) creating energy. Pristine [CLUB_KIT] jersey with sweat and effort visible but immaculate. Color palette: emerald field, vibrant stadium lighting, golden trophy accents, white crowd areas. This is the moment every athlete dreams of — individual recognition in team sport. Perfect composition, dynamic diagonal lines, award-winning sports photography, emotional authenticity",

  "rep-renovacion-contrato": "Power moment of commitment: [AGE] footballer in [CLUB_KIT] jersey holding it up with absolute conviction, signing a major contract. Club president or director shaking hand while nodding approvingly. Modern executive office: glass walls, minimalist design, large windows with city skyline visible behind. Dramatic side-lighting emphasizing resolve and determination on face. Mahogany contract on table with visible signatures. Color palette: crisp whites, deep blacks, jewel tones, city lights bokeh through windows. This represents dedication and loyalty — not just money, but legacy commitment. Premium sports business photography, editorial quality, aspirational imagery",

  "fork-ascenso-division": "Celebratory pitch invasion moment: [AGE] footballer with arms raised in pure joy, teammates surrounding in celebratory embrace. Field is packed with celebrating players. Crowd visible going absolutely wild in background. Stadium atmosphere electric. Evening/dusk lighting creating dramatic shadows and warm tones. Grass fresh and vibrant green, white pitch lines sharp. Multiple celebrations happening simultaneously creating kinetic energy. Color palette: natural field greens, blue sky, warm sunset tones, crowd colors. This is about collective triumph — the entire team rising together. Epic cinematic sports moment, documentary photography quality, pure team joy",

  "premio-balon-oro": "Red carpet royalty moment: [AGE] footballer in impeccable black tuxedo with white bow tie, holding the iconic Balón de Oro trophy at waist level, confident and composed smile. Red carpet stretches behind. Professional event photographers visible (bokeh flashes in background). Elegant awards ceremony backdrop with luxury branding. Theatrical stage lighting creating perfect skin tones and highlighting the trophy's gleaming surfaces. Formal audience members in background in evening wear. Color palette: deep blacks and golds, rich burgundy carpet, white dress shirts, golden trophy reflection. This represents the pinnacle of individual achievement — the world's best footballer. Premium fashion and sports photography combined, museum-quality, aspirational and iconic",

  "sel-primera-convocatoria": "Pride and patriotism: [AGE] footballer in pristine national team kit (perfectly clean and tailored), standing tall with hand on heart or fist raised. National flag visible prominently in background (not blurred, clearly visible). Modern national team stadium as backdrop. Patriotic lighting — dramatic and respectful. Fellow players visible in formation behind. Color palette: national colors prominent and vibrant, field green, clear sky. This is about representing your nation — honor, duty, pride. Cinematic national anthem quality, official team photography, emotional and respectful composition",

  "sel-capitania": "Leadership embodied: [AGE] footballer wearing captain's armband prominently (armband large and perfectly visible in frame), holding it proudly with one hand, looking forward with absolute confidence and maturity. National team kit impeccable. Teammates visible behind in formation, showing respect. Stadium background, focused intensity. Dramatic professional lighting emphasizing maturity and responsibility. Color palette: national colors, armband color prominent, field backdrop. This represents the peak of leadership in international football. Premium editorial sports photography, iconic leadership imagery, dignified and inspiring",

  "sel-mundial": "World Cup triumph moment: [AGE] footballer in national team kit jumping with ecstatic celebration, arms spread wide, absolutely screaming with joy. World Cup stadium (iconic) in background. MASSIVE crowd visible going insane, confetti in air. Multiple teammates joining celebration in frame. Incredible stadium lighting creating cinematic atmosphere. Ball visible in frame or goal posts. Color palette: national colors vivid and dominant, stadium greens, crowd colors, night lighting creating dramatic contrast. This is the moment of ultimate international achievement. World-class sports photography, Getty Images iconic, FIFA quality imagery, life-defining moment",

  "sel-eurocopa": "Continental triumph: [AGE] footballer celebrating with intensity on European championship pitch, arms raised, teammates joining. Iconic European stadium architecture visible. European crowd (diverse, colorful). Evening/night lighting creating dramatic European stadium atmosphere. Flag of nation visible. Color palette: national colors vibrant, European stadium architecture tones, diverse crowd colors. This represents continental-level achievement. Premier League/UEFA quality photography, prestigious international moment, emotional and triumphant",

  "sel-copa-america": "Passion and celebration: [AGE] footballer celebrating on South American championship pitch with raw emotion and passion, teammates embracing. Tropical stadium atmosphere (palm trees, warm colors visible). South American crowd energy visible. Warm lighting creating golden tones. Field vibrant green, sky warm. National colors dominant. Color palette: tropical warmth, national pride colors, green field, golden hour tones. This represents continental South American achievement. Dynamic action photography, celebratory intensity, colorful and vibrant composition",

  "premio-golden-boy": "Gala moment: [AGE] holding a golden youth-award trophy on an elegant stage, wearing a sharp dark suit with an open collar, a proud and slightly overwhelmed smile, camera flashes (bokeh) and an elegant audience in evening wear behind him, warm theatrical lighting, deep blacks and golds, cinematic fashion and sports photography, no readable text anywhere",
  "premio-pichichi": "Golden scorer's moment: [AGE] footballer holding the Pichichi trophy high with victorious smile, golden trophy gleaming. Stadium background, field visible. Golden hour lighting or theatrical stage lighting creating trophy reflection. Soccer ball visible in composition. Teammates or crowd in soft focus background. Color palette: golden trophy dominant, emerald field, warm lighting, white crowd areas. This represents the pinnacle of individual scoring achievement — the top goal-scorer of the league. Premium sports photography, golden hour cinematography, achievement imagery",

  "premio-mvp-torneo": "Tournament MVP crowning moment: [AGE] footballer on stage holding massive MVP trophy, standing between club officials or ceremony presenters. Plain stage background with absolutely no readable text, logos, sponsor names or competition branding. Professional event lighting creating perfect visibility of trophy and expression. Audience visible (blurred), creating atmosphere. Formal presentation moment captured. Color palette: stage lighting tones, trophy gold, formal blacks and whites, crowd bokeh. This represents tournament-level individual dominance. Premium award ceremony photography, official tournament imagery, prestige and achievement captured",
};

/**
 * Traduce los milestoneType usados en el motor narrativo a los tipos de
 * escena que sabe dibujar contextual-image-prompts.ts. Cualquier tipo que
 * no aparezca aquí cae al event.imageScene (que la IA ya genera contextual
 * por evento) en vez de forzar un genérico.
 */
export const MILESTONE_TYPE_TO_CONTEXT_TYPE: Record<string, string> = {
  representante: "representante_primera_firma",
  fichaje_agente: "representante_primera_firma",
  puja_agente: "representante_primera_firma",
  agencia: "representante_primera_firma",
  contrato: "transferencia_fichaje",
  fichaje_galactico: "transferencia_fichaje",
  oferta_fondo: "transferencia_fichaje",
  cantera: "transferencia_fichaje",
  cantera_propia: "transferencia_fichaje",
  canterano: "transferencia_fichaje",
  filial: "transferencia_fichaje",
  debut: "debut_primer_partido",
  lesion_debut: "debut_primer_partido",
  gol: "gol_celebracion",
  gol_decisivo: "gol_celebracion",
  hat: "gol_celebracion",
  primer_gol: "gol_celebracion",
  primer_hat_trick: "gol_celebracion",
  primer_titulo: "trofeo_levantando",
  titulo: "trofeo_levantando",
  titulo_presidente: "trofeo_levantando",
  final_champions: "trofeo_levantando",
  copa_america: "trofeo_levantando",
  eurocopa: "trofeo_levantando",
  mundial: "trofeo_levantando",
  capitania: "capitan_brazalete",
  premio: "recordista_marca",
  balon_oro_cliente: "recordista_marca",
  hall_fama: "recordista_marca",
  prensa: "entrevista_prensa",
  fondo_deportivo: "beneficencia_caridad",
  mvp: "victoria_epica",
  tactica: "entrenamiento_intenso",
  pretemp: "entrenamiento_intenso",
  pretemporada: "entrenamiento_intenso",
  seleccion: "debut_internacional",
  presidente_federacion: "debut_internacional",
};

/**
 * Limpieza de cualquier prompt de foto antes de enviarlo: «Getty Images» hacía que el modelo dibujara la marca de agua
 * y el crédito del fotógrafo, y «camiseta sobre los hombros» le hacía poner una segunda camiseta encima de la que ya llevaba.
 */
export function cleanImagePrompt(prompt: string, opts: { surname?: string | null } = {}): string {
  // Si la escena enseña el nombre en una camiseta, tiene que ser el apellido REAL del jugador (salía «Rodríguez»).
  const surname = (opts.surname ?? "").trim().toUpperCase();
  const showsShirtName = surname && /(name|surname|apellido)/i.test(prompt) && /(back|shirt|jersey)/i.test(prompt);
  const nameRule = showsShirtName ? ` The only name that may appear on any shirt is his own surname, exactly spelled "${surname}" in capital letters; never write any other surname.` : "";
  const cleaned = (prompt + nameRule)
    .replace(/Getty Images/gi, "press-agency")
    .replace(/jersey over (his )?shoulders?/gi, "jersey worn normally on his body")
    // «Away kit» (un partido en Múnich) dejaba que el modelo inventara una camiseta azul con «MADRID»: la camiseta del club es siempre la que se pide.
    .replace(/(?<!team )\b(away|second|alternate|alternative|third|visiting|road)([ -])(kit|jersey|shirt|strip)\b/gi, "club $3");
  return /no watermark/i.test(cleaned) ? cleaned : `${cleaned} No watermark and no photographer credit; no text anywhere except what is explicitly requested above; no names, numbers or lettering printed on the front of any worn shirt; any crest or badge is small, simple and clean (never a large invented emblem); one jersey per person only (no second shirt draped over the shoulders).`;
}

export function getMilestoneImagePrompt(
  eventId: string,
  age: number,
  club?: string,
  playerName?: string,
  milestoneType?: string,
  agentName?: string,
): string | null {
  const safePlayerName = playerName || "jugador";

  // 1) Prompts cinematográficos hechos a mano para IDs de evento conocidos
  //    (los más elaborados: fichaje, hat-trick, título, boda, Balón de Oro...)
  // Las galas de premios (award-balon-oro-*, award-golden-boy-*) llevan su propia escena: sin esto, el tipo "premio" caía
  // en la escena de "récord" (un marcador con "50 goles") y salía una foto que no tenía nada que ver con la gala.
  const promptKey = eventId.startsWith("award-balon-oro") ? "premio-balon-oro" : eventId.startsWith("award-golden-boy") ? "premio-golden-boy" : eventId;
  const basePrompt = MILESTONE_IMAGE_PROMPTS[promptKey];
  // La primera firma también se presenta de varias formas (apretón de manos con el presidente, camiseta con tu apellido...).
  if ((promptKey === "contrato-debut" || promptKey === "contrato-fallback") && club && Math.random() < 0.65) {
    return pickSigningScene(safePlayerName, club);
  }
  if (basePrompt) {
    let prompt = basePrompt;
    // Tramos por la edad real (antes de 18 a 22 salía «20-23», de 28 a 31 «veterano» y de 32 a 34 «35+»).
    const ageContext =
      age < 18
        ? "young 16-17 year old footballer"
        : age < 23
          ? `young ${age}-year-old footballer`
          : age < 30
            ? `${age}-year-old footballer in his prime`
            : age < 34
              ? `experienced ${age}-year-old footballer`
              : `veteran ${age}-year-old footballer`;
    // El look (barba, peinado) evoluciona con la edad del jugador.
    prompt = prompt.replace("[AGE]", `${ageContext}, ${describeLook(age, safePlayerName)}`);
    if (club && prompt.includes("[CLUB_KIT]")) {
      prompt = prompt.replace("[CLUB_KIT]", describeKit(club));
    } else if (club && !/national team|world cup|euro 20|selecci/i.test(prompt)) {
      // Las escenas sin camiseta propia dejaban que el modelo eligiera una al azar (salió el escudo del Barça en un jugador del Liverpool).
      prompt += ` If he wears any club kit, tracksuit or jacket, it is exactly: ${describeKit(club)}; never another club's colours or crest.`;
    }
    return prompt;
  }

  // 2) Sin ID exacto: mapea el milestoneType a un tipo de escena contextual
  //    real (agente, camiseta, gol, trofeo...), nunca al eventId crudo.
  const mappedType = milestoneType ? MILESTONE_TYPE_TO_CONTEXT_TYPE[milestoneType] : undefined;
  if (mappedType) {
    return getContextualImagePrompt(mappedType, safePlayerName, age, {
      clubName: club || "",
      agentName: agentName || "su representante",
    });
  }

  // 3) Sin match conocido: deja que el caller use event.imageScene, que la
  //    IA ya genera específico para ese evento — mejor que un genérico.
  return null;
}


/**
 * Las escenas de foto que escribe la IA (event.imageScene) no sabían nada de
 * la camiseta real del club, de la edad del jugador ni de que el modelo de
 * imagen inventa texto: salió un chico de 19 años con pinta de 35, de azul
 * jugando con el Real Madrid, y un marcador con "HAT-TRICK" en un 1-2. Estas
 * cláusulas se añaden al final de cualquier escena de IA.
 */
export function withSceneGuards(scene: string, opts: { club?: string; age: number; nationalTeam?: boolean; nation?: string; surname?: string; position?: string }): string {
  const ageText =
    opts.age < 18
      ? "a 16-17 year old teenager"
      : opts.age < 26
        ? `a ${opts.age}-year-old young man with a youthful, clean-shaven or lightly stubbled face, no wrinkles, no grey hair, looking clearly in his early twenties`
        : `a ${opts.age}-year-old man`;
  // Con la selección, la camiseta es la de la selección (antes no se decía ninguna y salía una cualquiera: rojinegra y sin escudo).
  // Sin club todavía no hay camiseta de club (salía una inventada con colores al azar).
  const noClub = !opts.club || opts.club === NO_CLUB_YET;
  const kit = /national team (home|away) kit/.test(scene)
    ? ""
    : opts.nationalTeam
    ? opts.nation
      ? ` If he wears a football kit, it is ${describeNationalKit(opts.nation)}.`
      : ""
    : !noClub
      ? ` If he wears a football kit, it is: ${describeKit(opts.club as string)}.`
      : " He does not wear any club kit or crest: plain training wear or casual clothes.";
  // El portero juega de portero: guantes, camiseta de portero (de un color distinto al del resto) y nada de celebrar goles como un delantero.
  const keeper = opts.position === "Portero" ? " He is a goalkeeper: if he wears a football kit it is a goalkeeper kit with gloves in a colour clearly different from his outfield teammates; show him making or celebrating a save, never scoring." : "";
  return `${scene} Requirements: the man is ${ageText}.${kit}${keeper} Every person in the image is a living athlete caught mid-action with natural motion: never a statue, sculpture, mannequin or frozen figure. Any goalkeeper wears a goalkeeper kit of a clearly different colour from the outfield players and is in a natural diving or standing position. Realistic sports photography. No readable text anywhere in the image: no scoreboard numbers, no captions, no banners with words, and no names at all${opts.surname ? ` except his own surname "${opts.surname.toUpperCase()}" (only if a shirt back is shown)` : ""}.`;
}
