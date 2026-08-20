"use client";

import { useMemo, useState } from "react";
import { FileDown, Printer } from "lucide-react";
import { getDpKpi, getDpRango, getSthKpi, getSthRango, type KpiClientParams } from "@/lib/knopClient";
import type { DpDevice, RangoDp, RangoSth, SthDevice } from "@/lib/knopTypes";
import { summarize } from "@/lib/stats";
import { fmt, formatDateToMinute } from "@/lib/units";

type Props = {
  kind: "dp" | "sth";
  devices: DpDevice[] | SthDevice[];
  query: Omit<KpiClientParams, "id">;
  currentId: string;
};

type BatchItem = {
  id: string;
  label: string;
  rows: Awaited<ReturnType<typeof getDpKpi>> | Awaited<ReturnType<typeof getSthKpi>>;
  rango: RangoDp | RangoSth | null;
};

/** Selecciona varios sensores y reutiliza las mismas APIs/ventanas del informe actual. */
export function BatchPrintPanel({ kind, devices, query, currentId }: Props) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string[]>(currentId ? [currentId] : []);
  const [items, setItems] = useState<BatchItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const normalized = useMemo(
    () => devices.map((d) => ({ id: kind === "dp" ? (d as DpDevice).devEui : (d as SthDevice).name, label: kind === "dp" ? `${(d as DpDevice).identificador} — ${(d as DpDevice).ubicacion}` : `${(d as SthDevice).identificador} — ${(d as SthDevice).ubicacion}` })),
    [devices, kind]
  );

  const period = query.start && query.end ? `${query.start} a ${query.end}` : query.preset ?? "Periodo seleccionado";

  const prepare = async () => {
    if (!selected.length) return;
    setLoading(true);
    setError(null);
    try {
      const loaded = await Promise.all(
        selected.map(async (id) => {
          const meta = normalized.find((d) => d.id === id);
          if (!meta) throw new Error("Sensor no encontrado");
          const [rows, rango] = kind === "dp"
            ? await Promise.all([getDpKpi({ ...query, id }), getDpRango(id)])
            : await Promise.all([getSthKpi({ ...query, id }), getSthRango(id)]);
          return { id, label: meta.label, rows, rango } as BatchItem;
        })
      );
      setItems(loaded);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudieron preparar los informes");
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const print = () => {
    document.body.classList.add("batch-printing");
    window.addEventListener("afterprint", () => document.body.classList.remove("batch-printing"), { once: true });
    window.print();
  };

  const openPanel = () => {
    setSelected((old) => (old.length ? old : currentId ? [currentId] : []));
    setOpen(true);
  };

  return (
    <>
      <div className="no-print flex justify-end">
        <button
          type="button"
          onClick={openPanel}
          disabled={!devices.length}
          className="flex h-11 items-center gap-2 rounded-xl border border-line-strong bg-surface px-4 text-sm font-bold text-brand-700 transition-colors hover:border-brand-300 disabled:opacity-50"
        >
          <FileDown className="h-4 w-4" />
          Imprimir varios
        </button>
      </div>

      {open && (
        <div className="no-print fixed inset-0 z-40 flex items-end justify-center bg-ink/40 p-0 backdrop-blur-sm sm:items-center sm:p-4">
          <div className="max-h-[90dvh] w-full max-w-2xl overflow-y-auto rounded-t-2xl bg-surface p-5 shadow-[var(--shadow-pop)] sm:rounded-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-extrabold text-brand-900">Imprimir varios informes</h2>
                <p className="mt-1 text-sm text-muted">Selecciona sensores y genera un único flujo de impresión · {period}</p>
              </div>
              <button type="button" onClick={() => setOpen(false)} className="text-sm font-bold text-muted">Cerrar</button>
            </div>
            <div className="mt-4 flex gap-2">
              <button type="button" onClick={() => setSelected(normalized.map((d) => d.id))} className="rounded-lg bg-brand-50 px-3 py-2 text-xs font-bold text-brand-800">Seleccionar todos</button>
              <button type="button" onClick={() => setSelected([])} className="rounded-lg bg-surface-2 px-3 py-2 text-xs font-bold text-muted">Ninguno</button>
            </div>
            <div className="mt-3 grid max-h-64 gap-2 overflow-y-auto rounded-xl border border-line p-3 sm:grid-cols-2">
              {normalized.map((d) => (
                <label key={d.id} className="flex items-start gap-2 rounded-lg p-2 text-sm hover:bg-surface-2">
                  <input type="checkbox" checked={selected.includes(d.id)} onChange={(e) => setSelected((old) => e.target.checked ? [...old, d.id] : old.filter((id) => id !== d.id))} />
                  <span>{d.label}</span>
                </label>
              ))}
            </div>
            {error && <p className="mt-3 rounded-lg bg-alert-soft px-3 py-2 text-sm font-semibold text-alert">{error}</p>}
            <div className="mt-4 flex flex-wrap justify-end gap-2 border-t border-line pt-4">
              <button type="button" onClick={() => setOpen(false)} className="h-10 rounded-xl border border-line-strong px-4 text-sm font-bold text-muted">Cancelar</button>
              <button type="button" onClick={prepare} disabled={loading || !selected.length} className="h-10 rounded-xl bg-brand-700 px-4 text-sm font-bold text-white disabled:opacity-50">{loading ? "Preparando…" : `Preparar ${selected.length} informe(s)`}</button>
              {!!items.length && <button type="button" onClick={print} className="flex h-10 items-center gap-2 rounded-xl bg-brand-800 px-4 text-sm font-bold text-white"><Printer className="h-4 w-4" /> Imprimir PDF conjunto</button>}
            </div>
          </div>
        </div>
      )}

      <div className="batch-print-sheet">
        <h1>Informe estadístico conjunto</h1>
        <p className="batch-period" suppressHydrationWarning>Periodo: {period} · {kind === "dp" ? "Diferencial de presión" : "Termohigrómetros"}</p>
        {items.map((item, index) => <BatchReport key={item.id} item={item} kind={kind} last={index === items.length - 1} />)}
      </div>
    </>
  );
}

function BatchReport({ item, kind, last }: { item: BatchItem; kind: Props["kind"]; last: boolean }) {
  if (kind === "dp") {
    const rows = item.rows as Awaited<ReturnType<typeof getDpKpi>>;
    const stats = summarize(rows.map((r) => r.pa));
    const rango = item.rango as RangoDp | null;
    const latest = rows.at(-1)?.pa ?? null;
    const latestRow = rows.at(-1);
    return <article className={`batch-report ${last ? "" : "print-break"}`}><h2>{item.label}</h2><p>Última lectura: <strong>{fmt(latest)} Pa</strong> · Promedio: <strong>{fmt(stats.avg)} Pa</strong></p><p>Mínimo: {fmt(stats.min)} Pa · Máximo: {fmt(stats.max)} Pa · Muestras: {stats.n}</p><p>Rango: {rango?.minPa != null ? `${fmt(rango.minPa)}–${fmt(rango.maxPa)} Pa` : "No disponible"}</p><p>Última medición: {latestRow ? formatDateToMinute(latestRow.last ?? latestRow.t) : "—"}</p></article>;
  }
  const rows = item.rows as Awaited<ReturnType<typeof getSthKpi>>;
  const temp = summarize(rows.map((r) => r.tempC));
  const hum = summarize(rows.map((r) => r.hum));
  const rango = item.rango as RangoSth | null;
  const latest = rows.at(-1);
  return <article className={`batch-report ${last ? "" : "print-break"}`}><h2>{item.label}</h2><p>Temperatura actual: <strong>{fmt(latest?.tempC, 1)} °C</strong> · Promedio: <strong>{fmt(temp.avg, 1)} °C</strong></p><p>Humedad actual: <strong>{fmt(latest?.hum, 1)} %</strong> · Promedio: <strong>{fmt(hum.avg, 1)} %</strong></p><p>T° mín/máx: {fmt(temp.min, 1)} / {fmt(temp.max, 1)} °C · H mín/máx: {fmt(hum.min, 1)} / {fmt(hum.max, 1)} % · Muestras: {temp.n}</p><p>Rango T°: {rango?.tempMin != null ? `${rango.tempMin}–${rango.tempMax} °C` : "No disponible"} · Rango H: {rango?.humMin != null ? `${rango.humMin}–${rango.humMax} %` : "No disponible"}</p><p>Última medición: {latest ? formatDateToMinute(latest.t) : "—"}</p></article>;
}
