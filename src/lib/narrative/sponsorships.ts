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
        consequences: { patrimonio: 15000, fama: 8, rel_representante: 3 },
      },
      {
        id: "rechazar-adidas-botas",
        label: "Rechazar: prefiero mantenerme independiente",
        subtitle: "Sigues siendo libre de elegir marca, pero pierdes una oportunidad importante",
        consequences: { moral: 2 },
      },
      {
        id: "negociar-adidas-botas",
        label: "Negociar: solo si añaden beneficios adicionales",
        subtitle: "Intentas mejorar los términos del contrato",
        consequences: { patrimonio: 18000, fama: 10, forma: 2 },
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
        consequences: { patrimonio: 20000, fama: 12, moral: 5 },
      },
      {
        id: "rechazar-nike",
        label: "Declinar: demasiado compromiso",
        subtitle: "No quieres estar tan atado a una marca",
        consequences: { forma: 1 },
      },
      {
        id: "negociar-nike",
        label: "Negociar plazos y exclusividades",
        subtitle: "Quieres libertad para otras colaboraciones menores",
        consequences: { patrimonio: 22000, fama: 13, rel_representante: 5 },
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
        consequences: { patrimonio: 12000, fama: 6, forma: 3 },
      },
      {
        id: "jugar-seguro-startup",
        label: "Rechazar: prefiero marcas consolidadas",
        subtitle: "Las startups pueden desaparecer. Demasiado riesgo.",
        consequences: {},
      },
      {
        id: "dual-patrocinio",
        label: "Proponer: yo con ambas marcas (botas y ropa)",
        subtitle: "Intentas monetizar ambos espacios sin conflicto",
        consequences: { patrimonio: 16000, fama: 7, rel_representante: 3 },
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
        consequences: { patrimonio: 18000, fama: 10, moral: 4 },
      },
      {
        id: "rechazar-reloj",
        label: "No, los relojes no van conmigo",
        subtitle: "No encaja con tu estilo personal",
        consequences: {},
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
        consequences: { patrimonio: 8000, fama: 5 },
      },
      {
        id: "rechazar-bebida",
        label: "Rechazar: no quiero asociarme a bebidas",
        subtitle: "Prefieres mantener tu imagen limpia de productos procesados",
        consequences: {},
      },
      {
        id: "renegociar-bebida",
        label: "Solo si es una marca natural/saludable",
        subtitle: "Aceptas pero con condiciones sobre el tipo de producto",
        consequences: { patrimonio: 10000, fama: 6, moral: 2 },
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
        consequences: { patrimonio: 12000, fama: 8 },
      },
      {
        id: "rechazar-videojuego",
        label: "Rechazar: mi imagen es solo mía",
        subtitle: "No quieres que otros moneticen tu identidad",
        consequences: {},
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
      },
      {
        id: "rechazar-casual",
        label: "No: soy futbolista, no modisto",
        subtitle: "Prefieres enfocarte 100% en el fútbol",
        consequences: { forma: 1 },
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
      },
      {
        id: "rechazar-inmobiliaria",
        label: "Declinar: muy alejado de mi carrera",
        subtitle: "Quieres mantener tu enfoque deportivo",
        consequences: {},
      },
      {
        id: "negocios-inmobiliaria",
        label: "Negociar: además de cara visible, quiero participación",
        subtitle: "Intentas ser socio, no solo embajador",
        consequences: { patrimonio: 25000, fama: 12, rel_representante: 5 },
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
      },
      {
        id: "rechazar-banca",
        label: "No: no quiero deberle nada a un banco",
        subtitle: "Prefieres manejar tus finanzas de forma independiente",
        consequences: {},
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
      },
      {
        id: "rechazar-local",
        label: "Declinar: espero ofertas mayores",
        subtitle: "Quieres patrocinios de mayor envergadura",
        consequences: {},
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
      },
      {
        id: "rechazar-ong",
        label: "No ahora: primero dinero",
        subtitle: "Quieres consolidar tu carrera financiera antes",
        consequences: {},
      },
      {
        id: "dual-social-comercial",
        label: "Aceptar + una marca comercial simultáneamente",
        subtitle: "Dinero de una marca + reputación de la ONG",
        consequences: { patrimonio: 12000, moral: 6, fama: 10 },
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
