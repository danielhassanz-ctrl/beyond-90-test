-- ============================================================
-- LÍMITES DEL BUCKET DE FOTOS (auditoría del 16-oct-2026, bloques D y E)
--
-- Aplicar a mano en el SQL Editor de Supabase. Es idempotente.
--
-- Resultado de la auditoría: las políticas de Storage de `player-photos` ya exigen que la primera carpeta de la ruta sea el
-- identificador del usuario (subir, modificar y borrar), y la lectura pública es solo de ese bucket. Lo que faltaba: el bucket no
-- tenía límite de tamaño ni de tipo de archivo, así que cualquier jugador con sesión podía subir ficheros enormes o que no fueran
-- imágenes a su carpeta. La app solo sube imágenes (JPEG/PNG generados por el juego y la foto del jugador, que el navegador
-- comprime a JPEG; si la compresión falla puede llegar el original, de ahí HEIC/HEIF y WebP).
-- ============================================================

update storage.buckets
set file_size_limit = 10485760,  -- 10 MB
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
where id = 'player-photos';

-- Comprobación: debe salir 1 fila con el límite y la lista de tipos.
select id, public, file_size_limit, allowed_mime_types from storage.buckets where id = 'player-photos';
