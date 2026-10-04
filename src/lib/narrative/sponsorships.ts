import type { GameEvent } from "@/types/career";

export const SPONSORSHIP_EVENTS: Record<string, GameEvent> = {
  "sponsor-adidas-botas": {
    id: "sponsor-adidas-botas",
    category: "especial",
    title: "Adidas te propone una línea de botas personalizada",
    description: "El equipo de Adidas se pone en contacto. Quieren lanzar una edición limitada de botas con tu nombre, diseño personalizado y tu número. Es un acuerdo importante.",
    isMilestone: true,
    milestoneType: "sponsor",
    imageScene: "Photorealistic Getty Images photo of a footballer crouching on one knee on a training pitch, holding up a brand-new pair of personalized football boots with his name and number stitched on the side, studio-quality product lighting mixed with natural daylight, proud focused expression, sponsor branding subtly visible on packaging nearby, professional sports marketing photography",
    options: [
      {
        id: "aceptar-adidas-botas",
        label: "Aceptar: firma el acuerdo",
        subtitle: "Botas personalizadas, acuerdos de exclusividad y dinero mensual",
        consequences: { patrimonio: 15000, fama: 8, rel_representante: 3 , flags: { sponsor_botas: "Adidas" } },
        outcomeText: "Firmas con una sonrisa y el diseñador te enseña el primer boceto: tu nombre bordado en el talón, tu dorsal en la lengüeta. Sales de la reunión sintiendo que ya eres una marca.",
      },
      {
        id: "rechazar-adidas-botas",
        label: "Rechazar: prefiero mantenerme independiente",
        subtitle: "Sigues siendo libre de elegir marca, pero pierdes una oportunidad importante",
        consequences: { moral: 2 },
        outcomeText: "El responsable de la marca asiente con educación y recoge los papeles sin una queja. En la puerta, tu representante te mira en silencio, y ya sabes lo que piensa.",
      },
      {
        id: "negociar-adidas-botas",
        label: "Negociar: solo si añaden beneficios adicionales",
        subtitle: "Intentas mejorar los términos del contrato",
        consequences: { patrimonio: 18000, fama: 10, forma: 2 , flags: { sponsor_botas: "Adidas" } },
        outcomeText: "Después de dos rondas tensas, la marca cede en casi todo. Cierras un acuerdo mejor del que traían y la prensa lo cuenta como una victoria tuya.",
      },
    ],
  },

  "sponsor-nike-acuerdo": {
    id: "sponsor-nike-acuerdo",
    category: "especial",
    title: "Nike te ofrece ser su embajador en la región",
    description: "La marca más icónica del fútbol te contacta. Quieren que lleves sus botines en todos los partidos y aparezcas en campañas publicitarias. Es un salto importante.",
    isMilestone: true,
    milestoneType: "sponsor",
    imageScene: "Photorealistic Getty Images advertising campaign photo of a footballer in an athletic pose against a bold minimalist studio backdrop, confident powerful expression, dramatic side lighting, brand ambassador photoshoot aesthetic, premium sportswear photography, magazine-cover quality",
    options: [
      {
        id: "aceptar-nike",
        label: "Firmar con Nike",
        subtitle: "Prestigio internacional y ingresos consistentes",
        consequences: { patrimonio: 20000, fama: 12, moral: 5 , flags: { sponsor_botas: "Nike" } },
        outcomeText: "Cuando se hace público, tu móvil explota con felicitaciones. En el entrenamiento, algún compañero te silba al ver la caja con las botas nuevas.",
      },
      {
        id: "rechazar-nike",
        label: "Declinar: demasiado compromiso",
        subtitle: "No quieres estar tan atado a una marca",
        consequences: { forma: 1 },
        outcomeText: "Dices que no a la marca más grande del fútbol. La noticia se filtra y medio vestuario te pregunta si te has vuelto loco. Tú sonríes y no explicas nada.",
      },
      {
        id: "negociar-nike",
        label: "Negociar plazos y exclusividades",
        subtitle: "Quieres libertad para otras colaboraciones menores",
        consequences: { patrimonio: 22000, fama: 13, rel_representante: 5 , flags: { sponsor_botas: "Nike" } },
        outcomeText: "Nike acepta lo esencial y tú sales con libertad para otras colaboraciones. Tu representante levanta el pulgar al otro lado de la sala.",
      },
    ],
  },

  "sponsor-marca-emergente": {
    id: "sponsor-marca-emergente",
    category: "especial",
    title: "Una startup de equipamiento deportivo quiere asociarse contigo",
    description: "Una marca nueva, ágil y con mucho presupuesto de inversión te busca. No tienen el histórico de Nike o Adidas, pero ofrecen más libertad creativa y menos restricciones.",
    isMilestone: true,
    milestoneType: "sponsor",
    imageScene: "Photorealistic photo of a footballer in a modern minimalist design studio, examining a prototype piece of sports gear with a small emerging brand's logo, casual creative atmosphere, exposed brick and natural light, relaxed genuine smile, editorial startup-culture photography",
    options: [
      {
        id: "aceptar-startup",
        label: "Apostar por la startup",
        subtitle: "Menos dinero ahora, pero acciones de la empresa y mayor protagonismo",
        consequences: { patrimonio: 12000, fama: 6, forma: 3 , flags: { sponsor_botas: "una startup de equipamiento" } },
        outcomeText: "Los fundadores te reciben con camisetas a medida y una tarta con tu cara. Se les nota la ilusión: contigo han puesto en marcha su sueño.",
      },
      {
        id: "jugar-seguro-startup",
        label: "Rechazar: prefiero marcas consolidadas",
        subtitle: "Las startups pueden desaparecer. Demasiado riesgo.",
        consequences: {},
        outcomeText: "Los fundadores te dan las gracias con una sonrisa forzada y se despiden en la puerta. Dos semanas después, ves su campaña con otro futbolista.",
      },
      {
        id: "dual-patrocinio",
        label: "Proponer: yo con ambas marcas (botas y ropa)",
        subtitle: "Intentas monetizar ambos espacios sin conflicto",
        consequences: { patrimonio: 16000, fama: 7, rel_representante: 3 , flags: { sponsor_botas: "una startup de equipamiento" } },
        outcomeText: "La startup no esperaba la contrapropuesta, pero acepta tras pensárselo una noche. Tu representante te guiña un ojo: has convertido un sí en dos.",
      },
    ],
  },

  "sponsor-reloj-lujo": {
    id: "sponsor-reloj-lujo",
    category: "especial",
    title: "Una marca suiza de lujo quiere que uses su reloj",
    description: "Relojes de lujo solo para atletas de élite. Te proponen ser el futbolista que represente la marca. Apariciones en eventos, publicidad exclusiva, y un reloj personalizado para ti.",
    isMilestone: true,
    milestoneType: "sponsor",
    imageScene: "Photorealistic luxury advertising photograph of a footballer in an elegant tailored suit, close-up on wrist showing an exquisite luxury watch, sophisticated dark backdrop, dramatic rim lighting highlighting the watch's metal and glass, refined confident expression, premium editorial fashion photography",
    options: [
      {
        id: "aceptar-reloj-lujo",
        label: "Aceptar: quiero imagen de élite",
        subtitle: "Dinero, prestigio y un reloj de colección",
        consequences: { patrimonio: 18000, fama: 10, moral: 4 , flags: { sponsor_reloj: true } },
        outcomeText: "En la presentación te colocan el reloj en la muñeca con un cuidado casi ceremonial. Al primer flash, entiendes por qué esta marca solo trabaja con élites.",
      },
      {
        id: "rechazar-reloj",
        label: "No, los relojes no van conmigo",
        subtitle: "No encaja con tu estilo personal",
        consequences: {},
        outcomeText: "La marca lo acepta con elegancia suiza: ni un reproche. Te mandan, eso sí, una caja con una tarjeta: 'Por si cambias de opinión'.",
      },
    ],
  },

  "sponsor-energia-bebida": {
    id: "sponsor-energia-bebida",
    category: "especial",
    title: "Una bebida energética te propone patrocinio",
    description: "Quieren que sea tu bebida oficial. Apariciones en anuncios, presencia en redes sociales, y comisiones por venta. Es más accesible que los acuerdos de equipamiento.",
    isMilestone: true,
    milestoneType: "sponsor",
    imageScene: "Photorealistic energetic advertising photograph of a footballer mid-motion holding up a branded energy drink can, water droplets on the can, vibrant dynamic studio lighting with colorful gel lights, sweat and athletic intensity visible, high-energy commercial photography",
    options: [
      {
        id: "aceptar-bebida",
        label: "Aceptar: ingresos pasivos fáciles",
        subtitle: "Dinero constante sin mucho esfuerzo",
        consequences: { patrimonio: 8000, fama: 5 , flags: { sponsor_bebida: true } },
        outcomeText: "Grabáis el anuncio en una sola tarde. Al verlo en televisión, tu madre llama para decirte que sales demasiado serio bebiendo eso.",
      },
      {
        id: "rechazar-bebida",
        label: "Rechazar: no quiero asociarme a bebidas",
        subtitle: "Prefieres mantener tu imagen limpia de productos procesados",
        consequences: {},
        outcomeText: "Declinas con educación. Un nutricionista del club te lo agradece públicamente en una entrevista y ganas puntos entre la gente que cuida lo que come.",
      },
      {
        id: "renegociar-bebida",
        label: "Solo si es una marca natural/saludable",
        subtitle: "Aceptas pero con condiciones sobre el tipo de producto",
        consequences: { patrimonio: 10000, fama: 6, moral: 2 , flags: { sponsor_bebida: true } },
        outcomeText: "La marca se compromete a una línea natural solo para ti. Te mandan muestras a casa y tu pareja se come la mitad antes de que las pruebes.",
      },
    ],
  },

  "sponsor-videojuego": {
    id: "sponsor-videojuego",
    category: "especial",
    title: "Un videojuego de fútbol quiere tu licencia",
    description: "Quieren usar tu cara, nombre y datos para el juego. Es un acuerdo puro de derechos de imagen. Dinero sin compromiso, solo apariciones digitales.",
    isMilestone: true,
    milestoneType: "sponsor",
    imageScene: "Photorealistic photo of a footballer standing inside a motion-capture studio wearing a tracking suit covered in small reflective markers, surrounded by ring lights and camera rigs, technicians blurred in background, curious amused expression, behind-the-scenes video game production photography",
    options: [
      {
        id: "aceptar-videojuego",
        label: "Firmar: dinero por usar mi cara",
        subtitle: "Acuerdo simple, ingresos directos",
        consequences: { patrimonio: 12000, fama: 8 , flags: { licencia_videojuego: true } },
        outcomeText: "Te escanean la cara en una cabina de cien cámaras y te piden que hagas tu celebración. Dentro de un año, millones de chavales jugarán contigo sin saberlo.",
      },
      {
        id: "rechazar-videojuego",
        label: "Rechazar: mi imagen es solo mía",
        subtitle: "No quieres que otros moneticen tu identidad",
        consequences: {},
        outcomeText: "Dices que tu imagen es tuya y de nadie más. El equipo legal del juego se encoge de hombros: lo pondrán con un jugador genérico, y hasta ahí llegó.",
      },
    ],
  },

  "sponsor-ropa-casual": {
    id: "sponsor-ropa-casual",
    category: "especial",
    title: "Una marca de ropa casual te ofrece colaboración",
    description: "No es equipamiento deportivo, es ropa urbana. Te proponen diseñar una colección contigo, usar tu nombre, y aparecer en las tiendas. Más creativo, menos deporte.",
    isMilestone: true,
    milestoneType: "sponsor",
    imageScene: "Photorealistic streetwear fashion photograph of a footballer in stylish urban casual clothing (not football kit), leaning against an exposed concrete wall with graffiti-style street art, confident relaxed pose, natural outdoor city lighting, high-fashion lookbook photography",
    options: [
      {
        id: "aceptar-casual",
        label: "Aceptar: quiero ser diseñador",
        subtitle: "Ingresos creativos, presencia en moda",
        consequences: { patrimonio: 14000, fama: 9, moral: 3 },
        outcomeText: "En el estudio de diseño te pasan telas, bocetos y colores. Te cuesta escoger, pero cuando te ves con la primera prenda, algo cambia dentro de ti.",
      },
      {
        id: "rechazar-casual",
        label: "No: soy futbolista, no modisto",
        subtitle: "Prefieres enfocarte 100% en el fútbol",
        consequences: { forma: 1 },
        outcomeText: "Se lo dices tal cual: 'soy futbolista, no modisto'. Ellos se ríen, te estrechan la mano y se van sin enfadarse.",
      },
    ],
  },

  "sponsor-inmobiliaria": {
    id: "sponsor-inmobiliaria",
    category: "especial",
    title: "Un proyecto residencial de lujo te ofrece ser su cara visible",
    description: "Quieren que promociones su nuevo desarrollo inmobiliario. Tu cara en vallas, anuncios, eventos de inauguración. Es más allá del deporte: estás entrando en negocios.",
    isMilestone: true,
    milestoneType: "sponsor",
    imageScene: "Photorealistic photo of a footballer in a tailored suit standing in front of a luxury residential building model or architectural rendering display, gesturing toward it with a confident business smile, modern real estate showroom setting, professional corporate photography, warm interior lighting",
    options: [
      {
        id: "aceptar-inmobiliaria",
        label: "Aceptar: ingresos pasivos vía bienes raíces",
        subtitle: "Dinero ahora, posible inversión después",
        consequences: { patrimonio: 20000, fama: 10 },
        outcomeText: "Posas delante de un edificio de lujo con el casco puesto. El fotógrafo te pide que mires lejos, 'como quien ya ve el futuro'. Casi te ríes.",
      },
      {
        id: "rechazar-inmobiliaria",
        label: "Declinar: muy alejado de mi carrera",
        subtitle: "Quieres mantener tu enfoque deportivo",
        consequences: {},
        outcomeText: "El promotor se queda mirando los planos y asiente: 'entiendo'. Luego añade en voz baja que si algún día cambias de idea, la oferta seguirá ahí.",
      },
      {
        id: "negocios-inmobiliaria",
        label: "Negociar: además de cara visible, quiero participación",
        subtitle: "Intentas ser socio, no solo embajador",
        consequences: { patrimonio: 25000, fama: 12, rel_representante: 5 },
        outcomeText: "Después de varias llamadas, aceptan darte una pequeña participación en el proyecto. Es la primera vez que firmas algo que te hace dueño de una parte.",
      },
    ],
  },

  "sponsor-banca": {
    id: "sponsor-banca",
    category: "especial",
    title: "Un banco te ofrece ser su embajador de 'atletas de éxito'",
    description: "Quieren ser tu banco oficial, prestarte dinero con tasas especiales y que aparezcas en sus campañas. Es un acuerdo que mezcla finanzas y marketing.",
    isMilestone: true,
    milestoneType: "sponsor",
    imageScene: "Photorealistic corporate advertising photograph of a footballer in a sharp business suit standing confidently in a modern bank branch or glass-walled financial office, subtle bank branding visible, professional formal lighting, trustworthy composed expression, premium financial services campaign photography",
    options: [
      {
        id: "aceptar-banca",
        label: "Aceptar: finanzas + publicidad",
        subtitle: "Dinero y acceso a crédito privilegiado",
        consequences: { patrimonio: 16000, fama: 8, rel_representante: 4 },
        outcomeText: "En la sede del banco te enseñan un anuncio con tu cara en una pared de dos pisos. Tu padre, que está contigo, se hace una foto debajo.",
      },
      {
        id: "rechazar-banca",
        label: "No: no quiero deberle nada a un banco",
        subtitle: "Prefieres manejar tus finanzas de forma independiente",
        consequences: {},
        outcomeText: "Dices que no quieres deber nada a ningún banco y el director te mira con respeto, aunque algo contrariado. Tu padre aprueba con un gesto de cabeza.",
      },
    ],
  },

  "sponsor-local-regional": {
    id: "sponsor-local-regional",
    category: "especial",
    title: "Una empresa local importante quiere patrocinarte",
    description: "No es una marca internacional, pero es importante en tu región. Te proponen apoyarlos en eventos locales, publicidad regional y dinero modesto. Es más humano, menos corporativo.",
    isMilestone: true,
    milestoneType: "sponsor",
    imageScene: "Photorealistic warm community photograph of a footballer posing with the modest storefront or team banner of a local family business, genuine friendly smile, small-town atmosphere, natural daylight, humble down-to-earth photography style, local newspaper quality",
    options: [
      {
        id: "aceptar-local",
        label: "Aceptar: apoyar lo local",
        subtitle: "Dinero moderado pero conexión con la comunidad",
        consequences: { patrimonio: 10000, fama: 6, moral: 4 },
        outcomeText: "Grabas el anuncio en el barrio donde creciste. El dueño de la tienda de enfrente sale a la puerta a saludarte y te regala un bocadillo.",
      },
      {
        id: "rechazar-local",
        label: "Declinar: espero ofertas mayores",
        subtitle: "Quieres patrocinios de mayor envergadura",
        consequences: {},
        outcomeText: "Rechazas la oferta de la marca local con educación. En el barrio se comenta durante días que 'ahora te crees demasiado importante'.",
      },
    ],
  },

  "sponsor-autobus-club": {
    id: "sponsor-autobus-club",
    category: "especial",
    title: "Tu cara en el autobús del club",
    description: "El club rediseña el autobús oficial del equipo para la temporada, y tu cara ocupa todo un lateral, más grande que la de cualquier otro compañero. Es la primera vez que ves tu propia imagen así de gigante, en movimiento por la ciudad.",
    isMilestone: true,
    milestoneType: "sponsor",
    imageScene: "Photorealistic photo of the photographed man's face printed huge on the side of a football club's official team bus, parked outside a stadium, dramatic low-angle shot, natural daylight, proud subtle smile looking up at his own image, professional sports photography",
    options: [
      {
        id: "orgullo-autobus",
        label: "Disfrutarlo con orgullo",
        subtitle: "Un símbolo real de lo que has llegado a ser",
        consequences: { moral: 6, fama: 4, rel_aficion: 3 },
        outcomeText: "Te haces una foto delante del autobús con tu cara pegada en el lateral. Un niño te grita desde la acera: '¡Eres tú!' Y tú dices que sí, con orgullo.",
      },
      {
        id: "incomodo-autobus",
        label: "Sentirte algo incómodo con tanto protagonismo",
        subtitle: "No querías que fuera solo tu cara",
        consequences: { moral: 1, rel_vestuario: -2 },
        outcomeText: "Pasas por debajo del autobús sin levantar la vista. En el fondo agradeces la fama, pero verte a esa escala te supera un poco.",
      },
      {
        id: "compartir-autobus",
        label: "Pedirle al club que incluya también a otros compañeros",
        subtitle: "Repartir el foco",
        consequences: { moral: 4, rel_vestuario: 5 },
        outcomeText: "El club acepta tu propuesta y el siguiente autobús lleva a varios compañeros. En el vestuario, alguien te da una palmada: 'Eso no lo hace cualquiera'.",
      },
    ],
  },

  "sponsor-marquesinas-ciudad": {
    id: "sponsor-marquesinas-ciudad",
    category: "especial",
    title: "Marquesinas por toda la ciudad",
    description: "Una marca lanza una campaña con tu imagen en marquesinas de autobús por toda la ciudad. Al salir de casa, te cruzas con tu propia cara varias veces antes de llegar al entrenamiento — algo que todavía no te acostumbras a ver.",
    isMilestone: true,
    milestoneType: "sponsor",
    imageScene: "Photorealistic street photography of the photographed man's face on a large advertising billboard at a city bus stop, urban street setting, pedestrians walking by in soft motion blur, natural daylight, candid documentary style capturing the scale of the ad",
    options: [
      {
        id: "aceptar-marquesinas",
        label: "Firmar la campaña completa",
        subtitle: "Máxima visibilidad en toda la ciudad",
        consequences: { patrimonio: 18000, fama: 12, rel_aficion: 4 },
        outcomeText: "Una semana después, tu cara aparece en cada parada de autobús de la ciudad. Tu madre manda fotos desde la calle: lleva doce.",
      },
      {
        id: "limitar-marquesinas",
        label: "Aceptar, pero limitar la campaña a tu barrio",
        subtitle: "Algo más manejable y cercano",
        consequences: { patrimonio: 10000, fama: 6, moral: 3 },
        outcomeText: "La campaña queda reducida a tu barrio. Vecinos y comerciantes se paran a verla y te saludan al pasar, como a un chaval de toda la vida.",
      },
      {
        id: "rechazar-marquesinas",
        label: "Rechazar: demasiada exposición para tu gusto",
        subtitle: "Prefieres mantener algo de vida privada",
        consequences: { moral: 2 },
        outcomeText: "Dices que no a ver tu cara en todas partes. La agencia lo respeta, y tu representante te lo agradece con un 'prefiero tu tranquilidad'.",
      },
    ],
  },

  "sponsor-times-square": {
    id: "sponsor-times-square",
    category: "especial",
    title: "Tu cara en Times Square",
    description: "Una marca global cierra el acuerdo más grande de tu carrera hasta ahora: tu imagen ocupa una pantalla gigante en pleno Times Square, en Nueva York, entre las mismas luces donde solo aparecen las estrellas más grandes del planeta. Tu representante te manda el vídeo diez veces antes de que puedas ni abrirlo.",
    isMilestone: true,
    milestoneType: "sponsor",
    minFama: 88,
    imageScene: "Photorealistic night photo of the photographed man's face on a giant digital billboard screen in Times Square, New York City, surrounded by other bright advertising screens, bustling crowds and yellow taxis below, vibrant neon city lights, iconic dramatic night photography",
    options: [
      {
        id: "aceptar-times-square",
        label: "Firmar el acuerdo global",
        subtitle: "El salto definitivo a icono mundial",
        consequences: { patrimonio: 60000, fama: 20, rel_representante: 6 },
        outcomeText: "Estás en Nueva York el día que tu cara se enciende en una pantalla de Times Square. Miles de personas pasan por debajo sin saber quién eres... excepto una niña, que te señala.",
      },
      {
        id: "compartir-times-square",
        label: "Compartir el momento con tu familia antes que con la prensa",
        subtitle: "Que lo vivan ellos primero",
        consequences: { patrimonio: 60000, fama: 16, moral: 6 },
        outcomeText: "Antes de salir en ninguna entrevista, llamas a casa. Tu madre llora y tu padre dice 'ya lo habíamos visto'. Es la mejor reacción de toda la campaña.",
      },
      {
        id: "humilde-times-square",
        label: "Quitarle importancia en público: 'sigo siendo el mismo'",
        subtitle: "Gestionar el ego con cuidado",
        consequences: { patrimonio: 60000, fama: 14, reputacion: 5 },
        outcomeText: "Dices que sigues siendo el mismo y la frase se hace viral. Tus excompañeros de la cantera te escriben: 'Eso es lo que esperábamos de ti'.",
      },
    ],
  },

  "sponsor-causa-social": {
    id: "sponsor-causa-social",
    category: "especial",
    title: "Una ONG quiere que seas su embajador deportivo",
    description: "No es dinero directo, pero es visibilidad y responsabilidad social. Quieren que ayudes a niños, aparezcas en eventos benéficos, y des voz a su causa. Prestige sin dinero.",
    isMilestone: true,
    milestoneType: "sponsor",
    imageScene: "Photorealistic heartwarming photograph of a footballer crouching down to eye level with a small group of children at a community sports field, handing out a ball or high-fiving them, genuine warm smile, soft natural daylight, documentary-style charity photography, authentic and tender moment",
    options: [
      {
        id: "aceptar-ong",
        label: "Aceptar: quiero retribuir a la sociedad",
        subtitle: "Imagen limpia, moral alta, sin dinero",
        consequences: { moral: 8, fama: 6, forma: 2 },
        outcomeText: "Visitas la sede de la ONG y un niño te regala un dibujo. Lo guardas en el bolsillo del abrigo y, aquella noche, apenas puedes dormir de la emoción.",
      },
      {
        id: "rechazar-ong",
        label: "No ahora: primero dinero",
        subtitle: "Quieres consolidar tu carrera financiera antes",
        consequences: {},
        outcomeText: "La organización lo entiende con educación, pero la noticia se filtra: 'el jugador prefiere el dinero'. Los comentarios en redes no tardan.",
      },
      {
        id: "dual-social-comercial",
        label: "Aceptar + una marca comercial simultáneamente",
        subtitle: "Dinero de una marca + reputación de la ONG",
        consequences: { patrimonio: 12000, moral: 6, fama: 10 },
        outcomeText: "Cierras ambos acuerdos a la vez. En redes, la gente aplaude tu equilibrio y, de paso, a tu representante, que lo ha organizado todo.",
      },
    ],
  },
};

// El nombre del parámetro decía "media" pero el único sitio que llama a
// esto (engine.ts) siempre le pasa player.fama a propósito: un patrocinio
// depende de cuánto se habla de ti, no de tu nivel puro sobre el campo.
// Renombrado para que no parezca un bug de "le pasan el stat equivocado".
export function isEligibleForSponsorship(fama: number): boolean {
  return fama >= 65;
}

export function getRandomSponsorshipEvent(): GameEvent {
  const events = Object.values(SPONSORSHIP_EVENTS);
  return events[Math.floor(Math.random() * events.length)];
}
