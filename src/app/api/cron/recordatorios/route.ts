import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { fetchAllRows } from "@/lib/supabase/fetchAll";
import { pushConfigured, sendPush } from "@/lib/push/send";
import { reminderFor, type ReminderPlayer } from "@/lib/push/reminders";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

interface SubRow {
  id: string;
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  last_sent_at: string | null;
}

interface PlayerRow extends ReminderPlayer {
  user_id: string;
  created_at: string;
}

/**
 * Recordatorios diarios (Vercel Cron, ver vercel.json). Vercel manda `Authorization: Bearer <CRON_SECRET>`; sin ese secreto
 * configurado o con otro valor, no hace nada. Un aviso como mucho cada 20 horas por dispositivo (ver push/reminders.ts).
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  if (!pushConfigured()) return NextResponse.json({ ok: false, motivo: "Faltan las claves VAPID" });

  let service;
  try {
    service = createServiceClient();
  } catch {
    return NextResponse.json({ ok: false, motivo: "Falta SUPABASE_SERVICE_ROLE_KEY" });
  }

  const { data: subs, error } = await fetchAllRows<SubRow>((from, to) =>
    service.from("push_subscriptions").select("id, user_id, endpoint, p256dh, auth, last_sent_at").order("id").range(from, to),
  );
  if (error) return NextResponse.json({ ok: false, motivo: error.message }, { status: 500 });
  if (subs.length === 0) return NextResponse.json({ ok: true, suscripciones: 0, enviados: 0 });

  // El jugador más reciente de cada usuario.
  const userIds = [...new Set(subs.map((s) => s.user_id))];
  const latest = new Map<string, PlayerRow>();
  for (let i = 0; i < userIds.length; i += 100) {
    const chunk = userIds.slice(i, i + 100);
    const { data } = await service.from("players").select("user_id, last_name, nickname, status, flags, last_active_at, created_at").in("user_id", chunk).order("created_at", { ascending: false });
    for (const p of (data ?? []) as PlayerRow[]) if (!latest.has(p.user_id)) latest.set(p.user_id, p);
  }

  const now = new Date();
  let sent = 0;
  let removed = 0;
  let failed = 0;
  const gone: string[] = [];
  const delivered: string[] = [];
  for (let i = 0; i < subs.length; i += 20) {
    await Promise.all(
      subs.slice(i, i + 20).map(async (sub) => {
        const player = latest.get(sub.user_id);
        if (!player) return;
        const reminder = reminderFor(player, sub.last_sent_at, now);
        if (!reminder) return;
        const res = await sendPush(sub, reminder);
        if (res === "ok") {
          sent++;
          delivered.push(sub.id);
        } else if (res === "gone") {
          removed++;
          gone.push(sub.id);
        } else failed++;
      }),
    );
  }
  if (gone.length) await service.from("push_subscriptions").delete().in("id", gone);
  if (delivered.length) await service.from("push_subscriptions").update({ last_sent_at: now.toISOString() }).in("id", delivered);

  return NextResponse.json({ ok: true, suscripciones: subs.length, enviados: sent, eliminados: removed, fallidos: failed });
}
