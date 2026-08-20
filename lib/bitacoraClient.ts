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

function bodyFor(input: EventoInput, archivo?: File | null): BodyInit {
  if (!archivo) return JSON.stringify(input);
  const form = new FormData();
  form.set("tipo", input.tipo);
  form.set("fechaHora", input.fechaHora);
  form.set("titulo", input.titulo);
  form.set("descripcion", input.descripcion ?? "");
  form.set("area", input.area ?? "");
  form.set("autor", input.autor);
  form.set("archivo", archivo);
  return form;
}

function initFor(input: EventoInput, archivo?: File | null): RequestInit {
  const body = bodyFor(input, archivo);
  return {
    method: "POST",
    ...(archivo ? {} : { headers: { "Content-Type": "application/json" } }),
    body,
  };
}

export const createEventoRequest = (input: EventoInput, archivo?: File | null) =>
  request<EventoBitacora>("/api/bitacora", {
    ...initFor(input, archivo),
  });

export const updateEventoRequest = (id: number, input: Partial<EventoInput>, archivo?: File | null) => {
  if (!archivo) {
    return request<EventoBitacora>(`/api/bitacora/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
  }
  const form = new FormData();
  for (const [key, value] of Object.entries(input)) {
    if (value !== undefined && value !== null) form.set(key, String(value));
  }
  form.set("archivo", archivo);
  return request<EventoBitacora>(`/api/bitacora/${id}`, {
    method: "PATCH",
    body: form,
  });
};
