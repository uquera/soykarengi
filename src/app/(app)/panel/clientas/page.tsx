import type { Metadata } from "next";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { Encabezado, Vacio } from "@/components/panel-sencillo-ui";
import { BuscadorClientas } from "./buscador";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Clientas" };

export default async function ClientasPage() {
  await requireAdmin();
  const clientas = await db.user.findMany({
    where: { role: "CLIENT" },
    orderBy: { name: "asc" },
    include: { _count: { select: { appointments: true, designRequests: true } } },
  });

  return (
    <div>
      <Encabezado titulo="Clientas" bajada="Toca un nombre para ver sus citas, sus pedidos y sus archivos." />
      {clientas.length === 0 ? (
        <Vacio titulo="Todavía no hay clientas" texto="Cuando alguien cree su cuenta en la web, aparecerá aquí." />
      ) : (
        <BuscadorClientas
          clientas={clientas.map((c) => ({
            id: c.id,
            nombre: c.name,
            contacto: c.phone || c.email,
            citas: c._count.appointments,
            pedidos: c._count.designRequests,
          }))}
        />
      )}
    </div>
  );
}
