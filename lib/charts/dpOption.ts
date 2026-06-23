import type { EChartsOption } from "echarts";
import type { DpRow, RangoDp } from "@/lib/knopTypes";
import { CHART } from "@/lib/echartsTheme";
import { formatLabelDate, paToInH2O } from "@/lib/units";

export function buildDpOption(
  rows: DpRow[],
  rango: RangoDp | null,
  sensorLabel: string
): EChartsOption {
  const xLabels = rows.map((r) => formatLabelDate(r.t));
  const pa = rows.map((r) => r.pa);
  const inH2O = pa.map((v) => (v == null ? null : paToInH2O(v)));

  const lines: Record<string, unknown>[] = [];
  if (rango?.minPa != null) {
    lines.push({
      yAxis: rango.minPa,
      lineStyle: { color: CHART.warn, type: "dashed", width: 1.5 },
      label: {
        formatter: `Mín ${rango.minPa.toFixed(2)} Pa`,
        color: "#a16207",
        fontSize: 11,
        position: "insideEndBottom",
      },
    });
  }
  if (rango?.maxPa != null) {
    lines.push({
      yAxis: rango.maxPa,
      lineStyle: { color: CHART.alert, type: "dashed", width: 1.5 },
      label: {
        formatter: `Máx ${rango.maxPa.toFixed(2)} Pa`,
        color: "#991b1b",
        fontSize: 11,
        position: "insideEndTop",
      },
    });
  }

  const yMin = (v: { min: number }) => {
    const lo = Math.min(v.min, rango?.minPa ?? v.min);
    return Math.max(0, Math.floor(lo - 2));
  };
  const yMax = (v: { max: number }) => {
    const cands = [v.max];
    if (rango?.maxPa != null && rango.maxPa <= v.max * 1.8) cands.push(rango.maxPa);
    return Math.ceil(Math.max(...cands) + 2);
  };

  return {
    animation: false,
    grid: { left: 50, right: 28, top: 24, bottom: 70, containLabel: true },
    tooltip: {
      trigger: "axis",
      confine: true,
      axisPointer: { type: "line", snap: true },
      formatter: (params: unknown) => {
        const p = params as { dataIndex: number; marker: string }[];
        const idx = p?.[0]?.dataIndex ?? 0;
        const vPa = pa[idx] == null ? "—" : pa[idx]!.toFixed(2);
        const vIn = inH2O[idx] == null ? "—" : inH2O[idx]!.toFixed(3);
        const ld = xLabels[idx] ?? "";
        return `
          <div style="min-width:190px">
            <div style="font-weight:700;font-size:13px;margin-bottom:6px">${sensorLabel}</div>
            <div style="font-size:12px;color:#6b7280;margin-bottom:6px">${ld}</div>
            <div style="display:flex;justify-content:space-between;gap:14px;margin-bottom:3px">
              <span>${p?.[0]?.marker ?? ""} Presión</span><b>${vPa} Pa</b>
            </div>
            <div style="display:flex;justify-content:space-between;gap:14px;color:#6b7280">
              <span>inH₂O</span><b>${vIn} inH₂O</b>
            </div>
          </div>`;
      },
    },
    xAxis: {
      type: "category",
      data: xLabels,
      axisTick: { alignWithLabel: true },
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
              { offset: 0, color: "rgba(15,111,58,0.18)" },
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
