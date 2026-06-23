import type { EChartsOption } from "echarts";
import type { DpRow, RangoDp } from "@/lib/knopTypes";
import { CHART } from "@/lib/echartsTheme";
import { formatLabelDate } from "@/lib/units";

/**
 * Gráfico del informe de presión. El eje incluye el límite mínimo (siempre visible)
 * y, si está cerca de los datos, también el máximo. Líneas punteadas de límite y
 * promedio — sin relleno que tape toda el área (como en la página original).
 */
export function buildDpReportOption(
  rows: DpRow[],
  rango: RangoDp | null,
  avg: number | null
): EChartsOption {
  const xLabels = rows.map((r) => formatLabelDate(r.t));
  const pa = rows.map((r) => r.pa);

  const lines: Record<string, unknown>[] = [];
  if (rango?.minPa != null)
    lines.push({
      yAxis: rango.minPa,
      lineStyle: { color: CHART.alert, type: "dashed", width: 1.4 },
      label: {
        formatter: `Mín ${rango.minPa} Pa`,
        color: CHART.alert,
        fontSize: 11,
        position: "insideStartBottom",
      },
    });
  if (rango?.maxPa != null)
    lines.push({
      yAxis: rango.maxPa,
      lineStyle: { color: CHART.alert, type: "dashed", width: 1.4 },
      label: {
        formatter: `Máx ${rango.maxPa} Pa`,
        color: CHART.alert,
        fontSize: 11,
        position: "insideStartTop",
      },
    });
  if (avg != null)
    lines.push({
      yAxis: avg,
      lineStyle: { color: CHART.muted, type: "dotted", width: 1.2 },
      label: {
        formatter: `Prom ${avg.toFixed(2)} Pa`,
        color: CHART.muted,
        fontSize: 11,
        position: "insideStartTop",
      },
    });

  const yMin = (v: { min: number }) => {
    const lo = Math.min(v.min, rango?.minPa ?? v.min);
    return Math.max(0, Math.floor(lo - 2));
  };
  const yMax = (v: { max: number }) => {
    const cands = [v.max];
    // Incluir el máximo de rango solo si está cerca de los datos (no aplastar la línea).
    if (rango?.maxPa != null && rango.maxPa <= v.max * 1.8) cands.push(rango.maxPa);
    return Math.ceil(Math.max(...cands) + 2);
  };

  return {
    animation: false,
    grid: { left: 48, right: 28, top: 18, bottom: 64, containLabel: true },
    tooltip: {
      trigger: "axis",
      confine: true,
      axisPointer: { type: "line", snap: true },
      valueFormatter: (v: unknown) =>
        v == null ? "—" : `${Number(v).toFixed(2)} Pa`,
    },
    xAxis: {
      type: "category",
      data: xLabels,
      axisLabel: {
        hideOverlap: true,
        margin: 12,
        lineHeight: 15,
        formatter: (value: string) => {
          if (!value) return "";
          const parts = String(value).split(" ");
          if (parts.length < 2) return value;
          return `${parts[0]}\n${parts[1].substring(0, 5)}`;
        },
      },
    },
    yAxis: { type: "value", name: "Pa", min: yMin, max: yMax },
    series: [
      {
        name: "Presión (Pa)",
        type: "line",
        showSymbol: false,
        sampling: "lttb",
        data: pa,
        lineStyle: { width: 2, color: CHART.pressure },
        itemStyle: { color: CHART.pressure },
        areaStyle: {
          color: {
            type: "linear",
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: "rgba(15,111,58,0.16)" },
              { offset: 1, color: "rgba(15,111,58,0.01)" },
            ],
          },
        },
        markLine: lines.length
          ? { silent: true, symbol: "none", data: lines as never }
          : undefined,
      },
    ],
  };
}
