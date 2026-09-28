import Link from "next/link";
import { requestPasswordReset } from "../actions";

export default async function RecuperarPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;

  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-1 text-center">
          <p className="text-4xl">🔑</p>
          <h1 className="font-display text-2xl">Recuperar acceso</h1>
          <p className="text-sm text-muted-foreground">
            Escribe el email de tu cuenta y te mandamos un enlace para poner una contraseña nueva.
          </p>
        </div>

        {params.error && (
          <p className="rounded-lg border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {params.error}
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

          <button
            formAction={requestPasswordReset}
            className="gold-fill w-full rounded-full px-4 py-3 font-cond text-sm font-bold uppercase tracking-wide text-primary-foreground"
          >
            Enviar enlace
          </button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          <Link href="/login" className="text-gold hover:underline">
            Volver a iniciar sesión
          </Link>
        </p>
      </div>
    </main>
  );
}
