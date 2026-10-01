import { NextResponse } from "next/server";
import { availableSlots } from "@/lib/availability";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const dia = new URL(request.url).searchParams.get("dia");
  if (!dia) return NextResponse.json({ slots: [] });

  // Los bloques libres dependen de cuánto dura el servicio: una mentoría de
  // 75 minutos no cabe en un hueco de una hora.
  const servicioId = new URL(request.url).searchParams.get("servicio");
  const servicio = servicioId
    ? await db.service.findUnique({ where: { id: servicioId }, select: { durationMin: true } })
    : null;

  return NextResponse.json({ slots: await availableSlots(dia, servicio?.durationMin ?? 60) });
}
