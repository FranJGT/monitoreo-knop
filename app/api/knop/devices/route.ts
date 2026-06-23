import { NextResponse } from "next/server";
import { fetchDpDevices, fetchSthDevices } from "@/lib/knopApi";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") ?? "dp";
  try {
    const data =
      type === "sth" ? await fetchSthDevices() : await fetchDpDevices();
    return NextResponse.json(data, {
      headers: { "Cache-Control": "public, max-age=60, s-maxage=300" },
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Error" },
      { status: 502 }
    );
  }
}
