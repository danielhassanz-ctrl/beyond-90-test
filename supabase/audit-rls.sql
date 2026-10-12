-- ============================================================
-- AUDITORÍA DE SEGURIDAD (solo lectura): pegar en el SQL Editor de Supabase y ejecutar bloque a bloque.
-- Nada de aquí modifica datos. Las tablas principales (players, milestones, career_events) NO están
-- definidas en supabase/migrations: se crearon a mano, así que esto es la única forma de revisarlas.
-- ============================================================

-- A) ¿Qué tablas tienen RLS activado? (rowsecurity debe ser true en TODAS las de la app)
select tablename, rowsecurity
from pg_tables
where schemaname = 'public'
order by tablename;

-- B) Todas las políticas: quién puede qué. Mirar sobre todo players, milestones y career_events.
--    Lo correcto: SELECT/INSERT/UPDATE/DELETE solo con auth.uid() = user_id (o vía players.user_id).
--    Alarma si ves  qual = true  (o with_check = true) en players, milestones o career_events.
select tablename, policyname, cmd, roles, qual as using_expr, with_check
from pg_policies
where schemaname = 'public'
order by tablename, cmd, policyname;

-- C) Tipo de players.flags (debe ser jsonb para que funcione el trigger de créditos).
select data_type from information_schema.columns
where table_schema = 'public' and table_name = 'players' and column_name = 'flags';

-- D) Políticas del Storage (bucket player-photos): la subida debe exigir que la ruta empiece por el uid.
select policyname, cmd, roles, qual, with_check
from pg_policies
where schemaname = 'storage' and tablename = 'objects'
order by policyname;

-- E) ¿Es público el bucket? (lectura pública es lo esperado para player-photos)
select id, name, public, file_size_limit, allowed_mime_types from storage.buckets;

-- F) Tras aplicar 20261012_harden_rls.sql: el trigger debe existir.
select tgname, tgenabled from pg_trigger where tgname = 'trg_protect_player_credits';
