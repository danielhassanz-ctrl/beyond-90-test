import type { ReactNode } from "react";
import { FEET, MODE_OPTIONS, PERSONALITIES, POSITIONS } from "@/lib/constants";
import { PhotoInput } from "@/components/PhotoInput";
import { SubmitButton } from "@/components/SubmitButton";
import { createPlayer } from "./actions";

const inputClass =
  "w-full rounded-lg border border-amber-500/30 bg-neutral-900 px-4 py-3 text-sm text-neutral-100 outline-none focus:border-gold focus:ring-1 focus:ring-gold/50 transition-all";

const selectClass =
  "w-full rounded-lg border border-amber-500/30 bg-neutral-900 px-4 py-3 text-sm text-neutral-100 outline-none focus:border-gold focus:ring-1 focus:ring-gold/50 transition-all appearance-none cursor-pointer";

function Field({ label, emoji, children }: { label: string; emoji?: string; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <label className="flex items-center gap-2 text-sm font-semibold text-neutral-200">
        {emoji && <span className="text-lg">{emoji}</span>}
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
    <main className="flex flex-1 justify-center bg-gradient-to-b from-neutral-950 via-neutral-950 to-neutral-900 p-4 sm:p-6">
      <div className="w-full max-w-2xl space-y-8 pb-12">
        {/* Header */}
        <div className="space-y-2 text-center">
          <p className="text-5xl">⚽</p>
          <h1 className="text-4xl sm:text-5xl font-black text-white">
            Crea tu <span className="text-gold">Leyenda</span>
          </h1>
          <p className="text-sm text-neutral-400 max-w-md mx-auto">
            Define quién eres. Estos datos trazan tu destino en el fútbol.
          </p>
        </div>

        {params.error && (
          <div className="rounded-lg border border-red-500/50 bg-red-950/30 px-4 py-3 text-sm text-red-200 flex items-center gap-2">
            <span>⚠️</span>
            {params.error}
          </div>
        )}

        <form action={createPlayer} className="space-y-6">
          {/* Identidad */}
          <div className="space-y-4 rounded-xl border border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-transparent p-6">
            <p className="text-xs font-bold uppercase tracking-widest text-amber-300">Tu Identidad</p>

            <Field label="Apellido" emoji="👤">
              <input name="last_name" required placeholder="Ej: Ronaldo" className={inputClass} />
            </Field>

            <Field label="Dorsal" emoji="📊">
              <input
                name="number"
                type="number"
                min={1}
                max={99}
                required
                placeholder="7"
                className={inputClass}
              />
            </Field>

            <Field label="Nacionalidad" emoji="🌍">
              <input
                name="nation"
                required
                placeholder="España"
                className={inputClass}
              />
            </Field>
          </div>

          {/* Estilo de Juego */}
          <div className="space-y-4 rounded-xl border border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-transparent p-6">
            <p className="text-xs font-bold uppercase tracking-widest text-amber-300">Estilo de Juego</p>

            <Field label="Posición" emoji="🎯">
              <select name="position" required defaultValue="" className={selectClass}>
                <option value="" disabled>
                  Elige tu posición
                </option>
                {POSITIONS.map((position) => (
                  <option key={position} value={position}>
                    {position}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Pie Hábil" emoji="👟">
              <select name="foot" required defaultValue="" className={selectClass}>
                <option value="" disabled>
                  Elige tu pie
                </option>
                {FEET.map((foot) => (
                  <option key={foot} value={foot}>
                    {foot}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          {/* Personalidad */}
          <div className="space-y-4 rounded-xl border border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-transparent p-6">
            <p className="text-xs font-bold uppercase tracking-widest text-amber-300">Personalidad</p>
            <p className="text-xs text-neutral-400">Define cómo reaccionas ante éxito, presión y focos</p>

            <Field label="Rasgo Principal" emoji="💎">
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

            <Field label="Rasgo Secundario" emoji="✨">
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

          {/* Foto & Modo */}
          <div className="space-y-4 rounded-xl border border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-transparent p-6">
            <Field label="Foto de Perfil (Opcional)" emoji="📸">
              <PhotoInput name="photo" />
              <p className="text-xs text-neutral-400">Sube una foto tuya para que aparezca en las tarjetas compartibles</p>
            </Field>

            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-amber-300 mb-3">Modo de Carrera</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {MODE_OPTIONS.map((mode, i) => (
                  <label
                    key={mode.value}
                    className="flex cursor-pointer flex-col gap-2 rounded-lg border border-amber-500/30 bg-neutral-900/50 px-4 py-3 text-sm has-[:checked]:border-gold has-[:checked]:bg-gold/10 transition-all hover:border-amber-500/50"
                  >
                    <span className="flex items-center gap-2 font-semibold">
                      <input
                        type="radio"
                        name="mode"
                        value={mode.value}
                        required
                        defaultChecked={i === 1}
                        className="w-4 h-4"
                      />
                      {mode.label}
                    </span>
                    <span className="text-xs text-neutral-400">{mode.hint}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <SubmitButton>🚀 Empieza tu carrera</SubmitButton>
        </form>
      </div>
    </main>
  );
}
