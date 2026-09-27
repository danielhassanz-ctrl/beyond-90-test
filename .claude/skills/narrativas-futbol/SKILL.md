---
name: narrativas-futbol
description: Genera tandas de eventos narrativos nuevos para Beyond 90 (src/lib/narrative/events.ts y los pools modulares como preseason-life.ts, market-window.ts, social-dm.ts, agent-events.ts) basados en patrones reales de carreras futbolísticas de los últimos ~15 años — sagas de traspasos, cesiones, vueltas de lesión, choques culturales al fichar fuera, crisis a mitad de carrera, declives, segundas oportunidades. También construye ARCOS NARRATIVOS de varios capítulos que reaparecen y evolucionan a lo largo de la carrera del jugador (una rivalidad que vuelve cada temporada, un hilo familiar/de negocio que avanza, una narrativa de prensa que cambia de fase), no solo escenas sueltas. Usar esta skill siempre que el usuario pida "más eventos", "más narrativas", "nuevas historias de fútbol", "historias que vayan pasando durante la carrera", contenido inspirado en carreras reales, o cuando el contenido narrativo del juego se sienta repetitivo o poco realista. Nunca usa jugadores reales identificables: solo el patrón de la historia, nunca la biografía de una persona concreta.
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
`fama-`, `pre-`, `ves-`, `ent-`, `sel-`) y los pools modulares que ya
existen para huecos temáticos concretos: `preseason-life.ts` (vida de
pretemporada), `market-window.ts` (rumores/ofertas de mercado),
`social-dm.ts` (mensajes por redes), `agent-events.ts` (llamadas del
representante), `loan-fork.ts` (cesiones). No repitas un tema que ya está
cubierto en ninguno de ellos. Con cientos de eventos ya escritos, la parte
que más valor aporta de esta skill es encontrar huecos temáticos reales,
no añadir una quinta variante de algo que ya existe cinco veces.

**Antes de escribir, decide el formato**: ¿es una escena suelta que puede
salir en cualquier momento (→ sección "3. Escribir los eventos" más
abajo, normalmente en `events.ts` o el pool modular que más encaje), o es
una historia que tiene sentido que **reaparezca y avance** a lo largo de
varias semanas o temporadas (→ sección "3-bis. Arcos narrativos
multi-capítulo")? Lo segundo es lo que pide explícitamente el pilar de
diseño "ninguna partida igual" cuando el jugador lleva ya muchas horas: un
rival que solo aparece una vez se olvida; un rival que te persigue durante
tres temporadas se convierte en parte de la identidad de esa carrera
concreta.

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

### 3-bis. Arcos narrativos multi-capítulo

Un arco es una historia con 3-5 capítulos que se disparan en momentos
distintos de la carrera (no la misma semana) y que se acuerda de en qué
punto va. Ejemplos de arquetipos reales que dan buen arco: una rivalidad
con un jugador de tu quinta que va fichando por clubes cada vez más
grandes que tú (o al revés), un patrocinador que va subiendo de nivel de
compromiso hasta un escándalo o una ruptura, un hilo familiar (un hermano
que también quiere ser futbolista y su carrera avanza en paralelo a la
tuya), una narrativa de prensa que empieza como "la joven promesa" y va
mutando capítulo a capítulo según cómo rindas.

El mecanismo técnico ya existe en el proyecto en varias formas — no hace
falta inventar nada nuevo, solo seguir el mismo patrón:

- **Estado del arco en `player.flags`** (ver `agent-events.ts` con
  `agent_dialogue_tracker`, o `loan-fork.ts` con `loan_active` /
  `loan_start_week`): un flag tipo `arco_<nombre>_fase` con el número o
  nombre del capítulo en el que va ese jugador concreto, más
  `arco_<nombre>_last_week` para no encadenar dos capítulos seguidos sin
  que pase tiempo de por medio.
- **Un selector `shouldTriggerX(player)`** que decide si toca el
  siguiente capítulo: normalmente exige que haya pasado un mínimo de
  semanas desde el capítulo anterior (5-15 según el arco) y a veces una
  condición de progreso (media/fama/edad) para que el capítulo 3 no salga
  antes de que el jugador esté en condiciones de vivirlo.
- **Un builder `buildXCapituloN(player)`** por cada fase, o una función
  única que recibe el número de fase y devuelve el `GameEvent` de esa
  fase — cada fase avanza el flag de fase al resolverse (en
  `consequences.flags`, igual que hace `market-window.ts` con
  `interestFlags`).
- **Wiring en `engine.ts`**: añade el check `shouldTriggerX` junto a los
  que ya existen en `pickNextEventDynamic` (busca
  `shouldTriggerSocialDm` o `shouldTriggerPreseasonLife` como referencia
  de dónde y cómo se engancha), respetando el guard `midMatch` para no
  colarse a mitad de un partido.
- **El desenlace importa**: la última fase de un arco es un buen momento
  para un hito compartible (`isMilestone: true` + `imageScene`) si el
  arco termina en algo grande (ganarle al rival de siempre en una final,
  romper con el patrocinador públicamente, que tu hermano debute en tu
  mismo equipo). No todos los arcos necesitan terminar bien — un arco que
  acaba en fracaso o decepción es igual de válido y a veces más
  memorable.

Antes de proponer un arco nuevo, decide también su **frecuencia real**:
la mayoría de las carreras solo deberían ver 1-3 arcos completos, no
media docena en marcha a la vez compitiendo por las mismas semanas — así
que la condición de disparo del capítulo 1 de cada arco debe ser lo
bastante específica (una racha de partidos, cierto nivel de fama, cierto
club) para que no todos los arcos empiecen a la vez en toda partida.

### 4. Entregar el resultado

Escenas sueltas van a `src/lib/narrative/events.ts` (cerca de eventos de
la misma categoría o del mismo hilo temático) o al pool modular que
corresponda si es un tema muy específico (mercado, redes, pretemporada).
Un arco multi-capítulo va en su propio archivo nuevo
(`src/lib/narrative/arco-<nombre>.ts`), siguiendo la misma forma que
`loan-fork.ts` o `social-dm.ts`, más el wiring correspondiente en
`engine.ts`.

En ambos casos, después de escribir:

```bash
npx tsc --noEmit -p .
npx eslint src
```

Y, antes de dar nada por terminado, una comprobación local **gratis** (sin
llamar a ninguna API — env -u ANTHROPIC_API_KEY) que simule cientos o
miles de invocaciones del builder nuevo sobre jugadores de prueba,
comprobando que ningún evento sale con `undefined`/`[object`/`NaN`, que
las opciones tienen sentido y que el tope de repetición (si lo hay) frena
de verdad. El patrón exacto de este script está en cómo se verificó
`preseason-life.ts` y `social-dm.ts` en esta misma carrera del proyecto.
Solo con esa comprobación en verde se hace commit y se despliega (ver
skill `revision-pre-despliegue`).

Si el usuario solo quiere ver el borrador antes de tocar nada, entrega los
objetos `GameEvent` (o el esquema del arco: fases, flags, condiciones de
disparo) en un bloque de código TypeScript con una frase por evento/fase
explicando en qué patrón real se basa, y espera confirmación antes de
escribir en el repositorio.
