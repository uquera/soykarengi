import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { getLicenciaStatus } from "@/lib/licencia";

export const dynamic = "force-dynamic";

/**
 * Gobernanza SaaS · estado y sincronización de la licencia.
 *
 * GET  — dos vías de acceso a propósito:
 *        1. El operador (health-check y sync del panel Hypnos) con X-Master-Key.
 *        2. Karen, desde /admin/licencia, con su sesión de administradora.
 *        Sin la primera, el health-check del panel no puede consultar nada.
 *
 * PATCH — solo el operador. Mueve fecha de vencimiento, plan y suspensión.
 *
 *   curl -X PATCH https://karengi.srv1485601.hstgr.cloud/api/gobernanza/licencia \
 *     -H "Content-Type: application/json" \
 *     -H "X-Master-Key: TU_CLAVE" \
 *     -d '{"fechaVencimiento":"2026-10-05","plan":"BASICO","suspendida":false}'
 */
function esOperador(request: Request) {
  const enviada = request.headers.get("x-master-key");
  const esperada = process.env.GOBERNANZA_MASTER_KEY;
  return Boolean(esperada && enviada && enviada === esperada);
}

export async function GET(request: Request) {
  if (!esOperador(request)) {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
  }

  return NextResponse.json(await getLicenciaStatus());
}

export async function PATCH(request: Request) {
  if (!esOperador(request)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Cuerpo inválido" }, { status: 400 });
  }

  const { fechaVencimiento, suspendida, plan, notasAdmin } = body as {
    fechaVencimiento?: string;
    suspendida?: boolean;
    plan?: string;
    notasAdmin?: string | null;
  };

  if (fechaVencimiento !== undefined && Number.isNaN(new Date(fechaVencimiento).getTime())) {
    return NextResponse.json({ error: "fechaVencimiento inválida" }, { status: 400 });
  }

  const data: Record<string, unknown> = {};
  if (fechaVencimiento !== undefined) data.fechaVencimiento = new Date(fechaVencimiento);
  if (suspendida !== undefined) data.suspendida = Boolean(suspendida);
  if (plan !== undefined) data.plan = String(plan);
  if (notasAdmin !== undefined) data.notasAdmin = notasAdmin ?? null;

  // La fila es un singleton con id fijo: el upsert la crea en el primer sync
  // sin que nadie tenga que sembrarla a mano en el servidor.
  const licencia = await db.licencia.upsert({
    where: { id: "singleton" },
    update: data,
    create: {
      id: "singleton",
      plan: plan ?? "BASICO",
      fechaVencimiento: fechaVencimiento ? new Date(fechaVencimiento) : new Date(),
      suspendida: Boolean(suspendida ?? false),
      notasAdmin: notasAdmin ?? null,
    },
  });

  return NextResponse.json({ ok: true, licencia });
}
