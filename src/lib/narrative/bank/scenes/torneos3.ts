/**
 * Antes del gran torneo: la espera de la lista, la lesión que te pone en duda, la despedida de tu
 * familia, la cábala del capitán. Salen en el año previo (torneoProx) y dejan marcas que cobran
 * durante el propio torneo y después.
 */
import { S, o, r } from "../dsl";
import type { BankScene } from "../types";

export const TORNEOS3: BankScene[] = [
  S("t3-espera-lista", "torneo", { torneoProx: "any", flags: ["sel_debut"], minAge: 19, media: [68, 99], notFlags: ["t3_espera"] }, "vida",
    "Faltan semanas para la lista final y no puedes pensar en otra cosa",
    "Cada llamada te sobresalta. Cada mensaje de tu agente, también. Las portadas de los diarios especulan con nombres que entran y salen: «Seguro que va», «Dudoso», «Sorpresa en la lista». Tú, sentado en el sofá, repasas mentalmente a los jugadores de tu posición y su forma. Tu madre te prepara una tila. Tu padre no dice nada, pero lo has visto subrayando tu nombre en un periódico.",
    [
      o("a", "Concentrarte en tu club y no mirar nada más", "Aislarte del ruido", { forma: 3, moral: 2, rel_entrenador: 2, flags: { t3_espera: "aislo" } }, "Apagas las notificaciones y entrenas con el doble de foco. El míster lo nota: «Estás sembrado». Cuando, semanas después, suena el teléfono, ya has dejado de esperar. Y por eso mismo, ahora sí te llaman."),
      o("b", "Llamar al seleccionador para preguntar claramente por tus opciones", "Pedir claridad", { rel_entrenador: -1, moral: 1, reputacion: 1, flags: { t3_espera: "llamo" } }, "Tarda en responder. Su respuesta es amable y vaga: «Sigo todos tus partidos». Cuelgas con la sensación de que no has ganado nada. Pero tampoco has perdido."),
      o("c", "Hacer una lista con todo lo que has hecho este año y repasarla cada noche", "Convencerte de que lo mereces", { moral: 5, flags: { t3_espera: "lista" } }, "La lista tiene veintisiete partidos, once goles y siete asistencias. Al verla, sientes que, pase lo que pase, has hecho todo lo que podías. Esa convicción, curiosamente, te hace jugar mejor."),
    ]),
  S("t3-lesion-duda", "torneo", { torneoProx: "any", flags: ["sel_debut"], minAge: 19, injured: true, notFlags: ["t3_lesion"] }, "vida",
    "Una lesión a meses del torneo te pone en duda y todo el país opina",
    "Es una molestia que se convierte en parte médico, y el parte en titular: «¿Llegará al Mundial?». Los tertulianos discuten tu rodilla con una autoridad pasmosa. El seleccionador, discreto, dice solo: «Confío en su recuperación». Tu fisio te mira con seriedad: «Podemos llegar. Pero sin atajos». Y tú, con la pierna elevada y el calendario en la pared, haces cuentas con una angustia que se come las noches.",
    [
      o("a", "Seguir el plan de recuperación al milímetro, sin atajos", "Disciplina total", { forma: 4, moral: 3, reputacion: 3, flags: { t3_lesion: "plan" } }, "Cada día, una tabla de ejercicios. Cada semana, una prueba. A tres semanas del torneo, el fisio sonríe: «Estás listo». Cuando suena el teléfono, no es solo una convocatoria: es una conquista."),
      r("b", "Forzar la recuperación con un tratamiento experimental", "Arriesgarlo todo", 0.45, "El tratamiento funciona. En diez días, estás corriendo. El seleccionador, al verte, asiente: «Esto es voluntad». Llegas al torneo con una rodilla de acero y una confianza nueva.", { forma: 5, moral: 6, fama: 2, flags: { t3_lesion: "exito" } }, "El tratamiento inflama la zona. La recuperación se alarga seis semanas. Te quedas fuera de la lista y ves el torneo por la televisión, con una manta y una mirada vacía. Hay golpes que no se olvidan.", { forma: -4, moral: -9, fama: -2, flags: { t3_lesion: "fracaso", coach_bench: "4" } }, "forma"),
      o("c", "Pedirle al seleccionador que te espere hasta el último momento", "Negociar con tiempo", { rel_entrenador: 2, moral: 2, flags: { t3_lesion: "espera" } }, "El seleccionador te escucha con una paciencia que no esperabas. «Tienes hasta el último día», dice. Es un gesto que nunca olvidarás. Te recuperas a tiempo. Y llegas con una deuda emocional que se convierte en entrega."),
    ]),
  S("t3-cabala-capitan", "torneo", { torneoProx: "any", flags: ["sel_debut"], minAge: 20, notFlags: ["t3_cabala"] }, "vestuario",
    "El capitán de la selección tiene una cábala y exige que todos la sigan",
    "Es sencilla y absurda: antes de cada partido, todos los jugadores deben tocar con la mano izquierda una bandera que lleva en la maleta, desde el más joven hasta el más veterano. Nadie lo discute, nadie lo comprende. Un día, un canterano, sin saberlo, la toca con la derecha. El capitán se detiene, lo mira con una calma helada y dice: «Otra vez». Se hace un silencio de plomo.",
    [
      o("a", "Seguir la cábala con respeto y reforzar el ritual", "Entrar en el ritual", { rel_vestuario: 6, moral: 4, flags: { t3_cabala: "sigo" } }, "Tocas la bandera con solemnidad. El capitán te mira, apenas, y asiente. Es el gesto de un hombre que ha convertido una superstición en un lazo de equipo. Cuando ganéis, será por esa bandera. O no. Pero habréis ganado juntos."),
      o("b", "Hacer una broma ligera sobre la bandera para quitar peso", "Humor con cariño", { rel_vestuario: 5, moral: 4, flags: { t3_cabala: "broma" } }, "«Hay que tocarla con la izquierda y pedir un deseo», dices. El capitán, tras un segundo de duda, sonríe. «Bien visto». Desde entonces, cada jugador toca la bandera y susurra su deseo. Es la mejor cábala de la historia de la selección."),
      o("c", "Negarte con educación a una tradición que no entiendes", "Mantener tu criterio", { rel_vestuario: -4, reputacion: 1, moral: -1, flags: { t3_cabala: "no" } }, "El vestuario te mira como a un hereje. El capitán, serio, te deja pasar. En el siguiente partido, no tocas la bandera. Marcas. Y cuando, tras el gol, alguien murmura «Es por no haberla tocado», no sabes si reír o preocuparte."),
    ]),
  S("t3-despedida-familia", "torneo", { torneoProx: "any", flags: ["sel_debut"], minAge: 20, notFlags: ["t3_despedida"] }, "vida",
    "Tu familia te despide en el aeropuerto con carteles, bocadillos y un nudo en la garganta",
    "Son las cinco de la mañana y la terminal está casi vacía. Tus padres, tu hermano pequeño, tu abuela y tres vecinos llevan una pancarta que dice «Vamos, campeón». Tu madre te ha preparado un bocadillo para el avión, aunque te darán de comer. Tu padre, con los ojos hinchados, no dice nada. Tu hermano te regala un dibujo. Hay veinte periodistas esperando fuera, pero ahora solo existe esta pequeña multitud.",
    [
      o("a", "Abrazar a cada uno despacio, sin prisa, con el reloj en el bolsillo", "Despedirte con calma", { moral: 8, reputacion: 3, flags: { t3_despedida: "calma" } }, "El avión puede esperar cinco minutos. Los abrazos, dos. A tu abuela le dices al oído: «Volveré con algo». Ella, con la voz rota, contesta: «Vuelve tú». Entras en la terminal con los ojos llenos y el corazón, extrañamente, tranquilo."),
      o("b", "Comerte el bocadillo ante todos y dedicárselo a tu madre", "Un gesto con humor", { moral: 7, rel_aficion: 3, flags: { t3_despedida: "bocadillo" } }, "Le das un bocado ante la cámara de un periodista. «Esto es lo mejor del avión», dices. La foto aparece en los diarios: «El crack y el bocadillo de su madre». Tu madre, al verla, llora de risa."),
      o("c", "Despedirte rápido para no emocionarte delante de la prensa", "Contenerte", { moral: -1, reputacion: 1, flags: { t3_despedida: "rapido" } }, "Un beso, un abrazo, una promesa. En el avión, al sentarte, notas un temblor en las manos. «Debería haberme quedado más», piensas. Pero ya es tarde. Y el torneo, también."),
    ]),
  S("t3-vuelta-torneo", "torneo", { torneo: { type: "any" }, turn: [1, 4], notFlags: ["t3_vuelta"] }, "vida",
    "Vuelves del torneo y descubres que tu barrio ha cambiado la fachada del bar con tu cara",
    "La furgoneta del club te deja en la esquina, con la maleta en la mano y un cansancio de cuarenta días. Al doblar la calle, te detienes. En el bar de siempre, el de las tapas y el camarero con bigote, han pintado una fachada nueva: tu cara, enorme, con una bufanda de tu país y una frase en la pared: «Nuestro orgullo». Alrededor, vecinos con vasos en alto. El camarero, desde la barra, te ofrece una caña.",
    [
      o("a", "Entrar con una sonrisa, pedir una caña y escuchar sus historias", "Volver a casa de verdad", { moral: 9, rel_aficion: 6, reputacion: 4, flags: { t3_vuelta: "caña" } }, "Pasas tres horas en la barra, sin móvil, sin guardaespaldas. Todos tienen una anécdota que contarte. Cuando sales, tu madre te espera en la puerta con un abrigo. «Anda, que estás en los huesos», dice. Y por fin, sientes que estás en casa."),
      o("b", "Hacerte una foto con todos ante el mural y subirla con una frase", "Compartirlo", { fama: 4, rel_aficion: 6, moral: 6, flags: { t3_vuelta: "foto" } }, "La foto, con cincuenta vecinos y tu cara gigante detrás, se comparte por todo el país. «El mural más bonito de la selección», dice un periodista. El camarero, emocionado, la enmarca. Será su cuadro favorito."),
      o("c", "Pasar de largo hacia casa, agotado, y volver mañana", "Descansar primero", { moral: 2, forma: 2, flags: { t3_vuelta: "luego" } }, "Duermes doce horas. Cuando, al día siguiente, vuelves al bar, el camarero te guarda la caña en la nevera. «Para cuando quisieras», dice. Y la bebes con una paz que no esperabas."),
    ]),
  S("t3-camiseta-regalo", "torneo", { torneo: { type: "any" }, turn: [1, 5], notFlags: ["t3_camiseta_reg"] }, "vida",
    "Un niño te pide la camiseta que llevaste en el torneo y se la das… con una condición",
    "Fue en una firma de autógrafos, entre cientos de personas. El niño, con un gorro de lana y la voz muy bajita, te dice: «Señor, ¿me da la camiseta que llevó en el partido?». Se la tienes guardada en una bolsa. Su madre, a su lado, trabaja de limpiadora y parece avergonzada. El niño, sin soltar el bolígrafo, añade: «Prometo cuidarla toda la vida». Te quedas mirándole, y notas algo en el pecho.",
    [
      o("a", "Dársela sin pedir nada a cambio y escribirle una dedicatoria", "Un regalo de verdad", { moral: 8, rel_aficion: 6, reputacion: 6, flags: { t3_camiseta_reg: "dedicada" } }, "Escribes: «Para el que cuidará esta camiseta mejor que yo». El niño la abraza como un tesoro. Su madre llora. Meses después, recibes una foto: la camiseta, enmarcada, en la pared de un cuarto muy pequeño y muy feliz."),
      o("b", "Pedirle que, a cambio, estudie mucho y te mande las notas", "Poner una condición dulce", { moral: 6, reputacion: 7, rel_aficion: 4, flags: { t3_camiseta_reg: "notas" } }, "El niño, solemne, asiente. Cada trimestre, te llega una carta con sus notas. A los tres años, es el primero de su clase. Cuando lo conoces, te dice: «Un trato es un trato». Y se te humedecen los ojos."),
      o("c", "Decirle que la camiseta va a una subasta benéfica, pero que le regalarás otra", "Una solución práctica", { moral: 4, reputacion: 4, patrimonio: 0, flags: { t3_camiseta_reg: "subasta" } }, "La camiseta del torneo se subasta por una cifra altísima para un hospital. El niño recibe otra, igual de firmada. «¿Es la misma?», pregunta. «Casi», dices. «Casi es mucho», responde él, con una sabiduría que te pilla desprevenido."),
    ]),
];
