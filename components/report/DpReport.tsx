"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Gauge,
  Activity,
  ArrowDownToLine,
  ArrowUpToLine,
  MapPin,
  Hash,
  Ruler,
  BatteryMedium,
} from "lucide-react";
import { ChartFrame } from "@/components/ChartFrame";
import { SensorChart } from "@/components/SensorChart";
import { StatusHero } from "@/components/kpi/StatusHero";
import { KpiCard } from "@/components/kpi/KpiCard";
import { SensorSelect, PresetRow } from "./controls";
import { AlarmRow, StatRow, InfoRow } from "./parts";
import { getDpDevices, getDpKpi, getDpRango } from "@/lib/knopClient";
import { useSensorSeries } from "@/lib/useSensorSeries";
import { buildDpReportOption } from "@/lib/charts/dpReportOption";
import { PRESETS } from "@/lib/aggregation";
import type { DpDevice, RangoDp } from "@/lib/knopTypes";
import { fmt, formatDateToMinute } from "@/lib/units";
import {
  summarize,
  compliance,
  outOfRange,
  trend,
  statusFor,
  evaluateHysteresis,
} from "@/lib/stats";

export function DpReport() {
  const [devices, setDevices] = useState<DpDevice[]>([]);
  const [selected, setSelected] = useState("");
  const [rango, setRango] = useState<RangoDp | null>(null);

  useEffect(() => {
    getDpDevices()
      .then((d) => {
        setDevices(d);
        if (d.length) setSelected((s) => s || d[0].devEui);
      })
      .catch(() => setDevices([]));
  }, []);

  const series = useSensorSeries({ id: selected, fetchData: getDpKpi });

  useEffect(() => {
    if (!selected) return;
    let active = true;
    getDpRango(selected)
      .then((r) => active && setRango(r))
      .catch(() => active && setRango(null));
    return () => {
      active = false;
    };
  }, [selected]);

  const meta = devices.find((d) => d.devEui === selected) ?? null;
  const sensorLabel = meta
    ? meta.ubicacion
      ? `${meta.identificador} — ${meta.ubicacion}`
      : meta.identificador
    : selected;

  const values = useMemo(() => series.rows.map((r) => r.pa), [series.rows]);
  const range = useMemo(
    () => ({ min: rango?.minPa ?? null, max: rango?.maxPa ?? null }),
    [rango?.minPa, rango?.maxPa]
  );
  const agg = series.query.agg;

  const stats = useMemo(() => summarize(values), [values]);
  const comp = useMemo(() => compliance(values, range), [values, range]);
  const oor = useMemo(() => outOfRange(values, range, agg), [values, range, agg]);
  const tr = useMemo(() => trend(values), [values]);
  const last = series.rows.length ? series.rows[series.rows.length - 1]?.pa ?? null : null;
  const status = statusFor(last, range);

  const span = range.min != null && range.max != null ? range.max - range.min : 0;
  const lowEval =
    range.min != null
      ? evaluateHysteresis(
          values,
          { kind: "low", threshold: range.min, recover: range.min + span * 0.05 },
          agg
        )
      : null;
  const highEval =
    range.max != null
      ? evaluateHysteresis(
          values,
          { kind: "high", threshold: range.max, recover: range.max - span * 0.05 },
          agg
        )
      : null;
  const activeAlarms = (lowEval?.active ? 1 : 0) + (highEval?.active ? 1 : 0);

  const periodLabel =
    series.query.start && series.query.end
      ? `${series.query.start} a ${series.query.end}`
      : PRESETS.find((p) => p.key === series.preset)?.label ?? "—";

  const chartOption = useMemo(
    () => buildDpReportOption(series.rows, rango, stats.avg),
    [series.rows, rango, stats.avg]
  );

  const options = devices.map((d) => ({
    value: d.devEui,
    label: d.ubicacion ? `${d.identificador} — ${d.ubicacion}` : d.identificador,
    group: d.area || "Sensores",
  }));

  return (
    <>
      <div className="no-print card flex flex-wrap items-end gap-4 p-4">
        <SensorSelect value={selected} onChange={setSelected} options={options} />
        <PresetRow value={series.preset} onSelect={series.setPreset} />
      </div>

      <p className="text-sm text-muted">
        <span className="font-semibold text-ink">{sensorLabel}</span> · Periodo: {periodLabel}
      </p>

      {/* KPIs */}
      <div className="report-kpis grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard
          label="Última lectura"
          value={last == null ? "—" : fmt(last)}
          unit="Pa"
          icon={<Gauge className="h-4 w-4" />}
          trend={tr}
          sub={
            series.rows.length
              ? `Medición ${formatDateToMinute(
                  series.rows[series.rows.length - 1].last ??
                    series.rows[series.rows.length - 1].t
                )}`
              : undefined
          }
        />
        <KpiCard
          label="Promedio"
          value={fmt(stats.avg)}
          unit="Pa"
          icon={<Activity className="h-4 w-4" />}
          sub={`${stats.n} muestras`}
        />
        <KpiCard label="Mínimo" value={fmt(stats.min)} unit="Pa" icon={<ArrowDownToLine className="h-4 w-4" />} />
        <KpiCard label="Máximo" value={fmt(stats.max)} unit="Pa" icon={<ArrowUpToLine className="h-4 w-4" />} />
      </div>

      {/* Estado + gráfico */}
      <div className="report-main grid grid-cols-1 gap-4 lg:grid-cols-3">
        <StatusHero status={status} compliancePct={comp.pct} outMinutes={oor.minutes} />
        <div className="card flex flex-col p-4 lg:col-span-2">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-bold text-brand-900">Diferencial de Presión · evolución</h3>
            <span className="text-xs text-faint">Línea roja = límite · punteada = promedio</span>
          </div>
          <ChartFrame
            className="report-chart min-h-[320px] flex-1"
            loading={series.loading && !series.rows.length}
            error={series.error}
            empty={!series.loading && !series.error && !series.rows.length}
          >
            <SensorChart option={chartOption} className="h-full min-h-[320px] w-full" />
          </ChartFrame>
        </div>
      </div>

      {/* Paneles */}
      <div className="report-panels grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="card p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-bold text-brand-900">Alarmas y reglas</h3>
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                activeAlarms > 0 ? "bg-alert-soft text-alert" : "bg-ok-soft text-ok"
              }`}
            >
              {activeAlarms} activas
            </span>
          </div>
          <div className="flex flex-col gap-2.5">
            <AlarmRow label="Alarma baja" rule={range.min != null ? `< ${fmt(range.min)} Pa` : "—"} active={!!lowEval?.active} />
            <AlarmRow label="Alarma alta" rule={range.max != null ? `> ${fmt(range.max)} Pa` : "—"} active={!!highEval?.active} />
          </div>
          <p className="mt-3 text-xs leading-relaxed text-faint">
            Las alarmas usan histéresis: se restablecen al volver dentro del 5% del rango.
          </p>
        </div>

        <div className="card p-4">
          <h3 className="mb-3 text-sm font-bold text-brand-900">Estadísticas del periodo</h3>
          <StatRow label="Mínimo" value={`${fmt(stats.min)} Pa`} />
          <StatRow label="Promedio" value={`${fmt(stats.avg)} Pa`} />
          <StatRow label="Máximo" value={`${fmt(stats.max)} Pa`} />
          <StatRow label="Cumplimiento" value={comp.pct == null ? "—" : `${comp.pct.toFixed(1)}%`} />
          <StatRow label="Tiempo fuera de rango" value={`${oor.minutes} min (${oor.pct.toFixed(1)}%)`} />
          <StatRow label="Muestras" value={`${stats.n}`} last />
        </div>

        <div className="card p-4">
          <h3 className="mb-3 text-sm font-bold text-brand-900">Información del sensor</h3>
          <InfoRow icon={<Hash className="h-4 w-4" />} label="Identificador" value={meta?.identificador || "—"} />
          <InfoRow icon={<MapPin className="h-4 w-4" />} label="Ubicación" value={meta?.ubicacion || "—"} />
          <InfoRow icon={<Activity className="h-4 w-4" />} label="Área / Sección" value={[meta?.area, meta?.seccion].filter(Boolean).join(" · ") || "—"} />
          <InfoRow icon={<Ruler className="h-4 w-4" />} label="Rango operacional" value={rango?.descripcion || (range.min != null ? `${fmt(range.min)}–${fmt(range.max)} Pa` : "—")} />
          <InfoRow icon={<Gauge className="h-4 w-4" />} label="Tipo de rango" value={rango?.tipo || meta?.tipoRango || "—"} />
          <InfoRow icon={<BatteryMedium className="h-4 w-4" />} label="Batería" value="No disponible" last />
        </div>
      </div>
    </>
  );
}
