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
          <h1 className="text-2xl font-bold tracking-tight text-gold">Beyond 90</h1>
          <p className="text-sm text-neutral-400">
            Inicia sesión o crea tu cuenta para empezar
          </p>
        </div>

        {params.error && (
          <p className="rounded-md border border-red-900/50 bg-red-950/50 px-3 py-2 text-sm text-red-300">
            {params.error}
          </p>
        )}
        {params.message && (
          <p className="rounded-md border border-sky-900/50 bg-sky-950/50 px-3 py-2 text-sm text-sky-300">
            {params.message}
          </p>
        )}

        <form className="space-y-4">
          <div className="space-y-1">
            <label htmlFor="email" className="text-sm font-medium text-neutral-300">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className="w-full rounded-md border border-panel-border bg-panel px-3 py-2 text-sm text-neutral-100 outline-none focus:border-gold"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="password" className="text-sm font-medium text-neutral-300">
              Contraseña <span className="text-xs text-neutral-500">(mínimo 8 caracteres)</span>
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              minLength={8}
              autoComplete="current-password"
              className="w-full rounded-md border border-panel-border bg-panel px-3 py-2 text-sm text-neutral-100 outline-none focus:border-gold"
            />
          </div>

          <div className="flex flex-col gap-2 pt-2">
            <button
              formAction={login}
              className="rounded-md bg-gold px-4 py-2 text-sm font-semibold text-neutral-950 hover:bg-gold-soft"
            >
              Iniciar sesión
            </button>
            <button
              formAction={signup}
              className="rounded-md border border-panel-border px-4 py-2 text-sm font-medium text-neutral-300 hover:bg-panel"
            >
              Crear cuenta
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
