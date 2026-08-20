"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { NotebookPen, Plus, Download, RefreshCw, SearchX } from "lucide-react";
import { PageHeading } from "@/components/PageHeading";
import { FilterBar, type TipoFiltro } from "@/components/bitacora/FilterBar";
import { EventoCard } from "@/components/bitacora/EventoCard";
import { EntryForm } from "@/components/bitacora/EntryForm";
import { Toast, type ToastState } from "@/components/bitacora/Toast";
import { getEventos, createEventoRequest, updateEventoRequest } from "@/lib/bitacoraClient";
import { exportEventosXlsx } from "@/lib/bitacoraExport";
import type { EventoBitacora, EventoInput } from "@/lib/bitacoraMeta";

function hoy(): Date {
  const n = new Date();
  return new Date(n.getFullYear(), n.getMonth(), n.getDate());
}

function fechaLabel(ymd: string): string {
  const [y, m, d] = ymd.split("-").map(Number);
  const fecha = new Date(y, m - 1, d);
  const diff = Math.round((hoy().getTime() - fecha.getTime()) / 86400000);
  if (diff === 0) return "Hoy";
  if (diff === 1) return "Ayer";
  return fecha.toLocaleDateString("es-CL", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

type Estado = "cargando" | "listo" | "error";

function Skeleton() {
  return (
    <div className="space-y-4">
      {[0, 1, 2].map((i) => (
        <div key={i} className="skeleton h-36 rounded-[var(--radius-lg)]" />
      ))}
    </div>
  );
}

export default function BitacoraPage() {
  const [eventos, setEventos] = useState<EventoBitacora[]>([]);
  const [estado, setEstado] = useState<Estado>("cargando");
  const [tipo, setTipo] = useState<TipoFiltro>("todos");
  const [texto, setTexto] = useState("");
  const [textoDebounced, setTextoDebounced] = useState("");
  const [formAbierto, setFormAbierto] = useState(false);
  const [editando, setEditando] = useState<EventoBitacora | null>(null);
  const [equipoInicial, setEquipoInicial] = useState("");
  const [toast, setToast] = useState<ToastState>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const linkHandledRef = useRef(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (linkHandledRef.current || params.get("nuevo") !== "1") return;
    linkHandledRef.current = true;
    setEditando(null);
    setEquipoInicial(params.get("equipo") ?? "");
    setFormAbierto(true);
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setTextoDebounced(texto), 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [texto]);

  const cargar = useCallback(async () => {
    try {
      const data = await getEventos({ tipo, texto: textoDebounced });
      setEventos(data);
      setEstado("listo");
    } catch {
      setEstado("error");
    }
  }, [tipo, textoDebounced]);

  useEffect(() => {
    const ctrl = new AbortController();
    let active = true;
    getEventos({ tipo, texto: textoDebounced }, ctrl.signal)
      .then((data) => {
        if (!active) return;
        setEventos(data);
        setEstado("listo");
      })
      .catch((e) => {
        if (!active) return;
        if (e instanceof DOMException && e.name === "AbortError") return;
        setEstado("error");
      });
    return () => {
      active = false;
      ctrl.abort();
    };
  }, [tipo, textoDebounced]);

  const grupos = useMemo(() => {
    const map = new Map<string, EventoBitacora[]>();
    for (const e of eventos) {
      const ymd = e.fechaHora.slice(0, 10);
      if (!map.has(ymd)) map.set(ymd, []);
      map.get(ymd)!.push(e);
    }
    return [...map.entries()];
  }, [eventos]);

  const tieneFiltros = tipo !== "todos" || textoDebounced !== "";
  const sinEventos = estado === "listo" && eventos.length === 0;

  const handleSubmit = async (input: EventoInput, archivo?: File | null) => {
    if (editando) {
      await updateEventoRequest(editando.id, input, archivo);
      setToast({ message: "Evento actualizado", tone: "success" });
    } else {
      await createEventoRequest(input, archivo);
      setToast({ message: "Evento registrado en la bitácora", tone: "success" });
    }
    setEditando(null);
    setEstado("cargando");
    await cargar();
  };

  const handleEdit = (e: EventoBitacora) => {
    setEditando(e);
    setEquipoInicial("");
    setFormAbierto(true);
  };

  const handleLimpiar = () => {
    setTipo("todos");
    setTexto("");
    setTextoDebounced("");
  };

  return (
    <div className="mx-auto flex w-full max-w-[1400px] flex-1 flex-col gap-4 px-4 py-6 sm:px-6">
      <PageHeading
        kicker="Registro de calidad"
        title="Bitácora"
        subtitle="Registra qué se hizo, sobre qué equipo y quién lo realizó."
        right={
          <>
            <button
              type="button"
              onClick={() => exportEventosXlsx(eventos)}
              disabled={!eventos.length}
              className="flex h-11 cursor-pointer items-center gap-1.5 rounded-xl bg-brand-800 px-4 text-sm font-bold text-white transition-colors hover:bg-brand-900 disabled:opacity-50"
            >
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Excel</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setEditando(null);
                setEquipoInicial("");
                setFormAbierto(true);
              }}
              className="flex h-11 cursor-pointer items-center gap-1.5 rounded-xl bg-brand-700 px-4 text-sm font-bold text-white transition-colors hover:bg-brand-800"
            >
              <Plus className="h-4 w-4" />
              Nuevo registro
            </button>
          </>
        }
      />

      <div className="mt-6 space-y-5">
        <FilterBar
          tipo={tipo}
          onTipo={setTipo}
          texto={texto}
          onTexto={setTexto}
          onReset={handleLimpiar}
          tieneFiltros={tieneFiltros}
        />

        {estado === "cargando" && <Skeleton />}

        {estado === "error" && (
          <div className="card flex flex-col items-center gap-3 p-10 text-center">
            <p className="text-sm font-semibold text-muted">
              No se pudo cargar la bitácora. Revisa la conexión a la base de datos.
            </p>
            <button
              type="button"
              onClick={() => cargar()}
              className="flex h-10 cursor-pointer items-center gap-2 rounded-xl border border-line-strong bg-surface px-4 text-sm font-bold text-brand-700 transition-colors hover:border-brand-300"
            >
              <RefreshCw className="h-4 w-4" />
              Reintentar
            </button>
          </div>
        )}

        {sinEventos && !tieneFiltros && (
          <div className="card flex flex-col items-center gap-4 p-12 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-700 ring-1 ring-brand-100">
              <NotebookPen className="h-7 w-7" />
            </span>
            <div>
              <h2 className="text-lg font-bold text-brand-900">Aún no hay registros</h2>
              <p className="mt-1 text-sm text-muted">
                Anota el primer evento de la bitácora: una visita, una mantención…
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setEditando(null);
                setEquipoInicial("");
                setFormAbierto(true);
              }}
              className="flex h-11 cursor-pointer items-center gap-2 rounded-xl bg-brand-700 px-5 text-sm font-bold text-white transition-colors hover:bg-brand-800"
            >
              <Plus className="h-4 w-4" />
              Agregar el primero
            </button>
          </div>
        )}

        {sinEventos && tieneFiltros && (
          <div className="card flex flex-col items-center gap-4 p-12 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-2 text-faint ring-1 ring-line">
              <SearchX className="h-7 w-7" />
            </span>
            <div>
              <h2 className="text-lg font-bold text-brand-900">
                No hay resultados para tu búsqueda
              </h2>
              <p className="mt-1 text-sm text-muted">
                Prueba con otras palabras o revisa los filtros aplicados.
              </p>
            </div>
            <button
              type="button"
              onClick={handleLimpiar}
              className="h-11 cursor-pointer rounded-xl border border-line-strong bg-surface px-5 text-sm font-bold text-brand-700 transition-colors hover:border-brand-300"
            >
              Limpiar filtros
            </button>
          </div>
        )}

        {estado === "listo" && eventos.length > 0 && (
          <div className="space-y-8">
            {grupos.map(([ymd, items]) => (
              <section key={ymd} aria-label={fechaLabel(ymd)}>
                <h2 className="mb-3 flex items-center gap-3 text-[13px] font-extrabold uppercase tracking-[0.14em] text-muted">
                  <span className="capitalize">{fechaLabel(ymd)}</span>
                  <span className="h-px flex-1 bg-line" />
                  <span className="tnum text-faint normal-case tracking-normal">
                    {items.length} {items.length === 1 ? "evento" : "eventos"}
                  </span>
                </h2>
                <ul className="relative space-y-4 before:absolute before:bottom-3 before:left-[8px] before:top-3 before:w-px before:bg-line">
                  {items.map((e) => (
                    <EventoCard key={e.id} evento={e} onEdit={handleEdit} />
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}
      </div>

      {formAbierto && (
        <EntryForm
          evento={editando}
          initialEquipment={equipoInicial}
          onClose={() => setFormAbierto(false)}
          onSubmit={handleSubmit}
        />
      )}

      <Toast toast={toast} onDismiss={() => setToast(null)} />
    </div>
  );
}
