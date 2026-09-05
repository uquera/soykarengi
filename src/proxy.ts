import { NextResponse, type NextRequest } from "next/server";

/**
 * Un layout de servidor no conoce la ruta que se está pintando, y el corte por
 * licencia necesita saberla para dejar abierta /admin/licencia mientras bloquea
 * el resto del panel. Aquí se pasa en una cabecera y `headers()` la lee.
 *
 * No hay lógica de sesión a propósito: la autenticación se resuelve en el
 * servidor con `requireUser` / `requireAdmin`, que además consultan la base.
 *
 * Se llama `proxy` y no `middleware` porque Next 16 renombró la convención.
 */
export function proxy(request: NextRequest) {
  const headers = new Headers(request.headers);
  headers.set("x-pathname", request.nextUrl.pathname);
  return NextResponse.next({ request: { headers } });
}

export const config = {
  matcher: ["/admin/:path*", "/mi-espacio/:path*"],
};
