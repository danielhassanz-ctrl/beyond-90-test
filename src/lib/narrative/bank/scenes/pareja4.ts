/**
 * La pareja como parte de tu carrera (ver narrative/partner.ts): ella tiene su propia vida y opina de las ciudades
 * donde vives. Unas veces se adapta y echa raíces (y entonces te cuesta más irte); otras no se adapta y te lo pide
 * hasta el ultimátum; si la descuidas se enfría y, al final, se va. Cada opción mueve la relación (pareja_delta) y
 * deja marcas que otras escenas recogen: un hilo abierto («le prometiste buscar una salida»), banderas...
 */
import { S, o, r, th, after } from "../dsl";
import type { BankScene } from "../types";

export const PAREJA4: BankScene[] = [
  // ───── Ella echa raíces ─────
  S("p4-ciudad-feliz", "pareja", { flags: ["pareja", "pareja_encantada"], notFlags: ["p4_feliz"], minAge: 19, clubTurns: [4, 400] }, "vida",
    "{pareja} ya se siente de aquí",
    "Lo notas en las pequeñas cosas: conoce al panadero por su nombre, ha encontrado «su» cafetería y el domingo te arrastra a un mercadillo del que no sabías nada. En {club} ha echado raíces antes que tú. Esta noche, sin que venga a cuento, te lo dice: «Aquí soy feliz. No me importaría quedarme muchos años».",
    [
      o("a", "Decirle que tú también, y que no tienes prisa por irte", "Echar raíces juntos", { moral: 6, rel_aficion: 1, flags: { pareja_delta: "8", p4_feliz: true } }, "Le coges la mano por encima de la mesa y se lo prometes sin pensarlo demasiado. Esa noche duerme con la tranquilidad de quien sabe dónde está su casa. Tú, con un nudo agradable: has dicho en voz alta que aquí quieres estar."),
      o("b", "Agradecérselo, pero recordarle que el fútbol manda", "Honesto, aunque frío", { moral: 1, flags: { pareja_delta: "-3", p4_feliz: true } }, "Se lo dices con cariño, pero lo dices: las carreras cambian de ciudad cuando toca. Ella asiente, sonríe a medias y recoge los platos antes de tiempo. No es un reproche; es una nota mental que se queda guardada."),
      o("c", "Proponerle buscar una casa para quedaros", "Ir un paso más allá", { moral: 5, flags: { pareja_delta: "10", p4_feliz: true } }, "Se le ilumina la cara. Esa misma noche abre el portátil y empieza a guardar anuncios con una serenidad que te hace gracia. «Solo mirar», dice. Pero a la tercera casa ya está eligiendo el color de las cortinas."),
    ]),

  // ───── Ella no se adapta ─────
  S("p4-ciudad-dura", "pareja", { flags: ["pareja", "pareja_reacia"], notFlags: ["p4_dura"], minAge: 19, clubTurns: [4, 400] }, "vida",
    "{pareja} no se adapta a {club}",
    "Llevas semanas notándolo: sale menos, llama más a su madre y a las once de la noche, cuando termina la cena, mira por la ventana como quien espera que aparezca otra ciudad. Hoy te lo suelta en la cocina: «Aquí no estoy bien. No es por ti. Es la ciudad, la gente, el idioma… Me siento sola».",
    [
      o("a", "Escucharla de verdad y prometerle que lo pensaréis juntos", "Ponerte de su lado", { moral: -1, flags: { pareja_delta: "7", p4_dura: "a" } }, "Dejas el móvil, te sientas en el suelo de la cocina y la escuchas una hora sin interrumpir. Al final no hay soluciones, pero hay algo mejor: ella sabe que lo ha dicho y que alguien la ha oído. «Gracias por no decirme que se pasa solo», susurra."),
      o("b", "Pedirle paciencia: es cuestión de unos meses", "Quitarle hierro", { flags: { pareja_delta: "-4", p4_dura: "b" } }, "«Todo cambio cuesta», le dices. Es verdad y es lo peor que podías decir. Ella asiente con una sonrisa educada que no llega a los ojos. Esa noche cena en silencio y se acuesta temprano."),
      o("c", "Ayudarla a buscar algo suyo: un curso, un trabajo, gente", "Darle una vida propia aquí", { moral: 2, patrimonio: -500, flags: { pareja_delta: "5", p4_dura: "c" } }, "Pasáis la tarde buscando academias, grupos de gente y un gimnasio con buena pinta. Pagas la matrícula de un curso que le hacía ilusión. No lo arregla todo, pero el jueves vuelve a casa contando una anécdota de clase. Y hacía semanas que no contaba nada."),
    ]),
  S("p4-ciudad-ultimatum", "pareja", { after: [after("p4-ciudad-dura", undefined, 8, 90)], flags: ["pareja", "pareja_reacia"], notFlags: ["p4_ulti"], minAge: 19 }, "vida",
    "«O nos vamos de aquí, o me voy yo»",
    "{pareja} ha preparado la conversación. Se sienta frente a ti, sin móvil, sin excusas. «He aguantado todo lo que he podido. Quiero que volvamos a algún sitio donde pueda respirar, contigo. Pero si no puede ser, necesito saberlo ya». Se le quiebra la voz en la última palabra y se agarra las manos para que no se note.",
    [
      o("a", "Decirle a tu representante que busque una salida", "Poner tu carrera al servicio de los dos", { moral: 3, rel_representante: 1, flags: { pareja_delta: "12", p4_ulti: "salida", p4_salida: true } }, "Llamas a tu representante delante de ella, con el altavoz puesto, para que lo oiga. «Necesito un cambio. Mira qué hay». {pareja} se tapa la boca con la mano y llora en silencio. No es una victoria: es alivio. Ahora te toca cumplir.", { thread: th("promesa", "{pareja}", "Le prometiste buscar una salida de {club} para poder vivir los dos donde ella sea feliz") }),
      r("b", "Pedirle que aguante hasta final de temporada", "Ganar tiempo", 0.45, "Se queda callada un buen rato. Después asiente: «Hasta el final de la temporada. Ni un día más». No sonríe, pero tampoco se va. Es una tregua con fecha, y las dos partes lo saben.", { moral: 1, flags: { pareja_delta: "4", p4_ulti: "espera" } }, "«¿Otra vez esperar?», dice, y por la forma en que lo dice sabes que la respuesta ya estaba decidida antes de preguntar. Esa noche duerme en el sofá. Por la mañana, hay una nota sobre la mesa: «Necesito unos días con mi madre».", { moral: -6, forma: -2, flags: { pareja_delta: "-18", p4_ulti: "espera_mal" } }, "moral"),
      o("c", "Decirle que tu carrera va primero", "Sin vuelta atrás", { moral: -5, flags: { pareja_delta: "-22", p4_ulti: "carrera" } }, "Lo dices con firmeza, sin levantar la voz. Ella no discute: te mira como se mira a alguien a quien ya has dejado de conocer. «Vale», dice. Solo eso. Pero ese «vale» pesa más que cualquier grito y los dos lo sabéis."),
    ]),

  // ───── Si la descuidas ─────
  S("p4-frio", "pareja", { flags: ["pareja", "pareja_baja"], notFlags: ["pareja_rota_ya", "p4_frio"], minAge: 18 }, "vida",
    "Hace días que apenas habláis",
    "La casa ha cogido un silencio nuevo. {pareja} contesta con monosílabos, cena viendo el móvil y esta mañana ni siquiera ha preguntado cómo te fue el partido. No ha pasado nada y ha pasado todo. Entre entrenos, viajes y concentraciones, te das cuenta de cuánto hace que no estáis de verdad.",
    [
      o("a", "Cancelar lo que tengas y pasar el día entero con ella", "Priorizarla", { moral: 3, forma: -1, flags: { pareja_delta: "14", p4_frio: true } }, "Apagas el móvil, cancelas la comida con el representante y la sacas a pasear sin destino. Hablas poco y escuchas mucho. Por la tarde, sin darte cuenta, la estás haciendo reír. «Echaba de menos esto», dice. Tú también."),
      o("b", "Hablarlo esta noche, con sinceridad", "Poner las cartas sobre la mesa", { moral: 1, flags: { pareja_delta: "9", p4_frio: true } }, "«Te noto lejos y es culpa mía», le dices. Ella tarda en contestar. Al final, lo suelta todo: lo sola que se siente, lo poco que cuentas con ella. Duele, pero es la primera conversación de verdad en semanas."),
      o("c", "Dejarlo pasar: ya se le pasará", "No remover", { moral: -3, flags: { pareja_delta: "-8", p4_frio: true } }, "Pasas la semana entre entrenos y partidos, convencido de que es una racha. Ella lo nota. No dice nada porque ya no le ve sentido. El silencio de la casa se vuelve cada vez más cómodo, que es lo más preocupante."),
    ], { weight: 6 }),
  S("p4-se-va", "pareja", { flags: ["pareja", "pareja_rota_ya"], minAge: 18 }, "vida",
    "{pareja} se marcha",
    "No hay gritos. Solo una maleta pequeña, las llaves sobre la mesa y la voz más tranquila que le has oído en meses: «He intentado esperarte y no estabas. Me voy. No te lo tomes como un castigo: es lo único que me queda por hacer bien».",
    [
      r("a", "Pedirle que se quede, de rodillas si hace falta", "Jugártela entera", 0.3, "Se queda quieta con la maleta en la mano. Pasan segundos eternos. Después la deja en el suelo. «Una oportunidad. Una. Y cambias de verdad». Te abraza llorando. Sabes que no tendrás una tercera.", { moral: 5, flags: { pareja_delta: "35" } }, "Te escucha hasta el final, te da un beso en la frente y se va. No cierra de un portazo: cierra con mucho cuidado, y es peor. Esa noche te quedas mirando la llave sobre la mesa hasta que se hace de día.", { moral: -10, forma: -3, flags: { pareja: "", pareja_foto: "", ex_pareja: true, convivencia: "" } }, "moral"),
      o("b", "Dejarla marchar con dignidad", "Aceptarlo", { moral: -6, flags: { pareja: "", pareja_foto: "", ex_pareja: true, convivencia: "" } }, "Le dices que lo entiendes y que le deseas lo mejor. Ayudas a bajar la maleta. En el portal, os abrazáis sin decir nada. Subes las escaleras despacio, y la casa, de repente, es enorme."),
    ], { weight: 20 }),
];
