import fs from "node:fs";

const file = "src/game/finance.ts";
let src = fs.readFileSync(file, "utf8");

const oldCandidates = `  const candidates = OFFERS.filter(
    (o) => !f.boughtIds.includes(o.id) && f.cash >= o.minCash && (!o.requires || o.requires(s)),
  );`;
const newCandidates = `  const candidates = OFFERS.filter((o) => {
    const minimumUpfront = o.financeable ? Math.round(o.price / 2) : o.price;
    return !f.boughtIds.includes(o.id) && f.cash >= Math.max(o.minCash, minimumUpfront) && (!o.requires || o.requires(s));
  });`;
if (!src.includes(oldCandidates)) throw new Error("Money candidate filter not found");
src = src.replace(oldCandidates, newCandidates);

const oldChoices = `  const choices: { id: string; label: string; hint?: string }[] = [];
  if (f.cash >= offer.price) choices.push({ id: "cash", label: \`Pagarlo al contado (\${offer.price}.000 €)\`, hint: \`Saldo: \${f.cash}.000 €\` });
  if (offer.financeable) choices.push({ id: "finance", label: "Financiar la mitad", hint: "Menos caja hoy, deuda a plazos" });
  choices.push({ id: "no", label: "Dejarlo pasar", hint: "Sigues como estás" });`;
const newChoices = `  const choices: { id: string; label: string; hint?: string }[] = [];
  if (f.cash >= offer.price) {
    choices.push({ id: "cash", label: \`Pagarlo al contado (\${offer.price}.000 €)\`, hint: \`Saldo: \${f.cash}.000 €\` });
    if (offer.financeable) choices.push({ id: "finance", label: "Financiar la mitad", hint: "Conservas caja, asumes deuda" });
    else choices.push({ id: "plan", label: "Revisarlo con tu asesor antes de pagar", hint: "No compras hoy; ganas contexto" });
  } else if (offer.financeable) {
    choices.push({ id: "finance", label: "Financiar la mitad", hint: "Es la vía asumible con tu caja actual" });
    choices.push({ id: "plan", label: "Esperar y ahorrar para reducir la deuda", hint: "Disciplina financiera, sin compra hoy" });
  } else {
    choices.push({ id: "cash", label: \`Pagarlo al contado (\${offer.price}.000 €)\`, hint: \`Saldo: \${f.cash}.000 €\` });
    choices.push({ id: "plan", label: "Revisarlo con tu asesor antes de pagar", hint: "No compras hoy; ganas contexto" });
  }
  choices.push({ id: "no", label: "Dejarlo pasar", hint: "Sigues como estás" });`;
if (!src.includes(oldChoices)) throw new Error("Money choices builder not found");
src = src.replace(oldChoices, newChoices);

const oldNo = `  if (choiceId === "no" || choiceId === "free") {
    return { title: "No es el momento", text: "Lo dejas pasar. El dinero sigue donde estaba y tú también.", tone: "neutral" };
  }`;
const newNo = `  if (choiceId === "plan") {
    s.discipline = Math.min(100, s.discipline + 3);
    f.history.unshift({ season: s.seasons[s.seasons.length - 1]?.season ?? \`Temporada \${s.seasonIndex}\`, text: \`Aplazas \${offer.title} para revisar números.\`, amount: 0 });
    f.history = f.history.slice(0, 14);
    return { title: "Primero, los números", text: "No firmas ni compras hoy. Pides el coste completo, comparas deuda y caja y dejas la decisión para cuando puedas asumirla sin improvisar.", tone: "neutral" };
  }
  if (choiceId === "no" || choiceId === "free") {
    return { title: "No es el momento", text: "Lo dejas pasar. El dinero sigue donde estaba y tú también.", tone: "neutral" };
  }`;
if (!src.includes(oldNo)) throw new Error("Money rejection resolver not found");
src = src.replace(oldNo, newNo);

fs.writeFileSync(file, src);
console.log("Finance offers now expose exactly three actionable choices.");
