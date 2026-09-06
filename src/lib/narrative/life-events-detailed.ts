/**
 * EVENTOS DE VIDA DETALLADOS
 * Más específico, más emocional, más variado
 */

export const LIFE_EVENT_SCENARIOS = {
  // ROMANCE
  romance_meet: [
    "Conoces a alguien en un evento. Al principio es flirteo. Luego es serio.",
    "Tu amigo te presenta a alguien. Te dice que es 'como tu tipo'. Tiene razón.",
    "Vacaciones de verano. Una chica en la playa. Destino vacacional. Buena química.",
    "Redes sociales. Ella te sigue. Luego DM. Luego café. Luego... todo.",
  ],

  romance_conflict: [
    "Ella quiere que pares de viajar tanto. Tu carrera viaja. Conflicto real.",
    "Descubre una infidelidad. Tuya. Te atrapó. Ahora debe decidir si se va.",
    "Presión de casarse. Tú quieres esperar. Ella no. Padres de ella no ayudan.",
    "Ella está celosa de tu expareja. Ve una foto antigua. Arma escándalo.",
  ],

  romance_proposal: [
    "Propuesta en la cancha después de ganar. Anillo de diamantes. Todo el estadio lo ve.",
    "Cena elegante. Reserva todo meses antes. Ella se da cuenta. Dice sí llorando.",
    "Cae de rodillas en el coche. Anillo falso de broma. Luego el real. Ella grita.",
    "Viaje sorpresa a París. Torre Eiffel al atardecer. Anillo antigua de familia.",
  ],

  romance_breakup: [
    "Ella se va con alguien más. Descubres en redes que está con otro. Duele de verdad.",
    "Vosotros terminais porque tu carrera no la permite estar cerca. Ambos llorais.",
    "Ella pide que elijas: ella o el fútbol. Elegiste el fútbol ayer. Hoy se va.",
    "10 años juntos. De repente todo cambia. No sabes qué pasó. Ella tampoco.",
  ],

  // PATERNIDAD
  hijo_nacimiento: [
    "Te llama la matrona: 'Es un niño'. Cuelgas y gritas en el vestuario. Todos saben.",
    "Estás en un partido. Te pasan una nota: 'Es una niña, 3kg 200g'. Juegas como poseso.",
    "Nace prematuro. Miedo real. UCIN. Hospital. Tú ahí rezando aunque no creas.",
    "Gemelos. Anuncian en el estadio. Todos aplaudieren. Es tu mejor día.",
  ],

  hijo_conflict: [
    "Tu hijo quiere jugar al fútbol pero no lo ves en el. Él quiere complacerte. Presión.",
    "Tu hija te pide estar más tiempo en casa. Tú estás 200 días fuera. Culpa.",
    "Escuela: 'Tu hijo dice que su papá siempre está en la tele'. Él te señala así.",
    "Nacimiento de hijo coincide con final de Champions. Pierdes. Eres abuelo y he fracasado.",
  ],

  // DINERO
  dinero_ganancia: [
    "Primer salario grande (100k€/mes). Transferencia. No lo puedes creer. Lloras.",
    "Bono de fichaje. 500k€. Lo metes en la cuenta. Tu familia sale de pobreza.",
    "Patrocinios. Acuerdos publicitarios. De repente ganas sin jugar. Patrimonio +1M.",
    "Casa vendida a mayor precio de lo esperado. Gana 200k€. Inesperado. Suerte.",
  ],

  dinero_perdida: [
    "Inversión en negocio de 'amigos'. Dinero desaparece. Aprendes lección cara.",
    "Agente te roba. Descubres años después. Has perdido millones. Juicio eterno.",
    "Crisis inmobiliaria. Casa vale mitad. Crédito sigue igual. Atrapado.",
    "Demanda de expareja. Dinero para la custodia. Millones. Duele más que dinero.",
  ],

  dinero_luxury: [
    "Compras mansión de ensueño. Hecha a tu medida. Coches. Piscina olímpica.",
    "Jet privado compartido con otros futbolistas. Primera vez viajas así. Vicio.",
    "Evento benéfico. Subastas de caridad. Compras un viaje a la Luna (no existe aún). Por risa.",
    "Tu hija pide un caballo de carrera. Tienes dinero. Lo compras. Ella es feliz.",
  ],

  // FAMILIA
  muerte_familiar: [
    "Tu padre muere. Es repentino. Funeral. Tú en el campo. No puedes estar ahí.",
    "Abuela con cáncer. Visitas. Sabe que se muere. Te dice qué hacer. Consejos finales.",
    "Hermano muere en accidente de coche. Carretera mojada. Estabas en concentración.",
    "Madre tiene infarto leve. Recupera. Te hace prometer que visitarás más. Culpa.",
  ],

  muerte_shock: [
    "Muere un compañero de equipo. Joven. Aneurisma. Nadie esperaba. Equipo en duelo.",
    "Muere un rival que era tu amigo. Accidente de entrenamiento. Cierra ojos cada noche pensando en él.",
    "Muere un aficionado que SIEMPRE iba. Te pedía autógrafos. Años viéndolo. Un día no está.",
  ],

  // TRAICIÓN
  traicion_amigo: [
    "Tu mejor amigo duerme con tu pareja. Te enteras por redes. Bloques a los dos.",
    "Amigo íntimo vende historias de ti a la prensa. Privacidad violada. Nunca más hablas.",
    "Compañero de cuarto hablaba mal de ti en entrevistas. Media descubre. Conflicto abierto.",
  ],

  traicion_representante: [
    "Tu agente te roba en contrato. Clausulas ocultas. Descubres 5 años después.",
    "Representante vende tus datos a las apuestas. Conflicto de intereses. Juicio.",
    "Agente hace acuerdo secreto con otro club para que te transfieran. Te usa.",
  ],

  // RECONOCIMIENTO
  premio_individual: [
    "Balón de Oro. Tu nombre grita en París. Sueño de toda la infancia realidad.",
    "Mejor jugador de la liga. Foto en portada de revistas. Leyenda ya.",
    "Premio a la Sportsmanship. Por carácter y ética. Orgullo diferente.",
  ],

  reconocimiento_club: [
    "Retire tu número. Nunca nadie más lo usará. Eternidad en el estadio.",
    "Estatua tuya en la entrada. Bronce. Tú viendo la inauguración.",
    "Hall of Fame. Nombre en la pared con los mejores. Para siempre.",
  ],

  // ESCÁNDALO
  escandalo_privado: [
    "Video privado se filtra en redes. Íntimo. Viral. Humillación pública. Borran tras 12h pero el daño hecho.",
    "Foto tuya en fiesta sin mascarilla durante confinamiento. Hipocresía expuesta. Media ataca.",
    "Ex publica fotos de desnudos. Dichos años atrás. Consentidos pero ella enojada. Imagen dañada.",
  ],

  escandalo_pelea: [
    "Pelea en la calle. Paparazzis la captan. Viral. Ese video de vos peleándote existe para siempre.",
    "Conflicto verbal con aficionado. Lo insultas. Video en Twitter. Suspenso de 3 partidos.",
    "Agresión en el vestuario a un compañero. Investigación. Noticia nacional.",
  ],

  escandalo_politico: [
    "Tuiteas algo sin pensar. Es interpretado como sexista/racista. Tormenta media. Disculpa pública.",
    "Apoyas candidato polémico. Mitad del país te odia. 6 meses de crítica.",
  ],
};

export const LIFE_EVENTS_BY_AGE = {
  "16-20": ["romance_meet", "dinero_ganancia", "reconocimiento_club"],
  "21-25": ["romance_proposal", "hijo_nacimiento", "traicion_amigo"],
  "26-30": ["hijo_conflict", "dinero_luxury", "escandalo_privado"],
  "31-35": ["dinero_perdida", "muerte_familiar", "premio_individual"],
  "36+": ["dinero_ganancia", "traicion_representante", "reconocimiento_club"],
};

export const LIFE_EVENTS_BY_STATS = {
  high_fama: ["escandalo_privado", "escandalo_pelea", "premio_individual"],
  low_moral: ["traicion_amigo", "romance_breakup", "muerte_familiar"],
  high_patrimonio: ["dinero_luxury", "dinero_perdida"],
  low_rel_representante: ["traicion_representante", "dinero_perdida"],
};
