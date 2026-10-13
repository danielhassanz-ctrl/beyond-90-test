/** Prueba sin IA: las fotos con la selección llevan la camiseta de la selección y no la de un club ni nombres sobre la camiseta. */
import { withSceneGuards, cleanImagePrompt } from "../src/lib/images/milestonePrompts";
import { describeNationalKit } from "../src/lib/clubColors";

let fails = 0;
const ok = (c: boolean, m: string) => { console.log((c ? "  ✓ " : "  ✗ ") + m); if (!c) fails++; };

const kit = describeNationalKit("España");
ok(/red jersey/.test(kit) && /NOT look like any club kit/.test(kit), "España: camiseta roja de selección, sin escudo de club");
ok(/flag/.test(describeNationalKit("Tuvalu")), "una selección sin camiseta definida usa los colores de su bandera");
const g = withSceneGuards("The man poses for the call-up photo.", { club: "Real Madrid", age: 22, nationalTeam: true, nation: "España" });
ok(/national team home kit/.test(g) && !/Real Madrid|white kit|Madrid/i.test(g), "con la selección, la guarda trae la camiseta de España y nada del club");
const c = withSceneGuards("The man at training.", { club: "Real Madrid", age: 22 });
ok(/it is:/.test(c) && !/national team/.test(c), "sin selección, sigue la camiseta del club");
const clean = cleanImagePrompt("A portrait.");
ok(/no names, numbers or lettering printed on the front/.test(clean), "ninguna foto pide nombres ni números en el pecho");

console.log(fails ? `\nFALLOS: ${fails}` : "\nTODO OK");
process.exit(fails ? 1 : 0);
