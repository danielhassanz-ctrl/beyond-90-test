/**
 * Los sitios del fútbol: el campo de césped artificial que te quema las rodillas, el vestuario
 * visitante sin agua caliente, el estadio con una grada que huele a incienso. Escenas de pueblo y
 * de ciudad, de modestos y de grandes, con la memoria de lo que hace distinto cada campo.
 */
import { S, o } from "../dsl";
import type { BankScene } from "../types";

export const ESTADIOS: BankScene[] = [
  S("es-cesped-artificial", "estadio", { minAge: 17, clubLevels: ["modesto"], clubTurns: [3, 400], notFlags: ["es_artificial"] }, "partido",
    "Juegas en un campo de césped artificial que te quema las rodillas",
    "Es un terreno verde brillante, con unas fibras que parecen cristal y un olor a goma recalentada. Cada vez que te deslizas, notas una quemadura. El rival, local, parece moverse como pez en el agua. El balón bota con una violencia desconocida. Un compañero, tras una caída, se levanta con la rodilla roja. El fisio, desde la banda, grita: «¡Con crema, con crema!».",
    [
      o("a", "Adaptar tu juego: menos deslizamientos, más pase corto y fuerza", "Ajustar la técnica", { forma: 2, rel_entrenador: 3, moral: 3, flags: { es_artificial: "ajusto" } }, "Cambias de estilo: más toque, menos riesgo. El rival, que esperaba una guerra, se frustra. Ganas por 2-0 con goles de segunda jugada. El míster, al final, te dice: «Esto es lo que llamamos inteligencia»."),
      o("b", "Jugar como siempre y pagar con las rodillas", "No renunciar a nada", { forma: -3, moral: 2, fama: 1, flags: { es_artificial: "siempre" } }, "Marcas un golazo en el minuto 40 con una chilena sobre el césped. Pero a la mañana siguiente, tienes las rodillas en carne viva y una cojera de abuelo. El fisio, riendo, murmura: «Por eso se llama artificial»."),
      o("c", "Pedir al míster que te rote en estos campos para cuidar las rodillas", "Gestionar la carga", { forma: 2, rel_entrenador: -1, moral: 1, flags: { es_artificial: "rotacion" } }, "El míster lo medita. «Lo tendré en cuenta». A los tres desplazamientos sobre césped artificial, te deja en casa. Las rodillas te lo agradecen. El equipo, un poco menos."),
    ]),
  S("es-vestuario-visitante", "estadio", { minAge: 16, clubTurns: [3, 400], notFlags: ["es_visitante"] }, "vestuario",
    "El vestuario visitante no tiene agua caliente y el local te sonríe desde la puerta",
    "Es un cuartucho con azulejos amarillos, una bombilla pelada y un grifo que escupe agua helada. El utillero, indignado, murmura: «Es el mismo de hace cuarenta años». Desde el pasillo, un encargado del club local, con un chándal impecable, os mira con una sonrisa piadosa: «Lo sentimos. Obras». Alguien, entre dientes, dice: «Siempre hay obras cuando venimos». Hace frío. Hay ganas de venganza.",
    [
      o("a", "Convertir la incomodidad en motivación y salir a ganar con rabia", "Usar el frío", { forma: 1, moral: 4, rel_vestuario: 5, flags: { es_visitante: "rabia" } }, "Salís al campo con una furia contenida. Ganáis 3-1. En el túnel, el encargado del club local, algo avergonzado, os mira: «Qué buen partido». Le sonreís con dignidad."),
      o("b", "Reclamar con humor y pedir una toalla caliente", "Quejarte con gracia", { moral: 3, rel_vestuario: 3, flags: { es_visitante: "humor" } }, "El encargado, desconcertado, os trae una manta térmica. Os sentáis en círculo, envueltos como una peña de abuelos. El míster, al verlo, murmura: «Qué patético y qué precioso»."),
      o("c", "Callar y dejar que sea el utillero quien se encargue", "Aguantar", { moral: -1, flags: { es_visitante: "callo" } }, "El utillero consigue agua tibia en una cafetería cercana. Os duchais en turnos, tiritando. No es un buen recuerdo. Pero a veces, el fútbol son estas pequeñas miserias."),
    ]),
  S("es-grada-incienso", "estadio", { minAge: 17, clubTurns: [3, 400], notFlags: ["es_incienso"] }, "partido",
    "Juegas en un estadio donde la grada celebra con incienso y tambores",
    "Es una tarde de calor. Al salir al campo, un olor dulce y denso te golpea: de los fondos suben nubes de incienso, con un tambor monótono que marca el ritmo. Los aficionados, de blanco, mueven las manos en el aire. Es una ceremonia, más que un partido. El capitán, pálido, murmura: «Aquí perdemos si nos descuidamos». Un niño, entre la humareda, te lanza una flor.",
    [
      o("a", "Recoger la flor y devolver un gesto de respeto a la grada", "Aceptar el rito", { rel_aficion: 5, reputacion: 4, moral: 4, flags: { es_incienso: "respeto" } }, "Besas la flor y la colocas en el bolsillo del pantalón. La grada, al verlo, enloquece de risa y respeto. Ganas, y te dedican una canción. Esa flor, seca, estará años en tu mesilla."),
      o("b", "Concentrarte en el partido e ignorar el ambiente", "Mantener el foco", { forma: 2, moral: 2, flags: { es_incienso: "foco" } }, "Te aíslas. El incienso, el tambor, los cánticos: todo es ruido. Juegas con una calma helada. Marcas dos goles y no celebras. Un periodista escribe: «El delantero que no tiembla»."),
      o("c", "Preguntar a un compañero local qué significa todo esto y escucharle con respeto", "Aprender la tradición", { rel_vestuario: 4, reputacion: 3, flags: { es_incienso: "pregunto" } }, "Te cuenta que lo hacen desde hace cien años, para honrar a un ídolo local. Te emocionas. En el siguiente partido, un aficionado te regala un amuleto del mismo ídolo. Lo llevas siempre."),
    ]),
  S("es-cesped-gigante", "estadio", { minAge: 17, clubLevels: ["grande"], clubTurns: [3, 400], notFlags: ["es_gigante"] }, "partido",
    "Un estadio enorme te hace sentir pequeño y la grada es una pared de ruido",
    "Hay setenta mil personas. Desde el centro del campo, las gradas parecen paredes de colores. El ruido es una masa sólida. Por primera vez en tu carrera, no oyes ni tu propia voz. El capitán, a tu lado, grita algo que no entiendes. Al ver el balón en el aire, piensas que parece una mota en una catedral. Notas cómo se te encoge el estómago. Y cómo, al mismo tiempo, se te enciende algo en el pecho.",
    [
      o("a", "Respirar hondo y dejar que el ruido te llene", "Absorber la energía", { moral: 8, forma: 2, rel_aficion: 4, flags: { es_gigante: "absorbo" } }, "Al primer pase, el ruido deja de ser un enemigo. Al tercero, es un aliado. Juegas con una energía que no es tuya. Al acabar, el capitán te dice: «Aquí se aprende o se acaba»."),
      o("b", "Aislarte con tus rutinas y repetir una frase para ti", "Controlar el momento", { moral: 4, forma: 2, flags: { es_gigante: "rutina" } }, "Repites mentalmente: «Un pase, un balón, un paso». Te ayuda. El partido, con ese ruido, pasa como si fuera de otro mundo. Cuando se termina, no recuerdas casi nada. Pero lo has hecho bien."),
      o("c", "Quedarte bloqueado los primeros minutos y pagar caro cada error", "Sufrir el estreno", { moral: -3, forma: -1, rel_entrenador: -1, flags: { es_gigante: "bloqueo" } }, "Los primeros veinte minutos son una pesadilla: pases fallidos, controles malos. El míster te cambia en el 60. En el vestuario, te dice: «Esto le pasa a todos. Mañana, de nuevo». Y de nuevo, sin bloqueos."),
    ]),
  S("es-campo-barro", "estadio", { minAge: 16, clubLevels: ["modesto"], clubTurns: [3, 400], notFlags: ["es_barro"] }, "partido",
    "Un campo de tierra con una portería de hierro oxidado te devuelve a la infancia",
    "Es una copa a un pueblo de mil habitantes. El campo es una explanada con raíces, una línea de cal torcida y un banquillo hecho de palés. Los vecinos, con sillas plegables, forman una grada improvisada. Al saltar al terreno, el viento levanta una nube de polvo. Tu compañero, un chaval de ciudad, se ríe: «Esto no es fútbol». «Esto es fútbol», respondes. Y por primera vez en meses, sonríes sin motivo.",
    [
      o("a", "Jugar con alegría, haciendo regates de barrio y disfrutando", "Volver a ser niño", { moral: 8, rel_aficion: 5, fama: 2, flags: { es_barro: "niño" } }, "Marcas con una chilena en una portería sin red. Los vecinos, locos, invaden el campo. Un anciano te abraza llorando. Es un partido sin importancia que recordarás más que una final."),
      o("b", "Tomártelo en serio y ganar con oficio para evitar sorpresas", "Cumplir sin brillo", { rel_entrenador: 3, moral: 2, flags: { es_barro: "oficio" } }, "Ganas 3-0 sin sustos. Los vecinos, algo decepcionados, aplauden con educación. El míster, al final, te dice: «Así se pasa una eliminatoria». Pero tú piensas que te has perdido algo."),
      o("c", "Quedarte al final a compartir un bocadillo con los vecinos", "Convivir", { rel_aficion: 7, reputacion: 4, moral: 5, flags: { es_barro: "bocadillo" } }, "Un hombre con delantal te ofrece un bocadillo de chorizo. Charláis durante una hora sobre campos, pueblos y tiempos. Al despedirte, te regala un banderín. Lo guardas con una ternura inesperada."),
    ]),
  S("es-cantico-rival", "estadio", { minAge: 17, clubTurns: [3, 400], notFlags: ["es_cantico"] }, "partido",
    "La grada rival te dedica un cántico con tanta gracia que te lo aprendes",
    "Es una melodía pegadiza, con una letra ingeniosa que rima tu apellido con una fruta y una profesión absurda. Cuarenta mil gargantas la repiten cada vez que tocas el balón. Al principio, quieres enfadarte. Al cuarto minuto, ya llevas el ritmo con el pie. En la banda, el míster se ríe. Un rival, a tu lado, murmura: «Esa te la van a cantar siempre».",
    [
      o("a", "Saludar con una sonrisa a la grada rival y tararear la letra", "Reírte con ellos", { fama: 4, rel_aficion: 4, moral: 5, flags: { es_cantico: "rio" } }, "La grada, al ver tu respuesta, estalla. Después del partido, un grupo de aficionados rivales te regala una bufanda. «Es la mejor respuesta que nos han dado», dice uno. Os hacéis una foto. Es una anécdota de las que se cuentan."),
      o("b", "Ignorarlo y jugar con el rostro serio", "Mantener la compostura", { reputacion: 3, moral: 1, flags: { es_cantico: "serio" } }, "No les das el gusto. Pero, al llegar al hotel, tarareas la melodía. Es pegadiza. Al día siguiente, en el desayuno, el portero la silba. Os miráis, desconcertados."),
      o("c", "Pedir a tus compañeros que respondan con un cántico propio", "Contraatacar con humor", { rel_vestuario: 5, moral: 4, flags: { es_cantico: "contraataque" } }, "Os inventáis uno sobre el portero rival, con una letra absurda. Al día siguiente, el vídeo, grabado en el autobús, tiene medio millón de visualizaciones. «La guerra de canciones», titula un diario."),
    ]),
  S("es-nostalgia-estadio-viejo", "estadio", { minAge: 22, clubTurns: [10, 400], notFlags: ["es_viejo"] }, "especial",
    "Derriban el viejo estadio donde debutaste y te invitan a la última visita",
    "Es una tarde de mayo, con el cielo naranja y las gradas medio vacías. Un grupo de exjugadores, directivos y aficionados recorre el campo con una mezcla de risa y nostalgia. En el túnel, alguien ha pintado la frase «Aquí se aprendió a perder». En el césped, una grúa descansa, esperando. Un viejo socio, con el abrigo de siempre, te toca el brazo: «Chaval, ¿te acuerdas de tu primer gol aquí?».",
    [
      o("a", "Marcar un último gol simbólico con la grúa de testigo", "Despedirte del césped", { moral: 8, rel_aficion: 6, reputacion: 4, flags: { es_viejo: "gol" } }, "Con un balón viejo, tiras desde el punto de penalti. Entra, con un sonido seco. Se oye un aplauso emocionado. Un exportero, con los ojos húmedos, murmura: «Este estadio ha tenido un final bonito»."),
      o("b", "Llevarte un trozo de césped, una butaca y una cal del campo", "Guardar recuerdos", { moral: 6, patrimonio: -50, flags: { es_viejo: "recuerdo" } }, "Tu salón se llena de pequeños tesoros: una butaca, un puñado de hierba seca, un trozo de línea. Cada vez que alguien pregunta, cuentas una historia. Y el estadio, de alguna manera, sigue vivo."),
      o("c", "Pasear solo por la grada y despedirte en silencio", "Un adiós íntimo", { moral: 5, flags: { es_viejo: "silencio" } }, "Recorres las gradas, una a una. En un asiento, ves unas iniciales grabadas con una llave. Son las de tu padre, de cuando era joven. Te sientas allí un rato, solo, con una tristeza muy dulce."),
    ]),
];
