-- Al regenerar la foto de un hito (botón "Regenerar imagen"), el prompt
-- real y específico de la escena (p.ej. "una paloma en mitad del círculo
-- central, compañeros mirándola") solo existía en events.ts, nunca se
-- guardaba en la fila del hito — así que regenerateMilestoneImage no
-- tenía forma de reconstruirlo y caía a un prompt genérico basado solo en
-- el título, que la IA interpretaba libremente (reportado en vivo: el
-- título decía "la paloma que no se va" pero la foto regenerada no tenía
-- ninguna paloma, solo un jugador arrodillado genérico).
alter table milestones
  add column if not exists image_scene text;
