import { milestoneVisualSpec } from "../src/game/milestone-visual";
import type { ShareData } from "../src/game/types";

function share(headline: string, kicker: string, lines: Array<{ label: string; value: string }> = []): ShareData {
  return { headline, kicker, lines } as ShareData;
}

function expectKind(data: ShareData, expected: ReturnType<typeof milestoneVisualSpec>["kind"], label: string) {
  const actual = milestoneVisualSpec(data).kind;
  if (actual !== expected) throw new Error(`${label}: expected ${expected}, got ${actual}`);
}

// Supporting metadata must not erase a milestone whose subject is clearly the player.
// These cases protect the UI from losing generated/shareable milestone scenes merely
// because a secondary line mentions a coach, physio, family member or former club.
expectKind(
  share("Fichas por el Villarreal", "Nuevo capítulo", [{ label: "Entrenador", value: "Te da la bienvenida" }]),
  "signing",
  "signing with coach metadata",
);
expectKind(
  share("Debutas con el primer equipo en Liga", "Tu estreno profesional", [{ label: "Familia", value: "Está en la grada" }]),
  "debut",
  "debut with family metadata",
);
expectKind(
  share("Ganas la Copa del Rey", "Noche de gloria", [{ label: "Ex club", value: "Te felicita después" }]),
  "trophy",
  "trophy with former-club metadata",
);
expectKind(
  share("Cuelgas las botas", "Fin de carrera", [{ label: "Fisio", value: "Te acompaña en la despedida" }]),
  "retirement",
  "retirement with physio metadata",
);

// Third-party milestones remain non-player career cards when the third party is
// the actual subject of the headline/kicker.
expectKind(share("Tu entrenador se retira", "Despedida del míster"), "career", "coach retirement");
expectKind(share("Tu ex club gana la Liga", "Una noche ajena"), "career", "former-club trophy");

console.log("milestone subject-scope smoke passed");
