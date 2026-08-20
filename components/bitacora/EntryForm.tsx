"use client";

import { useEffect, useRef, useState } from "react";
import { X, Loader2 } from "lucide-react";
import {
  EVENT_TYPES,
  TIPO_LABEL,
  LEGACY_EVENT_TYPES,
  type EventoBitacora,
  type EventoInput,
} from "@/lib/bitacoraMeta";
import { getDpDevices, getSthDevices } from "@/lib/knopClient";
import type { DpDevice, SthDevice } from "@/lib/knopTypes";

type Props = {
  /** Si viene, es edición; si es null, creación. */
  evento: EventoBitacora | null;
  onClose: () => void;
  onSubmit: (input: EventoInput, archivo?: File | null) => Promise<void>;
};

type Errores = Partial<Record<"tipo" | "fechaHora" | "titulo" | "area" | "autor", string>>;

function nowLocalValue(): string {
  const d = new Date();
  const off = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - off).toISOString().slice(0, 16);
}

function toInputValue(e: EventoBitacora): string {
  return e.fechaHora.slice(0, 16);
}

/** Formulario de creación/edición en modal, con validación en blur y focus trap simple. */
export function EntryForm({ evento, onClose, onSubmit }: Props) {
  const [tipo, setTipo] = useState<string>(evento?.tipo ?? "visita");
  const [fechaHora, setFechaHora] = useState(evento ? toInputValue(evento) : nowLocalValue());
  const [titulo, setTitulo] = useState(evento?.titulo ?? "");
  const [area, setArea] = useState(evento?.area ?? "");
  const [descripcion, setDescripcion] = useState(evento?.descripcion ?? "");
  const [autor, setAutor] = useState(evento?.autor ?? "");
  const [archivo, setArchivo] = useState<File | null>(null);
  const [archivoError, setArchivoError] = useState<string | null>(null);
  const [equipos, setEquipos] = useState<Array<{ value: string; label: string }>>([]);
  const [errores, setErrores] = useState<Errores>({});
  const [enviando, setEnviando] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const tituloRef = useRef<HTMLInputElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    returnFocusRef.current = document.activeElement as HTMLElement | null;
    tituloRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      returnFocusRef.current?.focus();
    };
  }, [onClose]);

  useEffect(() => {
    let active = true;
    Promise.all([getSthDevices(), getDpDevices()])
      .then(([sth, dp]) => {
        if (!active) return;
        const sthOptions = (sth as SthDevice[]).map((d) => ({
          value: `[STH] ${d.identificador}${d.ubicacion ? ` — ${d.ubicacion}` : ""}`,
          label: `STH · ${d.identificador}${d.ubicacion ? ` — ${d.ubicacion}` : ""}`,
        }));
        const dpOptions = (dp as DpDevice[]).map((d) => ({
          value: `[SDP] ${d.identificador}${d.ubicacion ? ` — ${d.ubicacion}` : ""}`,
          label: `SDP · ${d.identificador}${d.ubicacion ? ` — ${d.ubicacion}` : ""}`,
        }));
        setEquipos([...sthOptions, ...dpOptions]);
      })
      .catch(() => setEquipos([]));
    return () => {
      active = false;
    };
  }, []);

  const validarCampo = (campo: keyof Errores, valor: string) => {
    const errs = { ...errores };
    if (campo === "titulo" && !valor.trim()) errs.titulo = "El título es obligatorio";
    else if (campo === "titulo" && valor.trim().length > 200)
      errs.titulo = "Máximo 200 caracteres";
    else if (campo === "autor" && !valor.trim()) errs.autor = "El autor es obligatorio";
    else if (campo === "autor" && valor.trim().length > 100)
      errs.autor = "Máximo 100 caracteres";
    else if (campo === "fechaHora" && !valor) errs.fechaHora = "La fecha es obligatoria";
    else if (campo === "area" && valor.trim().length > 100)
      errs.area = "Máximo 100 caracteres";
    else delete errs[campo];
    setErrores(errs);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Errores = {};
    if (!titulo.trim()) errs.titulo = "El título es obligatorio";
    if (!autor.trim()) errs.autor = "El autor es obligatorio";
    if (!fechaHora) errs.fechaHora = "La fecha es obligatoria";
    if (archivoError) return;
    setErrores(errs);
    if (Object.keys(errs).length) return;

    setEnviando(true);
    setServerError(null);
    try {
      await onSubmit({
        tipo: tipo as EventoInput["tipo"],
        fechaHora,
        titulo: titulo.trim(),
        descripcion: descripcion.trim() || null,
        area: area.trim() || null,
        autor: autor.trim(),
      }, archivo);
      onClose();
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "No se pudo guardar");
    } finally {
      setEnviando(false);
    }
  };

  const onFileChange = (file: File | undefined) => {
    setArchivoError(null);
    if (!file) {
      setArchivo(null);
      return;
    }
    const allowed = new Map([
      ["application/pdf", ["pdf"]],
      ["application/msword", ["doc"]],
      ["application/vnd.openxmlformats-officedocument.wordprocessingml.document", ["docx"]],
      ["application/vnd.ms-excel", ["xls"]],
      ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", ["xlsx"]],
      ["image/png", ["png"]],
      ["image/jpeg", ["jpg", "jpeg"]],
    ]);
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
    if (file.size > 10 * 1024 * 1024 || !allowed.has(file.type) || !allowed.get(file.type)!.includes(ext)) {
      setArchivo(null);
      setArchivoError("Usa PDF, Word, Excel, PNG o JPG con extensión y tipo MIME coherentes (máximo 10 MB).");
      return;
    }
    setArchivo(file);
  };

  const field =
    "w-full rounded-xl border border-line-strong bg-surface px-3.5 py-2.5 text-sm text-ink outline-none transition-colors hover:border-brand-300 focus:border-brand-500";

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="entryform-titulo"
        className="max-h-[92dvh] w-full max-w-xl overflow-y-auto rounded-t-2xl bg-surface shadow-[var(--shadow-pop)] sm:rounded-2xl"
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 id="entryform-titulo" className="text-lg font-extrabold text-brand-900">
            {evento ? "Editar evento" : "Nuevo evento"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl text-muted transition-colors hover:bg-surface-2 hover:text-ink"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-4 px-5 py-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="ef-tipo"
                className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-muted"
              >
                Tipo de evento
              </label>
              <select
                id="ef-tipo"
                value={tipo}
                onChange={(e) => setTipo(e.target.value)}
                className={field}
              >
                {[...(evento && LEGACY_EVENT_TYPES.includes(evento.tipo as (typeof LEGACY_EVENT_TYPES)[number]) ? [evento.tipo] : []), ...EVENT_TYPES].map((t) => (
                  <option key={t} value={t}>
                    {t === "mantencion" ? "Mantención (registro histórico)" : TIPO_LABEL[t]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                htmlFor="ef-fecha"
                className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-muted"
              >
                Fecha y hora
              </label>
              <input
                id="ef-fecha"
                type="datetime-local"
                value={fechaHora}
                onChange={(e) => setFechaHora(e.target.value)}
                onBlur={() => validarCampo("fechaHora", fechaHora)}
                className={field}
              />
              {errores.fechaHora && (
                <p className="mt-1 text-xs font-semibold text-alert">{errores.fechaHora}</p>
              )}
            </div>
          </div>

          <div>
            <label
              htmlFor="ef-titulo"
              className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-muted"
            >
              Título
            </label>
            <input
              id="ef-titulo"
              ref={tituloRef}
              type="text"
              value={titulo}
              maxLength={200}
              onChange={(e) => setTitulo(e.target.value)}
              onBlur={() => validarCampo("titulo", titulo)}
              placeholder="Ej: Visita proveedor de filtros"
              className={field}
            />
            {errores.titulo && (
              <p className="mt-1 text-xs font-semibold text-alert">{errores.titulo}</p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="ef-area"
                className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-muted"
              >
                Equipo STH / SDP (opcional)
              </label>
              <input
                id="ef-area"
                type="text"
                list="ef-equipos-lista"
                value={area}
                maxLength={100}
                onChange={(e) => setArea(e.target.value)}
                onBlur={() => validarCampo("area", area)}
                placeholder="Selecciona un equipo o conserva texto histórico"
                className={field}
              />
              <datalist id="ef-equipos-lista">
                {equipos.map((e) => (
                  <option key={e.value} value={e.value} label={e.label} />
                ))}
              </datalist>
              {errores.area && (
                <p className="mt-1 text-xs font-semibold text-alert">{errores.area}</p>
              )}
            </div>
            <div>
              <label
                htmlFor="ef-autor"
                className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-muted"
              >
                Quién registra
              </label>
              <input
                id="ef-autor"
                type="text"
                value={autor}
                maxLength={100}
                onChange={(e) => setAutor(e.target.value)}
                onBlur={() => validarCampo("autor", autor)}
                placeholder="Nombre y apellido"
                className={field}
              />
              {errores.autor && (
                <p className="mt-1 text-xs font-semibold text-alert">{errores.autor}</p>
              )}
            </div>
          </div>

          <div>
            <label
              htmlFor="ef-archivo"
              className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-muted"
            >
              Informe de mantenimiento (opcional)
            </label>
            <input
              id="ef-archivo"
              type="file"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,application/pdf"
              onChange={(e) => onFileChange(e.target.files?.[0])}
              className="block w-full rounded-xl border border-dashed border-line-strong bg-surface-2 px-3.5 py-3 text-sm text-muted file:mr-3 file:rounded-lg file:border-0 file:bg-brand-50 file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-brand-800"
            />
            {evento?.archivo && !archivo && (
              <a
                href={`/api/bitacora/${evento.id}`}
                target="_blank"
                rel="noreferrer"
                className="mt-1.5 block text-xs font-semibold text-brand-700 underline"
              >
                Ver informe actual: {evento.archivo.nombre}
              </a>
            )}
            {archivo && <p className="mt-1.5 text-xs font-semibold text-brand-700">Nuevo archivo: {archivo.name}</p>}
            {archivoError && <p className="mt-1 text-xs font-semibold text-alert">{archivoError}</p>}
          </div>

          <div>
            <label
              htmlFor="ef-desc"
              className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-muted"
            >
              Descripción (opcional)
            </label>
            <textarea
              id="ef-desc"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              rows={4}
              placeholder="Detalle del evento…"
              className={`${field} resize-y`}
            />
          </div>

          {serverError && (
            <p role="alert" className="rounded-xl bg-alert-soft px-3.5 py-2.5 text-sm font-semibold text-alert">
              {serverError}
            </p>
          )}

          <div className="flex justify-end gap-2 border-t border-line pt-4">
            <button
              type="button"
              onClick={onClose}
              className="h-11 cursor-pointer rounded-xl border border-line-strong bg-surface px-4 text-sm font-bold text-muted transition-colors hover:border-brand-300 hover:text-brand-800"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={enviando}
              className="flex h-11 cursor-pointer items-center gap-2 rounded-xl bg-brand-700 px-5 text-sm font-bold text-white transition-colors hover:bg-brand-800 disabled:opacity-60"
            >
              {enviando && <Loader2 className="h-4 w-4 animate-spin" />}
              {evento ? "Guardar cambios" : "Registrar evento"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
