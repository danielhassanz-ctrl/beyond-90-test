import { ImageResponse } from "next/og";
import { createClient } from "@/lib/supabase/server";
import { getPublicCareerCard } from "@/lib/player/shareCard";

export const alt = "Tarjeta de carrera en Beyond 90";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", background: "rgba(255,255,255,0.06)", borderRadius: 20, padding: "18px 0", width: 190 }}>
      <div style={{ display: "flex", fontSize: 64, fontWeight: 900 }}>{value}</div>
      <div style={{ display: "flex", fontSize: 22, letterSpacing: 4, color: "#e9ba4a", textTransform: "uppercase" }}>{label}</div>
    </div>
  );
}

export default async function Image({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const supabase = await createClient();
  const card = await getPublicCareerCard(supabase, code);
  const photo = card?.photo_url && card.photo_url.startsWith("https://") ? card.photo_url : null;

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "linear-gradient(135deg, #0a0c10 0%, #15181f 60%, #231c0a 100%)", color: "white" }}>
        <div style={{ display: "flex", width: 470, height: "100%", background: "#15181f" }}>
          {photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photo} alt="" width={470} height={630} style={{ objectFit: "cover", objectPosition: "top" }} />
          ) : (
            <div style={{ display: "flex", width: "100%", alignItems: "center", justifyContent: "center", fontSize: 200 }}>⚽</div>
          )}
        </div>
        <div style={{ display: "flex", flexDirection: "column", flex: 1, padding: "56px 56px", justifyContent: "space-between" }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", fontSize: 26, letterSpacing: 8, color: "#e9ba4a", textTransform: "uppercase" }}>Beyond 90 · Carrera</div>
            <div style={{ display: "flex", fontSize: card && card.display_name.length > 16 ? 64 : 84, fontWeight: 900, marginTop: 14, lineHeight: 1.05 }}>
              {card ? card.display_name : "Enlace no encontrado"}
            </div>
            {card && <div style={{ display: "flex", fontSize: 34, color: "#cfd3da", marginTop: 10 }}>{card.club} · {card.age} años</div>}
          </div>
          {card && (
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
                <div style={{ display: "flex", background: "#e9ba4a", color: "#0a0c10", borderRadius: 18, padding: "10px 30px", fontSize: 44, fontWeight: 900 }}>MEDIA {card.media}</div>
                <div style={{ display: "flex", fontSize: 30, color: "#cfd3da" }}>¿Puedes superarlo?</div>
              </div>
              <div style={{ display: "flex", gap: 14 }}>
                <Stat label="Goles" value={card.stats_goals} />
                <Stat label="Asist." value={card.stats_assists} />
                <Stat label="Partidos" value={card.stats_matches_played} />
              </div>
            </div>
          )}
        </div>
      </div>
    ),
    { ...size },
  );
}
