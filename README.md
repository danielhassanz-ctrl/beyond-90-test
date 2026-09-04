# Beyond the 90

Crea desde cero BEYOND 90, una web app móvil jugable premium en español: simulador narrativo de carrera y vida de un futbolista. Quiero una vertical slice realmente jugable y coherente desde los 16 años hasta al menos el debut profesional. Diseño mobile-first cinematográfico oscuro, negro/antracita con acentos dorados y verdes, inspirado en una app deportiva editorial premium, no dashboard SaaS.

PORTADA: logo textual BEYOND 90, lema 'TU HISTORIA. MÁS ALLÁ DEL 90.', botones Nueva carrera y Continuar.

ONBOARDING: nombre, apodo opcional, posición, nacionalidad/ciudad, subida de foto desde móvil con preview y elección de 2 rasgos entre Ambicioso, Leal, Rebelde, Familiar, Profesional, Carismático. La foto queda como avatar persistente.

INICIO A LOS 16: no asignar club automáticamente. Mostrar 4 propuestas de cantera: Real Betis, Villarreal CF, Sevilla FC y Málaga CF. Cada tarjeta debe explicar desarrollo, competencia, posibilidad de minutos y riesgo. La elección define el club juvenil y el camino posterior al filial y primer equipo.

JUEGO: cabecera persistente con avatar, nombre, edad, club, temporada y MEDIA futbolística grande SIEMPRE visible. La media cambia justificadamente según rendimiento, lesiones, forma y evolución. Mostrar barras persistentes de Entrenador, Afición, Vestuario y Representante. Navegación inferior: Historia, Carrera, Relaciones, Legado.

RITMO REALISTA: a los 16 empiezan cosas pequeñas: primer entrenamiento, conversación con entrenador, estudios/familia, ganarse convocatoria juvenil, banquillo, debut juvenil, primeros minutos, racha buena/mala. Después representante, primer contrato, paso al filial, lesiones, entrenar con mayores y debut profesional. Nada de Champions, fama mundial o grandes fichajes absurdos al principio. Los acontecimientos importantes deben sentirse ganados.

EVENTOS: cada evento debe tener una escena/imagen visual grande y cinematográfica más texto y 2-4 decisiones. Las decisiones modifican variables y pueden desbloquear/bloquear eventos futuros. Evitar repetir eventos: registrar IDs vistos y usar requisitos de edad, etapa, relaciones y eventos anteriores. Añadir humor surrealista ocasional y dosificado, por ejemplo una broma de vestuario; gossip solo cuando el jugador tenga suficiente notoriedad.

REPRESENTANTE: personaje persistente que aparece cuando el rendimiento lo justifique. Poder aceptar/rechazar representación y que influya en contratos y mercado.

PARTIDOS: generar resultados plausibles y variados, incluyendo 0-0, 1-0, 2-0, 3-0, 3-1, 4-1, derrotas claras y alguna goleada. No abusar de 2-1/3-2, remontadas, prórrogas ni finales épicos. Mostrar marcador, minutos destacados y actuación del jugador. En jugadas clave ocasionales permitir decisiones como penalti izquierda/derecha/fuerte/Panenka/cederlo a compañero, último ataque, etc.

CARRERA: pantalla con temporadas, clubes, media, PJ, goles/asistencias según posición y hitos. RELACIONES: entrenador, afición, vestuario, representante y familia. LEGADO: logros bloqueados/desbloqueados.

GUARDADO: persistencia local robusta para Nueva carrera y Continuar; opción Nueva carrera debe resetear correctamente. Arquitectura preparada para backend posterior, pero no bloquees esta versión por autenticación.

CALIDAD: prioriza profundidad y coherencia sobre cantidad. Necesito suficientes eventos únicos para que las primeras 2-3 temporadas no parezcan repetitivas. Todo debe funcionar muy bien en iPhone y ser visualmente emocionante. Construye la aplicación funcional ahora, no solo una maqueta.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://beyond-90-test.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/71222f9e-87da-47d9-b94f-1969bdef3827).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```


## V4.22 product note

Legacy scoring now derives from football performance, relationships, financial choices and identity. The UI integration follows only after the delivery gate stays green.
