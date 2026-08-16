import { NextResponse } from "next/server";
import { updateEvento } from "@/lib/bitacora";
import { EVENT_TYPES, type EventoTipo } from "@/lib/bitacoraMeta";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const idNum = Number(id);
  if (!Number.isInteger(idNum) || idNum <= 0) {
    return NextResponse.json({ error: "Id inválido" }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Cuerpo inválido" }, { status: 400 });
  }
  const b = body as Record<string, unknown>;

  const patch: Partial<{
    tipo: EventoTipo;
    fechaHora: string;
    titulo: string;
    descripcion: string | null;
    area: string | null;
    autor: string;
  }> = {};
  if (b.tipo !== undefined) {
    if (!EVENT_TYPES.includes(b.tipo as EventoTipo)) {
      return NextResponse.json({ error: "Tipo de evento no válido" }, { status: 400 });
    }
    patch.tipo = b.tipo as EventoTipo;
  }
  if (b.fechaHora !== undefined) patch.fechaHora = String(b.fechaHora);
  if (b.titulo !== undefined) patch.titulo = String(b.titulo);
  if (b.descripcion !== undefined)
    patch.descripcion = b.descripcion ? String(b.descripcion) : null;
  if (b.area !== undefined) patch.area = b.area ? String(b.area) : null;
  if (b.autor !== undefined) patch.autor = String(b.autor);

  try {
    const evento = await updateEvento(idNum, patch);
    if (!evento) {
      return NextResponse.json({ error: "Evento no encontrado" }, { status: 404 });
    }
    return NextResponse.json(evento);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "No se pudo editar el evento" },
      { status: 400 }
    );
  }
}
