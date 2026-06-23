import type { EChartsOption } from "echarts";
import type { RangoSth, SthRow } from "@/lib/knopTypes";
import { CHART } from "@/lib/echartsTheme";
import { formatLabelDate } from "@/lib/units";

/**
 * Eje Y único (como la página original): min 0 y máximo dinámico que incluye
 * los datos y los máximos de rango, para que las bandas de aceptación de
 * temperatura (verde) y humedad (azul) siempre queden visibles.
 */
export function buildSthOption(
  rows: SthRow[],
  rango: RangoSth | null,
  sensorLabel: string
): EChartsOption {
  const xLabels = rows.map((r) => formatLabelDate(r.t));
  const temp = rows.map((r) => r.tempC);
  const hum = rows.map((r) => r.hum);

  const bandTemp =
    rango?.tempMin != null && rango?.tempMax != null
      ? {
          silent: true,
          itemStyle: { color: "rgba(15,111,58,0.08)" },
          data: [[{ yAxis: rango.tempMin }, { yAxis: rango.tempMax }]] as never,
        }
      : undefined;

  const bandHum =
    rango?.humMin != null && rango?.humMax != null
      ? {
          silent: true,
          itemStyle: { color: "rgba(37,99,235,0.07)" },
          data: [[{ yAxis: rango.humMin }, { yAxis: rango.humMax }]] as never,
        }
      : undefined;

  const tempLines: Record<string, unknown>[] = [];
  if (rango?.tempMin != null)
    tempLines.push({
      yAxis: rango.tempMin,
      lineStyle: { color: CHART.temp, type: "dashed", width: 1.3 },
      label: { formatter: `T° mín ${rango.tempMin}°C`, color: CHART.temp, fontSize: 11, position: "insideEndTop" },
    });
  if (rango?.tempMax != null)
    tempLines.push({
      yAxis: rango.tempMax,
      lineStyle: { color: CHART.temp, type: "dashed", width: 1.3 },
      label: { formatter: `T° máx ${rango.tempMax}°C`, color: CHART.temp, fontSize: 11, position: "insideEndBottom" },
    });

  const humLines: Record<string, unknown>[] = [];
  if (rango?.humMin != null)
    humLines.push({
      yAxis: rango.humMin,
      lineStyle: { color: CHART.hum, type: "dashed", width: 1.3 },
      label: { formatter: `H mín ${rango.humMin}%`, color: CHART.hum, fontSize: 11, position: "insideEndTop" },
    });
  if (rango?.humMax != null)
    humLines.push({
      yAxis: rango.humMax,
      lineStyle: { color: CHART.hum, type: "dashed", width: 1.3 },
      label: { formatter: `H máx ${rango.humMax}%`, color: CHART.hum, fontSize: 11, position: "insideEndBottom" },
    });

  const yMax = (value: { max: number }) => {
    const dataMax = Number.isFinite(value.max) ? value.max : 10;
    const cands = [dataMax];
    if (rango?.tempMax != null) cands.push(rango.tempMax);
    if (rango?.humMax != null) cands.push(rango.humMax);
    return Math.ceil(Math.max(...cands) + 2);
  };

  return {
    animation: false,
    grid: { left: 48, right: 24, top: 30, bottom: 70, containLabel: true },
    legend: { show: true, top: 0, right: 8, data: ["Temperatura", "Humedad"] },
    tooltip: {
      trigger: "axis",
      confine: true,
      axisPointer: { type: "line", snap: true },
      formatter: (params: unknown) => {
        const p = params as { dataIndex: number }[];
        const idx = p?.[0]?.dataIndex ?? 0;
        const t = temp[idx] == null ? "—" : `${temp[idx]!.toFixed(1)} °C`;
        const h = hum[idx] == null ? "—" : `${hum[idx]!.toFixed(1)} %`;
        const ld = xLabels[idx] ?? "";
        return `
          <div style="min-width:200px">
            <div style="font-weight:700;font-size:13px;margin-bottom:6px">${sensorLabel}</div>
            <div style="font-size:12px;color:#6b7280;margin-bottom:6px">${ld}</div>
            <div style="display:flex;justify-content:space-between;gap:14px;margin-bottom:3px">
              <span style="color:${CHART.temp}">● Temperatura</span><b>${t}</b>
            </div>
            <div style="display:flex;justify-content:space-between;gap:14px">
              <span style="color:${CHART.hum}">● Humedad</span><b>${h}</b>
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
    yAxis: {
      type: "value",
      min: 0,
      max: yMax,
      splitLine: { lineStyle: { color: CHART.grid } },
    },
    series: [
      {
        name: "Temperatura",
        type: "line",
        showSymbol: false,
        sampling: "lttb",
        data: temp,
        lineStyle: { width: 2.2, color: CHART.temp },
        itemStyle: { color: CHART.temp },
        markArea: bandTemp,
        markLine: tempLines.length
          ? { silent: true, symbol: "none", data: tempLines as never }
          : undefined,
      },
      {
        name: "Humedad",
        type: "line",
        showSymbol: false,
        sampling: "lttb",
        data: hum,
        lineStyle: { width: 2.2, color: CHART.hum },
        itemStyle: { color: CHART.hum },
        markArea: bandHum,
        markLine: humLines.length
          ? { silent: true, symbol: "none", data: humLines as never }
          : undefined,
      },
    ],
  };
}
