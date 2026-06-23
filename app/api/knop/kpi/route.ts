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
    return NextResponse.json(data, {
      headers: { "Cache-Control": "public, max-age=15, s-maxage=30" },
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Error" },
      { status: 502 }
    );
  }
}
