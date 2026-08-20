import { NextResponse } from "next/server";
import { listEventos, createEvento } from "@/lib/bitacora";
import { ALL_EVENT_TYPES, type EventoTipoPersistido } from "@/lib/bitacoraMeta";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const tipoRaw = searchParams.get("tipo");
  const tipo =
    tipoRaw && ALL_EVENT_TYPES.includes(tipoRaw as EventoTipoPersistido)
      ? (tipoRaw as EventoTipoPersistido)
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
  let b: Record<string, unknown>;
  let archivo: File | null = null;
  try {
    if (req.headers.get("content-type")?.includes("multipart/form-data")) {
      const form = await req.formData();
      b = Object.fromEntries(
        ["tipo", "fechaHora", "titulo", "descripcion", "area", "autor"].map((k) => [k, form.get(k)])
      );
      const candidate = form.get("archivo");
      archivo = candidate instanceof File && candidate.size > 0 ? candidate : null;
    } else {
      b = (await req.json()) as Record<string, unknown>;
    }
  } catch {
    return NextResponse.json({ error: "Cuerpo inválido" }, { status: 400 });
  }
  try {
    const evento = await createEvento({
      tipo: b.tipo as EventoTipoPersistido,
      fechaHora: String(b.fechaHora ?? ""),
      titulo: String(b.titulo ?? ""),
      descripcion: b.descripcion ? String(b.descripcion) : null,
      area: b.area ? String(b.area) : null,
      autor: String(b.autor ?? ""),
    }, archivo);
    return NextResponse.json(evento, { status: 201 });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "No se pudo crear el evento" },
      { status: 400 }
    );
  }
}
