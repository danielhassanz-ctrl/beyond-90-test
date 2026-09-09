import fs from "node:fs";

const file = "src/routes/historia.tsx";
let src = fs.readFileSync(file, "utf8");

const oldBranch = `  } else if (pending.type === "dynamic") {
    body = <DynamicScene state={state} card={pending} onChoice={answerDynamic} />;
  } else if (pending.type === "event") {`;
const newBranch = `  } else if (pending.type === "dynamic") {
    body = pending.kind === "career_end"
      ? <CareerEndScene state={state} card={pending} />
      : <DynamicScene state={state} card={pending} onChoice={answerDynamic} />;
  } else if (pending.type === "event") {`;
if (!src.includes(oldBranch)) throw new Error("Dynamic branch not found");
src = src.replace(oldBranch, newBranch);

const marker = `function DynamicScene({`;
if (!src.includes(marker)) throw new Error("DynamicScene marker not found");
const component = `function CareerEndScene({ state, card }: { state: GameState; card: DynamicCard }) {
  const view = renderDynamic(state, card);
  const apps = state.seasons.reduce((sum, season) => sum + season.apps, 0);
  const goals = state.seasons.reduce((sum, season) => sum + season.goals, 0);
  const peak = Math.max(state.overall, ...state.seasons.map((season) => season.overall));

  return (
    <Scene image={SCENES.celebration} kicker="Carrera terminada" title={view.title} accent="border-gold/70">
      <p className="text-[0.95rem] leading-relaxed text-foreground/85">{view.text}</p>
      <div className="mt-5 grid grid-cols-3 gap-2 text-center">
        <Cell label="Partidos" value={apps} />
        <Cell label="Goles" value={goals} />
        <Cell label="Pico" value={peak} />
      </div>
      <a
        href="./legado"
        className="gold-fill mt-5 block w-full rounded-xl px-5 py-3.5 text-center font-cond text-base font-bold uppercase tracking-[0.18em] active:scale-[0.99]"
      >
        Ver mi legado
      </a>
    </Scene>
  );
}

`;
src = src.replace(marker, component + marker);
fs.writeFileSync(file, src);
console.log("Career-end screen is now terminal and links to Legado without next().");
