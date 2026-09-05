---
name: revision-pre-despliegue
description: Checklist a seguir antes de cualquier "vercel --prod" en Beyond 90 — verifica tipos, lint, y avisa de pasos extra según qué haya tocado el cambio (IA, imágenes, base de datos). Usar siempre justo antes de desplegar a producción, o cuando el usuario diga "despliega", "súbelo", "ponlo en producción" o similar.
---

# Revisión antes de desplegar

Antes de cada `npx vercel --prod --yes` en este proyecto, sigue este orden.
No te saltes un paso porque "seguro que no afecta" — la mayoría de los
bugs que hemos encontrado en esta sesión (plantillas de texto rotas,
flags filtrándose a la UI, eventos inalcanzables por un flag que nunca se
pone) los hemos pillado precisamente en este tipo de repaso, no antes.

## 1. Tipos y lint (siempre)

```bash
npx tsc --noEmit
npx eslint src
```

Si hay error, arréglalo antes de seguir. No despliegues con errores de
tipos "porque total funciona en local".

## 2. Comprueba qué tocó el cambio

Repasa los archivos editados y marca qué categorías aplican:

- **¿Tocó `src/lib/narrative/ai.ts` o los prompts que le llegan a la IA?**
  Revisa que ningún campo nuevo del `EVENT_TOOL` se quede sin leer en
  `callEventTool`, y que cualquier dato nuevo (nacionalidad, vida
  personal, hilos de memoria) se guarde donde le corresponde, no solo se
  lea.
- **¿Tocó imágenes (`src/lib/images/*`, `imageScene`, `ClubCrest`,
  `EventScene`)?** Confirma que el logging de errores sigue en pie
  (`console.error` en cada `catch` y cada rama de fallo) — sin eso, un
  fallo de Replicate es invisible hasta que alguien se queja.
- **¿Tocó `src/lib/narrative/events.ts`?**
  - Busca `flags: {` en el nuevo evento: si algo lo consume vía
    `requiresFlag`, confirma que ALGÚN evento existente pone ese flag.
    Un evento con `requiresFlag` que nadie activa nunca es alcanzable —
    ya nos ha pasado.
  - Si el evento tiene textos entre comillas dobles dentro de una
    plantilla de comillas dobles (o backticks anidados mal cerrados),
    cuidado — un backtick o comilla suelta rompe el parseo de todo el
    archivo con errores que apuntan a líneas muy lejanas del problema
    real. Si `tsc` da errores raros y numerosos en `events.ts`, sospecha
    primero de una comilla/backtick sin cerrar antes de rascarte la
    cabeza con cada error individual.
  - Si el evento usa `minMedia`/`maxMedia`, comprueba que el rango
    tiene sentido con el `minWeek` (no gatear algo de carrera temprana
    con una media de 80, por ejemplo).
- **¿Tocó algo que se muestra en `LifeThreads`, `EventScene`, o
  cualquier componente que lee `player.flags` directamente?** Confirma
  que solo se muestran las claves pensadas para el jugador — cualquier
  flag interno nuevo (memoria para la IA, contadores, etc.) no debe
  aparecer sin filtrar en un componente que itera sobre `Object.entries`.
- **¿Tocó variables de entorno o algo que dependa de Replicate/Anthropic
  con límites de cuota?** Si vas a probarlo en vivo justo después de
  desplegar, ten en cuenta que Replicate sin método de pago está
  limitado a 6 peticiones/minuto — no lo confundas con un bug de código.

## 3. Verificación en vivo — solo si el cambio es observable

Si el cambio afecta a algo que se ve jugando (una pantalla nueva, un
evento nuevo, una imagen), haz una pasada rápida en local antes de
desplegar: crear un jugador de prueba mínimo, avanzar lo justo para
disparar el cambio, y borrar el jugador al terminar. No hace falta jugar
una carrera entera cada vez — con confirmar que no rompe nada y que se
ve lo esperado basta. Si el cambio es puramente mecánico/interno (una
constante, un tipo, un refactor sin efecto visible), no hace falta
verificación en vivo: confía en `tsc`/`eslint` y sigue.

## 4. Desplegar

```bash
git add -A && git commit -m "..."
npx vercel --prod --yes
curl -s -o /dev/null -w "%{http_code}\n" https://beyond-90.vercel.app
```

Confirma el `200` antes de dar el cambio por terminado.
