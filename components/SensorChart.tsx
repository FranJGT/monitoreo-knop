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

/**
 * Ajusta el gráfico al tamaño REAL del contenedor usando su bounding box.
 * Evita el canvas de ancho 0 cuando ECharts se inicializa antes de que el
 * layout (flex/grid) haya calculado el ancho del contenedor.
 */
function fitChart(chart: echarts.ECharts | null, el: HTMLElement | null) {
  if (!chart || !el) return;
  const { width, height } = el.getBoundingClientRect();
  if (width > 0 && height > 0) {
    chart.resize({ width: Math.round(width), height: Math.round(height) });
  }
}

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

    const fit = () => fitChart(chartRef.current, el);
    // Ajuste inicial tras el primer layout (evita canvas de ancho 0 en grids/flex).
    let raf = requestAnimationFrame(() => {
      fit();
      raf = requestAnimationFrame(fit);
    });

    const ro = new ResizeObserver(fit);
    ro.observe(el);
    window.addEventListener("resize", fit);

    // Redibujar al alto reducido de impresión (PDF en una hoja) y al volver.
    window.addEventListener("beforeprint", fit);
    window.addEventListener("afterprint", fit);
    const mql = window.matchMedia("print");
    mql.addEventListener?.("change", fit);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("resize", fit);
      window.removeEventListener("beforeprint", fit);
      window.removeEventListener("afterprint", fit);
      mql.removeEventListener?.("change", fit);
      chart.dispose();
      chartRef.current = null;
    };
  }, []);

  // update option
  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;
    chart.setOption(option, { notMerge, lazyUpdate: true });
    fitChart(chart, containerRef.current);
  }, [option, notMerge]);

  return <div ref={containerRef} className={className} />;
}
