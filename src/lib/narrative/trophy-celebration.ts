/**
 * Cómo se celebra un título. Ganar una final no se responde con "subir algo a las redes" o "un reto de penaltis":
 * es la noche de la copa, el vestuario cantando, la ciudad entera en la calle y la llamada a casa.
 */
import type { EventOption } from "@/types/career";

export function trophyCelebrationOptions(label: string, opts: { national?: boolean; team?: string } = {}): EventOption[] {
  const who = opts.national ? `con la selección de ${opts.team ?? "tu país"}` : "con el vestuario";
  return [
    {
      id: "noche",
      label: `Celebrarlo toda la noche ${who}: cena, cánticos y alguna copa de más`,
      subtitle: "La noche que no se repite",
      consequences: { moral: 12, rel_vestuario: 6, fama: 3, forma: -4 },
      outcomeText: `A las seis de la mañana, el capitán canta subido a una fuente con la copa en los brazos y el míster finge no ver nada. Tú no recuerdas la mitad de la noche, pero tienes un vídeo en el que se te oye gritar «¡${label}!» cuarenta veces. Al día siguiente, ni una molestia: hoy se puede.`,
    },
    {
      id: "desfile",
      label: `Subir al autobús descubierto y pasear la copa con la afición`,
      subtitle: "Compartirlo con la gente",
      consequences: { rel_aficion: 10, fama: 5, moral: 8 },
      outcomeText: `La ciudad entera está en la calle: bufandas, bocinas, gente llorando en los balcones. Levantas el trofeo y la multitud responde con un rugido que sientes en el pecho. Un niño te grita su nombre, y el tuyo, desde un hombro de su padre. Piensas: esto es para lo que jugaba de pequeño.`,
    },
    {
      id: "familia",
      label: "Bajar al césped con tu familia y quedarte allí un rato, llorando sin disimular",
      subtitle: "Lo que de verdad importa",
      consequences: { moral: 10, fama: 2, rel_representante: 1 },
      outcomeText: `Tu madre te abraza con la cara empapada, tu padre se hace el duro un segundo y luego rompe a llorar. Os hacéis una foto sentados en el césped con el trofeo en medio, sin posar. Será, con diferencia, la foto más bonita de tu carrera.`,
    },
    {
      id: "dedicar",
      label: "Dedicarle el título a quien creyó en ti antes que nadie",
      subtitle: "Devolver lo que te dieron",
      consequences: { moral: 9, reputacion: 4, rel_aficion: 3 },
      outcomeText: `En la zona mixta, con la voz rota, dices un nombre: el de quien te dio la primera oportunidad. Al día siguiente, esa persona te escribe un mensaje muy corto: «No hacía falta». Lo lees tres veces en el avión de vuelta.`,
    },
  ];
}
