import { NextResponse } from "next/server";
import { availableSlots } from "@/lib/availability";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const dia = new URL(request.url).searchParams.get("dia");
  if (!dia) return NextResponse.json({ slots: [] });

  return NextResponse.json({ slots: await availableSlots(dia) });
}
