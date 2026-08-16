import { NextResponse } from "next/server";
import { listEventos, createEvento } from "@/lib/bitacora";
import { EVENT_TYPES, type EventoTipo } from "@/lib/bitacoraMeta";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const tipoRaw = searchParams.get("tipo");
  const tipo =
    tipoRaw && EVENT_TYPES.includes(tipoRaw as EventoTipo)
      ? (tipoRaw as EventoTipo)
      : "todos";
  const texto = searchParams.get("texto")?.slice(0, 100) ?? undefined;
  const desde = searchParams.get("desde") ?? undefined;
  const hasta = searchParams.get("hasta") ?? undefined;

  try {
    const data = await listEventos({ tipo, texto, desde, hasta });
    return NextResponse.json(data, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Error al listar la bitácora" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Cuerpo inválido" }, { status: 400 });
  }
  const b = body as Record<string, unknown>;
  try {
    const evento = await createEvento({
      tipo: b.tipo as EventoTipo,
      fechaHora: String(b.fechaHora ?? ""),
      titulo: String(b.titulo ?? ""),
      descripcion: b.descripcion ? String(b.descripcion) : null,
      area: b.area ? String(b.area) : null,
      autor: String(b.autor ?? ""),
    });
    return NextResponse.json(evento, { status: 201 });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "No se pudo crear el evento" },
      { status: 400 }
    );
  }
}
