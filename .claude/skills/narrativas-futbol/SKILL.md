---
name: narrativas-futbol
description: Genera tandas de eventos narrativos nuevos para Beyond 90 (src/lib/narrative/events.ts) basados en patrones reales de carreras futbolísticas de los últimos ~15 años — sagas de traspasos, cesiones, vueltas de lesión, choques culturales al fichar fuera, crisis a mitad de carrera, declives, segundas oportunidades. Usar esta skill siempre que el usuario pida "más eventos", "más narrativas", "nuevas historias de fútbol", contenido inspirado en carreras reales, o cuando el contenido narrativo del juego se sienta repetitivo o poco realista. Nunca usa jugadores reales identificables: solo el patrón de la historia, nunca la biografía de una persona concreta.
---

# Narrativas de fútbol basadas en patrones reales

## Por qué existe esta skill

El fútbol real produce constantemente el mismo puñado de arquetipos de
carrera — la cesión que sale mejor que el club de origen, el fichaje
carísimo que nunca cuaja, el veterano que vuelve al club donde debutó, el
choque de idioma y cultura en la primera semana en un vestuario extranjero,
la lesión de rodilla que cambia media carrera, el suplente eterno que
explota tarde. Beyond 90 ya tiene mucho contenido de este tipo escrito a
mano, pero se agota: cuantas más carreras juegue la misma persona, más
fácil es notar que los patrones se repiten. Esta skill investiga qué tipo
de situaciones pasan de verdad en el fútbol (sin fijarse en un jugador
concreto) y las convierte en eventos nuevos, listos para pegar en
`events.ts`, con la estructura y el tono que ya tiene el resto del archivo.

## Restricción dura (no negociable)

Nunca se investiga ni se referencia la biografía de un jugador real
identificable — ni su nombre, ni su club exacto en un momento exacto, ni
detalles que lo hagan reconocible. Esto ya es una regla del proyecto
(`AGENTS.md`: cualquier persona famosa que aparezca en el juego debe ser
claramente ficticia) y aplica igual de fuerte a la fase de investigación:
busca **patrones y tendencias generales** ("por qué fracasan los fichajes
caros", "cómo es el primer mes de un jugador que ficha en una liga
extranjera", "qué pasa con los jugadores que se lesionan el ligamento
cruzado a media carrera"), no la carrera de una persona concreta. Si una
búsqueda devuelve sobre todo artículos centrados en un jugador con nombre y
apellido, extrae el patrón subyacente y descarta el resto — el evento final
no debe ser reconocible como la historia de nadie en particular.

## Proceso

### 1. Revisar qué ya existe

Antes de escribir nada, repasa `src/lib/narrative/events.ts` (grep por
`id: "` y por los prefijos de categoría: `par-`, `fork-`, `esp-`, `vid-`,
`fama-`, `pre-`, `ves-`, `ent-`, `sel-`) para no repetir un tema que ya
está cubierto. Con más de 450 eventos ya escritos, la parte que más valor
aporta de esta skill es encontrar huecos temáticos reales, no añadir una
quinta variante de algo que ya existe cinco veces.

### 2. Investigar patrones (WebSearch)

Lanza varias búsquedas centradas en el PATRÓN, no en una persona:

- "por qué fracasan los fichajes caros en el fútbol"
- "cómo afecta una lesión de ligamento cruzado a una carrera de futbolista"
- "adaptación de futbolistas a ligas extranjeras choque cultural"
- "cesiones que salieron mejor que quedarse en el club"
- "futbolistas que rescatan su carrera en un club modesto"
- "conflictos entre jugador y entrenador por minutos"
- "futbolistas veteranos que vuelven al club de su debut"

Ajusta las búsquedas al hueco temático que encontraste en el paso 1. El
objetivo es salir con 4-8 arquetipos de escena distintos, cada uno
resumible en una frase (ej. "el filial te ficha para media temporada y
acabas siendo mejor que los del primer equipo", no una noticia concreta).

### 3. Escribir los eventos

Por cada arquetipo, un objeto `GameEvent` siguiendo exactamente las
convenciones ya usadas en `events.ts`:

- **Idioma**: castellano de España, tú siempre, cero voseo ni vocabulario
  rioplatense (revisa `AGENTS.md` si hay duda).
- **id**: kebab-case, único, con el prefijo de su categoría.
- **category**: una de las ya existentes (`entrenamiento`, `partido`,
  `vestuario`, `representante`, `prensa`, `vida`, `especial`).
- **title** / **description**: cortas, concretas, como una escena de
  simulador — nunca relleno genérico.
- **options**: entre 2 y 4 (varía la cantidad, no siempre el mismo
  número). Cuando el desenlace sea incierto, usa `resolve` con
  `baseChance`, `success` y `fail`.
- **consequences**: solo campos numéricos existentes (`forma`, `moral`,
  `fama`, `media`, `patrimonio`, `rel_entrenador`, `rel_vestuario`,
  `rel_aficion`, `rel_representante`, `reputacion`), más `flags` si el
  evento crea o cierra un hilo de vida.
- **allowFreeText**: de vez en cuando (no en todos), con `freeTextPrompt`.
- **isMilestone** + **imageScene**: solo en el momento realmente
  memorable de cada arquetipo (más o menos 1 de cada 4-5), con la escena
  descrita en inglés, fotorrealista, sin nombres reales de nadie.
- **minWeek**: coherente con la etapa de carrera que representa el
  patrón (una lesión de mitad de carrera no debería poder salir a los 16
  años recién debutando).
- **minMedia** / **maxMedia** (opcionales): úsalos cuando el patrón sea
  específicamente de éxito (solo para quien rinde bien) o de fracaso/lucha
  (solo para quien va mal) — así conviven en el juego carreras muy
  distintas en vez de que todo el mundo vea las mismas oportunidades. Mira
  cómo se usan ya en eventos como `fork-fuera-de-planes` o
  `fork-gigante-europeo` para calibrar los números.
- **Personajes**: cualquier nombre (agente, compañero, entrenador, familia)
  es inventado. Nunca un nombre real.

### 4. Entregar el resultado

Por defecto, añade los eventos directamente a `src/lib/narrative/events.ts`
(cerca de eventos de la misma categoría o del mismo hilo temático) y
después corre:

```bash
npx tsc --noEmit
npx eslint src
```

Si el usuario solo quiere ver el borrador antes de tocar el archivo,
entrega los objetos `GameEvent` en un bloque de código TypeScript con una
frase por evento explicando en qué patrón real se basa, y espera
confirmación antes de editar `events.ts`.
