---
name: eventos-dinamicos-edad
description: Genera eventos narrativos únicos y contextualizados según la edad/etapa de carrera del jugador. Cada evento es creado dinámicamente por IA, nunca repetido. Use esta skill SIEMPRE que el sistema necesite un nuevo evento en carrera. Reemplaza el pool fijo de 40 eventos con generación inteligente basada en edad, club, stats y momento de carrera.
compatibility: Anthropic SDK (Claude Sonnet 5), integración con src/lib/narrative/engine.ts
---

# Eventos Dinámicos por Edad/Etapa

## Problema actual
El juego tiene ~40 eventos pre-escritos que se repiten. Después de 50-100 semanas, el jugador ve las mismas historias.

## Solución: Generación dinámica con IA

Cada evento es **único y creado en el momento**, contextualizado a:
- Edad actual del jugador (16 = canterano, 25 = estrella, 32 = veterano)
- Club donde juega
- Stats actuales (Forma/Moral/Fama)
- Historia previa (últimos 10 eventos)
- Modo de carrera (Express = 20 semanas, Standard = 90, Pro = 200)

## Estructura de eventos por etapa

### **STAGE 1: Canterano (16-18 años)**
Contexto: Joven en cantera, sin experiencia, todo es nuevo

**Eventos futbolísticos:**
- Primeras sesiones de entrenamiento duro
- Conocer al entrenador (personaje específico, no genérico)
- Competencia interna con otros canteranos
- Agente que lo descubre en vídeos
- Primera cedencia (sí/no)
- Rotura de confianza: entrenador no confía en ti

**Eventos de vida real (50% de los eventos):**
- Fiestas con compañeros del equipo (sí → moral ↑ pero forma ↓, no → focus en entrenar)
- Primer amor en el instituto
- Padres presionan para estudiar alternativa
- Decisión: mudarse solo o quedarse con familia
- Vacaciones de verano (relajarse vs. entrenar)
- Amigos de barrio que "se van por otro camino"

**Personajes:**
- `entrenador_tipo`: "técnico exigente", "ex-mediocampista cabreado", "técnico joven con ideas"
- `capitan_tipo`: "veterano que te acoge", "rival competitivo", "capitán del equipo B"
- `agente_tipo`: "oportunista que vio tu vídeo", "representante con contactos", "agente sin conexiones"
- `familia`: Padre/madre con expectativas, hermano/a mayor que triunfó en otra cosa
- `novia_tipo`: "compañera de instituto", "amiga de amigo", "chica que no entiende el fútbol"

### **STAGE 2: Ascenso (19-24 años)**
Contexto: Ganando experiencia, primeros éxitos, presión aumenta

**Eventos futbolísticos:**
- Primer gol oficial (importante)
- Lesión leve (recuperación)
- Llamada a selección sub-21
- Presión del técnico
- Transferencia a equipo más grande (sí/no)
- Comparación con ex-compañeros que "la rompieron"
- Primer enfado serio con entrenador

**Eventos de vida real (40-50%):**
- Comprar primer coche (lujo vs. práctico)
- Pareja que te reclama tiempo
- Padres quieren que "inviertas" en algo (casa, negocio)
- Viaje de vacaciones con amigos (desconectar vs. entrenar)
- Fiestas post-gol (celebrar o mantener perfil bajo)
- Hermano/a tiene problema, necesita apoyo
- Presión mediática por foto con pareja
- Amigos que piden dinero prestado

**Personajes:**
- Entrenador que confía vs. que no
- Pareja que aparece en momentos clave
- Amigos de infancia que "se quedaron atrás"
- Compañero rival que te supera o tú lo superas
- Padre/madre que gestiona tus finanzas

### **STAGE 3: Pico (25-28 años)**
Contexto: Eres una estrella, presión mediática, oportunidades grandes

**Eventos futbolísticos:**
- Champions League (primera participación)
- Fichaje a club gigante (sí/no)
- Competencia feroz con estrellas
- Portadas de prensa (crítica vs. elogio)
- Oferta de Arabia/China (tentación económica)
- Lesión seria (riesgo real)
- Gana títulos importantes
- Goleada importante: eres la estrella

**Eventos de vida real (40-50%):**
- Boda o propuesta de matrimonio
- Comprar casa de lujo (sí/no, hipoteca vs. efectivo)
- Hijo nace / primer hijo
- Vacaciones exóticas vs. retiro a playa tranquila
- Paternidad: tu hijo quiere pasar tiempo (vs. entrenar)
- Negocio fallido: "amigo" te pide invertir
- Familia: padres envejecen, necesitan ayuda
- Fiestas VIP, encuentros con celebridades
- Pareja te presiona por boda o separación
- Comprar avión privado (oferta de lujo, decisión)

**Personajes:**
- Pareja → esposa/pareja con futuro juntos
- Compañeros internacionales famosos
- Agente que te presiona por fichaje
- Rival directo en el campo
- Hijo/a pequeño que no entiende el fútbol
- Padre/madre mayor que presencia partidos

### **STAGE 4: Veterano (29-35 años)**
Contexto: Experiencia, menos oportunidades, mentor, despedida cercana

**Eventos futbolísticos:**
- Última oportunidad en club grande
- Mentor joven: enseñas a canterano emergente
- Lesiones que cuestionan tu futuro
- Oferta para retirarse (sí/no)
- Despedida emocional del club
- Segunda vida (torneos/dirección técnica)
- Recordar "cómo era antes"
- Comparsa en partido importante (no juegas)

**Eventos de vida real (50%):**
- Hijo quiere ser futbolista (apoyar vs. "busca otra carrera")
- Divorcio o reconciliación importante
- Padre/madre enfermo, decisión de estar cerca
- Inversiones: golf, restaurante, academia de fútbol
- Vacaciones con familia (primera vez sin estrés)
- Amigos de carrera se retiran antes, pregunta si es hora
- Patrimonio: vender casas, invertir en seguro
- Expareja reaparece con hijo
- Oferta de trabajo en dirección técnica o media
- Celebridades jóvenes te copian, nostalgia de "cuando yo era"

**Personajes:**
- Hijo/a (joven adulto, quizás futbolista)
- Médico que te da "noticias incómodas"
- Esposa/pareja que quiere estabilidad post-carrera
- Antiguo compañero que ya se retiró
- Joven talento que idolatra tu carrera

---

## Prompt para generar evento

```typescript
// Input:
{
  playerId: string,
  position: "delantero" | "mediocampista" | "defensa" | "portero",
  age: number,           // 16-35+
  club: string,          // "Real Madrid", "pequeño equipo"
  week: number,          // 1-200
  mode: "express" | "standard" | "pro",
  stats: {
    forma: number,       // 0-99
    moral: number,
    fama: number,
  },
  recentHistory: Array<{
    title: string,
    chosen: string,
  }>,
  flags: object,         // títulos ganados, lesiones, etc.
}

// Prompt a IA:
You are a football life narrative generator. Create a UNIQUE event for this player.

Position: ${position} (delantero/mediocampista/defensa/portero)
Age: ${age} years old
Club: ${club}
Week: ${week} of ${modeWeeks[mode]} total weeks
Recent form: ${stats.forma}/99, Morale: ${stats.moral}/99, Fame: ${stats.fama}/99

Recent events (to avoid repetition): ${recentHistory.map(h => h.title).join(", ")}

CRITICAL INSTRUCTIONS:

1. **NEVER repeat** any event from "Recent events"

2. **Position matters**: 
   - Delantero: goles, Pichichi, jugadas individuales, presión de anotar
   - Mediocampista: control del juego, pases clave, defensa/ataque
   - Defensa: duelos, robos, liderazgo defensivo, tarjetas
   - Portero: penaltis, atajadas, distribuir balón, liderazgo

3. **~40-50% of events MUST be LIFE**: relationships, family, parties, vacations, buying house/car/plane, money decisions, divorce, kids, parents aging, friendships tested. NOT just football.

4. **Create specific details**: Names, dialogue, concrete situations (not abstract)

5. **EMOTIONALLY resonant**: tension, uncertainty, growth, sacrifice, joy, loss, redemption

6. **Decisions have consequences**: choosing career over family, spending vs. saving, risk vs. safety, ego vs. teamwork

Return JSON:
{
  "category": "entrenamiento|partido|vestuario|representante|prensa|vida|especial",
  "title": "...",
  "description": "...",
  "options": [
    { "label": "...", "subtitle": "..." },
    { "label": "...", "subtitle": "..." },
    { "label": "...", "subtitle": "..." }
  ],
  "consequences": { /* stat changes */ },
  "isMilestone": boolean,
  "lookEvolution": "string or null"
}
```

---

## Eventos de partido por posición

Además de vida personal, cada evento de PARTIDO es contextualizado a la posición del jugador.

### **DELANTERO** (9, extremo)
Eventos típicos en partido:
- **Ocasión de gol** → dispara puntería o centras
- **Pichichi en juego** → presión de anotar o asistir
- **Uno contra uno** → regate al portero
- **Fuera de juego sospechoso** → reclamar o aceptar
- **Jugada individual** → amague o pase a compañero
- **Hat-trick posible** → ir por el tercero o consolidar
- **Marcaje defensivo** → defender o dejarlo al lateral
- **Penalti a favor** → lanzar o dejar a otro

**Decisiones:**
- "Disparas al arco o centras al área" → Forma ↑ o Moral ↑
- "Intenta regate o pasa seguro" → Fama ↑ o Forma ↑
- "Toma el balón para la jugada personal" → Egoísmo/Moral

### **CENTROCAMPISTA** (8, 4)
Eventos típicos:
- **Control del medio** → marca rival o cubre espacios
- **Pase clave** → visión de juego o seguridad
- **Recuperación de balón** → corte o barrida
- **Distribución defensiva** → construir desde atrás
- **Entrada fuerte** → tarjeta amarilla o limpieza
- **Asistencia a gol** → visión vs. egoísmo
- **Conducción de ataque** → acelera o mantiene ritmo

**Decisiones:**
- "Das pase al delantero o buscas tú mismo el gol" → Compañerismo vs. Individualidad
- "Cierras espacios o presionas arriba" → Defensa vs. Ataque

### **DEFENSA** (3, 2, 5)
Eventos típicos:
- **Duelo aéreo** → cabeceo ganado/perdido
- **Robo de balón** → intercepción limpia
- **Entrada comprometida** → tarjeta o salida limpia
- **Uno contra uno** → desborden o corte
- **Saque de puerta** → juego largo o corto
- **Líder defensivo** → tu grito anima o asusta
- **Gol en contra por error** → presión psicológica
- **Penalti provocado/defendido** → decisión en crisis

**Decisiones:**
- "Entras fuerte o dejas pasar" → Agresividad vs. Control
- "Juegas largo o construyes corto" → Riesgo vs. Seguridad

### **PORTERO** (1)
Eventos típicos:
- **Penalti** → adivinas lado o te engañan
- **Paradón imposible** → instinto vs. acción calculada
- **Gol evitable** → culpa psicológica
- **Distribución de balón** → pases de portero (riesgo)
- **Duelo aéreo en área** → salida de portero vs. confiar en defensa
- **Comunicación defensiva** → líder silencioso o ruidoso
- **Ataque a portería vacía** → riesgo de expulsión por salir
- **Toma de decisión en crisis** → pie o manos, zona de portería

**Decisiones:**
- "Saltas por la pelota o confías en defensa" → Confianza vs. Riesgo
- "Patadas largas o pases cortos" → Directo vs. Construcción

---

## Cómo la vida afecta el fútbol

**Ejemplos de consecuencias realistas:**

| Decisión de vida | Efecto futbolístico | Efecto personal |
|---|---|---|
| Fiesta después de gol | Forma ↓, Moral ↑ | Amigos ↑ |
| Boda/matrimonio | Moral ↑↑, Estabilidad | Tiempo personal ↓ |
| Hijo nace | Moral ↑, Presión ↑↑ | Familia ↑, Sueño ↓ |
| Comprar casa de lujo | Seguridad financiera | Hipoteca = presión |
| Madre enferma, viajar | Forma ↓ (falta entrenamientos), Moral ↓ | Familia ↑ |
| Divorcio | Moral ↓↓, Forma ↓ | Libertad pero soledad |
| Rechazo de boda | Moral ↓, Forma ↑ (canaliza rabia) | Corazón roto |
| Vacaciones | Forma recupera, Moral ↑ | Desconexión |
| Negocio falla | Preocupación financiera afecta forma | Aprendizaje amargo |

---

## Integración en código

### 1. Reemplazar `pickNextEventSmart()` en `src/lib/narrative/engine.ts`

```typescript
async function pickNextEventDynamic(player: Player): Promise<GameEvent> {
  const recentEvents = await fetchRecentEvents(player.id, 10);
  
  const prompt = buildEventPrompt({
    age: playerAge(player.week),
    club: player.club,
    week: player.week,
    stats: { forma: player.forma, moral: player.moral, fama: player.fama },
    recentHistory: recentEvents,
    mode: player.mode,
  });
  
  const eventData = await generateWithClaude(prompt);
  return transformToGameEvent(eventData);
}
```

### 2. Cambiar `src/app/carrera/page.tsx`

De:
```typescript
event = await pickNextEventSmart(EVENTS, player, usedEventIds, historyForAi);
```

A:
```typescript
event = await pickNextEventDynamic(player);
```

### 3. Eliminar `EVENTS` array de `src/lib/narrative/events.ts`

Los 40 eventos fijos ya NO se usan. Solo quedan eventos pre-juego (elección representante, primeras ofertas, pretemporada).

---

## Ventajas

✅ **Nunca se repiten** — cada evento es único  
✅ **Emocionalmente relevante** — contextualizado a edad/etapa  
✅ **Personajes específicos** — no genéricos  
✅ **Narrativa coherente** — referencia historia previa  
✅ **Escalable** — la IA puede generar infinitas historias  

---

## Notas de implementación

- Cache de eventos recientes para evitar repetición (últimas 20-30)
- Usar `playerAge(week)` para stage detection
- Los prompts deben ser consistentes en tono (castellano, emocional, específico)
- Testear con carreras largas (100+ eventos) para verificar no-repetición
