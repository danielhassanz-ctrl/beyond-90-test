import fs from "node:fs";

function patch(path, edits) {
  let src = fs.readFileSync(path, "utf8");
  let changed = false;
  for (const [from, to] of edits) {
    if (src.includes(to)) continue;
    if (!src.includes(from)) throw new Error(`Patch anchor not found in ${path}: ${from.slice(0, 80)}`);
    src = src.replace(from, to);
    changed = true;
  }
  if (changed) fs.writeFileSync(path, src);
}

patch("src/game/dynamic.ts", [
  [
    'import { renderMoney, resolveMoney } from "./finance";',
    'import { renderMoney, resolveMoney } from "./finance";\nimport { renderFinanceFollowup, resolveFinanceFollowup } from "./finance-followups";'
  ],
  [
    'const ext = renderMoney(s, card) ?? renderConsequence(s, card);',
    'const ext = renderMoney(s, card) ?? renderFinanceFollowup(s, card) ?? renderConsequence(s, card);'
  ],
  [
    'const ext = resolveMoney(s, card, choiceId) ?? resolveConsequence(s, card, choiceId);',
    'const ext = resolveMoney(s, card, choiceId) ?? resolveFinanceFollowup(s, card, choiceId) ?? resolveConsequence(s, card, choiceId);'
  ],
]);

patch("src/game/engine.ts", [
  [
    'import { ensureFinance, moneyCard, netWorth, seasonFinance } from "./finance";',
    'import { ensureFinance, moneyCard, netWorth, seasonFinance } from "./finance";\nimport { financeFollowupCard } from "./finance-followups";'
  ],
  [
    `    if (slot.kind === "life" || slot.kind === "event") {
      const money = moneyCard(s);
      if (money) {
        s.pending = money;
        return touch(s);
      }
    }`,
    `    if (slot.kind === "life" || slot.kind === "event") {
      const followup = financeFollowupCard(s);
      if (followup) {
        s.pending = followup;
        return touch(s);
      }
      const money = moneyCard(s);
      if (money) {
        s.pending = money;
        return touch(s);
      }
    }`
  ],
]);
