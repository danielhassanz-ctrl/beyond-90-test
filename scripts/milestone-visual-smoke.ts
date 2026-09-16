import { milestoneVisualSpec } from "../src/game/milestone-visual";
import type { ShareData } from "../src/game/types";

function share(headline: string, kicker = "Hito de carrera", lines: ShareData["lines"] = []): ShareData {
  return { headline, kicker, lines };
}

function expectKind(data: ShareData, expected: ReturnType<typeof milestoneVisualSpec>["kind"]) {
  const actual = milestoneVisualSpec(data);
  if (actual.kind !== expected) {
    throw new Error(`Expected ${expected} for ${JSON.stringify(data)}, got ${actual.kind}`);
  }
}

expectKind(share("Fichas por el Villarreal", "Nuevo club"), "signing");
expectKind(share("Firmas por el Real Betis", "Nuevo club"), "signing");
expectKind(share("Debut con el primer equipo", "La primera noche"), "debut");
expectKind(share("Campeón de Liga", "Noche de gloria"), "trophy");
expectKind(share("Balón de Oro", "Premio individual"), "trophy");
expectKind(share("Tu último partido", "Despedida"), "retirement");
expectKind(share("Temporada completada", "Mi carrera"), "career");

// Event semantics must beat incidental competition or contract wording.
// A Champions/World Cup debut is a pitch debut, never a trophy celebration.
expectKind(share("Debut en Champions", "Tu primera noche europea"), "debut");
expectKind(share("Debut en el Mundial", "España confía en ti"), "debut");
expectKind(share("Estreno en Copa", "Primer partido con el club"), "debut");
expectKind(share("Último partido", "Campeón que se despide"), "retirement");
expectKind(share("Debut oficial", "Tu contrato ya está firmado"), "debut");

// A renewal or commercial deal must never manufacture a new-club presentation.
expectKind(share("Renuevas tu contrato hasta 2032", "Acuerdo cerrado"), "career");
expectKind(share("Firmas con Adidas", "Nuevo patrocinador"), "career");
expectKind(share("Nuevo contrato", "Mejora salarial"), "career");

console.log("milestone visual smoke: milestone classification and debut priority OK; renewal/sponsor false positives rejected");
