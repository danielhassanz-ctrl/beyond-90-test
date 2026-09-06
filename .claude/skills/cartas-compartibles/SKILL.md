---
name: cartas-compartibles
description: Genera imágenes contextuales para las tarjetas de hitos compartibles en Beyond 90. Cada evento tiene un prompt que describe la escena real (fichaje con camiseta del club, gol con dedos, trofeo, boda, etc.), en el que se sustituye [FACE] con la foto real del jugador. Use esta skill para mantener coherencia visual en todas las tarjetas compartibles.
compatibility: Replicate API (flux-kontext-pro), foto del jugador en formato URL
---

# Cartas Compartibles: Prompts Contextuales

## Cómo funciona

Cada evento importante (hito) genera una tarjeta compartible con una imagen. En lugar de mostrar solo la cara del jugador en azul, cada imagen es **contextual y realista**:

- **Fichaje**: jugador con camiseta nueva del club, estrechando mano al presidente
- **Gol importante (hat-trick)**: jugador en el campo con 3 dedos levantados, celebrando
- **Trofeo (Liga/Champions)**: jugador levantando el trofeo en el campo
- **Boda**: jugador en traje elegante en escena de boda
- **MVP**: jugador recibiendo trofeo de MVP en el campo
- **Ascenso**: jugador en uniforme celebrando en el campo
- **Renovación**: jugador sosteniendo camiseta del club

En cada prompt, reemplaza:
- `[FACE]` con la URL de la foto del jugador
- `[AGE]` con el contexto de edad (ej: "16-year-old young footballer", "30-year-old experienced footballer")

La foto generada mostrará al jugador envejecido según su edad en el juego.

## Prompts por evento

### Fichaje (contrato-*)
```
Photorealistic photo of [AGE] [FACE] holding up a [CLUB_KIT] football jersey with both hands at an official club unveiling event, a club president in a suit next to him extending a handshake, camera flashes, official club office backdrop, professional sports photography style
```

### Hat-trick (par-hat-trick)
```
Photorealistic sports photography of [FACE] on a professional football pitch celebrating a goal, holding up three fingers proudly, teammates in background, stadium lights and crowd, dramatic moment, photojournalism style
```

### Trofeo Liga (fork-titulo-liga)
```
Photorealistic sports photography of [FACE] lifting a large league trophy above his head on the pitch after winning, confetti falling around him, teammates and crowd in the background, stadium floodlights, triumphant moment, professional sports photography
```

### Trofeo Champions (fork-champions)
```
Photorealistic sports photography of [FACE] lifting a large European club trophy on the pitch after winning a continental final, fireworks and confetti in the background, massive crowd, dramatic stadium lighting, celebratory moment, international sports photography
```

### Boda (vid-boda)
```
Photorealistic wedding photo of [FACE] in a formal suit, smiling warmly, with a few teammates and a coach figure visible in the background, elegant wedding venue, warm golden hour light, joyful celebration atmosphere, wedding photography style
```

### MVP de partido (par-mvp-partido-clave)
```
Photorealistic sports photography of [FACE] receiving a man-of-the-match award trophy on the pitch after a game, holding the trophy proudly, stadium lights, teammates applauding in the background, camera flashes, professional sports moment
```

### Renovación de contrato (rep-renovacion-contrato)
```
Photorealistic photo of [FACE] holding up a [CLUB_KIT] football jersey with both hands in a professional club office, a club director in a suit next to him, official contract on table, camera moment, official club photography
```

### Ascenso de división (fork-ascenso-division)
```
Photorealistic sports photography of [FACE] celebrating on the pitch after his team wins promotion, arms raised in joy, teammates joining the celebration, crowd visible in background, stadium atmosphere, triumphant moment
```

### Balón de Oro (premio-balon-oro)
```
Photorealistic photo of [FACE] on a red carpet in a formal tuxedo at an award show gala, holding the Balón de Oro award, award show lighting, flashes from photographers, elegant awards ceremony atmosphere, sports awards ceremony style
```

### Selección (debut: sel-primera-convocatoria)
```
Photorealistic sports photography of [FACE] in his national team kit on a professional football pitch, proud expression, national flag visible in background, stadium atmosphere, professional sports moment
```

### Capitanía (sel-capitania)
```
Photorealistic sports photography of [FACE] wearing the captain's armband of his national team, holding the armband proudly, national team kit, stadium background, leadership moment, professional sports photography
```

### Mundial (sel-mundial)
```
Photorealistic sports photography of [FACE] in his national team kit celebrating passionately on a World Cup stadium pitch, huge crowd and confetti in the background, dramatic stadium lighting, momentous occasion, international tournament atmosphere
```

### Eurocopa (sel-eurocopa)
```
Photorealistic sports photography of [FACE] in his national team kit on a European championship pitch, celebrating with intensity, European stadium atmosphere, crowd in background, continental tournament moment
```

### Copa América (sel-copa-america)
```
Photorealistic sports photography of [FACE] in his national team kit celebrating on a South American stadium pitch, tropical atmosphere, crowd visible, continental tournament moment
```

---

## Cómo integrar en el código

En `src/app/carrera/actions.ts`, cuando generes una imagen para un hito:

1. Consulta esta skill para obtener el prompt según `event.id`
2. Reemplaza `[FACE]` con `player.photo_url`
3. Reemplaza `[CLUB_KIT]` con el resultado de `describeKit(newClub)` (si es aplicable)
4. Pasa el prompt final a `generatePlayerImage()`

**Ejemplo**:
```typescript
const promptMap: Record<string, string> = {
  "contrato-debut": "Photorealistic photo of [FACE] holding up a [CLUB_KIT] football jersey...",
  "par-hat-trick": "Photorealistic sports photography of [FACE] on a professional football pitch...",
  // etc.
};

const basePrompt = promptMap[event.id];
if (basePrompt) {
  const prompt = basePrompt
    .replace("[FACE]", player.photo_url)
    .replace("[CLUB_KIT]", describeKit(newClub));
  const buffer = await generatePlayerImage(player.photo_url, prompt);
}
```

---

## Notas

- Cada prompt mantiene coherencia visual: contexto real, escena definida, iluminación profesional
- El reemplazo de [FACE] es simple: solo la URL de la foto del jugador
- Los prompts no incluyen "remove background" o "generate new face" — siempre usan la foto real del jugador
- Los prompts siguen la escala de Flux/Replicate: detallados pero no abrumadores
