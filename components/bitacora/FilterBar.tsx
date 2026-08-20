"use client";

import { Search, RotateCcw } from "lucide-react";
import { ALL_EVENT_TYPES, TIPO_LABEL_PERSISTIDO, type EventoTipoPersistido } from "@/lib/bitacoraMeta";

export type TipoFiltro = EventoTipoPersistido | "todos";

type Props = {
  tipo: TipoFiltro;
  onTipo: (t: TipoFiltro) => void;
  texto: string;
  onTexto: (t: string) => void;
  onReset: () => void;
  tieneFiltros: boolean;
};

const CHIPS: TipoFiltro[] = ["todos", ...ALL_EVENT_TYPES];

/** Filtros de la bitácora: chips por tipo + búsqueda por texto. */
export function FilterBar({ tipo, onTipo, texto, onTexto, onReset, tieneFiltros }: Props) {
  return (
    <div className="card flex flex-wrap items-center gap-3 p-4">
      <div
        role="group"
        aria-label="Filtrar por tipo de evento"
        className="flex flex-wrap gap-2"
      >
        {CHIPS.map((t) => {
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

      <div className="relative ml-auto min-w-[180px] flex-1 sm:max-w-xs">
        <label htmlFor="bitacora-busqueda" className="sr-only">
          Buscar en la bitácora
        </label>
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-faint" />
        <input
          id="bitacora-busqueda"
          type="search"
          value={texto}
          onChange={(e) => onTexto(e.target.value)}
          placeholder="Buscar título, área, autor…"
          className="h-9 w-full rounded-full border border-line-strong bg-surface pl-9 pr-4 text-sm text-ink outline-none transition-colors placeholder:text-faint hover:border-brand-300 focus:border-brand-500"
        />
      </div>

      {tieneFiltros && (
        <button
          type="button"
          onClick={onReset}
          title="Limpiar filtros"
          className="flex h-9 cursor-pointer items-center gap-1.5 rounded-full border border-line-strong bg-surface px-3.5 text-[13px] font-semibold text-muted transition-colors hover:border-brand-300 hover:text-brand-800"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Limpiar
        </button>
      )}
    </div>
  );
}
