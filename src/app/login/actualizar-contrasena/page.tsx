import { updatePassword } from "./actions";

export default async function ActualizarContrasenaPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;

  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-1 text-center">
          <p className="text-4xl">🔐</p>
          <h1 className="font-display text-2xl">Pon una contraseña nueva</h1>
          <p className="text-sm text-muted-foreground">Esta será tu nueva contraseña a partir de ahora.</p>
        </div>

        {params.error && (
          <p className="rounded-lg border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {params.error}
          </p>
        )}

        <form className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="password" className="text-kicker">
              Contraseña nueva <span className="normal-case text-muted-foreground/70">(mínimo 8 caracteres)</span>
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              className="w-full rounded-full border border-input bg-surface-2 px-4 py-3 text-sm text-foreground outline-none focus:border-gold focus:ring-1 focus:ring-gold/50 transition-all"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="confirm" className="text-kicker">
              Repite la contraseña
            </label>
            <input
              id="confirm"
              name="confirm"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              className="w-full rounded-full border border-input bg-surface-2 px-4 py-3 text-sm text-foreground outline-none focus:border-gold focus:ring-1 focus:ring-gold/50 transition-all"
            />
          </div>

          <button
            formAction={updatePassword}
            className="gold-fill w-full rounded-full px-4 py-3 font-cond text-sm font-bold uppercase tracking-wide text-primary-foreground"
          >
            Guardar contraseña
          </button>
        </form>
      </div>
    </main>
  );
}
