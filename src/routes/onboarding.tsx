import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Camera, Check } from "lucide-react";
import { useRef, useState } from "react";
import { POSITIONS, TRAITS } from "@/game/data";
import { useGame } from "@/game/store";
import type { Position, TraitId } from "@/game/types";
import { fileToAvatar } from "@/lib/image";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/onboarding")({
  head: () => ({
    meta: [
      { title: "Crea tu futbolista — BEYOND 90" },
      { name: "description", content: "Nombre, posición, origen, foto y rasgos: define al futbolista de 16 años con el que empieza tu historia." },
      { property: "og:title", content: "Crea tu futbolista — BEYOND 90" },
      { property: "og:description", content: "Define nombre, posición, origen y dos rasgos de carácter antes de elegir cantera." },
    ],
  }),
  component: Onboarding,
});

function Onboarding() {
  const { start } = useGame();
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState("");
  const [nickname, setNickname] = useState("");
  const [position, setPosition] = useState<Position>("MC");
  const [nationality, setNationality] = useState("España");
  const [city, setCity] = useState("");
  const [avatar, setAvatar] = useState<string | null>(null);
  const [traits, setTraits] = useState<TraitId[]>([]);
  const [error, setError] = useState("");

  const toggleTrait = (id: TraitId) => {
    setTraits((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : prev.length >= 2 ? prev : [...prev, id],
    );
  };

  const onPhoto = async (file: File | undefined) => {
    if (!file) return;
    try {
      setAvatar(await fileToAvatar(file));
    } catch {
      setError("No pudimos procesar esa foto. Prueba con otra.");
    }
  };

  const submit = () => {
    if (name.trim().length < 3) return setError("Escribe tu nombre completo.");
    if (traits.length !== 2) return setError("Elige exactamente 2 rasgos.");
    setError("");
    start({
      name: name.trim(),
      nickname: nickname.trim(),
      position,
      nationality: nationality.trim() || "España",
      city: city.trim(),
      avatar,
      traits,
    });
    void navigate({ to: "/cantera" });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-md px-5 py-8 safe-top">
        <p className="text-kicker">Capítulo 0 · 16 años</p>
        <h1 className="mt-2 font-display text-3xl">¿Quién eres?</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Todo lo que decidas aquí condiciona cómo te ve el fútbol durante los próximos años.
        </p>

        <section className="panel mt-6 space-y-4 p-4">
          <Field label="Nombre y apellidos">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Álvaro Nieto"
              className="w-full rounded-lg border border-input bg-surface-2 px-3 py-3 text-base outline-none focus:border-gold/60"
            />
          </Field>
          <Field label="Apodo (opcional)">
            <input
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="El Chino"
              className="w-full rounded-lg border border-input bg-surface-2 px-3 py-3 text-base outline-none focus:border-gold/60"
            />
          </Field>

          <Field label="Posición">
            <div className="flex flex-wrap gap-2">
              {POSITIONS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setPosition(p.id)}
                  className={cn(
                    "rounded-lg border px-3 py-2 font-cond text-sm uppercase tracking-[0.12em] transition-colors",
                    position === p.id
                      ? "border-gold gold-fill font-bold"
                      : "border-border bg-surface-2 text-muted-foreground",
                  )}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              {POSITIONS.find((p) => p.id === position)?.long}
            </p>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Nacionalidad">
              <input
                value={nationality}
                onChange={(e) => setNationality(e.target.value)}
                className="w-full rounded-lg border border-input bg-surface-2 px-3 py-3 text-base outline-none focus:border-gold/60"
              />
            </Field>
            <Field label="Ciudad">
              <input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Dos Hermanas"
                className="w-full rounded-lg border border-input bg-surface-2 px-3 py-3 text-base outline-none focus:border-gold/60"
              />
            </Field>
          </div>
        </section>

        <section className="panel mt-4 p-4">
          <p className="text-kicker">Foto de ficha</p>
          <div className="mt-3 flex items-center gap-4">
            <div className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-2xl border border-gold/40 bg-surface-2">
              {avatar ? (
                <img src={avatar} alt="Vista previa de tu foto" className="h-full w-full object-cover" />
              ) : (
                <Camera className="h-6 w-6 text-muted-foreground" aria-hidden />
              )}
            </div>
            <div className="min-w-0">
              <button
                onClick={() => fileRef.current?.click()}
                className="rounded-lg border border-gold/50 px-4 py-2 font-cond text-sm font-semibold uppercase tracking-[0.14em] text-gold"
              >
                {avatar ? "Cambiar foto" : "Subir foto"}
              </button>
              <p className="mt-2 text-xs text-muted-foreground">
                Se guarda en tu móvil y será tu avatar en toda la carrera.
              </p>
            </div>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => void onPhoto(e.target.files?.[0])}
          />
        </section>

        <section className="panel mt-4 p-4">
          <div className="flex items-baseline justify-between">
            <p className="text-kicker">Rasgos de carácter</p>
            <span className="font-num text-sm text-gold">{traits.length}/2</span>
          </div>
          <ul className="mt-3 space-y-2">
            {TRAITS.map((t) => {
              const active = traits.includes(t.id);
              return (
                <li key={t.id}>
                  <button
                    onClick={() => toggleTrait(t.id)}
                    className={cn(
                      "grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-xl border px-4 py-3 text-left transition-colors",
                      active ? "border-gold/70 bg-surface-2" : "border-border bg-surface",
                    )}
                  >
                    <span className="min-w-0">
                      <span className="block font-cond text-base font-semibold uppercase tracking-[0.1em]">
                        {t.label}
                      </span>
                      <span className="block text-xs text-muted-foreground">{t.desc}</span>
                    </span>
                    {active && <Check className="h-5 w-5 shrink-0 text-gold" aria-hidden />}
                  </button>
                </li>
              );
            })}
          </ul>
        </section>

        {error && <p className="mt-4 text-sm text-destructive">{error}</p>}

        <button
          onClick={submit}
          className="gold-fill mt-6 w-full rounded-xl px-5 py-4 font-cond text-lg font-bold uppercase tracking-[0.18em] shadow-[var(--shadow-gold)]"
        >
          Elegir cantera
        </button>
        <div className="h-10" />
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-kicker">{label}</span>
      <div className="mt-1.5">{children}</div>
    </label>
  );
}
