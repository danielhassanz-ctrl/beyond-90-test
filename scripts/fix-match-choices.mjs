import fs from "node:fs";

const file = "src/game/match.ts";
let src = fs.readFileSync(file, "utf8");
const start = src.indexOf("const KEY_MOMENTS: KeyMoment[] = [");
const endMarker = "\n\nfunction goalShare";
const end = src.indexOf(endMarker, start);
if (start < 0 || end < 0) throw new Error("KEY_MOMENTS block not found");

const block = `const KEY_MOMENTS: KeyMoment[] = [
  {
    prompt: "Penalti a favor en el 71'. El capitán te mira y te deja el balón.",
    minute: 71,
    options: [
      { id: "penalti", label: "Tirarlo seguro a tu lado natural", success: 0.76, note: "La opción clásica: colocación y convicción." },
      { id: "panenka", label: "Panenka", success: 0.48, note: "Gloria o ridículo eterno." },
      { id: "ceder", label: "Cederlo a un compañero", success: 0.78, note: "Vestuario contento, focos para otro." },
    ],
  },
  {
    prompt: "Minuto 89, te plantas solo con espacio y un compañero llegando por dentro.",
    minute: 89,
    options: [
      { id: "tiro", label: "Tirar tú desde la frontal", success: 0.4, note: "Egoísta pero valiente." },
      { id: "pase", label: "Pase al que llega", success: 0.58, note: "Asistencia probable." },
      { id: "falta", label: "Provocar la falta y proteger el resultado", success: 0.85, note: "Sin épica, con oficio." },
    ],
  },
  {
    prompt: "El rival aprieta en el 82' y el míster pide que bajes a tapar tu banda.",
    minute: 82,
    options: [
      { id: "obedecer", label: "Bajar y defender", success: 0.85, note: "El míster lo apunta." },
      { id: "quedarte", label: "Quedarte arriba buscando el contragolpe", success: 0.42, note: "Riesgo alto." },
      { id: "proteger", label: "Cerrar por dentro y temporizar", success: 0.7, note: "Menos metros, más lectura táctica." },
    ],
  },
  {
    prompt: "Balón dividido con un central que te saca dos cabezas.",
    minute: 34,
    options: [
      { id: "meter", label: "Meter la pierna sin miedo", success: 0.6, note: "Puede salir caro." },
      { id: "proteger", label: "Proteger el cuerpo y aguantar", success: 0.82, note: "Cabeza fría." },
      { id: "falta", label: "Cortar antes con una falta táctica", success: 0.72, note: "Pierdes la jugada, evitas el golpe." },
    ],
  },
];`;

src = src.slice(0, start) + block + src.slice(end);
fs.writeFileSync(file, src);
console.log("Normalized all KEY_MOMENTS to exactly 3 choices.");
