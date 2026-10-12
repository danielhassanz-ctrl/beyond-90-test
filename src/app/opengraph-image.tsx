import { ImageResponse } from "next/og";

export const alt = "Beyond 90 — Simulador de carrera de futbolista";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #0a0c10 0%, #15181f 60%, #231c0a 100%)",
          color: "white",
          padding: 64,
        }}
      >
        <div style={{ display: "flex", fontSize: 28, letterSpacing: 10, color: "#e9ba4a", textTransform: "uppercase" }}>
          Simulador de carrera de futbolista
        </div>
        <div style={{ display: "flex", fontSize: 190, fontWeight: 900, letterSpacing: -4, marginTop: 8 }}>
          Beyond <span style={{ color: "#e9ba4a", marginLeft: 36 }}>90</span>
        </div>
        <div style={{ display: "flex", fontSize: 38, marginTop: 8, color: "#cfd3da" }}>
          Cada decisión cuenta. Llega a la leyenda.
        </div>
      </div>
    ),
    { ...size },
  );
}
