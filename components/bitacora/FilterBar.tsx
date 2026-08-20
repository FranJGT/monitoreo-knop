"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, Search, RotateCcw } from "lucide-react";
import {
  EVENT_TYPES,
  LEGACY_EVENT_TYPES,
  TIPO_LABEL_PERSISTIDO,
  type EventoTipoPersistido,
  type LegacyEventoTipo,
} from "@/lib/bitacoraMeta";

export type TipoFiltro = EventoTipoPersistido | "todos";

type Props = {
  tipo: TipoFiltro;
  onTipo: (t: TipoFiltro) => void;
  texto: string;
  onTexto: (t: string) => void;
  onReset: () => void;
  tieneFiltros: boolean;
};

const PRIMARY_CHIPS: TipoFiltro[] = ["todos", ...EVENT_TYPES];
const HISTORICAL_CHIPS: LegacyEventoTipo[] = [...LEGACY_EVENT_TYPES];

/** Filtros de la bitácora: catálogo actual + históricos secundarios + búsqueda. */
export function FilterBar({ tipo, onTipo, texto, onTexto, onReset, tieneFiltros }: Props) {
  const [historicalOpen, setHistoricalOpen] = useState(false);
  const historicalMenuRef = useRef<HTMLDivElement>(null);
  const historicalActive = (LEGACY_EVENT_TYPES as readonly string[]).includes(tipo);

  useEffect(() => {
    if (!historicalOpen) return;

    const closeOnOutsidePointer = (event: PointerEvent) => {
      if (!historicalMenuRef.current?.contains(event.target as Node)) {
        setHistoricalOpen(false);
      }
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setHistoricalOpen(false);
    };

    document.addEventListener("pointerdown", closeOnOutsidePointer);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsidePointer);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [historicalOpen]);

  return (
    <div className="card flex flex-col gap-3 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative min-w-0 flex-1">
          <label htmlFor="bitacora-busqueda" className="sr-only">
            Buscar en la bitácora
          </label>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-faint" />
          <input
            id="bitacora-busqueda"
            type="search"
            value={texto}
            onChange={(e) => onTexto(e.target.value)}
            placeholder="Buscar qué se hizo, equipo o autor…"
            className="h-10 w-full rounded-full border border-line-strong bg-surface pl-9 pr-4 text-sm text-ink outline-none transition-colors placeholder:text-faint hover:border-brand-300 focus:border-brand-500"
          />
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <div className="relative" ref={historicalMenuRef}>
            <button
              type="button"
              onClick={() => setHistoricalOpen((open) => !open)}
              aria-expanded={historicalOpen}
              aria-haspopup="menu"
              className={[
                "flex h-10 cursor-pointer items-center gap-2 rounded-full border px-3.5 text-[13px] font-bold transition-colors",
                historicalActive
                  ? "border-brand-700 bg-brand-700 text-white shadow-sm"
                  : "border-line-strong bg-surface text-ink hover:border-brand-300 hover:bg-brand-50",
              ].join(" ")}
            >
              Históricos
              <ChevronDown className={`h-4 w-4 transition-transform ${historicalOpen ? "rotate-180" : ""}`} />
            </button>

            {historicalOpen && (
              <div
                role="menu"
                aria-label="Tipos históricos"
                className="absolute right-0 z-20 mt-2 min-w-[220px] rounded-2xl border border-line bg-surface p-2 shadow-lg"
              >
                <p className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-faint">
                  Registros anteriores
                </p>
                {HISTORICAL_CHIPS.map((t) => {
                  const active = tipo === t;
                  return (
                    <button
                      key={t}
                      type="button"
                      role="menuitemradio"
                      aria-checked={active}
                      onClick={() => {
                        onTipo(t);
                        setHistoricalOpen(false);
                      }}
                      className={[
                        "flex w-full cursor-pointer items-center rounded-xl px-3 py-2 text-left text-sm font-semibold transition-colors",
                        active
                          ? "bg-brand-50 text-brand-800"
                          : "text-ink hover:bg-brand-50 hover:text-brand-800",
                      ].join(" ")}
                    >
                      {TIPO_LABEL_PERSISTIDO[t]}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {tieneFiltros && (
            <button
              type="button"
              onClick={onReset}
              title="Limpiar filtros"
              className="flex h-10 cursor-pointer items-center gap-1.5 rounded-full border border-line-strong bg-surface px-3.5 text-[13px] font-semibold text-muted transition-colors hover:border-brand-300 hover:text-brand-800"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Limpiar
            </button>
          )}
        </div>
      </div>

      <div
        role="group"
        aria-label="Filtrar por tipo de evento"
        className="flex flex-wrap gap-2"
      >
        {PRIMARY_CHIPS.map((t) => {
          const active = tipo === t;
          return (
            <button
              key={t}
              type="button"
              onClick={() => onTipo(t)}
              aria-pressed={active}
              className={[
                "h-9 cursor-pointer rounded-full border px-3.5 text-[13px] font-bold transition-colors",
                active
                  ? "border-brand-700 bg-brand-700 text-white shadow-sm"
                  : "border-line-strong bg-surface text-ink hover:border-brand-300 hover:bg-brand-50",
              ].join(" ")}
            >
              {t === "todos" ? "Todos" : TIPO_LABEL_PERSISTIDO[t]}
            </button>
          );
        })}
      </div>
    </div>
  );
}
