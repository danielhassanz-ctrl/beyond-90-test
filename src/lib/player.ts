import { createClient } from "@/lib/supabase/server";
import type { Player } from "@/types/player";

export async function getCurrentUserAndPlayer() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { supabase, user: null, player: null };
  }

  const { data: player } = await supabase
    .from("players")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<Player>();

  return { supabase, user, player };
}
