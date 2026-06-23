import { NextResponse } from "next/server";
import { fetchDpKpi, fetchSthKpi } from "@/lib/knopApi";
import type { KpiQuery, SensorKind } from "@/lib/knopTypes";
import type { PresetKey } from "@/lib/aggregation";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const kind = (searchParams.get("type") ?? "dp") as SensorKind;
  const id = searchParams.get("id") ?? "";
  if (!id) {
    return NextResponse.json({ error: "Falta id (devEui/deviceName)" }, { status: 400 });
  }

  const q: KpiQuery = {
    kind,
    id,
    preset: (searchParams.get("preset") as PresetKey) ?? undefined,
    start: searchParams.get("start") ?? undefined,
    end: searchParams.get("end") ?? undefined,
    agg: searchParams.get("agg") ? Number(searchParams.get("agg")) : undefined,
  };

  try {
    const data = kind === "sth" ? await fetchSthKpi(q) : await fetchDpKpi(q);
    // no-store en la respuesta: evita que el CDN cachee por ruta ignorando el
    // query string (colisión entre sensores/tipos). El upstream sí se cachea
    // server-side vía el `revalidate` del fetch en lib/knopApi.ts.
    return NextResponse.json(data, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Error" },
      { status: 502 }
    );
  }
}
