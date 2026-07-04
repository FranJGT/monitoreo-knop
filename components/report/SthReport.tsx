"use client";

import { useEffect, useMemo, useState } from "react";
import { Thermometer, Droplets, MapPin, Hash, Activity, BatteryMedium } from "lucide-react";
import { ChartFrame } from "@/components/ChartFrame";
import { SensorChart } from "@/components/SensorChart";
import { StatusHero } from "@/components/kpi/StatusHero";
import { KpiCard } from "@/components/kpi/KpiCard";
import { SensorSelect, PresetRow } from "./controls";
import { AlarmRow, StatRow, InfoRow, PanelSubhead } from "./parts";
import { getSthDevices, getSthKpi, getSthRango } from "@/lib/knopClient";
import { useSensorSeries } from "@/lib/useSensorSeries";
import { buildSthOption } from "@/lib/charts/sthOption";
import {
  PRESETS,
  aggForPresetSth,
  estimateAggFromDatesSth,
  presetRangeYmd,
} from "@/lib/aggregation";
import type { SthDevice, RangoSth } from "@/lib/knopTypes";
import { fmt, formatDateToMinute } from "@/lib/units";
import {
  summarize,
  compliance,
  outOfRange,
  trend,
  statusFromCompliance,
  evaluateHysteresis,
  batteryStatus,
  BATTERY_STATUS_LABEL,
  BATTERY_STATUS_COLOR,
  type Range,
  type SensorStatus,
} from "@/lib/stats";

const RANK: Record<SensorStatus, number> = { normal: 0, advertencia: 1, alerta: 2 };

export function SthReport() {
  const [devices, setDevices] = useState<SthDevice[]>([]);
  const [selected, setSelected] = useState("");
  const [rango, setRango] = useState<RangoSth | null>(null);

  useEffect(() => {
    getSthDevices()
      .then((d) => {
        setDevices(d);
        if (d.length) setSelected((s) => s || d[0].name);
      })
      .catch(() => setDevices([]));
  }, []);

  const series = useSensorSeries({
    id: selected,
    fetchData: getSthKpi,
    aggForPreset: aggForPresetSth,
    estimateAgg: estimateAggFromDatesSth,
    presetToRange: presetRangeYmd,
  });

  useEffect(() => {
    if (!selected) return;
    let active = true;
    getSthRango(selected)
      .then((r) => active && setRango(r))
      .catch(() => active && setRango(null));
    return () => {
      active = false;
    };
  }, [selected]);

  const meta = devices.find((d) => d.name === selected) ?? null;
  const sensorLabel = meta?.name || selected;
  // `null` = agg por defecto del servidor (~5 min); se usa 5 para estimar minutos fuera.
  const agg = series.query.agg ?? 5;

  const tempVals = useMemo(() => series.rows.map((r) => r.tempC), [series.rows]);
  const humVals = useMemo(() => series.rows.map((r) => r.hum), [series.rows]);
  const tempRange: Range = useMemo(
    () => ({ min: rango?.tempMin ?? null, max: rango?.tempMax ?? null }),
    [rango?.tempMin, rango?.tempMax]
  );
  const humRange: Range = useMemo(
    () => ({ min: rango?.humMin ?? null, max: rango?.humMax ?? null }),
    [rango?.humMin, rango?.humMax]
  );

  const tempStats = useMemo(() => summarize(tempVals), [tempVals]);
  const humStats = useMemo(() => summarize(humVals), [humVals]);
  const tempComp = useMemo(() => compliance(tempVals, tempRange), [tempVals, tempRange]);
  const humComp = useMemo(() => compliance(humVals, humRange), [humVals, humRange]);
  const tempOor = useMemo(() => outOfRange(tempVals, tempRange, agg), [tempVals, tempRange, agg]);
  const humOor = useMemo(() => outOfRange(humVals, humRange, agg), [humVals, humRange, agg]);
  const tempTrend = useMemo(() => trend(tempVals), [tempVals]);
  const humTrend = useMemo(() => trend(humVals), [humVals]);

  const last = series.rows.length ? series.rows[series.rows.length - 1] : null;
  const lastTemp = last?.tempC ?? null;
  const lastHum = last?.hum ?? null;

  const tempStatus = statusFromCompliance(lastTemp, tempRange, tempOor.buckets);
  const humStatus = statusFromCompliance(lastHum, humRange, humOor.buckets);
  const overall: SensorStatus = RANK[tempStatus] >= RANK[humStatus] ? tempStatus : humStatus;

  const overallComp =
    tempComp.pct == null || humComp.pct == null
      ? (tempComp.pct ?? humComp.pct ?? null)
      : Math.min(tempComp.pct, humComp.pct);
  const overallOut = Math.max(tempOor.minutes, humOor.minutes);

  // Alarmas (4 reglas con histéresis)
  const tSpan = tempRange.min != null && tempRange.max != null ? tempRange.max - tempRange.min : 0;
  const hSpan = humRange.min != null && humRange.max != null ? humRange.max - humRange.min : 0;
  const tLow = tempRange.min != null ? evaluateHysteresis(tempVals, { kind: "low", threshold: tempRange.min, recover: tempRange.min + tSpan * 0.05 }, agg) : null;
  const tHigh = tempRange.max != null ? evaluateHysteresis(tempVals, { kind: "high", threshold: tempRange.max, recover: tempRange.max - tSpan * 0.05 }, agg) : null;
  const hLow = humRange.min != null ? evaluateHysteresis(humVals, { kind: "low", threshold: humRange.min, recover: humRange.min + hSpan * 0.05 }, agg) : null;
  const hHigh = humRange.max != null ? evaluateHysteresis(humVals, { kind: "high", threshold: humRange.max, recover: humRange.max - hSpan * 0.05 }, agg) : null;
  const activeAlarms = [tLow, tHigh, hLow, hHigh].filter((e) => e?.active).length;

  // En modo preset la query lleva start/end (STH), así que el rango personalizado
  // se detecta por `series.range`, no por la presencia de start/end.
  const periodLabel =
    series.range?.from && series.range?.to
      ? `${series.query.start} a ${series.query.end}`
      : PRESETS.find((p) => p.key === series.preset)?.label ?? "—";

  const chartOption = useMemo(
    () => buildSthOption(series.rows, rango, sensorLabel),
    [series.rows, rango, sensorLabel]
  );

  const options = devices.map((d) => ({
    value: d.name,
    label: d.ubicacion ? `${d.identificador} — ${d.ubicacion}` : d.identificador,
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
          label="Temperatura"
          value={lastTemp == null ? "—" : fmt(lastTemp, 1)}
          unit="°C"
          icon={<Thermometer className="h-4 w-4" />}
          trend={tempTrend}
          sub={`Prom ${fmt(tempStats.avg, 1)} °C`}
        />
        <KpiCard
          label="Humedad"
          value={lastHum == null ? "—" : fmt(lastHum, 1)}
          unit="%"
          icon={<Droplets className="h-4 w-4" />}
          trend={humTrend}
          sub={`Prom ${fmt(humStats.avg, 1)} %`}
        />
        <KpiCard
          label="T° mín / máx"
          value={`${fmt(tempStats.min, 1)} / ${fmt(tempStats.max, 1)}`}
          unit="°C"
          icon={<Thermometer className="h-4 w-4" />}
          sub={`${last ? formatDateToMinute(last.t) : ""}`}
        />
        <KpiCard
          label="H mín / máx"
          value={`${fmt(humStats.min, 1)} / ${fmt(humStats.max, 1)}`}
          unit="%"
          icon={<Droplets className="h-4 w-4" />}
          sub={`${tempStats.n} muestras`}
        />
      </div>

      {/* Estado + gráfico */}
      <div className="report-main grid grid-cols-1 gap-4 lg:grid-cols-3">
        <StatusHero status={overall} compliancePct={overallComp} outMinutes={overallOut} />
        <div className="card flex flex-col p-4 lg:col-span-2">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-bold text-brand-900">Temperatura y humedad · evolución</h3>
            <span className="text-xs text-faint">Bandas = rango de aceptación</span>
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
            <AlarmRow label="T° baja" rule={tempRange.min != null ? `< ${tempRange.min} °C` : "—"} active={!!tLow?.active} />
            <AlarmRow label="T° alta" rule={tempRange.max != null ? `> ${tempRange.max} °C` : "—"} active={!!tHigh?.active} />
            <AlarmRow label="Humedad baja" rule={humRange.min != null ? `< ${humRange.min} %` : "—"} active={!!hLow?.active} />
            <AlarmRow label="Humedad alta" rule={humRange.max != null ? `> ${humRange.max} %` : "—"} active={!!hHigh?.active} />
          </div>
        </div>

        <div className="card p-4">
          <h3 className="mb-3 text-sm font-bold text-brand-900">Estadísticas del periodo</h3>
          <PanelSubhead>
            <Thermometer className="h-3.5 w-3.5 text-brand-600" /> Temperatura
          </PanelSubhead>
          <StatRow label="Mín / Prom / Máx" value={`${fmt(tempStats.min, 1)} / ${fmt(tempStats.avg, 1)} / ${fmt(tempStats.max, 1)} °C`} />
          <StatRow label="Cumplimiento" value={tempComp.pct == null ? "—" : `${tempComp.pct.toFixed(1)}%`} />
          <StatRow label="Fuera de rango" value={`${tempOor.minutes} min (${tempOor.pct.toFixed(1)}%)`} />
          <PanelSubhead>
            <Droplets className="h-3.5 w-3.5 text-brand-600" /> Humedad
          </PanelSubhead>
          <StatRow label="Mín / Prom / Máx" value={`${fmt(humStats.min, 1)} / ${fmt(humStats.avg, 1)} / ${fmt(humStats.max, 1)} %`} />
          <StatRow label="Cumplimiento" value={humComp.pct == null ? "—" : `${humComp.pct.toFixed(1)}%`} />
          <StatRow label="Fuera de rango" value={`${humOor.minutes} min (${humOor.pct.toFixed(1)}%)`} last />
        </div>

        <div className="card p-4">
          <h3 className="mb-3 text-sm font-bold text-brand-900">Información del sensor</h3>
          <InfoRow icon={<Hash className="h-4 w-4" />} label="Identificador" value={meta?.identificador || "—"} />
          <InfoRow icon={<MapPin className="h-4 w-4" />} label="Ubicación" value={meta?.ubicacion || "—"} />
          <InfoRow icon={<Activity className="h-4 w-4" />} label="Tipo de rango" value={rango?.tipo || "—"} />
          <InfoRow icon={<Thermometer className="h-4 w-4" />} label="Rango temperatura" value={tempRange.min != null ? `${tempRange.min}–${tempRange.max} °C` : "—"} />
          <InfoRow icon={<Droplets className="h-4 w-4" />} label="Rango humedad" value={humRange.min != null ? `${humRange.min}–${humRange.max} %` : "—"} />
          <InfoRow
            icon={<BatteryMedium className="h-4 w-4" />}
            label="Batería"
            value={
              last?.batV == null ? (
                "—"
              ) : (
                <>
                  {fmt(last.batV, 2)} V{" "}
                  <span className={BATTERY_STATUS_COLOR[batteryStatus(last.batV)!]}>
                    · {BATTERY_STATUS_LABEL[batteryStatus(last.batV)!]}
                  </span>
                </>
              )
            }
            last
          />
        </div>
      </div>
    </>
  );
}
