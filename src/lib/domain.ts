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
/**
 * Tracker por color. Cada estado del pedido tiene un color propio para que el
 * avance se lea de un vistazo, sin tener que leer las etiquetas una por una.
 * Se usan en línea (no como clases) porque son datos, no diseño de plantilla.
 */
export const REQUEST_COLOR: Record<string, string> = {
  SOLICITUD: "#D8A129", // amarillo · llegó
  COTIZADA: "#3B7EA1", // azul · hay una cifra sobre la mesa
  APROBADA: "#4C9A8A", // verde azulado · el cliente dijo que sí
  PAGADA: "#6B4A68", // ciruela · entró el pago
  EN_DISENO: "#C97B3A", // naranja · Karen está trabajando
  REVISION: "#D8A129", // amarillo · la pelota está en el cliente
  APROBACION_FINAL: "#8BB08E", // verde · aprobado
  ENTREGADA: "#494C31", // verde oliva · cerrado
  CANCELADA: "#A0938A",
};

export function requestProgress(status: string) {
  const i = REQUEST_FLOW.indexOf(status as (typeof REQUEST_FLOW)[number]);
  if (i < 0) return 0;
  return Math.round(((i + 1) / REQUEST_FLOW.length) * 100);
}

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

// Las claves son datos guardados en cada diseño: se recolorean, no se renombran.
export const PALETTES: Record<string, { from: string; to: string; ink: string }> = {
  rose: { from: "#FAEAEE", to: "#EFC9D2", ink: "#9C3B52" },
  gold: { from: "#F7EEE0", to: "#E4CFAF", ink: "#7B5622" },
  sage: { from: "#EDF3ED", to: "#C6DBC7", ink: "#494C31" },
  clay: { from: "#F7EDE4", to: "#E3CBB2", ink: "#8A5A3A" },
  plum: { from: "#F2EAF1", to: "#D8C4D6", ink: "#6B4A68" },
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


/**
 * Filtro emocional de la vitrina. El cliente no busca "PERSONAL": busca regalar.
 * Cada intención tiene URL propia (?buscas=) y apunta a un grupo de categorías;
 * los diseños declaran a qué intenciones responden en su campo `intents`.
 */
export const INTENTS = [
  { key: "celebrar", label: "Celebrar", group: "EVENTOS" },
  { key: "regalar", label: "Regalar", group: "PERSONAL" },
  { key: "homenajear", label: "Homenajear", group: "PROPOSITO" },
  { key: "inspirar", label: "Inspirar", group: "PERSONAL" },
  { key: "compartir", label: "Compartir un momento", group: "PROPOSITO" },
] as const;

export type IntentKey = (typeof INTENTS)[number]["key"];

export function intentOf(key?: string) {
  return INTENTS.find((i) => i.key === key);
}

/** Un diseño responde a una intención si la declara, o si su grupo coincide. */
export function matchesIntent(
  design: { intents: string | null; category?: { group: string } | null },
  key: string,
) {
  const declared = (design.intents ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (declared.length > 0) return declared.includes(key);
  return design.category?.group === intentOf(key)?.group;
}

/**
 * Antes de reservar: seis maneras de nombrar lo que a alguien le pasa, cada una
 * apuntando a la especialidad que mejor calza. Cuando no hay certeza, la
 * primera conversación de orientación es siempre la respuesta correcta.
 */
export const NEEDS = [
  { key: "mejor", specialty: "Psicología" },
  { key: "claridad", specialty: "Life Coaching" },
  { key: "proyecto", specialty: "Mentoría" },
  { key: "cambio", specialty: "Psicología" },
  { key: "acompanamiento", specialty: "Orientación" },
  { key: "insegura", specialty: "Orientación" },
] as const;

export type NeedKey = (typeof NEEDS)[number]["key"];

/**
 * Páginas propias por especialidad. Existen por SEO: cada una responde a una
 * búsqueda real ("psicóloga online en español") con su URL y su contenido.
 */
export const SPECIALTY_PAGES = [
  { slug: "psicologia", specialty: "Psicología" },
  { slug: "life-coaching", specialty: "Life Coaching" },
  { slug: "mentoria", specialty: "Mentoría" },
  { slug: "orientacion", specialty: "Orientación" },
] as const;

export type SpecialtySlug = (typeof SPECIALTY_PAGES)[number]["slug"];

export function specialtyPageOf(slug: string) {
  return SPECIALTY_PAGES.find((p) => p.slug === slug);
}
