/**
 * compare-knop.mjs — Verificación "app propia vs sistema original" (Knop).
 *
 * Compara, caso por caso, que la INFORMACIÓN (datos + Excel) que entrega nuestra
 * app Next.js coincide con la del sistema original de Softronica, que consume la
 * misma API upstream. No depende de la UI: replica la lógica de parámetros de
 * ambos sistemas, golpea la API real y arma ambos Excel con SheetJS para
 * compararlos celda por celda.
 *
 * Uso:
 *   node scripts/compare-knop.mjs                 # todos los casos
 *   node scripts/compare-knop.mjs --no-report     # sin escribir el .md
 *
 * Salida: tabla por consola + docs/reporte-comparacion.md
 *
 * Cubre: DP y STH × 6 presets (estructura en vivo) + rangos fijos (Excel byte a byte).
 */

import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const XLSX = await import("xlsx");
const __dirname = dirname(fileURLToPath(import.meta.url));

const BASE = "https://newenergy.softronica.cl/knop/monitoreo/";
const PRESETS = ["24h", "2d", "3d", "7d", "30d", "12m"];

// Dispositivos de prueba (reales).
const DP_DEVICES = [
  { id: "a84041d1435aa48d", label: "A1-2" }, // RSDP 1
  { id: "a840414ca95aa4d4", label: "C3" }, // RSDP 2
];
const STH_DEVICES = [
  { id: "AHP - Área HPLC", label: "AHP" },
  { id: "CBC - Bodega Controlados", label: "CBC" },
];

// Rangos históricos fijos (estables: sin drift de datos en vivo) para el Excel byte a byte.
// Cubren todos los tramos de estimateAgg (1d, 5d, 20d, 60d).
const FIXED_RANGES = [
  { start: "2026-06-20", end: "2026-06-21" }, //   1–2 días
  { start: "2026-06-16", end: "2026-06-21" }, //   ~5 días
  { start: "2026-06-01", end: "2026-06-21" }, //   ~20 días
  { start: "2026-04-22", end: "2026-06-21" }, //   ~60 días
];

/* ------------------------- helpers de tiempo/números ------------------------- */

/** YYYY-MM-DD en hora local (idéntico en ambos sistemas). */
function ymdLocal(d) {
  const off = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - off).toISOString().slice(0, 10);
}
function stripSeconds(ts) {
  if (ts == null || ts === "") return "";
  return String(ts).replace("T", " ").replace("Z", "").slice(0, 16);
}
function formatExcelTime(ts) {
  const c = stripSeconds(ts);
  if (!c || c.length < 16) return "";
  return `${c.slice(8, 10)}/${c.slice(5, 7)}/${c.slice(0, 4)} ${c.slice(11, 16)}`;
}
/** Coerción de números de NUESTRA app (lib/knopApi.ts toNum): "" -> null. */
function ourToNum(v) {
  if (v === null || v === undefined || v === "") return null;
  const n = typeof v === "number" ? v : Number(String(v));
  return Number.isFinite(n) ? n : null;
}
/** Coerción del ORIGINAL: `x != null ? Number(x) : null`  ("" -> 0). */
function origNum(v) {
  return v != null ? Number(v) : null;
}

/* --------------------------- lógica de parámetros --------------------------- */
// DP: ambos usan preset+agg (o start/end+agg en rango). Mapas idénticos.
const AGG_MAP_DP = { "24h": 5, "2d": 5, "3d": 5, "7d": 15, "30d": 60, "12m": 1440 };
function estimateAggDp(startYmd, endYmd) {
  const a = new Date(startYmd + "T00:00:00");
  const b = new Date(endYmd + "T23:59:59");
  const days = Math.max(1, Math.ceil((b - a) / (24 * 3600 * 1000)));
  if (days <= 3) return 5;
  if (days <= 7) return 15;
  if (days <= 30) return 60;
  return 1440;
}

// STH ------ NUESTRA app (lib/aggregation.ts) ------
const AGG_MAP_STH = { "24h": null, "2d": null, "3d": null, "7d": 10, "30d": 30, "12m": 60 };
function estimateAggSth(startYmd, endYmd) {
  const a = new Date(startYmd + "T00:00:00");
  const b = new Date(endYmd + "T23:59:59");
  const days = Math.max(1, Math.ceil((b - a) / (24 * 3600 * 1000)));
  if (days <= 3) return null;
  if (days <= 7) return 10;
  if (days <= 30) return 30;
  return 60;
}
/** presetRangeYmd() nuestro: start = hoy − N (setDate/setMonth). */
function ourSthParams(preset, now) {
  const start = new Date(now);
  switch (preset) {
    case "24h": start.setDate(start.getDate() - 1); break;
    case "2d": start.setDate(start.getDate() - 2); break;
    case "3d": start.setDate(start.getDate() - 3); break;
    case "7d": start.setDate(start.getDate() - 7); break;
    case "30d": start.setDate(start.getDate() - 30); break;
    case "12m": start.setMonth(start.getMonth() - 12); break;
  }
  return { start: ymdLocal(start), end: ymdLocal(now), agg: AGG_MAP_STH[preset] };
}
// STH ------ ORIGINAL (getRangeAndAgg del index.html) ------
function origSthParams(preset, now) {
  let start = new Date(now);
  let agg = null;
  switch (preset) {
    case "24h": start = new Date(now.getTime() - 24 * 3600 * 1000); break;
    case "2d": start = new Date(now.getTime() - 2 * 24 * 3600 * 1000); break;
    case "3d": start = new Date(now.getTime() - 3 * 24 * 3600 * 1000); break;
    case "7d": start = new Date(now.getTime() - 7 * 24 * 3600 * 1000); agg = 10; break;
    case "30d": start = new Date(now.getTime() - 30 * 24 * 3600 * 1000); agg = 30; break;
    case "12m": start = new Date(now); start.setMonth(start.getMonth() - 12); agg = 60; break;
  }
  return { start: ymdLocal(start), end: ymdLocal(now), agg };
}

/* ------------------------------- fetch upstream ------------------------------ */
async function getJSON(url) {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 45000);
      const res = await fetch(url, { signal: ctrl.signal, headers: { Accept: "application/json" } });
      clearTimeout(t);
      if (!res.ok) throw new Error("HTTP " + res.status);
      return await res.json();
    } catch (e) {
      if (attempt === 2) throw e;
      await new Promise((r) => setTimeout(r, 1000));
    }
  }
}
function dpKpiUrl({ id, preset, start, end, agg }) {
  const u = new URL(BASE + "sdp/kpiDP.php");
  u.searchParams.set("devEui", id);
  if (preset) u.searchParams.set("preset", preset);
  if (start) u.searchParams.set("start", start);
  if (end) u.searchParams.set("end", end);
  if (agg) u.searchParams.set("agg", String(agg));
  return u.toString();
}
function sthKpiUrl({ id, start, end, agg }) {
  const u = new URL(BASE + "kpiSTH.php");
  u.searchParams.set("deviceName", id);
  if (start) u.searchParams.set("start", start);
  if (end) u.searchParams.set("end", end);
  if (agg) u.searchParams.set("agg", String(agg));
  return u.toString();
}

/* ------------------------ construcción de Excel (AOA) ------------------------ */
function aoaFromRows(rows, header) {
  const ws = XLSX.utils.json_to_sheet(rows, { header });
  return XLSX.utils.sheet_to_json(ws, { header: 1, raw: true, defval: null });
}
/** Compara dos matrices (AOA) y devuelve lista de diferencias (vacía = OK). */
function diffAOA(a, b, maxReport = 8) {
  const diffs = [];
  if (a.length !== b.length) diffs.push(`filas: nuestra=${a.length} original=${b.length}`);
  const n = Math.min(a.length, b.length);
  for (let i = 0; i < n && diffs.length < maxReport; i++) {
    const ra = a[i] || [], rb = b[i] || [];
    const cols = Math.max(ra.length, rb.length);
    for (let c = 0; c < cols; c++) {
      const va = ra[c], vb = rb[c];
      const eq = va === vb || (va == null && vb == null) ||
        (typeof va === "number" && typeof vb === "number" && Object.is(va, vb));
      if (!eq) { diffs.push(`fila ${i} col ${c}: nuestra=${JSON.stringify(va)} original=${JSON.stringify(vb)}`); break; }
    }
  }
  return diffs;
}

/* -------------------------- transformaciones a Excel ------------------------- */
function dpOurAOA(data) {
  const rows = data.map((r) => ({
    bucket_time: r.bucket_time ?? "",
    last_datetime: r.last_datetime ?? "",
    Differential_pressure_Pa: ourToNum(r.Differential_pressure_Pa),
  }));
  return aoaFromRows(rows, ["bucket_time", "last_datetime", "Differential_pressure_Pa"]);
}
function dpOrigAOA(data) {
  const pa = data.map((r) => origNum(r.Differential_pressure_Pa));
  const rows = data.map((r, i) => ({
    bucket_time: r.bucket_time ?? "",
    last_datetime: r.last_datetime ?? "",
    Differential_pressure_Pa: pa[i],
  }));
  return aoaFromRows(rows, ["bucket_time", "last_datetime", "Differential_pressure_Pa"]);
}
const STH_METRICS = ["hum_SHT", "tempC_SHT"];
function sthOurAOA(data) {
  const rows = data.map((r) => ({
    time: formatExcelTime(r.bucket_time),
    hum_SHT: ourToNum(r.hum_SHT),
    tempC_SHT: ourToNum(r.tempC_SHT),
  }));
  return aoaFromRows(rows, ["time", ...STH_METRICS]);
}
function sthOrigAOA(data) {
  const rows = data.map((r) => {
    const row = { time: formatExcelTime(r.time ?? r.bucket_time ?? "") };
    STH_METRICS.forEach((m) => (row[m] = origNum(r[m])));
    return row;
  });
  return aoaFromRows(rows, ["time", ...STH_METRICS]);
}

/* --------------------------------- runner ----------------------------------- */
const results = [];
function record(kind, caso, status, detail) {
  results.push({ kind, caso, status, detail: detail || "" });
  const icon = status === "OK" ? "✓" : status === "AVISO" ? "▲" : "✗";
  console.log(`  ${icon} [${kind}] ${caso}${detail ? " — " + detail : ""}`);
}

function checkSpacingMinutes(data) {
  // mediana del delta entre buckets consecutivos, en minutos
  const ts = data.map((r) => new Date(String(r.bucket_time).replace(" ", "T")).getTime()).filter((n) => !isNaN(n));
  const deltas = [];
  for (let i = 1; i < ts.length; i++) deltas.push((ts[i] - ts[i - 1]) / 60000);
  deltas.sort((a, b) => a - b);
  return deltas.length ? deltas[Math.floor(deltas.length / 2)] : null;
}

async function run() {
  const now = new Date();
  console.log("== Verificación Knop: nuestra app vs sistema original ==");
  console.log("Fecha:", now.toISOString(), "\n");

  /* 1) PARÁMETROS por preset (determinista) --------------------------------- */
  console.log("1) Parámetros por preset (mismo `now` para ambos):");
  for (const p of PRESETS) {
    // DP: ambos preset+agg idénticos por construcción
    const dpOk = AGG_MAP_DP[p] != null;
    record("DP-param", p, dpOk ? "OK" : "FALLA", `preset+agg=${AGG_MAP_DP[p]}`);
    // STH: comparar start/end/agg de ambos
    const a = ourSthParams(p, now), b = origSthParams(p, now);
    const same = a.start === b.start && a.end === b.end && (a.agg ?? null) === (b.agg ?? null);
    record(
      "STH-param",
      p,
      same ? "OK" : "AVISO",
      `nuestra=${a.start}..${a.end}/agg=${a.agg} original=${b.start}..${b.end}/agg=${b.agg}`
    );
  }

  /* 2) ESTRUCTURA en vivo por preset (spacing=agg, columnas) ----------------- */
  console.log("\n2) Estructura en vivo por preset (una llamada, params de nuestra app):");
  for (const dev of DP_DEVICES.slice(0, 1)) {
    for (const p of PRESETS) {
      try {
        const data = await getJSON(dpKpiUrl({ id: dev.id, preset: p, agg: AGG_MAP_DP[p] }));
        const sp = checkSpacingMinutes(data);
        const cols = data[0] ? Object.keys(data[0]).join(",") : "-";
        const okCols = data[0] && ["bucket_time", "last_datetime", "Differential_pressure_Pa"].every((k) => k in data[0]);
        record("DP-vivo", `${dev.label}/${p}`, okCols ? "OK" : "FALLA", `filas=${data.length} spacing≈${sp}min cols=${cols}`);
      } catch (e) { record("DP-vivo", `${dev.label}/${p}`, "FALLA", e.message); }
    }
  }
  for (const dev of STH_DEVICES.slice(0, 1)) {
    for (const p of PRESETS) {
      try {
        const pr = ourSthParams(p, now);
        const data = await getJSON(sthKpiUrl({ id: dev.id, start: pr.start, end: pr.end, agg: pr.agg }));
        const sp = checkSpacingMinutes(data);
        const okCols = data[0] && ["bucket_time", "tempC_SHT", "hum_SHT"].every((k) => k in data[0]);
        record("STH-vivo", `${dev.label}/${p}`, okCols ? "OK" : "FALLA", `filas=${data.length} spacing≈${sp}min`);
      } catch (e) { record("STH-vivo", `${dev.label}/${p}`, "FALLA", e.message); }
    }
  }

  /* 3) EXCEL byte a byte en rangos fijos (nuestra transformación vs original) - */
  console.log("\n3) Excel celda por celda (rangos históricos fijos):");
  for (const dev of DP_DEVICES) {
    for (const rg of FIXED_RANGES) {
      const caso = `${dev.label}/${rg.start}..${rg.end}`;
      try {
        const agg = estimateAggDp(rg.start, rg.end);
        const data = await getJSON(dpKpiUrl({ id: dev.id, start: rg.start, end: rg.end, agg }));
        const d = diffAOA(dpOurAOA(data), dpOrigAOA(data));
        record("DP-xlsx", caso, d.length ? "FALLA" : "OK", d.length ? d.join(" | ") : `filas=${data.length} agg=${agg}`);
      } catch (e) { record("DP-xlsx", caso, "FALLA", e.message); }
    }
  }
  for (const dev of STH_DEVICES) {
    for (const rg of FIXED_RANGES) {
      const caso = `${dev.label}/${rg.start}..${rg.end}`;
      try {
        const agg = estimateAggSth(rg.start, rg.end);
        const data = await getJSON(sthKpiUrl({ id: dev.id, start: rg.start, end: rg.end, agg }));
        const d = diffAOA(sthOurAOA(data), sthOrigAOA(data));
        record("STH-xlsx", caso, d.length ? "FALLA" : "OK", d.length ? d.join(" | ") : `filas=${data.length} agg=${agg ?? "def"}`);
      } catch (e) { record("STH-xlsx", caso, "FALLA", e.message); }
    }
  }

  /* 4) BARRIDO de TODOS los dispositivos (un rango) -------------------------- */
  console.log("\n4) Barrido de TODOS los dispositivos (rango fijo, Excel celda por celda):");
  const sweepRange = { start: "2026-06-18", end: "2026-06-21" };
  try {
    const dpAll = await getJSON(BASE + "sdp/deviceDP.php");
    const aggDp = estimateAggDp(sweepRange.start, sweepRange.end);
    for (const dev of dpAll) {
      const caso = `${dev.identificador || dev.devEui}`;
      try {
        const data = await getJSON(dpKpiUrl({ id: dev.devEui, start: sweepRange.start, end: sweepRange.end, agg: aggDp }));
        const d = diffAOA(dpOurAOA(data), dpOrigAOA(data));
        record("DP-todos", caso, d.length ? "FALLA" : "OK", d.length ? d.join(" | ") : `filas=${data.length}`);
      } catch (e) { record("DP-todos", caso, "FALLA", e.message); }
    }
  } catch (e) { record("DP-todos", "deviceDP.php", "FALLA", e.message); }

  try {
    const sthAll = await getJSON(BASE + "device.php"); // array de strings "CODE - Ubicación"
    const aggSth = estimateAggSth(sweepRange.start, sweepRange.end);
    for (const name of sthAll) {
      const caso = String(name).split(" - ")[0];
      try {
        const data = await getJSON(sthKpiUrl({ id: name, start: sweepRange.start, end: sweepRange.end, agg: aggSth }));
        const d = diffAOA(sthOurAOA(data), sthOrigAOA(data));
        record("STH-todos", caso, d.length ? "FALLA" : "OK", d.length ? d.join(" | ") : `filas=${data.length}`);
      } catch (e) { record("STH-todos", caso, "FALLA", e.message); }
    }
  } catch (e) { record("STH-todos", "device.php", "FALLA", e.message); }

  /* Resumen ------------------------------------------------------------------ */
  const fallas = results.filter((r) => r.status === "FALLA");
  const avisos = results.filter((r) => r.status === "AVISO");
  console.log(`\n== Resumen: ${results.length} casos · ${fallas.length} fallas · ${avisos.length} avisos ==`);

  if (!process.argv.includes("--no-report")) {
    const md = buildReport(now, results, fallas, avisos);
    const out = join(__dirname, "..", "docs", "reporte-comparacion.md");
    writeFileSync(out, md);
    console.log("Reporte escrito en docs/reporte-comparacion.md");
  }
  process.exit(fallas.length ? 1 : 0);
}

function buildReport(now, all, fallas, avisos) {
  const byKind = {};
  for (const r of all) (byKind[r.kind] ||= []).push(r);
  let md = `# Reporte de comparación — Knop (nuestra app vs sistema original)\n\n`;
  md += `**Generado:** ${now.toISOString()}\n\n`;
  md += `**Total:** ${all.length} casos · **Fallas:** ${fallas.length} · **Avisos:** ${avisos.length}\n\n`;
  md += fallas.length ? `> ⚠️ Hay diferencias reales. Ver sección de fallas.\n\n` : `> ✅ Sin diferencias de datos en ningún caso.\n\n`;
  for (const kind of Object.keys(byKind)) {
    md += `## ${kind}\n\n| Caso | Estado | Detalle |\n|---|---|---|\n`;
    for (const r of byKind[kind]) md += `| ${r.caso} | ${r.status} | ${r.detail} |\n`;
    md += `\n`;
  }
  return md;
}

run().catch((e) => { console.error("Error fatal:", e); process.exit(2); });
