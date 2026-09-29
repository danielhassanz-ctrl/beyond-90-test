import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/game/dynamic.ts", import.meta.url), "utf8");
const forbidden = [
  /El domingo no estás en la lista\./,
  /El último domingo el estadio se pone en pie/,
];

const hits = forbidden.filter((pattern) => pattern.test(source));
if (hits.length) {
  throw new Error(
    "Narrative chronology invents a weekday without calendar evidence: " +
      hits.map(String).join(", "),
  );
}

console.log("Narrative weekday chronology smoke passed.");
