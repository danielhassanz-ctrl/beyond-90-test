import type { ReactNode } from "react";
import { FEET, MODE_OPTIONS, PERSONALITIES, POSITIONS } from "@/lib/constants";
import { PhotoInput } from "@/components/PhotoInput";
import { SubmitButton } from "@/components/SubmitButton";
import { createPlayer } from "./actions";

const inputClass =
  "w-full rounded-md border border-panel-border bg-panel px-3 py-2 text-sm text-neutral-100 outline-none focus:border-gold";

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="text-sm font-medium text-neutral-300">{label}</label>
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
    <main className="flex flex-1 justify-center p-6">
      <div className="w-full max-w-lg space-y-6 pb-12">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-gold">Crea tu jugador</h1>
          <p className="text-sm text-neutral-400">
            Estos datos definen quién eres al arrancar tu carrera. El club te lo va a ofrecer tu
            agente en tu primera decisión.
          </p>
        </div>

        {params.error && (
          <p className="rounded-md border border-red-900/50 bg-red-950/50 px-3 py-2 text-sm text-red-300">
            {params.error}
          </p>
        )}

        <form action={createPlayer} className="space-y-4">
          <Field label="Apellido">
            <input name="last_name" required className={inputClass} />
          </Field>

          <Field label="Dorsal">
            <input
              name="number"
              type="number"
              min={1}
              max={99}
              required
              className={inputClass}
            />
          </Field>

          <Field label="Pie hábil">
            <select name="foot" required defaultValue="" className={inputClass}>
              <option value="" disabled>
                Elige una opción
              </option>
              {FEET.map((foot) => (
                <option key={foot} value={foot}>
                  {foot}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Nacionalidad">
            <input
              name="nation"
              required
              placeholder="España"
              className={inputClass}
            />
          </Field>

          <Field label="Posición">
            <select name="position" required defaultValue="" className={inputClass}>
              <option value="" disabled>
                Elige una opción
              </option>
              {POSITIONS.map((position) => (
                <option key={position} value={position}>
                  {position}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Personalidad principal">
            <select name="personality" required defaultValue="" className={inputClass}>
              <option value="" disabled>
                Elige una opción
              </option>
              {PERSONALITIES.map((personality) => (
                <option key={personality} value={personality}>
                  {personality}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Personalidad secundaria">
            <select name="personality_2" required defaultValue="" className={inputClass}>
              <option value="" disabled>
                Elige una opción
              </option>
              {PERSONALITIES.map((personality) => (
                <option key={personality} value={personality}>
                  {personality}
                </option>
              ))}
            </select>
            <p className="text-xs text-neutral-500">Elige dos rasgos distintos: definen cómo reacciona tu jugador ante el éxito, la presión y los focos.</p>
          </Field>

          <Field label="Foto (opcional)">
            <PhotoInput name="photo" />
          </Field>

          <Field label="Modo de carrera">
            <div className="grid grid-cols-3 gap-3">
              {MODE_OPTIONS.map((mode, i) => (
                <label
                  key={mode.value}
                  className="flex cursor-pointer flex-col gap-1 rounded-md border border-panel-border bg-panel px-3 py-2 text-sm text-neutral-200 has-[:checked]:border-gold has-[:checked]:bg-gold/10"
                >
                  <span className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="mode"
                      value={mode.value}
                      required
                      defaultChecked={i === 1}
                    />
                    {mode.label}
                  </span>
                  <span className="text-xs text-neutral-500">{mode.hint}</span>
                </label>
              ))}
            </div>
          </Field>

          <SubmitButton>Guardar jugador</SubmitButton>
        </form>
      </div>
    </main>
  );
}
