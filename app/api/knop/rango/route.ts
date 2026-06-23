import { NextResponse } from "next/server";
import { fetchDpRango, fetchSthRango } from "@/lib/knopApi";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") ?? "dp";
  const id = searchParams.get("id") ?? "";
  if (!id) {
    return NextResponse.json({ error: "Falta id" }, { status: 400 });
  }
  try {
    const data =
      type === "sth" ? await fetchSthRango(id) : await fetchDpRango(id);
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
