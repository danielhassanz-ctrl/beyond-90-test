import { login, signup } from "./actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const params = await searchParams;

  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-1 text-center">
          <p className="text-4xl">⚽</p>
          <h1 className="font-display text-2xl">
            Beyond <span className="gold-text">90</span>
          </h1>
          <p className="text-sm text-muted-foreground">
            Inicia sesión o crea tu cuenta para empezar
          </p>
        </div>

        {params.error && (
          <p className="rounded-lg border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {params.error}
          </p>
        )}
        {params.message && (
          <p className="rounded-lg border border-gold/50 bg-gold/10 px-3 py-2 text-sm text-gold-soft">
            {params.message}
          </p>
        )}

        <form className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="email" className="text-kicker">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className="w-full rounded-full border border-input bg-surface-2 px-4 py-3 text-sm text-foreground outline-none focus:border-gold focus:ring-1 focus:ring-gold/50 transition-all"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="text-kicker">
              Contraseña <span className="normal-case text-muted-foreground/70">(mínimo 8 caracteres)</span>
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              minLength={8}
              autoComplete="current-password"
              className="w-full rounded-full border border-input bg-surface-2 px-4 py-3 text-sm text-foreground outline-none focus:border-gold focus:ring-1 focus:ring-gold/50 transition-all"
            />
          </div>

          <div className="flex flex-col gap-2 pt-2">
            <button
              formAction={login}
              className="gold-fill rounded-full px-4 py-3 font-cond text-sm font-bold uppercase tracking-wide text-primary-foreground"
            >
              Iniciar sesión
            </button>
            <button
              formAction={signup}
              className="rounded-full border border-panel-border px-4 py-3 font-cond text-sm font-bold uppercase tracking-wide text-foreground hover:border-gold/50"
            >
              Crear cuenta
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
