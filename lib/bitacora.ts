import "server-only";
import { query } from "./db";
import type { ResultSetHeader, RowDataPacket } from "mysql2/promise";
import {
  EVENT_TYPES,
  type EventoTipo,
  type EventoBitacora,
  type EventoInput,
  type EventoFiltros,
} from "./bitacoraMeta";

export { EVENT_TYPES };
export type { EventoTipo, EventoBitacora, EventoInput, EventoFiltros };

const MAX_TITULO = 200;
const MAX_AUTOR = 100;
const MAX_AREA = 100;

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
    tipo: (EVENT_TYPES as readonly string[]).includes(r.tipo_evento)
      ? (r.tipo_evento as EventoTipo)
      : "otro",
    fechaHora: dbDateToString(r.fecha_hora),
    titulo: r.titulo,
    descripcion: r.descripcion,
    area: r.area,
    autor: r.autor,
    creadoEn: dbDateToString(r.creado_en),
    actualizadoEn: dbDateToString(r.actualizado_en),
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
  tipo: EventoTipo;
  fechaHora: string;
  titulo: string;
  descripcion: string | null;
  area: string | null;
  autor: string;
};

export function validarEvento(input: EventoInput): EventoValidado {
  if (!(EVENT_TYPES as readonly string[]).includes(input.tipo)) {
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

  const sql = `SELECT id, tipo_evento, fecha_hora, titulo, descripcion, area, autor,
                      creado_en, actualizado_en
               FROM bitacora_eventos
               ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
               ORDER BY fecha_hora DESC, id DESC
               LIMIT 500`;
  const rows = (await query(sql, params)) as EventoRow[];
  return rows.map(toEvento);
}

export async function createEvento(input: EventoInput): Promise<EventoBitacora> {
  const v = validarEvento(input);
  const res = (await query(
    `INSERT INTO bitacora_eventos (tipo_evento, fecha_hora, titulo, descripcion, area, autor)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [v.tipo, v.fechaHora, v.titulo, v.descripcion, v.area, v.autor]
  )) as ResultSetHeader;
  const creado = await getEvento(res.insertId);
  if (!creado) throw new Error("No se pudo leer el evento recién creado");
  return creado;
}

export async function updateEvento(
  id: number,
  input: Partial<EventoInput>
): Promise<EventoBitacora | null> {
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
  return getEvento(id);
}

async function getEvento(id: number): Promise<EventoBitacora | null> {
  const rows = (await query(
    `SELECT id, tipo_evento, fecha_hora, titulo, descripcion, area, autor,
            creado_en, actualizado_en
     FROM bitacora_eventos WHERE id = ?`,
    [id]
  )) as EventoRow[];
  return rows.length ? toEvento(rows[0]) : null;
}
