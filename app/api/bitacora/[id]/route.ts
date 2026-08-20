import { NextResponse } from "next/server";
import { getArchivoDownload, updateEvento } from "@/lib/bitacora";
import { ALL_EVENT_TYPES, type EventoTipoPersistido } from "@/lib/bitacoraMeta";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const idNum = Number(id);
  if (!Number.isInteger(idNum) || idNum <= 0) {
    return NextResponse.json({ error: "Id inválido" }, { status: 400 });
  }

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

  const patch: Partial<{
    tipo: EventoTipoPersistido;
    fechaHora: string;
    titulo: string;
    descripcion: string | null;
    area: string | null;
    autor: string;
  }> = {};
  if (b.tipo !== undefined) {
    if (!ALL_EVENT_TYPES.includes(b.tipo as EventoTipoPersistido)) {
      return NextResponse.json({ error: "Tipo de evento no válido" }, { status: 400 });
    }
    patch.tipo = b.tipo as EventoTipoPersistido;
  }
  if (b.fechaHora !== undefined) patch.fechaHora = String(b.fechaHora);
  if (b.titulo !== undefined) patch.titulo = String(b.titulo);
  if (b.descripcion !== undefined)
    patch.descripcion = b.descripcion ? String(b.descripcion) : null;
  if (b.area !== undefined) patch.area = b.area ? String(b.area) : null;
  if (b.autor !== undefined) patch.autor = String(b.autor);

  try {
    const evento = await updateEvento(idNum, patch, archivo);
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

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const idNum = Number(id);
  if (!Number.isInteger(idNum) || idNum <= 0) {
    return NextResponse.json({ error: "Id inválido" }, { status: 400 });
  }
  try {
    const archivo = await getArchivoDownload(idNum);
    if (!archivo) return NextResponse.json({ error: "Informe no encontrado" }, { status: 404 });
    return new NextResponse(archivo.contenido as unknown as BodyInit, {
      headers: {
        "Content-Type": archivo.mime,
        "Content-Length": String(archivo.tamano),
        "Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(archivo.nombre)}`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "No se pudo leer el informe" },
      { status: 404 }
    );
  }
}
