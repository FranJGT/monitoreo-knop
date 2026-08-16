import type { EventoBitacora, EventoFiltros, EventoInput } from "./bitacoraMeta";

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { cache: "no-store", ...init });
  if (!res.ok) {
    let msg = `Error ${res.status}`;
    try {
      const j = await res.json();
      if (j?.error) msg = j.error;
    } catch {}
    throw new Error(msg);
  }
  return (await res.json()) as T;
}

function filtrosUrl(f: EventoFiltros): string {
  const u = new URLSearchParams();
  if (f.tipo && f.tipo !== "todos") u.set("tipo", f.tipo);
  if (f.texto) u.set("texto", f.texto);
  if (f.desde) u.set("desde", f.desde);
  if (f.hasta) u.set("hasta", f.hasta);
  const qs = u.toString();
  return qs ? `/api/bitacora?${qs}` : "/api/bitacora";
}

export const getEventos = (f: EventoFiltros, signal?: AbortSignal) =>
  request<EventoBitacora[]>(filtrosUrl(f), { signal });

export const createEventoRequest = (input: EventoInput) =>
  request<EventoBitacora>("/api/bitacora", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

export const updateEventoRequest = (id: number, input: Partial<EventoInput>) =>
  request<EventoBitacora>(`/api/bitacora/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
