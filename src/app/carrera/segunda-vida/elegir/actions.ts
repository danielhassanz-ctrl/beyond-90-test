"use server";

import { redirect } from "next/navigation";
import { getCurrentUserAndPlayer } from "@/lib/player";
import { PRESIDENT_CLUB_OPTIONS, COACH_CLUB_OPTIONS, AGENT_SPECIALTY_OPTIONS } from "@/lib/constants";
import type { SecondCareerRole } from "@/types/career";

export async function chooseSecondCareer(formData: FormData) {
  const { supabase, user, player } = await getCurrentUserAndPlayer();

  if (!user || !player) {
    redirect("/login");
  }

  const role = formData.get("role") as SecondCareerRole;

  await supabase.from("players").update({ second_career: role }).eq("id", player.id);
  redirect("/carrera/segunda-vida/elegir");
}

export async function choosePresidentClub(formData: FormData) {
  const { supabase, user, player } = await getCurrentUserAndPlayer();

  if (!user || !player) {
    redirect("/login");
  }

  const value = formData.get("club_option") as string;
  const option = PRESIDENT_CLUB_OPTIONS.find((c) => c.value === value);

  if (!option) {
    redirect("/carrera/segunda-vida/elegir?error=Elige un club para continuar.");
  }

  if (player.patrimonio < option.cost) {
    redirect(
      `/carrera/segunda-vida/elegir?error=${encodeURIComponent("No tienes patrimonio suficiente para ese proyecto.")}`,
    );
  }

  const club = "club" in option ? option.club : player.club;

  await supabase
    .from("players")
    .update({
      second_club: club,
      patrimonio: player.patrimonio - option.cost,
      second_week: 1,
      status: "second_life",
    })
    .eq("id", player.id);

  redirect("/carrera/segunda-vida");
}

export async function chooseCoachClub(formData: FormData) {
  const { supabase, user, player } = await getCurrentUserAndPlayer();

  if (!user || !player) {
    redirect("/login");
  }

  const value = formData.get("club_option") as string;
  const option = COACH_CLUB_OPTIONS.find((c) => c.value === value);

  if (!option) {
    redirect("/carrera/segunda-vida/elegir?error=Elige un banquillo para continuar.");
  }

  const club = "club" in option ? option.club : player.club;

  await supabase
    .from("players")
    .update({
      second_club: club,
      second_week: 1,
      status: "second_life",
    })
    .eq("id", player.id);

  redirect("/carrera/segunda-vida");
}

export async function chooseAgentSpecialty(formData: FormData) {
  const { supabase, user, player } = await getCurrentUserAndPlayer();

  if (!user || !player) {
    redirect("/login");
  }

  const value = formData.get("specialty_option") as string;
  const option = AGENT_SPECIALTY_OPTIONS.find((s) => s.value === value);

  if (!option) {
    redirect("/carrera/segunda-vida/elegir?error=Elige una especialización para continuar.");
  }

  await supabase
    .from("players")
    .update({
      second_week: 1,
      status: "second_life",
      flags: { ...player.flags, agente_especialidad: option.label },
    })
    .eq("id", player.id);

  redirect("/carrera/segunda-vida");
}
