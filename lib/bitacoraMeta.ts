/** Constantes y tipos compartidos de la bitácora (usable desde cliente y servidor). */

export const EVENT_TYPES = [
  "visita",
  "mantencion_programada",
  "mantencion_correctiva",
  "incidente",
  "calibracion",
  "otro",
] as const;

export type EventoTipo = (typeof EVENT_TYPES)[number];

/** Tipo que existía antes de separar las mantenciones. Se conserva para leer y
 * editar registros históricos sin alterar datos ya persistidos. */
export const LEGACY_EVENT_TYPES = ["mantencion"] as const;
export type LegacyEventoTipo = (typeof LEGACY_EVENT_TYPES)[number];
export const ALL_EVENT_TYPES = [...EVENT_TYPES, ...LEGACY_EVENT_TYPES] as const;
export type EventoTipoPersistido = EventoTipo | LegacyEventoTipo;

export const TIPO_LABEL: Record<EventoTipo, string> = {
  visita: "Visita",
  mantencion_programada: "Mantención programada",
  mantencion_correctiva: "Mantención correctiva",
  incidente: "Incidente",
  calibracion: "Calibración",
  otro: "Otro",
};

export const TIPO_LABEL_PERSISTIDO: Record<EventoTipoPersistido, string> = {
  ...TIPO_LABEL,
  mantencion: "Mantención (registro histórico)",
};

export interface EventoArchivo {
  id: number;
  nombre: string;
  mime: string;
  tamano: number;
  creadoEn: string;
}

export interface EventoBitacora {
  id: number;
  tipo: EventoTipoPersistido;
  /** "YYYY-MM-DD HH:mm:ss" en hora local de Chile. */
  fechaHora: string;
  titulo: string;
  descripcion: string | null;
  area: string | null;
  autor: string;
  creadoEn: string;
  actualizadoEn: string;
  archivo: EventoArchivo | null;
}

export interface EventoInput {
  tipo: EventoTipoPersistido;
  /** "YYYY-MM-DDTHH:mm" desde el input datetime-local. */
  fechaHora: string;
  titulo: string;
  descripcion?: string | null;
  area?: string | null;
  autor: string;
}

export interface EventoFiltros {
  tipo?: EventoTipoPersistido | "todos";
  texto?: string;
  /** "YYYY-MM-DD" inclusive. */
  desde?: string;
  hasta?: string;
}
