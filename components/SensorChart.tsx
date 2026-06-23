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

    return () => {
      ro.disconnect();
      window.removeEventListener("resize", onWin);
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
