-- El prototipo de referencia deja poner un apodo y lo usa como nombre
-- "de cara al público" en toda la interfaz (como los futbolistas reales:
-- Kun, Pelusa...) — el nombre y apellidos real sigue siendo el que se usa
-- en la narrativa formal, pero el apodo es lo que aparece en cabeceras y
-- tarjetas cuando existe.
alter table players
  add column if not exists nickname text;
