import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * Gobernanza SaaS · registro de pagos de la licencia.
 *
 * Lo llama el panel de Hypnos al registrar un pago, para que Karen vea el
 * historial en /admin/licencia sin tener que pedirlo. Karen atiende desde
 * Estados Unidos, así que la moneda por defecto es USD.
 *
 *   curl -X POST https://karengi.srv1485601.hstgr.cloud/api/gobernanza/pagos \
 *     -H "Content-Type: application/json" \
 *     -H "X-Master-Key: TU_CLAVE" \
 *     -d '{"monto":25,"periodoInicio":"2026-09-05","periodoFin":"2026-10-05","fechaPago":"2026-09-05"}'
 */
export async function POST(request: Request) {
  const enviada = request.headers.get("x-master-key");
  const esperada = process.env.GOBERNANZA_MASTER_KEY;
  if (!esperada || enviada !== esperada) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Cuerpo inválido" }, { status: 400 });
  }

  const { monto, moneda, periodoInicio, periodoFin, fechaPago, notas } = body as {
    monto?: number | string;
    moneda?: string;
    periodoInicio?: string;
    periodoFin?: string;
    fechaPago?: string;
    notas?: string | null;
  };

  if (monto === undefined || !periodoInicio || !periodoFin) {
    return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
  }

  const importe = Number(monto);
  if (!Number.isFinite(importe) || importe < 0) {
    return NextResponse.json({ error: "monto inválido" }, { status: 400 });
  }

  const fechas = { periodoInicio: new Date(periodoInicio), periodoFin: new Date(periodoFin) };
  if (Object.values(fechas).some((d) => Number.isNaN(d.getTime()))) {
    return NextResponse.json({ error: "Fechas inválidas" }, { status: 400 });
  }

  // El pago cuelga de la licencia, y en un servidor recién desplegado puede que
  // todavía no exista la fila: se crea vacía antes de guardar el primer pago.
  await db.licencia.upsert({
    where: { id: "singleton" },
    update: {},
    create: { id: "singleton", plan: "BASICO", fechaVencimiento: fechas.periodoFin },
  });

  const pago = await db.pagoLicencia.create({
    data: {
      licenciaId: "singleton",
      monto: importe,
      moneda: moneda ?? "USD",
      periodoInicio: fechas.periodoInicio,
      periodoFin: fechas.periodoFin,
      fechaPago: fechaPago ? new Date(fechaPago) : new Date(),
      notas: notas ?? null,
    },
  });

  return NextResponse.json({ ok: true, pago }, { status: 201 });
}
