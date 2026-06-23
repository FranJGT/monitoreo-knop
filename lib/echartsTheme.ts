/**
 * Tema ECharts on-brand (Knop) y paleta compartida por todos los gráficos.
 */
export const CHART = {
  brand: "#0f6f3a",
  brandDeep: "#09612d",
  brandSoft: "#cfe8d8",
  temp: "#0f6f3a", // temperatura → verde marca
  hum: "#2563eb", // humedad → azul (contraste claro con el verde)
  pressure: "#0f6f3a",
  lime: "#5fe500",
  warn: "#d4a017",
  alert: "#dc2626",
  ok: "#16a34a",
  ink: "#0f1c14",
  muted: "#5b6b61",
  faint: "#8a988f",
  line: "#e3eae5",
  grid: "#eef3ef",
} as const;

export const KNOP_THEME_NAME = "knop";

export const knopEChartsTheme = {
  color: [CHART.brand, CHART.hum, CHART.lime, CHART.warn, CHART.alert],
  backgroundColor: "transparent",
  textStyle: {
    fontFamily:
      'var(--font-hanken), ui-sans-serif, system-ui, "Segoe UI", Roboto, Arial, sans-serif',
    color: CHART.ink,
  },
  title: {
    textStyle: { color: CHART.ink, fontWeight: 800 },
    subtextStyle: { color: CHART.muted },
  },
  line: {
    symbol: "none",
    smooth: false,
    lineStyle: { width: 2 },
  },
  categoryAxis: {
    axisLine: { lineStyle: { color: CHART.faint } },
    axisTick: { lineStyle: { color: CHART.faint } },
    axisLabel: { color: CHART.muted, fontSize: 12 },
    splitLine: { show: false },
  },
  valueAxis: {
    axisLine: { show: false },
    axisTick: { show: false },
    axisLabel: { color: CHART.muted, fontSize: 12 },
    splitLine: { lineStyle: { color: CHART.grid } },
    nameTextStyle: { color: CHART.muted, fontWeight: 700 },
  },
  legend: {
    textStyle: { color: CHART.muted, fontWeight: 600 },
    icon: "roundRect",
  },
  tooltip: {
    backgroundColor: "rgba(255,255,255,0.98)",
    borderColor: CHART.line,
    borderWidth: 1,
    textStyle: { color: CHART.ink },
    extraCssText:
      "box-shadow:0 14px 34px -10px rgba(15,28,20,.28);border-radius:12px;padding:10px;",
  },
};
