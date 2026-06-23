"use client";

import { useEffect, useMemo, useState } from "react";
import { Gauge, MapPin, Clock, Activity } from "lucide-react";
import { PageHeading } from "@/components/PageHeading";
import { MonitorToolbar, type DeviceOption } from "@/components/MonitorToolbar";
import { ChartFrame } from "@/components/ChartFrame";
import { SensorChart } from "@/components/SensorChart";
import { getDpDevices, getDpKpi, getDpRango } from "@/lib/knopClient";
import { useSensorSeries } from "@/lib/useSensorSeries";
import { buildDpOption } from "@/lib/charts/dpOption";
import type { DpDevice, RangoDp } from "@/lib/knopTypes";
import { fmt, formatDateToMinute, paToInH2O } from "@/lib/units";
import { exportRowsToXlsx, safeFileName } from "@/lib/exportXlsx";

export default function SdpPage() {
  const [devices, setDevices] = useState<DpDevice[]>([]);
  const [selected, setSelected] = useState("");
  const [rango, setRango] = useState<RangoDp | null>(null);

  // Cargar dispositivos
  useEffect(() => {
    getDpDevices()
      .then((d) => {
        setDevices(d);
        if (d.length) setSelected((s) => s || d[0].devEui);
      })
      .catch(() => setDevices([]));
  }, []);

  const series = useSensorSeries({ id: selected, fetchData: getDpKpi });

  // Rango operacional del sensor seleccionado
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
      ? `${meta.identificador} - ${meta.ubicacion}`
      : meta.identificador
    : selected;

  const options: DeviceOption[] = devices.map((d) => ({
    value: d.devEui,
    label: d.ubicacion ? `${d.identificador} — ${d.ubicacion}` : d.identificador,
    group: d.area || "Sensores",
  }));

  const last = series.rows.length ? series.rows[series.rows.length - 1] : null;
  const lastPa = last?.pa ?? null;

  const chartOption = useMemo(
    () => buildDpOption(series.rows, rango, sensorLabel),
    [series.rows, rango, sensorLabel]
  );

  const handleExport = () => {
    const rows = series.rows.map((r) => ({
      "Fecha/Hora": formatDateToMinute(r.t),
      "Presión (Pa)": r.pa,
      "inH₂O": r.pa == null ? null : Number(paToInH2O(r.pa).toFixed(3)),
    }));
    exportRowsToXlsx(
      `${safeFileName(sensorLabel || selected)}_presion.xlsx`,
      rows,
      "Diferencial de Presión"
    );
  };

  return (
    <div className="mx-auto flex w-full max-w-[1400px] flex-1 flex-col gap-4 px-4 py-6 sm:px-6">
      <PageHeading
        kicker="Knop Laboratorios · Monitoreo"
        title="Diferencial de Presión"
        subtitle="Cascadas de presión en esclusas y áreas controladas"
        right={
          series.lastUpdated ? (
            <span className="flex items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1.5 text-xs font-semibold text-muted">
              <Clock className="h-3.5 w-3.5" />
              Actualizado {series.lastUpdated.toLocaleTimeString("es-CL")}
            </span>
          ) : null
        }
      />

      <MonitorToolbar
        devices={options}
        deviceValue={selected}
        onDeviceChange={setSelected}
        preset={series.preset}
        onPreset={series.setPreset}
        range={series.range}
        onApplyRange={series.applyRange}
        onReset={series.reset}
        onExport={handleExport}
        exportDisabled={!series.rows.length}
        loading={series.loading}
      />

      {/* Tira de información del sensor */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <InfoStat
          icon={<Gauge className="h-4 w-4" />}
          label="Última lectura"
          value={lastPa == null ? "—" : `${fmt(lastPa)} Pa`}
          sub={lastPa == null ? undefined : `${fmt(paToInH2O(lastPa), 3)} inH₂O`}
        />
        <InfoStat
          icon={<Activity className="h-4 w-4" />}
          label="Rango operacional"
          value={
            rango?.minPa != null && rango?.maxPa != null
              ? `${fmt(rango.minPa)}–${fmt(rango.maxPa)} Pa`
              : "—"
          }
          sub={rango?.tipo || rango?.descripcion || undefined}
        />
        <InfoStat
          icon={<MapPin className="h-4 w-4" />}
          label="Ubicación"
          value={meta?.ubicacion || "—"}
          sub={meta?.seccion || meta?.area || undefined}
        />
        <InfoStat
          icon={<Clock className="h-4 w-4" />}
          label="Última medición"
          value={last ? formatDateToMinute(last.last ?? last.t) : "—"}
          sub={meta?.tipoRango ? `Tipo ${meta.tipoRango}` : undefined}
        />
      </div>

      <ChartFrame
        className="h-[clamp(420px,58vh,640px)]"
        loading={series.loading && !series.rows.length}
        error={series.error}
        empty={!series.loading && !series.error && !series.rows.length}
      >
        <SensorChart option={chartOption} className="h-full w-full" />
      </ChartFrame>
    </div>
  );
}

function InfoStat({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="card flex flex-col gap-1 p-3.5">
      <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-muted">
        <span className="text-brand-600">{icon}</span>
        {label}
      </div>
      <div className="tnum text-lg font-extrabold leading-tight text-brand-900">
        {value}
      </div>
      {sub && <div className="truncate text-xs text-faint">{sub}</div>}
    </div>
  );
}
