import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { diaKaren } from "@/lib/simple";
import { DiasLibresForm } from "./dias-libres-form";
import { Encabezado } from "@/components/panel-sencillo-ui";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Días libres" };

export default async function DiasLibresPage() {
  await requireAdmin();
  return (
    <div>
      <Encabezado
        titulo="Tomarme días libres"
        bajada="Esos días no se ofrecen en la agenda de la web. Las citas que ya tengas no se mueven."
        volver={{ href: "/panel/agenda", label: "Agenda" }}
      />
      <DiasLibresForm hoy={diaKaren(new Date())} />
    </div>
  );
}
