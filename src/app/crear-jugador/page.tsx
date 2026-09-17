import type { ReactNode } from "react";
import { FEET, MODE_OPTIONS, PERSONALITIES, POSITIONS } from "@/lib/constants";
import { PhotoInput } from "@/components/PhotoInput";
import { SubmitButton } from "@/components/SubmitButton";
import { createPlayer } from "./actions";

const inputClass =
  "w-full rounded-full border border-input bg-surface-2 px-4 py-3 text-sm text-foreground outline-none focus:border-gold focus:ring-1 focus:ring-gold/50 transition-all";

const selectClass =
  "w-full rounded-full border border-input bg-surface-2 px-4 py-3 text-sm text-foreground outline-none focus:border-gold focus:ring-1 focus:ring-gold/50 transition-all appearance-none cursor-pointer";

function Field({ label, emoji, children }: { label: string; emoji?: string; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <label className="text-kicker flex items-center gap-2">
        {emoji && <span className="text-base normal-case">{emoji}</span>}
        {label}
      </label>
      {children}
    </div>
  );
}

export default async function CrearJugadorPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;

  return (
    <main className="flex flex-1 justify-center bg-gradient-to-b from-background via-background to-surface p-4 sm:p-6">
      <div className="w-full max-w-2xl space-y-8 pb-12">
        {/* Header */}
        <div className="space-y-2 text-center">
          <p className="text-5xl">⚽</p>
          <h1 className="font-display text-3xl sm:text-4xl text-foreground">
            ¿Quién <span className="gold-text">eres</span>?
          </h1>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Todo lo que decidas aquí condiciona cómo te ve el fútbol durante los próximos años.
          </p>
        </div>

        {params.error && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive flex items-center gap-2">
            <span>⚠️</span>
            {params.error}
          </div>
        )}

        <form action={createPlayer} className="space-y-6">
          {/* Identidad */}
          <div className="space-y-4 rounded-2xl border border-panel-border bg-surface p-6">
            <p className="text-kicker">Tu identidad</p>

            <Field label="Nombre y apellidos" emoji="👤">
              <input name="last_name" required placeholder="Ej: Ronaldo" className={inputClass} />
            </Field>

            <Field label="Apodo (opcional)" emoji="✨">
              <input name="nickname" placeholder="Ej: El Chino" className={inputClass} />
              <p className="text-xs text-muted-foreground">
                Si lo pones, será tu nombre &ldquo;de cara al público&rdquo; en toda la carrera — igual que los apodos de futbolistas de verdad.
              </p>
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Dorsal" emoji="📊">
                <input name="number" type="number" min={1} max={99} required placeholder="7" className={inputClass} />
              </Field>
              <Field label="Nacionalidad" emoji="🌍">
                <input name="nation" required placeholder="España" className={inputClass} />
              </Field>
            </div>
          </div>

          {/* Estilo de Juego */}
          <div className="space-y-4 rounded-2xl border border-panel-border bg-surface p-6">
            <p className="text-kicker">Estilo de juego</p>

            <Field label="Posición" emoji="🎯">
              <div className="flex flex-wrap gap-2">
                {POSITIONS.map((position, i) => (
                  <label key={position} className="cursor-pointer">
                    <input
                      type="radio"
                      name="position"
                      value={position}
                      required
                      defaultChecked={i === 0}
                      className="peer sr-only"
                    />
                    <span className="font-cond block rounded-full border border-input bg-surface-2 px-4 py-2 text-sm text-muted-foreground transition-all peer-checked:border-gold peer-checked:bg-gold peer-checked:text-primary-foreground">
                      {position}
                    </span>
                  </label>
                ))}
              </div>
            </Field>

            <Field label="Pie hábil" emoji="👟">
              <div className="flex flex-wrap gap-2">
                {FEET.map((foot, i) => (
                  <label key={foot} className="cursor-pointer">
                    <input
                      type="radio"
                      name="foot"
                      value={foot}
                      required
                      defaultChecked={i === 0}
                      className="peer sr-only"
                    />
                    <span className="font-cond block rounded-full border border-input bg-surface-2 px-4 py-2 text-sm text-muted-foreground transition-all peer-checked:border-gold peer-checked:bg-gold peer-checked:text-primary-foreground">
                      {foot}
                    </span>
                  </label>
                ))}
              </div>
            </Field>
          </div>

          {/* Personalidad */}
          <div className="space-y-4 rounded-2xl border border-panel-border bg-surface p-6">
            <p className="text-kicker">Personalidad</p>
            <p className="text-xs text-muted-foreground">Define cómo reaccionas ante éxito, presión y focos.</p>

            <Field label="Rasgo principal" emoji="💎">
              <select name="personality" required defaultValue="" className={selectClass}>
                <option value="" disabled>
                  Elige tu rasgo principal
                </option>
                {PERSONALITIES.map((personality) => (
                  <option key={personality} value={personality}>
                    {personality}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Rasgo secundario" emoji="✨">
              <select name="personality_2" required defaultValue="" className={selectClass}>
                <option value="" disabled>
                  Elige tu rasgo secundario
                </option>
                {PERSONALITIES.map((personality) => (
                  <option key={personality} value={personality}>
                    {personality}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          {/* Foto */}
          <div className="space-y-4 rounded-2xl border border-panel-border bg-surface p-6">
            <Field label="Foto de ficha (opcional)" emoji="📸">
              <PhotoInput name="photo" />
              <p className="text-xs text-muted-foreground">Se guarda en tu cuenta y será tu avatar en toda la carrera.</p>
            </Field>
          </div>

          {/* Modo */}
          <div className="space-y-4 rounded-2xl border border-panel-border bg-surface p-6">
            <p className="text-kicker">Ritmo de carrera</p>
            <p className="text-xs text-muted-foreground">El modo cambia la cantidad de decisiones, no tu potencial ni la dificultad deportiva.</p>
            <div className="space-y-3">
              {MODE_OPTIONS.map((mode, i) => (
                <label
                  key={mode.value}
                  className="flex cursor-pointer flex-col gap-1 rounded-2xl border border-input bg-surface-2 px-4 py-3 has-[:checked]:border-gold has-[:checked]:bg-gold/10 transition-all"
                >
                  <span className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-2 font-display text-sm text-foreground">
                      <input type="radio" name="mode" value={mode.value} required defaultChecked={i === 1} className="h-4 w-4" />
                      {mode.label}
                    </span>
                    <span className="font-num text-sm font-semibold text-gold">{mode.hint}</span>
                  </span>
                  <span className="pl-6 text-xs text-muted-foreground">{mode.description}</span>
                </label>
              ))}
            </div>
          </div>

          <SubmitButton>🚀 Empieza tu carrera</SubmitButton>
        </form>
      </div>
    </main>
  );
}
