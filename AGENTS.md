<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Idioma obligatorio en este proyecto

El usuario es de España y habla castellano. Escribe SIEMPRE en castellano de España, forma "tú" — nunca voseo argentino/rioplatense ("vos", "tenés", "querés", "andá", "contame", etc.) ni vocabulario latinoamericano ("plata", "auto", "computadora", "celular").

Esto aplica a:
- Cada respuesta de chat en este proyecto.
- Todo el texto de la interfaz de la app (botones, títulos, mensajes).
- Toda la narrativa del juego, tanto la escrita a mano como la generada por IA (ver `src/lib/narrative/ai.ts`, que ya incluye esta regla en sus prompts — no la quites).

Antes de enviar cualquier instrucción paso a paso, usa infinitivos ("ejecutar esto", "volver a intentar") en vez de imperativos conjugados, para evitar el error de conjugación tú/vos por completo.

Si en algún momento se detecta una palabra en voseo en una respuesta o en el código, es un error a corregir de inmediato, no una preferencia de estilo.

# Nombre del producto

El juego se llama **Beyond 90** (no "Conviértete en Leyenda", nombre antiguo ya retirado). Usar "Beyond 90" en toda la interfaz, los textos de compartir y los prompts de IA.

# Principios de diseño de "Beyond 90" (no negociables)

Toda decisión de producto, narrativa o UI de este juego se mide contra esto:

1. **Emotivo**: cada escena tiene que generar una reacción real, no ser un trámite de datos.
2. **Emocionante**: ritmo con tensión — momentos de incertidumbre real, no todo predecible.
3. **Narrativa bonita, siempre**: nunca texto genérico o de relleno. Si una escena no aporta nada de emoción o historia, no debería existir.
4. **Adictiva**: el jugador tiene que querer ver el siguiente turno.
5. **Compartible**: cualquier momento importante (empezar la carrera, fichar, un logro, un fracaso dramático) tiene que producir algo visualmente llamativo y con un botón de compartir — no una pantalla de texto plano. Esto incluye el arranque mismo de la carrera, no solo los hitos de media/final de carrera.

Antes de dar por terminada cualquier función nueva, revisar contra esta lista. Si falta algo compartible en un momento que lo amerita, es un defecto a corregir, no un "nice to have" para después.

