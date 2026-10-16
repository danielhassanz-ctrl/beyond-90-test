/**
 * ¿Es una escena con la selección? Antes solo se miraba si el id empezaba por «sel-», «torneo» o «matchday-torneo»: los partidos de
 * las ventanas de selección (clasificatorias, Nations League, amistosos: «matchday-sel-…») no encajaban y su foto salía con una
 * camiseta cualquiera (blanca y sin escudo en un España-Dinamarca). Ahora también cuenta el equipo propio del evento.
 */
export function isNationalTeamEvent(event: { id: string; ownTeam?: string | null; title?: string }, nation?: string | null): boolean {
  if (/^(sel-|torneo|matchday-torneo|matchday-sel-)/.test(event.id) || /-(sel|torneo)-/.test(event.id)) return true;
  return Boolean(event.ownTeam && nation && event.ownTeam === nation);
}
