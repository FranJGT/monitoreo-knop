"use client";

import { useEffect, useMemo, useState } from "react";
import { Thermometer, Droplets, MapPin, Clock, BatteryMedium } from "lucide-react";
import { PageHeading } from "@/components/PageHeading";
import { MonitorToolbar, type DeviceOption } from "@/components/MonitorToolbar";
import { ChartFrame } from "@/components/ChartFrame";
import { SensorChart } from "@/components/SensorChart";
import { getSthDevices, getSthKpi, getSthRango } from "@/lib/knopClient";
import { useSensorSeries } from "@/lib/useSensorSeries";
import { buildSthOption } from "@/lib/charts/sthOption";
import {
  aggForPresetSth,
  estimateAggFromDatesSth,
  presetRangeYmd,
} from "@/lib/aggregation";
import type { SthDevice, RangoSth } from "@/lib/knopTypes";
import { fmt, formatDateToMinute, formatExcelTime, ymdToDmy } from "@/lib/units";
import { batteryStatus, BATTERY_STATUS_LABEL, BATTERY_STATUS_COLOR } from "@/lib/stats";
import { exportRowsToXlsx, safeFileName } from "@/lib/exportXlsx";

export default function SthPage() {
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

  const options: DeviceOption[] = devices.map((d) => ({
    value: d.name,
    label: d.ubicacion ? `${d.identificador} — ${d.ubicacion}` : d.identificador,
  }));

  const last = series.rows.length ? series.rows[series.rows.length - 1] : null;

  const chartOption = useMemo(
    () => buildSthOption(series.rows, rango, sensorLabel),
    [series.rows, rango, sensorLabel]
  );

  // Export idéntico al del sistema original: columnas time/hum_SHT/tempC_SHT,
  // hoja "datos" y nombre sensor_<base>_<inicio>_<fin>_<agg>min_<stamp>.xlsx.
  const handleExport = () => {
    const rows = series.rows.map((r) => ({
      time: formatExcelTime(r.t),
      hum_SHT: r.hum,
      tempC_SHT: r.tempC,
    }));
    const start = series.query.start ?? "";
    const end = series.query.end ?? "";
    const aggMin = series.query.agg ?? 1;
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    const stamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(
      now.getDate()
    )}_${pad(now.getHours())}${pad(now.getMinutes())}`;
    exportRowsToXlsx(
      `sensor_${safeFileName(sensorLabel || selected)}_${ymdToDmy(start)}_${ymdToDmy(
        end
      )}_${aggMin}min_${stamp}.xlsx`,
      rows,
      "datos",
      ["time", "hum_SHT", "tempC_SHT"]
    );
  };

  return (
    <div className="mx-auto flex w-full max-w-[1400px] flex-1 flex-col gap-4 px-4 py-6 sm:px-6">
      <PageHeading
        kicker="Knop Laboratorios · Monitoreo"
        title="Termohigrómetros"
        subtitle="Temperatura y humedad relativa en áreas controladas"
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
        deviceLabel="Sensor"
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <InfoStat
          icon={<Thermometer className="h-4 w-4" />}
          label="Temperatura"
          value={last?.tempC == null ? "—" : `${fmt(last.tempC, 1)} °C`}
          sub={
            rango?.tempMin != null && rango?.tempMax != null
              ? `Rango ${rango.tempMin}–${rango.tempMax} °C`
              : undefined
          }
        />
        <InfoStat
          icon={<Droplets className="h-4 w-4" />}
          label="Humedad"
          value={last?.hum == null ? "—" : `${fmt(last.hum, 1)} %`}
          sub={
            rango?.humMin != null && rango?.humMax != null
              ? `Rango ${rango.humMin}–${rango.humMax} %`
              : undefined
          }
        />
        <InfoStat
          icon={<MapPin className="h-4 w-4" />}
          label="Ubicación"
          value={meta?.ubicacion || "—"}
          sub={rango?.tipo ? `Tipo ${rango.tipo}` : undefined}
        />
        <InfoStat
          icon={<BatteryMedium className="h-4 w-4" />}
          label="Batería · medición"
          value={
            last?.batV == null ? (
              "—"
            ) : (
              <>
                {fmt(last.batV, 2)} V{" "}
                <span className={`text-sm ${BATTERY_STATUS_COLOR[batteryStatus(last.batV)!]}`}>
                  · {BATTERY_STATUS_LABEL[batteryStatus(last.batV)!]}
                </span>
              </>
            )
          }
          sub={last ? formatDateToMinute(last.t) : undefined}
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
  value: React.ReactNode;
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
