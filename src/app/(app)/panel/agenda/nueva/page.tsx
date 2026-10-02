import type { Metadata } from "next";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { diaKaren } from "@/lib/simple";
import { Encabezado } from "@/components/panel-sencillo-ui";
import { AgendarForm } from "./agendar-form";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Agendar" };

export default async function AgendarPage() {
  await requireAdmin();
  const servicios = await db.service.findMany({ where: { active: true }, orderBy: { order: "asc" } });

  return (
    <div>
      <Encabezado
        titulo="Agendar a alguien"
        bajada="La cita queda confirmada y a la persona le llega un correo. Si no tiene cuenta, se le crea una."
        volver={{ href: "/panel/agenda", label: "Agenda" }}
      />
      <AgendarForm
        hoy={diaKaren(new Date())}
        servicios={servicios.map((s) => ({ id: s.id, nombre: s.name, modalidad: s.modality, minutos: s.durationMin }))}
      />
    </div>
  );
}
