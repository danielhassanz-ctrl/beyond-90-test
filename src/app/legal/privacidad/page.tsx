import Link from "next/link";

export const metadata = { title: "Privacidad — Beyond 90" };

export default function PrivacidadPage() {
  return (
    <main className="mx-auto w-full max-w-2xl flex-1 space-y-6 p-6 text-sm leading-relaxed text-foreground">
      <div className="space-y-1">
        <p className="text-4xl">🔒</p>
        <h1 className="font-display text-2xl">Política de privacidad</h1>
        <p className="text-xs text-muted-foreground">Última actualización: septiembre de 2026</p>
      </div>

      <p>
        Esta política explica, en un lenguaje sencillo, qué datos recoge Beyond 90, para qué los usa y qué puedes
        hacer con ellos. Si tienes cualquier duda, escríbenos a{" "}
        <a href="mailto:danielhassanz@gmail.com" className="text-gold hover:underline">
          danielhassanz@gmail.com
        </a>
        .
      </p>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold text-gold">1. Qué datos recogemos</h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong>Email y contraseña</strong>, al crear tu cuenta. La contraseña nunca la vemos en texto plano:
            la gestiona directamente nuestro proveedor de autenticación (Supabase).
          </li>
          <li>
            <strong>Los datos de tu jugador</strong>: nombre, apodo, posición, pie bueno, club, y todas las
            decisiones que tomas jugando. Son datos de un personaje de ficción, no tuyos personales, salvo que tú
            decidas ponerle tu propio nombre real.
          </li>
          <li>
            <strong>La foto que subes</strong> para tu jugador. Es un dato personal si es tu cara real, y lo
            tratamos como tal.
          </li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold text-gold">2. Para qué los usamos</h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>Crear y proteger tu cuenta, y recordar tu progreso en el juego.</li>
          <li>
            Generar, con ayuda de inteligencia artificial, las imágenes de los momentos importantes de tu carrera
            (fichajes, goles, títulos...) usando tu foto como referencia.
          </li>
          <li>Mostrarte el juego correctamente y solucionar problemas técnicos si algo falla.</li>
        </ul>
        <p>No usamos tus datos para publicidad ni los vendemos a nadie.</p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold text-gold">3. Con quién los compartimos</h2>
        <p>Solo con los proveedores estrictamente necesarios para que el juego funcione:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong>Supabase</strong> (base de datos, autenticación y almacenamiento de tu foto).
          </li>
          <li>
            <strong>Replicate</strong> (genera las imágenes de tus hitos a partir de tu foto, usando modelos de
            inteligencia artificial).
          </li>
          <li>
            <strong>Vercel</strong> (aloja la aplicación web).
          </li>
        </ul>
        <p>Ninguno de ellos puede usar tu foto para nada distinto de prestarnos ese servicio técnico.</p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold text-gold">4. Cuánto tiempo los conservamos</h2>
        <p>
          Mientras tu cuenta esté activa. Puedes borrar tu jugador (y volver a empezar) o pedir que se borre tu
          cuenta entera, incluida tu foto, en cualquier momento.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold text-gold">5. Tus derechos</h2>
        <p>
          Puedes pedirnos acceder a tus datos, corregirlos, borrarlos o llevártelos a otro sitio, escribiendo a{" "}
          <a href="mailto:danielhassanz@gmail.com" className="text-gold hover:underline">
            danielhassanz@gmail.com
          </a>
          . También puedes borrar tu jugador tú mismo desde{" "}
          <Link href="/mi-jugador/borrar" className="text-gold hover:underline">
            Mi jugador → Borrar
          </Link>
          .
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold text-gold">6. Menores de edad</h2>
        <p>
          Beyond 90 está pensado para mayores de 16 años. Si eres menor de esa edad, necesitas el permiso de tu
          padre, madre o tutor legal para crear una cuenta.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold text-gold">7. Cambios en esta política</h2>
        <p>
          Si cambiamos algo importante de esta política, te avisaremos dentro de la propia aplicación antes de que
          entre en vigor.
        </p>
      </section>

      <p className="pt-4 text-center">
        <Link href="/login" className="text-gold hover:underline">
          Volver
        </Link>
      </p>
    </main>
  );
}
