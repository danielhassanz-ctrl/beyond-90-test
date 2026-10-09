import Link from "next/link";

export const metadata = { title: "Términos de uso — Beyond 90" };

export default function TerminosPage() {
  return (
    <main className="mx-auto w-full max-w-2xl flex-1 space-y-6 p-6 text-sm leading-relaxed text-foreground">
      <div className="space-y-1">
        <p className="text-4xl">📋</p>
        <h1 className="font-display text-2xl">Términos de uso</h1>
        <p className="text-xs text-muted-foreground">Última actualización: octubre de 2026 · Beyond 90 está en fase beta</p>
      </div>

      <p>
        Al crear una cuenta en Beyond 90 aceptas estos términos. Si tienes dudas, escríbenos a{" "}
        <a href="mailto:danielhassanz@gmail.com" className="text-gold hover:underline">
          danielhassanz@gmail.com
        </a>
        .
      </p>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold text-gold">1. Qué es Beyond 90</h2>
        <p>
          Beyond 90 es un juego de simulación de una carrera de futbolista profesional. Todos los personajes,
          clubes, agentes, familiares y situaciones que aparecen son ficticios, generados o inventados para la
          partida — cualquier parecido con una persona real es casualidad, salvo tu propio jugador.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold text-gold">Clubes, competiciones y nombres reales</h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            Los nombres de clubes, selecciones, ligas y competiciones reales (Real Madrid, Premier League, Mundial...)
            se usan solo como contexto de la ficción. <strong>Beyond 90 no está afiliado, patrocinado ni respaldado por
            ningún club, liga, federación, marca ni persona.</strong>
          </li>
          <li>
            <strong>Los jugadores, entrenadores, directivos, familiares, agentes, periodistas y demás personas que
            aparecen son ficticios.</strong> Si algún nombre coincide con el de una persona real, es pura casualidad. Los
            escudos que ves son insignias de color propias del juego, no los escudos oficiales.
          </li>
          <li>
            Los resultados, clasificaciones, fichajes y premios son simulados: no corresponden a competiciones ni
            temporadas reales.
          </li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold text-gold">2. Tu cuenta</h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>Necesitas al menos 16 años, o el permiso de tu padre, madre o tutor legal si eres menor.</li>
          <li>Eres responsable de mantener segura tu contraseña.</li>
          <li>Una cuenta es personal e intransferible.</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold text-gold">3. La foto que subes</h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>Solo puedes subir tu propia foto, o una que tengas permiso claro de usar.</li>
          <li>
            La foto se usa para generar, con inteligencia artificial, imágenes de los momentos de tu carrera dentro
            del juego. Sigue siendo tuya: no reclamamos ningún derecho sobre ella más allá de lo necesario para
            prestarte ese servicio.
          </li>
          <li>No subas fotos de otras personas sin su permiso, ni contenido ilegal, ofensivo o inapropiado.</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold text-gold">4. Contenido generado por IA</h2>
        <p>
          Las imágenes y la narrativa del juego se generan con ayuda de inteligencia artificial. No garantizamos
          que una imagen concreta llegue a generarse (a veces falla o tarda), ni que el resultado sea siempre
          perfecto — es entretenimiento, no un servicio de fotografía profesional.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold text-gold">Compras de fotos</h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            Algunas fotos de hitos se generan gratis y puedes comprar packs de fotos adicionales. El precio se muestra
            antes de pagar y el cobro lo gestiona Stripe.
          </li>
          <li>
            Es un contenido digital que empieza a prestarse al generarse la foto. Al comprar aceptas que, una vez
            empezada la generación, pierdes el derecho de desistimiento de 14 días respecto de las fotos ya generadas.
          </li>
          <li>Si una foto falla por un error técnico nuestro, la devolvemos a tu saldo; no se cobra dos veces por la misma.</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold text-gold">Fase beta</h2>
        <p>
          Beyond 90 está en pruebas. Puede haber errores, cambios en el juego y, en casos excepcionales, reinicios de
          partidas. Te avisaremos si pasa. Tu opinión nos ayuda a mejorarlo.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold text-gold">5. Uso aceptable</h2>
        <p>No está permitido usar Beyond 90 para:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Acosar, amenazar o suplantar a otra persona.</li>
          <li>Intentar acceder a cuentas ajenas o a partes no públicas del servicio.</li>
          <li>Automatizar el uso del juego para abusar de la generación de imágenes u otros recursos.</li>
        </ul>
        <p>Podemos suspender o cerrar cuentas que incumplan esto.</p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold text-gold">6. El servicio &quot;tal cual&quot;</h2>
        <p>
          Beyond 90 se ofrece tal cual está, sin garantías de disponibilidad continua. Podemos cambiar, pausar o
          cerrar el servicio, avisando con la antelación que sea razonablemente posible.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold text-gold">7. Borrar tu cuenta</h2>
        <p>
          Puedes borrar tu jugador cuando quieras desde la propia app, o pedirnos que borremos tu cuenta entera
          escribiéndonos por email. Ver también nuestra{" "}
          <Link href="/legal/privacidad" className="text-gold hover:underline">
            Política de privacidad
          </Link>
          .
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold text-gold">8. Cambios en estos términos</h2>
        <p>Si cambiamos algo importante, te avisaremos dentro de la propia aplicación antes de que entre en vigor.</p>
      </section>

      <p className="pt-4 text-center">
        <Link href="/login" className="text-gold hover:underline">
          Volver
        </Link>
      </p>
    </main>
  );
}
