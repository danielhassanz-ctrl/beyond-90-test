/**
 * Vigila el código fuente contra un fallo que ya nos costó un susto en producción: las herramientas de edición por línea de
 * comandos pueden comerse las barras invertidas (\d se queda en d, \b se vuelve un carácter de retroceso). Aquí se busca
 * cualquier carácter de control raro y las expresiones regulares con pinta de haber perdido su barra.
 */
import fs from "fs";
import path from "path";

const roots = ["src", "scripts"];
const problems: string[] = [];

function walk(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) return e.name === "node_modules" || e.name === ".next" ? [] : walk(p);
    return /\.(ts|tsx|mts|cjs)$/.test(e.name) ? [p] : [];
  });
}

const CONTROL = /[\u0000-\u0008\u000B\u000C\u000E-\u001F]/;
// Una captura de dígitos sin barra: (d+), (d{2}), (d*) dentro de un literal regex.
const LOST_BACKSLASH = /\/\^?[a-z-]+\(d[+*{]/;

for (const root of roots) {
  for (const file of walk(root)) {
    const lines = fs.readFileSync(file, "utf8").split("\n");
    lines.forEach((line, i) => {
      if (file.endsWith("check-fuente.mts")) return;
      if (CONTROL.test(line)) problems.push(`${file}:${i + 1}: carácter de control (¿una barra invertida comida?)`);
      if (LOST_BACKSLASH.test(line)) problems.push(`${file}:${i + 1}: regex con (d+) sin barra: ${line.trim().slice(0, 90)}`);
    });
  }
}

if (problems.length) {
  console.log(problems.join("\n"));
  console.log(`\n${problems.length} PROBLEMAS EN EL CÓDIGO FUENTE`);
  process.exit(1);
}
console.log("CÓDIGO FUENTE LIMPIO (sin caracteres de control ni barras perdidas)");
