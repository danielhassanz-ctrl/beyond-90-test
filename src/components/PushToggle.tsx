"use client";

import { useEffect, useState } from "react";
import { guardarSuscripcion, quitarSuscripcion } from "@/app/mi-jugador/avisos/actions";

type Status = "cargando" | "no-soportado" | "instalar" | "bloqueado" | "apagado" | "encendido";

function toKey(base64: string): Uint8Array<ArrayBuffer> {
  const padded = (base64 + "=".repeat((4 - (base64.length % 4)) % 4)).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(padded);
  const out = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

/** Activar o apagar los avisos del reto del día y de la carrera. En iPhone solo funcionan con la app añadida a la pantalla de inicio. */
export function PushToggle({ publicKey }: { publicKey: string }) {
  const [status, setStatus] = useState<Status>("cargando");
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const standalone = window.matchMedia("(display-mode: standalone)").matches || (navigator as unknown as { standalone?: boolean }).standalone === true;
        const ios = /iPad|iPhone|iPod/.test(navigator.userAgent);
        if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
          if (!cancelled) setStatus(ios && !standalone ? "instalar" : "no-soportado");
          return;
        }
        if (Notification.permission === "denied") {
          if (!cancelled) setStatus("bloqueado");
          return;
        }
        const reg = await navigator.serviceWorker.getRegistration("/sw.js");
        const sub = reg ? await reg.pushManager.getSubscription() : null;
        if (!cancelled) setStatus(sub && Notification.permission === "granted" ? "encendido" : "apagado");
      } catch {
        if (!cancelled) setStatus("no-soportado");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function enable() {
    setBusy(true);
    setMessage(null);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus(permission === "denied" ? "bloqueado" : "apagado");
        return;
      }
      const reg = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: toKey(publicKey) });
      const json = sub.toJSON() as { endpoint?: string; keys?: { p256dh?: string; auth?: string } };
      const res = await guardarSuscripcion({ endpoint: json.endpoint ?? "", keys: { p256dh: json.keys?.p256dh ?? "", auth: json.keys?.auth ?? "" } }, navigator.userAgent);
      if (!res.ok) {
        await sub.unsubscribe().catch(() => {});
        setMessage(res.error ?? "No se pudo activar.");
        setStatus("apagado");
        return;
      }
      setStatus("encendido");
    } catch {
      setMessage("No se pudo activar en este dispositivo.");
    } finally {
      setBusy(false);
    }
  }

  async function disable() {
    setBusy(true);
    setMessage(null);
    try {
      const reg = await navigator.serviceWorker.getRegistration("/sw.js");
      const sub = reg ? await reg.pushManager.getSubscription() : null;
      if (sub) {
        await quitarSuscripcion(sub.endpoint);
        await sub.unsubscribe();
      }
      setStatus("apagado");
    } catch {
      setMessage("No se pudo apagar. Inténtalo de nuevo.");
    } finally {
      setBusy(false);
    }
  }

  if (status === "cargando") return null;

  return (
    <div className="w-full max-w-md space-y-2 rounded-2xl border border-panel-border bg-surface p-4">
      <p className="text-kicker">🔔 Avisos</p>
      {status === "no-soportado" && <p className="text-sm text-muted-foreground">Este navegador no admite avisos.</p>}
      {status === "instalar" && <p className="text-sm text-muted-foreground">En iPhone, para recibir avisos hay que añadir Beyond 90 a la pantalla de inicio (Compartir → Añadir a pantalla de inicio) y abrirla desde ahí.</p>}
      {status === "bloqueado" && <p className="text-sm text-muted-foreground">Has bloqueado los avisos para esta web. Se activan de nuevo desde los ajustes del navegador.</p>}
      {(status === "apagado" || status === "encendido") && (
        <>
          <p className="text-sm text-muted-foreground">
            {status === "encendido" ? "Te avisaremos del reto del día y de tu racha, como mucho una vez al día." : "Recibe un aviso con el reto del día y cuando tu racha esté en juego. Como mucho uno al día."}
          </p>
          <button
            type="button"
            disabled={busy}
            onClick={status === "encendido" ? disable : enable}
            className="rounded-full border border-gold/50 px-4 py-2 font-cond text-xs font-bold uppercase tracking-wide text-gold disabled:opacity-50"
          >
            {status === "encendido" ? "Apagar avisos" : "Activar avisos"}
          </button>
        </>
      )}
      {message && <p className="text-xs text-destructive">{message}</p>}
    </div>
  );
}
