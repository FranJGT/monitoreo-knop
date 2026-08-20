import "server-only";
import { query } from "./db";
import type { ResultSetHeader, RowDataPacket } from "mysql2/promise";
import {
  ALL_EVENT_TYPES,
  EVENT_TYPES,
  type EventoTipoPersistido,
  type EventoBitacora,
  type EventoInput,
  type EventoFiltros,
} from "./bitacoraMeta";
import { localFileStorage, type StoredFile } from "./bitacoraStorage";

export { ALL_EVENT_TYPES, EVENT_TYPES };
export type { EventoTipoPersistido as EventoTipo, EventoBitacora, EventoInput, EventoFiltros };

const MAX_TITULO = 200;
const MAX_AUTOR = 100;
const MAX_AREA = 100;
let attachmentTableAvailable: boolean | null = null;

interface EventoRow extends RowDataPacket {
  id: number;
  tipo_evento: string;
  fecha_hora: Date;
  titulo: string;
  descripcion: string | null;
  area: string | null;
  autor: string;
  creado_en: Date;
  actualizado_en: Date;
  archivo_id: number | null;
  archivo_nombre: string | null;
  archivo_mime: string | null;
  archivo_tamano: number | null;
  archivo_creado_en: Date | null;
}

/**
 * DATETIME es un "wall time" sin zona: reconstruye la cadena tal como se guardó
 * (el driver parsea con la tz del servidor Node, que coincide con la hora local
 * de Chile si el servidor está configurado en America/Santiago).
 */
function dbDateToString(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

function toEvento(r: EventoRow): EventoBitacora {
  return {
    id: r.id,
    tipo: (ALL_EVENT_TYPES as readonly string[]).includes(r.tipo_evento)
      ? (r.tipo_evento as EventoTipoPersistido)
      : "otro",
    fechaHora: dbDateToString(r.fecha_hora),
    titulo: r.titulo,
    descripcion: r.descripcion,
    area: r.area,
    autor: r.autor,
    creadoEn: dbDateToString(r.creado_en),
    actualizadoEn: dbDateToString(r.actualizado_en),
    archivo:
      r.archivo_id == null
        ? null
        : {
            id: r.archivo_id,
            nombre: r.archivo_nombre ?? "informe-mantenimiento",
            mime: r.archivo_mime ?? "application/octet-stream",
            tamano: r.archivo_tamano ?? 0,
            creadoEn: r.archivo_creado_en ? dbDateToString(r.archivo_creado_en) : "",
          },
  };
}

/** Normaliza "YYYY-MM-DDTHH:mm" a "YYYY-MM-DD HH:mm:ss" local. */
function normalizeFechaHora(raw: string): string {
  const s = String(raw).trim().replace("T", " ");
  if (!/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}/.test(s)) {
    throw new Error("Fecha inválida (formato esperado: YYYY-MM-DD HH:mm)");
  }
  const d = new Date(s.replace(" ", "T"));
  if (isNaN(d.getTime())) throw new Error("Fecha inválida");
  return `${s.slice(0, 16)}:00`;
}

function clean(s: string | null | undefined): string | null {
  const v = s?.trim();
  return v ? v : null;
}

export type EventoValidado = {
  tipo: EventoTipoPersistido;
  fechaHora: string;
  titulo: string;
  descripcion: string | null;
  area: string | null;
  autor: string;
};

export function validarEvento(input: EventoInput): EventoValidado {
  if (!(ALL_EVENT_TYPES as readonly string[]).includes(input.tipo)) {
    throw new Error("Tipo de evento no válido");
  }
  const titulo = clean(input.titulo);
  if (!titulo) throw new Error("El título es obligatorio");
  if (titulo.length > MAX_TITULO) throw new Error(`Título máximo ${MAX_TITULO} caracteres`);
  const autor = clean(input.autor);
  if (!autor) throw new Error("El autor es obligatorio");
  if (autor.length > MAX_AUTOR) throw new Error(`Autor máximo ${MAX_AUTOR} caracteres`);
  const area = clean(input.area);
  if (area && area.length > MAX_AREA) throw new Error(`Área máxima ${MAX_AREA} caracteres`);
  return {
    tipo: input.tipo,
    fechaHora: normalizeFechaHora(input.fechaHora),
    titulo,
    descripcion: clean(input.descripcion),
    area,
    autor,
  };
}

/** Lista de eventos, más recientes primero, con filtros opcionales. */
export async function listEventos(f: EventoFiltros): Promise<EventoBitacora[]> {
  const where: string[] = [];
  const params: (string | number | null)[] = [];

  if (f.tipo && f.tipo !== "todos") {
    where.push("tipo_evento = ?");
    params.push(f.tipo);
  }
  if (f.texto) {
    where.push("(titulo LIKE ? OR descripcion LIKE ? OR area LIKE ? OR autor LIKE ?)");
    const like = `%${f.texto}%`;
    params.push(like, like, like, like);
  }
  if (f.desde) {
    where.push("fecha_hora >= ?");
    params.push(`${f.desde} 00:00:00`);
  }
  if (f.hasta) {
    where.push("fecha_hora <= ?");
    params.push(`${f.hasta} 23:59:59`);
  }

  const hasAttachments = await canUseAttachmentTable();
  const sql = hasAttachments
    ? `SELECT e.id, e.tipo_evento, e.fecha_hora, e.titulo, e.descripcion, e.area, e.autor,
                      e.creado_en, e.actualizado_en,
                      a.id AS archivo_id, a.nombre_original AS archivo_nombre,
                      a.mime_type AS archivo_mime, a.tamano AS archivo_tamano,
                      a.creado_en AS archivo_creado_en
               FROM bitacora_eventos e
               LEFT JOIN bitacora_archivos a ON a.evento_id = e.id
               ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
               ORDER BY e.fecha_hora DESC, e.id DESC
               LIMIT 500`
    : `SELECT e.id, e.tipo_evento, e.fecha_hora, e.titulo, e.descripcion, e.area, e.autor,
                      e.creado_en, e.actualizado_en
               FROM bitacora_eventos e
               ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
               ORDER BY e.fecha_hora DESC, e.id DESC
               LIMIT 500`;
  const rows = (await query(sql, params)) as EventoRow[];
  return rows.map(toEvento);
}

export async function createEvento(input: EventoInput, archivo?: File | null): Promise<EventoBitacora> {
  const v = validarEvento(input);
  if (archivo && !(await canUseAttachmentTable())) {
    throw new Error("Falta aplicar la migración 002_bitacora_archivos antes de anexar informes.");
  }
  const res = (await query(
    `INSERT INTO bitacora_eventos (tipo_evento, fecha_hora, titulo, descripcion, area, autor)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [v.tipo, v.fechaHora, v.titulo, v.descripcion, v.area, v.autor]
  )) as ResultSetHeader;
  const id = Number(res.insertId);
  if (archivo) {
    let stored: StoredFile | null = null;
    try {
      stored = await localFileStorage.save(id, archivo);
      await insertArchivo(id, stored, v.autor);
    } catch (e) {
      if (stored) await localFileStorage.delete(stored.clave);
      await query("DELETE FROM bitacora_eventos WHERE id = ?", [id]);
      throw e;
    }
  }
  const creado = await getEvento(id);
  if (!creado) throw new Error("No se pudo leer el evento recién creado");
  return creado;
}

export async function updateEvento(
  id: number,
  input: Partial<EventoInput>,
  archivo?: File | null
): Promise<EventoBitacora | null> {
  if (archivo && !(await canUseAttachmentTable())) {
    throw new Error("Falta aplicar la migración 002_bitacora_archivos antes de anexar informes.");
  }
  const actual = await getEvento(id);
  if (!actual) return null;
  const merged: EventoInput = {
    tipo: input.tipo ?? actual.tipo,
    fechaHora: input.fechaHora ?? actual.fechaHora.slice(0, 16),
    titulo: input.titulo ?? actual.titulo,
    descripcion: input.descripcion === undefined ? actual.descripcion : input.descripcion,
    area: input.area === undefined ? actual.area : input.area,
    autor: input.autor ?? actual.autor,
  };
  const v = validarEvento(merged);
  await query(
    `UPDATE bitacora_eventos
     SET tipo_evento = ?, fecha_hora = ?, titulo = ?, descripcion = ?, area = ?, autor = ?
     WHERE id = ?`,
    [v.tipo, v.fechaHora, v.titulo, v.descripcion, v.area, v.autor, id]
  );
  if (archivo) {
    const previous = await getArchivoRecord(id);
    const stored = await localFileStorage.save(id, archivo);
    try {
      await insertArchivo(id, stored, v.autor);
      if (previous) await localFileStorage.delete(previous.clave);
    } catch (e) {
      await localFileStorage.delete(stored.clave);
      throw e;
    }
  }
  return getEvento(id);
}

async function getEvento(id: number): Promise<EventoBitacora | null> {
  const hasAttachments = await canUseAttachmentTable();
  const rows = (await query(
    hasAttachments
      ? `SELECT e.id, e.tipo_evento, e.fecha_hora, e.titulo, e.descripcion, e.area, e.autor,
            e.creado_en, e.actualizado_en,
            a.id AS archivo_id, a.nombre_original AS archivo_nombre,
            a.mime_type AS archivo_mime, a.tamano AS archivo_tamano,
            a.creado_en AS archivo_creado_en
     FROM bitacora_eventos e
     LEFT JOIN bitacora_archivos a ON a.evento_id = e.id
     WHERE e.id = ?`
      : `SELECT e.id, e.tipo_evento, e.fecha_hora, e.titulo, e.descripcion, e.area, e.autor,
            e.creado_en, e.actualizado_en
     FROM bitacora_eventos e
     WHERE e.id = ?`,
    [id]
  )) as EventoRow[];
  return rows.length ? toEvento(rows[0]) : null;
}

type ArchivoRow = RowDataPacket & {
  id: number;
  evento_id: number;
  clave: string;
  nombre_original: string;
  mime_type: string;
  tamano: number;
  subido_por: string;
};

async function insertArchivo(eventoId: number, stored: StoredFile, autor: string) {
  await query(
    `INSERT INTO bitacora_archivos
       (evento_id, clave, nombre_original, mime_type, tamano, subido_por)
     VALUES (?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       clave = VALUES(clave), nombre_original = VALUES(nombre_original),
       mime_type = VALUES(mime_type), tamano = VALUES(tamano),
       subido_por = VALUES(subido_por), actualizado_en = CURRENT_TIMESTAMP`,
    [eventoId, stored.clave, stored.nombre, stored.mime, stored.tamano, autor]
  );
}

async function getArchivoRecord(eventoId: number): Promise<ArchivoRow | null> {
  if (!(await canUseAttachmentTable())) return null;
  const rows = (await query(
    `SELECT id, evento_id, clave, nombre_original, mime_type, tamano, subido_por
     FROM bitacora_archivos WHERE evento_id = ?`,
    [eventoId]
  )) as ArchivoRow[];
  return rows[0] ?? null;
}

async function canUseAttachmentTable(): Promise<boolean> {
  if (attachmentTableAvailable !== null) return attachmentTableAvailable;
  try {
    await query("SELECT 1 FROM bitacora_archivos LIMIT 1");
    attachmentTableAvailable = true;
    return true;
  } catch (e) {
    const code = (e as { code?: string }).code;
    if (code !== "ER_NO_SUCH_TABLE") throw e;
    attachmentTableAvailable = false;
    return false;
  }
}

export async function getArchivoDownload(
  eventoId: number
): Promise<{ eventoId: number; nombre: string; mime: string; tamano: number; contenido: Buffer } | null> {
  const r = await getArchivoRecord(eventoId);
  if (!r) return null;
  const contenido = await localFileStorage.read(r.clave);
  return {
    eventoId,
    nombre: r.nombre_original,
    mime: r.mime_type,
    tamano: r.tamano,
    contenido,
  };
}
