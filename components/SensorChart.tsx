"use client";

import { useEffect, useRef } from "react";
import * as echarts from "echarts";
import { knopEChartsTheme, KNOP_THEME_NAME } from "@/lib/echartsTheme";

let themeRegistered = false;
function ensureTheme() {
  if (!themeRegistered) {
    echarts.registerTheme(KNOP_THEME_NAME, knopEChartsTheme);
    themeRegistered = true;
  }
}

type Props = {
  option: echarts.EChartsOption;
  className?: string;
  /** Reemplaza la opción completa en cada cambio (default true). */
  notMerge?: boolean;
};

export function SensorChart({ option, className, notMerge = true }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<echarts.ECharts | null>(null);

  // init / dispose
  useEffect(() => {
    ensureTheme();
    const el = containerRef.current;
    if (!el) return;

    const chart = echarts.init(el, KNOP_THEME_NAME, { renderer: "canvas" });
    chartRef.current = chart;

    const ro = new ResizeObserver(() => chart.resize());
    ro.observe(el);
    const onWin = () => chart.resize();
    window.addEventListener("resize", onWin);

    // Redibujar al alto reducido de impresión (PDF en una hoja) y al volver.
    const onBeforePrint = () => chart.resize();
    const onAfterPrint = () => chart.resize();
    window.addEventListener("beforeprint", onBeforePrint);
    window.addEventListener("afterprint", onAfterPrint);
    const mql = window.matchMedia("print");
    const onMql = () => chart.resize();
    mql.addEventListener?.("change", onMql);

    return () => {
      ro.disconnect();
      window.removeEventListener("resize", onWin);
      window.removeEventListener("beforeprint", onBeforePrint);
      window.removeEventListener("afterprint", onAfterPrint);
      mql.removeEventListener?.("change", onMql);
      chart.dispose();
      chartRef.current = null;
    };
  }, []);

  // update option
  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;
    chart.setOption(option, { notMerge, lazyUpdate: true });
    chart.resize();
  }, [option, notMerge]);

  return <div ref={containerRef} className={className} />;
}
