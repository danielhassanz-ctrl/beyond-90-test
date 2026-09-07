alter table players
  add column if not exists stats_matches_played integer not null default 0,
  add column if not exists stats_goals integer not null default 0,
  add column if not exists stats_assists integer not null default 0,
  add column if not exists stats_minutes_played integer not null default 0,
  add column if not exists stats_red_cards integer not null default 0,
  add column if not exists stats_yellow_cards integer not null default 0,
  add column if not exists stats_titles integer not null default 0,
  add column if not exists stats_clean_sheets integer not null default 0;
