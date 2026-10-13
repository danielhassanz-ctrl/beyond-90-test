/** Prueba sin IA: cada mensaje directo del banco lleva su avatar y tu respuesta, y se puede localizar por su reacción (para rehacer la tarjeta). */
import { BANK_SCENES } from "../src/lib/narrative/bank/scenes";
import { fillBankEvent } from "../src/lib/narrative/bank/select";
import { isAudioReply, composeDmCard } from "../src/lib/images/dmCard";

let fails = 0;
const ok = (c: boolean, m: string) => { console.log((c ? "  ✓ " : "  ✗ ") + m); if (!c) fails++; };
const player: any = { id: "p", last_name: "Hassan", club: "Liverpool FC", week: 120, media: 90, fama: 90, flags: {}, nation: "España" };

const dmScenes = BANK_SCENES.filter((s) => s.event.dm);
ok(dmScenes.length >= 7, `${dmScenes.length} escenas de mensaje en el banco`);
ok(dmScenes.every((s) => s.event.isMilestone === true && s.event.milestoneType === "dm_instagram"), "todas son hito de tipo mensaje (si no, no generan tarjeta)");

const seen = new Map<string, string>();
let dup = 0, missingReply = 0, noAvatar = 0;
for (const s of dmScenes) {
  const f: any = fillBankEvent(s.event as any, player);
  if (!/^[a-z0-9.]+$/.test(f.dm.handle) || /[{}]/.test(Object.values(f.dm).join(" "))) fails++;
  if (s.id.startsWith("bank-ch-") && !f.dm.avatar) noAvatar++;
  const replies = f.options.filter((o: any) => o.dmReply);
  if (replies.length === 0) missingReply++;
  for (const o of f.options) {
    const key = (o.outcomeText ?? "").trim();
    if (!key) continue;
    if (seen.has(key)) dup++;
    seen.set(key, s.id);
  }
}
ok(missingReply === 0, "todas llevan al menos una respuesta tuya para la tarjeta");
ok(noAvatar === 0, "las de las chicas llevan su foto");
ok(dup === 0, "la reacción de cada opción es única: sirve para localizar la escena de un hito antiguo");

const nerea = dmScenes.find((s) => s.id === "bank-ch-nerea-dm")!;
const f: any = fillBankEvent(nerea.event as any, player);
const opt = f.options.find((o: any) => /Trato hecho\. Pero el postre/.test(o.outcomeText));
ok(!!opt && opt.dmReply?.includes("Valoro la sinceridad") && opt.dmFollowUp?.includes("postre"), `Nerea: tu respuesta «${opt?.dmReply}» y su réplica «${opt?.dmFollowUp}»`);

ok(isAudioReply("Grabar un audio con cariño") && isAudioReply("Mandar un audio y ya") && isAudioReply("Mandarle una nota de voz") && !isAudioReply("Mandarle una foto firmada") && !isAudioReply("Ir a verlo al partido"), "se reconoce cuándo tu respuesta es un audio");
const audioCard = await composeDmCard({ name: "Rosa", handle: "rosa", message: "¿Podrías mandarle un audio de ánimo?", reply: "Dile que se divierta, que el miedo es normal y que yo también me pongo nervioso.", followUp: "Gracias!", replyAudio: true });
ok(audioCard.length > 10000, "la tarjeta con nota de voz y transcripción se dibuja");

console.log(fails ? `\nFALLOS: ${fails}` : "\nTODO OK");
process.exit(fails ? 1 : 0);
