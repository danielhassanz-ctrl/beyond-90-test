/** Prueba sin IA: el Balón de Oro cuesta (azar, títulos y cansancio de votantes) y el Golden Boy es más generoso; las frases de la gala varían. */
import { buildAwardEvent } from "../src/lib/narrative/awards";

let fails = 0;
const ok = (c: boolean, m: string) => { console.log((c ? "  ✓ " : "  ✗ ") + m); if (!c) fails++; };

// La edad es 16 + temporada: semana 31 = 19 años, 61 = 22, 91 = 25, 101 = 26.
const titles = (week: number) => JSON.stringify([{ k: "champions", s: Math.floor((week - 1) / 10) - 1, c: "Real Madrid" }, { k: "liga", s: Math.floor((week - 1) / 10) - 1, c: "Real Madrid" }]);
const mk = (i: number, o: any = {}): any => {
  const week = o.week ?? 101;
  return { id: `p-${i}`, last_name: "Hassan", club: "Real Madrid", media: 94, fama: 99, moral: 80, forma: 90, position: "Delantero", nation: "España", status: "active", ...o, week, flags: o.flags ?? { trofeos: titles(week) } };
};
const wins = (o: any, kind: "balon_oro" | "golden_boy", n = 400) => {
  let w = 0;
  for (let i = 0; i < n; i++) {
    const ev = buildAwardEvent(mk(i, o), kind);
    if (ev.options[0].consequences.flags?.title_balon_oro || ev.options[0].consequences.flags?.golden_boy) w++;
  }
  return w / n;
};

console.log("1) Balón de Oro: cuesta, y depende del nivel");
const star = wins({ media: 94, week: 101 }, "balon_oro");           // 26 años, 94, doblete europeo y nacional
const great = wins({ media: 90, week: 101 }, "balon_oro");
const good = wins({ media: 86, week: 101 }, "balon_oro");
const young = wins({ media: 94, week: 61 }, "balon_oro");          // 22 años
console.log(`    media 94 (26 años): ${Math.round(star * 100)} % · media 90: ${Math.round(great * 100)} % · media 86: ${Math.round(good * 100)} % · media 94 con 22 años: ${Math.round(young * 100)} %`);
ok(star > 0.25 && star < 0.6, "un crack de 94 en su prime lo gana a veces, no siempre");
ok(great < star && good < great, "más nivel, más opciones");
ok(good < 0.12, "con 86 de media es raro ganarlo");
ok(young < star, "con 22 años cuesta más que en la plenitud");

console.log("2) El que gana varias veces seguidas lo nota");
const third = wins({ media: 94, week: 101, flags: { bo_seasons: "8,9", trofeos: titles(101) } }, "balon_oro");
const first = wins({ media: 94, week: 101, flags: { trofeos: titles(101) } }, "balon_oro");
console.log(`    primero: ${Math.round(first * 100)} % · tercero seguido: ${Math.round(third * 100)} %`);
ok(third < first * 0.8, "el tercero seguido es claramente más difícil");

console.log("3) Los títulos de equipo cuentan");
const sinTitulos = wins({ media: 92, week: 101, flags: {} }, "balon_oro");
const conTitulos = wins({ media: 92, week: 101 }, "balon_oro");
ok(conTitulos > sinTitulos, `con títulos ${Math.round(conTitulos * 100)} % > sin títulos ${Math.round(sinTitulos * 100)} %`);

console.log("4) Golden Boy: el premio que motiva (menor de 21)");
const gb = wins({ media: 80, week: 36, fama: 60 }, "golden_boy");   // 19 años
const gbLow = wins({ media: 70, week: 36, fama: 40 }, "golden_boy");
console.log(`    media 80: ${Math.round(gb * 100)} % · media 70: ${Math.round(gbLow * 100)} %`);
ok(gb > 0.45, "un chico de 80 a los 19 lo gana con frecuencia");
ok(gbLow < gb, "con menos nivel, menos opciones");

console.log("5) La noche no suena siempre igual");
const seen = new Set<string>();
for (let i = 0; i < 300; i++) {
  const ev = buildAwardEvent(mk(i, { media: 99, fama: 99, week: 61 + (i % 6) * 10 }), "balon_oro");
  const text = ev.options[0].outcomeText ?? "";
  if (/Eres el|ganas el|es tuyo|eres el|Has ganado/.test(text)) seen.add(text.split(". ")[0] + "|" + (text.match(/[^.]*(madre|padre|hermana|abuela|amigo)[^.]*\./)?.[0] ?? ""));
}
ok(seen.size >= 8, `${seen.size} combinaciones distintas de frases al ganar`);
const verdicts = new Set<string>();
for (let i = 0; i < 300; i++) {
  const ev = buildAwardEvent(mk(i, { media: 99, fama: 99, week: 101 }), "balon_oro");
  if (ev.options[0].consequences.flags?.title_balon_oro) verdicts.add((ev.options[0].outcomeText ?? "").split(". ")[0]);
}
ok(verdicts.size >= 5, `${verdicts.size} aperturas distintas («Dicen tu nombre…» ya no es siempre la misma)`);

console.log("6) Criterio: un año lesionado o sin títulos no gana");
{
  const T = titles(101);
  const sano = wins({ media: 95, week: 101, flags: { trofeos: T } }, "balon_oro");
  const lesionado = wins({ media: 95, week: 101, flags: { trofeos: T, inj_10: "6" } }, "balon_oro");
  const medio = wins({ media: 95, week: 101, flags: { trofeos: T, inj_10: "3" } }, "balon_oro");
  const sinTit = wins({ media: 95, week: 101, flags: {} }, "balon_oro");
  console.log(`    sano con doblete: ${Math.round(sano * 100)} % · medio año de baja: ${Math.round(medio * 100)} % · todo el año de baja: ${Math.round(lesionado * 100)} % · sin títulos: ${Math.round(sinTit * 100)} %`);
  ok(lesionado < 0.02, "con el año entero de baja, no gana el Balón de Oro (aunque sea el mejor del mundo)");
  ok(medio < sano * 0.5, "con medio año de baja, mucho más difícil");
  ok(sinTit < sano * 0.35, "sin títulos de equipo, mucho más difícil que con Champions y Liga");
  const champ = JSON.stringify([{ k: "champions", s: 9, c: "Real Madrid" }, { k: "liga", s: 9, c: "Real Madrid" }]);
  const solo = JSON.stringify([{ k: "copa", s: 9, c: "Real Madrid" }]);
  const wChamp = wins({ media: 92, week: 101, flags: { trofeos: champ } }, "balon_oro");
  const wCopa = wins({ media: 92, week: 101, flags: { trofeos: solo } }, "balon_oro");
  ok(wChamp > wCopa * 2, "Champions y Liga pesan mucho más que una copa (" + Math.round(wChamp * 100) + " % frente a " + Math.round(wCopa * 100) + " %)");
}

console.log("7) Ganar el Mundial o la Eurocopa destacando te mete en la pelea");
{
  const mundial = JSON.stringify([{ k: "mundial", s: 9, c: "España" }]);
  const euro = JSON.stringify([{ k: "eurocopa", s: 9, c: "España" }]);
  const star = { match_decision_101_torneo_3: "x" } as Record<string, string>;
  void star;
  const decisions = (n: number) => Object.fromEntries(Array.from({ length: n }, (_, i) => [`match_decision_101_torneo.${i + 3}`, i % 2 ? "assist" : "goal"]));
  const sinNada = wins({ media: 92, week: 101, flags: {} }, "balon_oro");
  const mundialGris = wins({ media: 92, week: 101, flags: { trofeos: mundial } }, "balon_oro");
  const mundialBrillando = wins({ media: 92, week: 101, flags: { trofeos: mundial, ...decisions(4) } }, "balon_oro");
  const euroBrillando = wins({ media: 92, week: 101, flags: { trofeos: euro, ...decisions(4) } }, "balon_oro");
  const euroGris = wins({ media: 92, week: 101, flags: { trofeos: euro } }, "balon_oro");
  console.log(`    sin nada: ${Math.round(sinNada * 100)} % · Mundial sin destacar: ${Math.round(mundialGris * 100)} % · Mundial destacando: ${Math.round(mundialBrillando * 100)} % · Eurocopa destacando: ${Math.round(euroBrillando * 100)} % · Eurocopa sin destacar: ${Math.round(euroGris * 100)} %`);
  ok(mundialGris > sinNada * 3, "ganar el Mundial, aunque tu club no gane nada, te da posibilidades reales");
  ok(mundialBrillando > mundialGris, "destacar en el Mundial (goles y asistencias en las jugadas decisivas) suma más");
  ok(euroBrillando > euroGris && euroBrillando > sinNada * 2, "la Eurocopa también, algo menos que el Mundial");
  ok(mundialBrillando > euroBrillando, "el Mundial pesa más que la Eurocopa");
  ok(mundialBrillando < 0.8, "ni siquiera un Mundial brillante es un premio seguro");
  const lesionadoMundial = wins({ media: 92, week: 101, flags: { trofeos: mundial, ...decisions(4), inj_10: "6" } }, "balon_oro");
  ok(lesionadoMundial < mundialBrillando * 0.3, "pero un año de baja sigue pesando (" + Math.round(lesionadoMundial * 100) + " %)");
}

console.log(fails ? `\nFALLOS: ${fails}` : "\nTODO OK");
process.exit(fails ? 1 : 0);
