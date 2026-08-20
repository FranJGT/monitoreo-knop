"use client";

import { useEffect, useMemo, useState } from "react";
import { FileDown, Printer, Search } from "lucide-react";
import { BatchReport, type BatchItem } from "./BatchPrintPanel";
import {
  getDpDevices,
  getDpKpi,
  getDpRango,
  getSthDevices,
  getSthKpi,
  getSthRango,
  type KpiClientParams,
} from "@/lib/knopClient";
import type { DpDevice, SthDevice } from "@/lib/knopTypes";
import {
  PRESETS,
  aggForPreset,
  aggForPresetSth,
  estimateAggFromDates,
  estimateAggFromDatesSth,
  presetRangeYmd,
  type PresetKey,
} from "@/lib/aggregation";
import { equipmentOption, type EquipmentOption } from "@/lib/equipment";

type Kind = "dp" | "sth";

type Props = {
  query: Omit<KpiClientParams, "id">;
};

type SelectedItem = EquipmentOption & { key: string };
type PreparedItem = { kind: Kind; item: BatchItem };

function normalizeSearch(value: string): string {
  return value
    .toLocaleLowerCase("es")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function optionLabel(option: SelectedItem): string {
  return option.label.replace(/^(STH|SDP) · /, "");
}

function periodLabel(query: Props["query"]): string {
  if (query.start && query.end) return `${query.start} a ${query.end}`;
  return PRESETS.find((p) => p.key === (query.preset ?? "24h"))?.label ?? "Periodo seleccionado";
}

function queryForKind(kind: Kind, query: Props["query"]): Omit<KpiClientParams, "id"> {
  if (query.start && query.end) {
    return {
      start: query.start,
      end: query.end,
      agg: kind === "sth"
        ? estimateAggFromDatesSth(query.start, query.end)
        : estimateAggFromDates(query.start, query.end),
    };
  }

  const preset = (query.preset ?? "24h") as PresetKey;
  if (kind === "sth") {
    const range = presetRangeYmd(preset);
    return { start: range.start, end: range.end, agg: aggForPresetSth(preset) };
  }
  return { preset, agg: aggForPreset(preset) };
}

/** Flujo único de impresión para sensores SDP y STH, usando el periodo visible. */
export function BatchAllPrintPanel({ query }: Props) {
  const [dpDevices, setDpDevices] = useState<DpDevice[]>([]);
  const [sthDevices, setSthDevices] = useState<SthDevice[]>([]);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [items, setItems] = useState<PreparedItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    Promise.all([getDpDevices(), getSthDevices()])
      .then(([dp, sth]) => {
        if (!active) return;
        setDpDevices(dp);
        setSthDevices(sth);
      })
      .catch(() => {
        if (active) setError("No se pudieron cargar los sensores");
      });
    return () => {
      active = false;
    };
  }, []);

  const options = useMemo<SelectedItem[]>(() => [
    ...sthDevices.map((d) => ({ ...equipmentOption("sth", d), key: `sth:${d.name}` })),
    ...dpDevices.map((d) => ({ ...equipmentOption("dp", d), key: `sdp:${d.devEui}` })),
  ].sort((a, b) => optionLabel(a).localeCompare(optionLabel(b), "es", { numeric: true, sensitivity: "base" })), [dpDevices, sthDevices]);

  const matchingOptions = useMemo(() => {
    const needle = normalizeSearch(search.trim());
    if (!needle) return options;
    return options.filter((option) =>
      normalizeSearch(`${optionLabel(option)} ${option.label} ${option.id}`).includes(needle)
    );
  }, [options, search]);
  const matchingSth = matchingOptions.filter((option) => option.kind === "sth");
  const matchingDp = matchingOptions.filter((option) => option.kind === "dp");

  const period = periodLabel(query);

  const prepare = async () => {
    const chosen = options.filter((option) => selected.includes(option.key));
    if (!chosen.length) return;
    setLoading(true);
    setError(null);
    try {
      const loaded = await Promise.all(chosen.map(async (option) => {
        const params = { ...queryForKind(option.kind, query), id: option.id };
        const [rows, rango] = option.kind === "dp"
          ? await Promise.all([getDpKpi(params), getDpRango(option.id)])
          : await Promise.all([getSthKpi(params), getSthRango(option.id)]);
        return {
          kind: option.kind,
          item: { id: option.id, label: option.label, rows, rango } as BatchItem,
        };
      }));
      setItems(loaded);
    } catch (e) {
      setItems([]);
      setError(e instanceof Error ? e.message : "No se pudieron preparar los informes");
    } finally {
      setLoading(false);
    }
  };

  const print = () => {
    document.body.classList.add("batch-printing");
    window.addEventListener("afterprint", () => document.body.classList.remove("batch-printing"), { once: true });
    window.print();
  };

  const toggleMatching = () => {
    const keys = matchingOptions.map((option) => option.key);
    const allMatchingSelected = keys.length > 0 && keys.every((key) => selected.includes(key));
    setSelected((current) =>
      allMatchingSelected
        ? current.filter((key) => !keys.includes(key))
        : [...new Set([...current, ...keys])]
    );
  };

  const toggleOption = (key: string, checked: boolean) => {
    setSelected((current) =>
      checked ? [...new Set([...current, key])] : current.filter((selectedKey) => selectedKey !== key)
    );
  };

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setSearch("");
          setOpen(true);
        }}
        disabled={!options.length}
        className="no-print flex h-10 items-center gap-2 rounded-xl border border-line-strong bg-surface px-4 text-sm font-bold text-brand-700 transition-colors hover:border-brand-300 disabled:opacity-50"
      >
        <FileDown className="h-4 w-4" />
        Imprimir todos
      </button>

      {open && (
        <div className="no-print fixed inset-0 z-40 flex items-end justify-center bg-ink/40 p-0 backdrop-blur-sm sm:items-center sm:p-4">
          <div className="max-h-[90dvh] w-full max-w-2xl overflow-y-auto rounded-t-2xl bg-surface p-5 shadow-[var(--shadow-pop)] sm:rounded-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-extrabold text-brand-900">Imprimir todos los informes</h2>
                <p className="mt-1 text-sm text-muted">Selecciona sensores SDP y STH · {period}</p>
              </div>
              <button type="button" onClick={() => setOpen(false)} className="text-sm font-bold text-muted">Cerrar</button>
            </div>
            <div className="mt-4 relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-faint" />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar por código o ubicación"
                aria-label="Buscar equipos para imprimir"
                className="h-10 w-full rounded-xl border border-line-strong bg-surface pl-9 pr-3 text-sm text-ink outline-none placeholder:text-faint focus:border-brand-500"
              />
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={toggleMatching}
                disabled={!matchingOptions.length}
                className="rounded-lg bg-brand-50 px-3 py-2 text-xs font-bold text-brand-800 disabled:opacity-50"
              >
                {matchingOptions.length && matchingOptions.every((option) => selected.includes(option.key))
                  ? "Quitar resultados"
                  : "Seleccionar resultados"}
              </button>
              <button type="button" onClick={() => setSelected([])} className="rounded-lg bg-surface-2 px-3 py-2 text-xs font-bold text-muted">Ninguno</button>
              <span className="text-xs font-semibold text-muted" aria-live="polite">
                {selected.length} seleccionado{selected.length === 1 ? "" : "s"}
              </span>
            </div>
            <div className="mt-3 max-h-80 overflow-y-auto rounded-xl border border-line p-3">
              {!matchingOptions.length && (
                <p className="px-2 py-6 text-center text-sm text-muted">No encontramos equipos con “{search}”.</p>
              )}
              {!!matchingSth.length && (
                <section aria-label="Equipos STH">
                  <h3 className="mb-1 px-2 text-[11px] font-bold uppercase tracking-[0.12em] text-faint">STH</h3>
                  <div className="grid gap-1 sm:grid-cols-2">
                    {matchingSth.map((option) => (
                      <label key={option.key} className="flex cursor-pointer items-start gap-2 rounded-lg p-2 text-sm hover:bg-surface-2">
                        <input
                          type="checkbox"
                          checked={selected.includes(option.key)}
                          onChange={(event) => toggleOption(option.key, event.target.checked)}
                        />
                        <span className="min-w-0 break-words">{optionLabel(option)}</span>
                      </label>
                    ))}
                  </div>
                </section>
              )}
              {!!matchingDp.length && (
                <section className={matchingSth.length ? "mt-3 border-t border-line pt-3" : ""} aria-label="Equipos SDP">
                  <h3 className="mb-1 px-2 text-[11px] font-bold uppercase tracking-[0.12em] text-faint">SDP</h3>
                  <div className="grid gap-1 sm:grid-cols-2">
                    {matchingDp.map((option) => (
                      <label key={option.key} className="flex cursor-pointer items-start gap-2 rounded-lg p-2 text-sm hover:bg-surface-2">
                        <input
                          type="checkbox"
                          checked={selected.includes(option.key)}
                          onChange={(event) => toggleOption(option.key, event.target.checked)}
                        />
                        <span className="min-w-0 break-words">{optionLabel(option)}</span>
                      </label>
                    ))}
                  </div>
                </section>
              )}
            </div>
            {error && <p className="mt-3 rounded-lg bg-alert-soft px-3 py-2 text-sm font-semibold text-alert">{error}</p>}
            <div className="mt-4 flex flex-wrap justify-end gap-2 border-t border-line pt-4">
              <button type="button" onClick={() => setOpen(false)} className="h-10 rounded-xl border border-line-strong px-4 text-sm font-bold text-muted">Cancelar</button>
              <button type="button" onClick={prepare} disabled={loading || !selected.length} className="h-10 rounded-xl bg-brand-700 px-4 text-sm font-bold text-white disabled:opacity-50">
                {loading ? "Preparando…" : `Preparar ${selected.length} ${selected.length === 1 ? "informe" : "informes"}`}
              </button>
              {!!items.length && (
                <button type="button" onClick={print} className="flex h-10 items-center gap-2 rounded-xl bg-brand-800 px-4 text-sm font-bold text-white">
                  <Printer className="h-4 w-4" />
                  Imprimir PDF conjunto
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="batch-print-sheet">
        <h1>Informes estadísticos conjuntos</h1>
        <p className="batch-period" suppressHydrationWarning>Periodo: {period} · SDP + STH</p>
        {items.map((entry, index) => (
          <BatchReport key={`${entry.kind}:${entry.item.id}`} item={entry.item} kind={entry.kind} last={index === items.length - 1} />
        ))}
      </div>
    </>
  );
}
