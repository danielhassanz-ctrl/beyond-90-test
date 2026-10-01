-- Causa raíz real de "las fotos de hito nunca se guardan": la tabla
-- milestones solo tenía políticas de INSERT y SELECT, nunca UPDATE. El
-- pipeline de imágenes (resolveEvent, regenerateMilestoneImage) genera la
-- foto bien, pero al intentar guardar image_url/image_status en la fila
-- ya existente, Supabase descartaba el UPDATE en silencio (0 filas
-- afectadas, sin error) — ni siquiera el dueño del hito podía tocar su
-- propia fila. Confirmado en vivo con una cuenta de prueba real: insertar
-- y leer funcionaban, actualizar devolvía 0 filas sin ningún error.
--
-- Ya aplicada manualmente en el SQL Editor de Supabase (1 oct 2026) — este
-- archivo documenta el cambio en el repositorio, por si hace falta
-- reaplicarla en otro entorno.
create policy "Users can update their own milestones"
on public.milestones
for update
to authenticated
using (auth.uid() = (select players.user_id from players where players.id = milestones.player_id))
with check (auth.uid() = (select players.user_id from players where players.id = milestones.player_id));
