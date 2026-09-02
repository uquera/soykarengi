/** Vocabulario del negocio: una sola fuente de verdad para estados, grupos y emociones. */

export const REQUEST_FLOW = [
  "SOLICITUD",
  "COTIZADA",
  "APROBADA",
  "PAGADA",
  "EN_DISENO",
  "REVISION",
  "APROBACION_FINAL",
  "ENTREGADA",
] as const;

export type RequestStatus = (typeof REQUEST_FLOW)[number] | "CANCELADA";

export const REQUEST_LABEL: Record<string, string> = {
  SOLICITUD: "Solicitud recibida",
  COTIZADA: "Cotización enviada",
  APROBADA: "Cotización aprobada",
  PAGADA: "Pago confirmado",
  EN_DISENO: "En diseño",
  REVISION: "En revisión",
  APROBACION_FINAL: "Aprobación final",
  ENTREGADA: "Entregada",
  CANCELADA: "Cancelada",
};

/** Pedido = solicitud que ya pasó por caja. Alimenta "Mis pedidos" y el panel. */
export const ORDER_STATUSES = ["PAGADA", "EN_DISENO", "REVISION", "APROBACION_FINAL", "ENTREGADA"];

export const APPOINTMENT_STATUSES = ["PENDIENTE", "CONFIRMADA", "COMPLETADA", "CANCELADA"] as const;

export const APPOINTMENT_LABEL: Record<string, string> = {
  PENDIENTE: "Por confirmar",
  CONFIRMADA: "Confirmada",
  COMPLETADA: "Realizada",
  CANCELADA: "Cancelada",
};

export const CATEGORY_GROUPS = [
  {
    key: "EVENTOS",
    name: "Eventos",
    blurb: "Fechas que se celebran en compañía.",
  },
  {
    key: "PERSONAL",
    name: "Personal",
    blurb: "Detalles que se regalan y se guardan.",
  },
  {
    key: "PROPOSITO",
    name: "Con propósito",
    blurb: "Piezas que sostienen una historia.",
  },
] as const;

export const PURPOSES = [
  { key: "Evento", hint: "Una fecha que quiero celebrar" },
  { key: "Regalo", hint: "Algo para entregar a alguien" },
  { key: "Recuerdo", hint: "Guardar un momento que ya pasó" },
  { key: "Homenaje", hint: "Honrar a una persona" },
  { key: "Diseño personal", hint: "Algo mío, para mí" },
  { key: "Otro", hint: "Todavía lo estoy definiendo" },
];

export const EMOTIONS = [
  "Amor",
  "Gratitud",
  "Alegría",
  "Recuerdo",
  "Celebración",
  "Reconocimiento",
  "Inspiración",
];

export const FORMATS = ["Digital", "Impresa", "Ambas"];

export const MODALITIES = ["Online", "Presencial"];

export const PALETTES: Record<string, { from: string; to: string; ink: string }> = {
  rose: { from: "#FBE6EB", to: "#F0C2CE", ink: "#9E3350" },
  gold: { from: "#FBF0DF", to: "#F0D8B4", ink: "#8A6420" },
  sage: { from: "#F1E8F8", to: "#DCC9EC", ink: "#6B3F80" },
  clay: { from: "#FDEEE2", to: "#F5D6BF", ink: "#A85A3C" },
  plum: { from: "#EEE3F3", to: "#D5BEE2", ink: "#4A1E55" },
};

export function paletteOf(key: string) {
  return PALETTES[key] ?? PALETTES.plum;
}

/** Segmentación comercial: el cruce entre las dos unidades es la oportunidad. */
export type Segment = "AMBAS" | "SERVICIOS" | "DISENOS" | "SIN_ACTIVIDAD";

export const SEGMENT_LABEL: Record<Segment, string> = {
  AMBAS: "Usa ambas unidades",
  SERVICIOS: "Solo acompañamiento",
  DISENOS: "Solo diseños",
  SIN_ACTIVIDAD: "Registrado sin actividad",
};

export function segmentOf(appointments: number, requests: number): Segment {
  if (appointments > 0 && requests > 0) return "AMBAS";
  if (appointments > 0) return "SERVICIOS";
  if (requests > 0) return "DISENOS";
  return "SIN_ACTIVIDAD";
}
