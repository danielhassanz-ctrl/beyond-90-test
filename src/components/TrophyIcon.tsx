import type { TrofeoKind } from "@/lib/honours";

/**
 * Un trofeo dibujado para cada competición. Son diseños propios (copas, balón,
 * globo, medalla), no réplicas de los trofeos reales: cada uno tiene su silueta
 * y su paleta para que se reconozcan de un vistazo, también en pequeño.
 */

interface CupLook {
  /** Degradado del cuerpo: claro → oscuro. */
  body: [string, string];
  /** Color de la base. */
  base: [string, string];
  /** Asas grandes en forma de oreja (Champions). */
  bigHandles?: boolean;
  /** Adorno sobre la copa. */
  top?: "crown" | "stars" | "none";
  /** Adorno en el cuerpo. */
  emblem?: "star" | "band" | "none";
}

const CUPS: Partial<Record<TrofeoKind, CupLook>> = {
  champions: { body: ["#F4F7FB", "#8E9BB0"], base: ["#2C4A8A", "#162B5C"], bigHandles: true, top: "stars", emblem: "star" },
  europa: { body: ["#F4F7FB", "#9AA6B8"], base: ["#E8801C", "#B85A08"], top: "none", emblem: "band" },
  liga: { body: ["#FFE48A", "#C99219"], base: ["#1E7A46", "#0F4A29"], top: "none", emblem: "band" },
  copa: { body: ["#FFE48A", "#C99219"], base: ["#B3202E", "#7A1019"], top: "crown", emblem: "none" },
  eurocopa: { body: ["#F4F7FB", "#9AA6B8"], base: ["#2F5FCF", "#1B3A8F"], top: "stars", emblem: "none" },
  copa_america: { body: ["#FFE48A", "#C99219"], base: ["#4FA8E0", "#1F6FA8"], top: "none", emblem: "star" },
};

function Cup({ kind, look }: { kind: string; look: CupLook }) {
  const g = `cup-${kind}`;
  const handle = look.bigHandles
    ? "M15 9 C3 7 1 20 9 25 C12 27 15 26 16 25 M33 9 C45 7 47 20 39 25 C36 27 33 26 32 25"
    : "M15 10 C7 9 6 19 12 22 M33 10 C41 9 42 19 36 22";
  return (
    <svg viewBox="0 0 48 56" width="100%" height="100%" aria-hidden="true">
      <defs>
        <linearGradient id={`${g}-b`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={look.body[0]} />
          <stop offset="1" stopColor={look.body[1]} />
        </linearGradient>
        <linearGradient id={`${g}-p`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={look.base[0]} />
          <stop offset="1" stopColor={look.base[1]} />
        </linearGradient>
      </defs>
      <path d={handle} fill="none" stroke={`url(#${g}-b)`} strokeWidth={look.bigHandles ? 3 : 2.6} strokeLinecap="round" />
      <path d="M14 8 H34 V19 C34 27 29.5 32 24 33 C18.5 32 14 27 14 19 Z" fill={`url(#${g}-b)`} />
      <path d="M17 11 V19 C17 24 19.5 27.5 22 29" fill="none" stroke="#fff" strokeOpacity=".55" strokeWidth="1.6" strokeLinecap="round" />
      <rect x="21.5" y="33" width="5" height="8" rx="1.4" fill={`url(#${g}-b)`} />
      <path d="M16 41 H32 L34 46 H14 Z" fill={`url(#${g}-p)`} />
      <rect x="12" y="46" width="24" height="4.5" rx="1.6" fill={`url(#${g}-b)`} />
      {look.top === "crown" && <path d="M16 8 L17.5 3 L21 6.5 L24 2 L27 6.5 L30.5 3 L32 8 Z" fill="#FFE48A" stroke="#C99219" strokeWidth=".8" />}
      {look.top === "stars" && (
        <>
          <circle cx="24" cy="4.5" r="1.4" fill={look.body[0]} />
          <circle cx="19" cy="5.5" r="1" fill={look.body[0]} />
          <circle cx="29" cy="5.5" r="1" fill={look.body[0]} />
        </>
      )}
      {look.emblem === "star" && <path d="M24 14 L25.4 17.6 L29 17.8 L26.2 20 L27.2 23.6 L24 21.6 L20.8 23.6 L21.8 20 L19 17.8 L22.6 17.6 Z" fill={look.base[0]} />}
      {look.emblem === "band" && <rect x="14" y="16" width="20" height="3.2" fill={look.base[0]} opacity=".85" />}
    </svg>
  );
}

function Ball() {
  return (
    <svg viewBox="0 0 48 56" width="100%" height="100%" aria-hidden="true">
      <defs>
        <radialGradient id="bo-g" cx="0.35" cy="0.3" r="0.9">
          <stop offset="0" stopColor="#FFF3B0" />
          <stop offset="0.45" stopColor="#F2C230" />
          <stop offset="1" stopColor="#9A6A0A" />
        </radialGradient>
        <linearGradient id="bo-p" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3A2A10" />
          <stop offset="1" stopColor="#17100A" />
        </linearGradient>
      </defs>
      <circle cx="24" cy="23" r="17" fill="url(#bo-g)" />
      <path d="M24 14.5 L31 19.6 L28.3 27.8 H19.7 L17 19.6 Z" fill="#7A5208" opacity=".78" />
      <path d="M24 14.5 V6.2 M31 19.6 L39 17 M28.3 27.8 L33.2 34.5 M19.7 27.8 L14.8 34.5 M17 19.6 L9 17" stroke="#7A5208" strokeOpacity=".6" strokeWidth="1.2" fill="none" />
      <path d="M13.5 13 C16 9 20 7.5 23 7.2" fill="none" stroke="#fff" strokeOpacity=".7" strokeWidth="2" strokeLinecap="round" />
      <path d="M17 41 H31 L33 46 H15 Z" fill="url(#bo-p)" />
      <rect x="13" y="46" width="22" height="4.5" rx="1.6" fill="#D9A21E" />
    </svg>
  );
}

function Globe() {
  return (
    <svg viewBox="0 0 48 56" width="100%" height="100%" aria-hidden="true">
      <defs>
        <radialGradient id="mu-g" cx="0.35" cy="0.3" r="0.9">
          <stop offset="0" stopColor="#FFF3B0" />
          <stop offset="0.5" stopColor="#F2C230" />
          <stop offset="1" stopColor="#A06F0C" />
        </radialGradient>
        <linearGradient id="mu-b" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#FFE48A" />
          <stop offset="1" stopColor="#B8820E" />
        </linearGradient>
      </defs>
      <circle cx="24" cy="13" r="11" fill="url(#mu-g)" />
      <path d="M13.5 13 H34.5 M24 2 C18 7 18 19 24 24 M24 2 C30 7 30 19 24 24" fill="none" stroke="#9A6A0A" strokeOpacity=".55" strokeWidth="1" />
      <path d="M16.5 22 C10 27 14 35 21 36.5 L20.5 41 H27.5 L27 36.5 C34 35 38 27 31.5 22 C28 26 20 26 16.5 22 Z" fill="url(#mu-b)" />
      <path d="M15 41 H33 L34.5 46 H13.5 Z" fill="#1E8A54" />
      <rect x="12" y="46" width="24" height="4.5" rx="1.6" fill="url(#mu-b)" />
      <path d="M12 43.5 H36" stroke="#0B4F2E" strokeOpacity=".5" strokeWidth="1" />
    </svg>
  );
}

function Medal() {
  return (
    <svg viewBox="0 0 48 56" width="100%" height="100%" aria-hidden="true">
      <defs>
        <radialGradient id="ol-g" cx="0.35" cy="0.3" r="0.9">
          <stop offset="0" stopColor="#FFF3B0" />
          <stop offset="0.5" stopColor="#F2C230" />
          <stop offset="1" stopColor="#A06F0C" />
        </radialGradient>
      </defs>
      <path d="M14 2 H22 L26 20 H18 Z" fill="#2F5FCF" />
      <path d="M34 2 H26 L22 20 H30 Z" fill="#B3202E" />
      <circle cx="24" cy="34" r="15" fill="url(#ol-g)" />
      <circle cx="24" cy="34" r="11" fill="none" stroke="#9A6A0A" strokeOpacity=".6" strokeWidth="1.2" />
      <path d="M24 26 L26.1 31.2 L31.6 31.5 L27.3 35 L28.8 40.4 L24 37.4 L19.2 40.4 L20.7 35 L16.4 31.5 L21.9 31.2 Z" fill="#9A6A0A" opacity=".85" />
      <path d="M14.5 28 C16.5 24 20 22 23 21.6" fill="none" stroke="#fff" strokeOpacity=".7" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function GoldenBoy() {
  return (
    <svg viewBox="0 0 48 56" width="100%" height="100%" aria-hidden="true">
      <defs>
        <linearGradient id="gb-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#FFF3B0" />
          <stop offset="0.5" stopColor="#F2C230" />
          <stop offset="1" stopColor="#A06F0C" />
        </linearGradient>
      </defs>
      <circle cx="24" cy="9" r="5" fill="url(#gb-g)" />
      <path d="M17 17 C20 15 28 15 31 17 L33 30 C30 32 27 31 26 36 H22 C21 31 18 32 15 30 Z" fill="url(#gb-g)" />
      <path d="M24 3 L24.9 5.6 L27.6 5.7 L25.5 7.3 L26.2 9.9 L24 8.4 L21.8 9.9 L22.5 7.3 L20.4 5.7 L23.1 5.6 Z" fill="#9A6A0A" opacity=".7" transform="translate(0 4) scale(1)" />
      <rect x="21" y="36" width="6" height="7" rx="1.2" fill="url(#gb-g)" />
      <path d="M15 43 H33 L35 47 H13 Z" fill="#1B3A8F" />
      <rect x="12" y="47" width="24" height="4" rx="1.6" fill="url(#gb-g)" />
    </svg>
  );
}

export function TrophyIcon({ kind, size = 40, className = "" }: { kind: TrofeoKind; size?: number; className?: string }) {
  const cup = CUPS[kind];
  return (
    <span className={`inline-block shrink-0 drop-shadow-[0_2px_6px_rgba(245,183,64,0.35)] ${className}`} style={{ display: "inline-block", width: size * 0.86, height: size }}>
      {cup ? <Cup kind={kind} look={cup} /> : kind === "balon_oro" ? <Ball /> : kind === "mundial" ? <Globe /> : kind === "olimpico" ? <Medal /> : <GoldenBoy />}
    </span>
  );
}
