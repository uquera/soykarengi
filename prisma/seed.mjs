import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

// Karen atiende desde Estados Unidos: todos los precios están en dólares.
const SERVICES = [
  {
    slug: "primera-conversacion",
    name: "Primera conversación",
    nameEn: "First conversation",
    specialty: "Orientación",
    specialtyEn: "Orientation",
    accentEmoji: "◇",
    summary:
      "Treinta minutos para conocernos y definir juntas cuál acompañamiento se adapta mejor a este momento de tu vida.",
    summaryEn:
      "Thirty minutes to meet each other and decide together which kind of support fits this moment of your life.",
    description:
      "No tienes que tener todas las respuestas para comenzar. Solo necesitas decidir que mereces avanzar, sanar y volver a ti.\nUna conversación corta para entender tu situación y orientarte hacia el formato adecuado: terapia, coaching o mentoría.",
    descriptionEn:
      "You do not need every answer to begin. You only need to decide that you deserve to move forward, to heal, and to come back to yourself.\nA short conversation to understand your situation and point you to the right format: therapy, coaching or mentoring.",
    forWho:
      "Quien nunca ha trabajado con una psicóloga o coach\nPersonas que dudan entre terapia, coaching o mentoría\nQuien quiere conocer la forma de trabajo antes de comprometerse",
    forWhoEn:
      "Anyone who has never worked with a psychologist or coach\nPeople torn between therapy, coaching or mentoring\nAnyone who wants to see how I work before committing",
    whatToExpect:
      "Una conversación breve y concreta\nUna recomendación clara sobre qué formato te sirve\nCero presión por contratar",
    whatToExpectEn:
      "A short, concrete conversation\nA clear recommendation on which format suits you\nZero pressure to book",
    modality: "Online",
    modalityEn: "Online",
    durationMin: 30,
    price: 0,
    priceNote: "Sin costo",
    priceNoteEn: "Free",
    order: 0,
  },
  {
    slug: "terapia-psicologica",
    name: "Terapia psicológica",
    nameEn: "Psychological therapy",
    specialty: "Psicología",
    specialtyEn: "Psychology",
    accentEmoji: "◍",
    summary:
      "Acompañamiento profesional y personalizado para atender situaciones que afectan tu bienestar emocional.",
    summaryEn:
      "Professional, personalized support for the situations affecting your emotional wellbeing.",
    description:
      "Un espacio seguro y cercano para comprender lo que estás viviendo, transformar patrones y avanzar hacia una vida más consciente y coherente contigo.\nSesiones presenciales y en línea: individuales, para adolescentes y de pareja.",
    descriptionEn:
      "A safe, close space to understand what you are going through, transform patterns, and move toward a life that is more conscious and more coherent with who you are.\nIn-person and online sessions: individual, for teenagers, and for couples.",
    forWho:
      "Terapia individual para adultos\nTerapia para adolescentes\nTerapia de pareja\nAnsiedad y manejo del estrés\nAutoestima y seguridad personal\nDuelo, pérdidas y procesos de cambio\nDependencia emocional y relaciones difíciles\nLímites saludables\nRegulación emocional\nCreencias limitantes y patrones repetitivos\nProcesos migratorios y adaptación",
    forWhoEn:
      "Individual therapy for adults\nTherapy for teenagers\nCouples therapy\nAnxiety and stress management\nSelf-esteem and personal confidence\nGrief, loss and processes of change\nEmotional dependence and difficult relationships\nHealthy boundaries\nEmotional regulation\nLimiting beliefs and repeating patterns\nMigration and adaptation",
    whatToExpect:
      "Un espacio confidencial, sin juicio y con estructura\nUna devolución honesta, no solo escucha pasiva\nUn foco claro para la sesión y algo concreto al cerrar\nSesiones presenciales y en línea\nRegistro de tu proceso en tu cuenta, sesión a sesión",
    whatToExpectEn:
      "A confidential space, without judgment and with structure\nHonest feedback, not just passive listening\nA clear focus for the session and something concrete at the end\nIn-person and online sessions\nA record of your process in your account, session by session",
    modality: "Ambas",
    modalityEn: "Both",
    durationMin: 60,
    price: 110,
    order: 1,
  },
  {
    slug: "programa-intervencion-emocional",
    name: "Programa de intervención emocional",
    nameEn: "Emotional intervention program",
    specialty: "Psicología",
    specialtyEn: "Psychology",
    accentEmoji: "◎",
    summary:
      "Un proceso estructurado para comprender tus emociones, reconocer su origen y desarrollar nuevas formas de pensar, sentir y actuar.",
    summaryEn:
      "A structured process to understand your emotions, recognize where they come from, and build new ways of thinking, feeling and acting.",
    description:
      "No es una sesión suelta: es un programa con etapas, pensado para sostener un cambio en el tiempo.\nSe arma sobre tu punto de partida, así que el número de encuentros y el valor se definen en la primera conversación.",
    descriptionEn:
      "It is not a one-off session: it is a program with stages, designed to sustain change over time.\nIt is built around your starting point, so the number of sessions and the fee are agreed in the first conversation.",
    forWho:
      "Quien ya identificó algo que quiere cambiar y necesita un proceso, no una sesión\nPersonas que repiten el mismo patrón en distintas relaciones\nQuien quiere trabajar la raíz y no solo el síntoma\nPersonas que prefieren un camino con etapas y seguimiento",
    forWhoEn:
      "Anyone who has already named what they want to change and needs a process, not a session\nPeople repeating the same pattern across different relationships\nAnyone who wants to work the root and not just the symptom\nPeople who prefer a path with stages and follow-up",
    whatToExpect:
      "Autoconocimiento\nGestión emocional\nCreencias limitantes\nFortalecimiento de la autoestima\nValidación interna\nLímites saludables\nRelaciones conscientes\nConstrucción de nuevos hábitos\nReconexión con tu propósito\nPlan de acción personal",
    whatToExpectEn:
      "Self-knowledge\nEmotional management\nLimiting beliefs\nStronger self-esteem\nInternal validation\nHealthy boundaries\nConscious relationships\nBuilding new habits\nReconnecting with your purpose\nA personal action plan",
    modality: "Ambas",
    modalityEn: "Both",
    durationMin: 60,
    price: 0,
    priceNote: "Valor del programa a convenir",
    priceNoteEn: "Program fee agreed case by case",
    order: 2,
  },
  {
    slug: "life-coaching",
    name: "Sesiones de Life Coaching",
    nameEn: "Life Coaching sessions",
    specialty: "Life Coaching",
    specialtyEn: "Life Coaching",
    accentEmoji: "✧",
    summary:
      "Un acompañamiento práctico para quienes desean alcanzar una meta, tomar decisiones y avanzar con mayor claridad, enfoque y confianza.",
    summaryEn:
      "Practical support for anyone who wants to reach a goal, make decisions, and move forward with more clarity, focus and confidence.",
    description:
      "Coaching orientado a metas. Definimos qué quieres lograr, qué te está frenando y qué acciones concretas tomas esta semana.\nEs un trabajo activo: sales de la sesión con un plan, no con una reflexión.",
    descriptionEn:
      "Goal-oriented coaching. We define what you want to achieve, what is holding you back, and what concrete actions you take this week.\nIt is active work: you leave with a plan, not a reflection.",
    forWho:
      "Personas con una meta clara que no logran avanzar\nQuienes están frente a una decisión importante\nPersonas que quieren construir hábitos que se sostengan\nQuien necesita una mirada externa que le devuelva foco",
    forWhoEn:
      "People with a clear goal who cannot move forward\nAnyone facing an important decision\nPeople who want to build habits that hold\nAnyone who needs an outside perspective to regain focus",
    whatToExpect:
      "Definir metas claras y alcanzables\nOrganizar tus prioridades\nSuperar bloqueos personales\nFortalecer la confianza en ti\nMejorar tu motivación y disciplina\nDesarrollar nuevos hábitos\nTomar decisiones con mayor seguridad\nDiseñar un plan de acción\nDar seguimiento a tus avances\nConstruir una vida alineada con tus valores",
    whatToExpectEn:
      "Define clear, reachable goals\nOrganize your priorities\nMove past personal blocks\nStrengthen your confidence\nImprove your motivation and discipline\nBuild new habits\nMake decisions with more certainty\nDesign an action plan\nTrack your progress\nBuild a life aligned with your values",
    modality: "Online",
    modalityEn: "Online",
    durationMin: 50,
    price: 90,
    order: 3,
  },
  {
    slug: "mentorias",
    name: "Mentorías",
    nameEn: "Mentoring",
    specialty: "Mentoría",
    specialtyEn: "Mentoring",
    accentEmoji: "❖",
    summary:
      "Un proceso de crecimiento y transformación enfocado en entrenar la mente, elevar el nivel de conciencia y desarrollar el potencial necesario para crear la vida que deseas.",
    summaryEn:
      "A growth process focused on training the mind, raising awareness, and developing the potential needed to create the life you want.",
    description:
      "Las mentorías integran las herramientas de entrenamiento mental, liderazgo y desarrollo del potencial humano que Karen incorporó a su práctica como Máster Trainer del Círculo de Realización Personal.\nEs un proceso de varios encuentros: se trabaja sobre la manera de interpretar las circunstancias, no solo sobre las circunstancias.",
    descriptionEn:
      "Mentoring draws on the mental-training, leadership and human-potential tools Karen added to her practice as a Máster Trainer of the Círculo de Realización Personal.\nIt runs across several sessions: the work is on how you interpret circumstances, not only on the circumstances.",
    forWho:
      "Quien siente que repite los mismos patrones y quiere entender por qué\nPersonas que quieren fortalecer su liderazgo personal\nQuien busca conectar con su propósito y convertirlo en acciones\nPersonas dispuestas a comprometerse con un proceso, no con una sesión",
    forWhoEn:
      "Anyone who feels stuck in the same patterns and wants to understand why\nPeople who want to strengthen their personal leadership\nAnyone looking to connect with their purpose and turn it into action\nPeople willing to commit to a process, not a single session",
    whatToExpect:
      "Reconocer los patrones que te mantienen estancada\nTransformar creencias limitantes\nFortalecer tu liderazgo personal\nDescubrir tus recursos y capacidades\nConectar con tu propósito\nCambiar tu manera de interpretar las circunstancias\nCrear una visión más clara de tu futuro\nConvertir tus objetivos en acciones concretas\nAvanzar con enfoque, responsabilidad y compromiso",
    whatToExpectEn:
      "Recognize the patterns keeping you stuck\nTransform limiting beliefs\nStrengthen your personal leadership\nDiscover your resources and capabilities\nConnect with your purpose\nChange how you interpret circumstances\nBuild a clearer vision of your future\nTurn your goals into concrete action\nMove forward with focus, responsibility and commitment",
    modality: "Ambas",
    modalityEn: "Both",
    durationMin: 75,
    price: 150,
    order: 4,
  },
];

// Servicios anteriores al documento de septiembre. No se borran porque hay
// citas que los referencian: se apagan y dejan de ofrecerse.
const SERVICIOS_RETIRADOS = ["sesion-psicologica-individual", "mentoria-mujeres-que-crean"];

const CATEGORIES = [
  // 1 · Viste tu mensaje
  { slug: "prendas-con-mensaje", name: "Franelas y prendas personalizadas", nameEn: "Personalized tees and apparel", group: "VISTE", description: "Franelas y prendas que llevan puesto lo que quieres recordar.", descriptionEn: "Tees and apparel that wear what you want to remember.", order: 1 },
  { slug: "tote-bags", name: "Tote bags y bolsos", nameEn: "Tote bags", group: "VISTE", description: "Bolsos de tela que acompañan el día y dicen algo por ti.", descriptionEn: "Cloth bags that go with you and say something for you.", order: 2 },
  { slug: "uniformes", name: "Uniformes para empresas y emprendedores", nameEn: "Uniforms for teams and founders", group: "VISTE", description: "Uniformes con identidad para equipos, locales y emprendimientos.", descriptionEn: "Uniforms with identity for teams, shops and small businesses.", order: 3 },
  { slug: "frases", name: "Frases", nameEn: "Quotes", group: "VISTE", description: "Palabras que alguien necesita leer todos los días.", descriptionEn: "Words someone needs to read every day.", order: 4 },

  // 2 · Regala con intención
  { slug: "tazas-tumblers-termos", name: "Tazas, tumblers y termos", nameEn: "Mugs, tumblers and flasks", group: "REGALA", description: "El regalo que se usa todos los días y no se guarda en un cajón.", descriptionEn: "The gift that gets used daily instead of stored in a drawer.", order: 1 },
  { slug: "regalos-personalizados", name: "Regalos y recuerdos personalizados", nameEn: "Personalized gifts and keepsakes", group: "REGALA", description: "Un regalo pensado para una persona específica.", descriptionEn: "A gift made for one specific person.", order: 2 },
  { slug: "papeleria", name: "Papelería", nameEn: "Stationery", group: "REGALA", description: "Agendas, tarjetas y piezas de uso diario.", descriptionEn: "Planners, cards and everyday pieces.", order: 3 },
  { slug: "ilustraciones", name: "Ilustraciones", nameEn: "Illustrations", group: "REGALA", description: "Retratos e ilustraciones hechas a mano.", descriptionEn: "Hand-made portraits and illustrations.", order: 4 },
  { slug: "disenos-digitales", name: "Diseños digitales", nameEn: "Digital designs", group: "REGALA", description: "Piezas listas para compartir o imprimir tú misma.", descriptionEn: "Pieces ready to share or print yourself.", order: 5 },

  // 3 · Celebra tu historia
  { slug: "cumpleanos", name: "Cumpleaños y celebraciones", nameEn: "Birthdays and celebrations", group: "CELEBRA", description: "Invitaciones, señalética y recuerdos para celebrar un año más.", descriptionEn: "Invitations, signage and keepsakes to celebrate another year.", order: 1 },
  { slug: "craft-bar", name: "Craft Bar", nameEn: "Craft Bar", group: "CELEBRA", description: "Una estación creativa para que cada invitado cree y personalice su propio recuerdo.", descriptionEn: "A creative station where every guest makes and personalizes their own keepsake.", order: 2 },
  { slug: "familias-y-mascotas", name: "Familias, mascotas y raíces", nameEn: "Families, pets and roots", group: "CELEBRA", description: "Diseños para familias, mascotas, ciudades y raíces culturales.", descriptionEn: "Designs for families, pets, cities and cultural roots.", order: 3 },
  { slug: "invitaciones", name: "Invitaciones", nameEn: "Invitations", group: "CELEBRA", description: "La primera impresión de lo que estás organizando.", descriptionEn: "The first impression of what you're organizing.", order: 4 },
  { slug: "baby-shower", name: "Baby shower", nameEn: "Baby shower", group: "CELEBRA", description: "Para la espera, la ilusión y la gente que acompaña.", descriptionEn: "For the wait, the excitement, and the people who show up.", order: 5 },
  { slug: "bautizos", name: "Bautizos", nameEn: "Christenings", group: "CELEBRA", description: "Piezas sobrias y cálidas para una primera celebración.", descriptionEn: "Warm, understated pieces for a first celebration.", order: 6 },
  { slug: "matrimonios", name: "Matrimonios", nameEn: "Weddings", group: "CELEBRA", description: "Papelería completa para el día y para lo que queda después.", descriptionEn: "Full stationery for the day and for what stays afterward.", order: 7 },
  { slug: "graduaciones", name: "Graduaciones", nameEn: "Graduations", group: "CELEBRA", description: "Cerrar una etapa merece quedar registrado.", descriptionEn: "Closing a chapter deserves to be recorded.", order: 8 },

  // 4 · Haz visible tu marca
  { slug: "emprendimientos", name: "Emprendimientos y pequeños negocios", nameEn: "Small businesses", group: "MARCA", description: "Productos personalizados para quien está construyendo algo propio.", descriptionEn: "Personalized products for anyone building something of their own.", order: 1 },
  { slug: "eventos-corporativos", name: "Eventos y equipos", nameEn: "Events and teams", group: "MARCA", description: "Piezas con identidad para empresas, eventos y equipos.", descriptionEn: "Pieces with identity for companies, events and teams.", order: 2 },
  { slug: "pedidos-al-mayor", name: "Pedidos al mayor", nameEn: "Wholesale orders", group: "MARCA", description: "Producción por volumen, con la misma pieza repetida sin perder el detalle.", descriptionEn: "Volume production, the same piece repeated without losing the detail.", order: 3 },

  // 5 · Diseños que dejan huella
  { slug: "homenajes", name: "Homenajes", nameEn: "Tributes", group: "HUELLA", description: "Para honrar a alguien que dejó una huella.", descriptionEn: "To honor someone who left a mark.", order: 1 },
  { slug: "colecciones-solidarias", name: "Colecciones solidarias", nameEn: "Charitable collections", group: "HUELLA", description: "Series creadas con una causa detrás, donde la pieza sostiene algo más grande.", descriptionEn: "Series made around a cause, where the piece supports something larger.", order: 2 },
  { slug: "recuerdos", name: "Recuerdos", nameEn: "Keepsakes", group: "HUELLA", description: "Guardar un momento antes de que se difumine.", descriptionEn: "Keeping a moment before it fades.", order: 3 },
  { slug: "mensajes-especiales", name: "Mensajes especiales", nameEn: "Special messages", group: "HUELLA", description: "Lo que cuesta decir en voz alta, escrito y diseñado.", descriptionEn: "What's hard to say out loud, written and designed.", order: 4 },
  { slug: "fechas-importantes", name: "Fechas conmemorativas", nameEn: "Commemorative dates", group: "HUELLA", description: "Aniversarios, hitos y días que cambian algo.", descriptionEn: "Anniversaries, milestones and days that change something.", order: 5 },
];

const DELIVERY_ES = "Digital / Impresa / Ambas";
const DELIVERY_EN = "Digital / Printed / Both";
const FIELDS_ES = "Nombre,Fecha,Frase,Fotografía,Colores,Formato";
const FIELDS_EN = "Name,Date,Quote,Photograph,Colors,Format";

const DESIGNS = [
  {
    slug: "un-recuerdo-que-permanece",
    intents: "homenajear,compartir",
    name: "Un recuerdo que permanece",
    nameEn: "A keepsake that stays",
    category: "homenajes",
    tagline: "Diseño personalizado para homenajes y momentos especiales.",
    taglineEn: "A personalized design for tributes and meaningful moments.",
    description:
      "Una pieza pensada para honrar a alguien. Combinamos una fotografía, una frase que la represente y una fecha que importe.\nSe entrega en formato digital de alta resolución y, si lo prefieres, impresa en papel de algodón listo para enmarcar.",
    descriptionEn:
      "A piece made to honor someone. We combine a photograph, a phrase that represents them, and a date that matters.\nDelivered as a high-resolution digital file and, if you prefer, printed on cotton paper ready to frame.",
    basePrice: 75,
    palette: "plum",
    featured: true,
    order: 2,
    customFields: FIELDS_ES,
    customFieldsEn: FIELDS_EN,
  },
  {
    slug: "la-primera-vuelta-al-sol",
    intents: "celebrar,compartir",
    name: "La primera vuelta al sol",
    nameEn: "The first trip around the sun",
    category: "cumpleanos",
    tagline: "Kit completo para un primer cumpleaños: invitación, señalética y recuerdo.",
    taglineEn: "A complete first-birthday kit: invitation, signage and keepsake.",
    description:
      "Todo lo que necesitas para el primer cumpleaños, con una misma línea gráfica.\nIncluye invitación digital, cartel de bienvenida, etiquetas y una lámina de recuerdo para el año siguiente.",
    descriptionEn:
      "Everything you need for a first birthday, in one visual language.\nIncludes a digital invitation, a welcome sign, labels and a keepsake print for the year ahead.",
    basePrice: 120,
    palette: "rose",
    featured: true,
    order: 3,
    customFields: "Nombre,Fecha,Frase,Fotografía,Colores,Formato,Cantidad",
    customFieldsEn: "Name,Date,Quote,Photograph,Colors,Format,Quantity",
  },
  {
    slug: "lo-que-nos-dijimos",
    intents: "celebrar,compartir",
    name: "Lo que nos dijimos",
    nameEn: "What we said to each other",
    category: "matrimonios",
    tagline: "Los votos, tipografiados y compuestos como una pieza para colgar.",
    taglineEn: "Your vows, typeset and composed as a piece to hang.",
    description:
      "Tus votos convertidos en una lámina. Trabajamos la composición para que el texto respire y se lea bien a distancia.\nEs el regalo de aniversario que la gente conserva.",
    descriptionEn:
      "Your vows turned into a print. We work the composition so the text breathes and reads well from across the room.\nIt's the anniversary gift people actually keep.",
    basePrice: 95,
    palette: "gold",
    featured: true,
    order: 4,
    customFields: "Nombres,Fecha,Texto completo,Colores,Formato",
    customFieldsEn: "Names,Date,Full text,Colors,Format",
  },
  {
    slug: "gracias-por-tanto",
    intents: "regalar,homenajear",
    name: "Gracias por tanto",
    nameEn: "Thank you for all of it",
    category: "mensajes-especiales",
    tagline: "Una carta de gratitud diseñada para entregarse en mano.",
    taglineEn: "A gratitude letter designed to be handed over in person.",
    description:
      "Escribes lo que quieres decir y nosotras lo componemos como una pieza que se puede guardar.\nIdeal para despedidas, jubilaciones o para esa persona a la que nunca le dijiste todo.",
    descriptionEn:
      "You write what you want to say and we compose it as a piece worth keeping.\nIdeal for farewells, retirements, or for the person you never said everything to.",
    basePrice: 60,
    palette: "clay",
    order: 4,
    customFields: "Nombre,Texto,Frase,Colores,Formato",
    customFieldsEn: "Name,Text,Quote,Colors,Format",
  },
  {
    slug: "el-dia-que-llegaste",
    intents: "celebrar,regalar",
    name: "El día que llegaste",
    nameEn: "The day you arrived",
    category: "baby-shower",
    tagline: "Lámina con los datos del nacimiento y una ilustración a medida.",
    taglineEn: "A print with the birth details and a custom illustration.",
    description:
      "Nombre, fecha, hora, peso y estatura, compuestos junto a una ilustración hecha para ese bebé.\nSe entrega lista para imprimir o impresa y enmarcada.",
    descriptionEn:
      "Name, date, time, weight and length, composed alongside an illustration made for that baby.\nDelivered print-ready, or printed and framed.",
    basePrice: 70,
    palette: "sage",
    order: 5,
    customFields: "Nombre,Fecha,Datos del nacimiento,Ilustración,Colores,Formato",
    customFieldsEn: "Name,Date,Birth details,Illustration,Colors,Format",
  },
  {
    slug: "una-frase-para-los-dias-dificiles",
    intents: "inspirar,regalar",
    name: "Una frase para los días difíciles",
    nameEn: "A phrase for the hard days",
    category: "frases",
    tagline: "Tu frase ancla, diseñada para tenerla a la vista.",
    taglineEn: "Your anchor phrase, designed to keep in sight.",
    description:
      "En consulta aparece seguido: una frase que sostiene. Esta pieza la convierte en algo que puedes mirar todos los días.\nFormato digital para fondo de pantalla y versión impresa para el escritorio.",
    descriptionEn:
      "It comes up often in session: one phrase that holds you. This piece turns it into something you can look at every day.\nDigital format for your wallpaper and a printed version for your desk.",
    basePrice: 35,
    palette: "sage",
    order: 6,
    customFields: "Frase,Colores,Formato",
    customFieldsEn: "Quote,Colors,Format",
  },
  {
    slug: "invitacion-que-cuenta-algo",
    intents: "celebrar,compartir",
    name: "Una invitación que cuenta algo",
    nameEn: "An invitation that tells something",
    category: "invitaciones",
    tagline: "Invitación digital animada con la historia detrás del evento.",
    taglineEn: "An animated digital invitation with the story behind the event.",
    description:
      "Más que la hora y el lugar. Una invitación que ya empieza a contar de qué se trata la celebración.\nSe entrega en formato para WhatsApp e Instagram Stories.",
    descriptionEn:
      "More than a time and a place. An invitation that already starts telling what the celebration is about.\nDelivered in formats for WhatsApp and Instagram Stories.",
    basePrice: 55,
    palette: "clay",
    order: 7,
    customFields: "Nombres,Fecha,Lugar,Texto,Fotografía,Colores",
    customFieldsEn: "Names,Date,Venue,Text,Photograph,Colors",
  },
  {
    slug: "el-cierre-de-una-etapa",
    intents: "celebrar,homenajear",
    name: "El cierre de una etapa",
    nameEn: "The close of a chapter",
    category: "graduaciones",
    tagline: "Pieza de graduación con foto, nombre y la frase que resume estos años.",
    taglineEn: "A graduation piece with photo, name and the phrase that sums up these years.",
    description:
      "Para titulaciones, egresos y cierres de ciclo. Componemos foto, nombre, institución y una frase elegida por ti.\nDisponible en set de varias piezas para grupos de curso.",
    descriptionEn:
      "For graduations, commencements and end-of-cycle moments. We compose photo, name, institution and a phrase you choose.\nAvailable as a multi-piece set for whole classes.",
    basePrice: 45,
    palette: "gold",
    order: 8,
    customFields: "Nombre,Institución,Fecha,Frase,Fotografía,Formato,Cantidad",
    customFieldsEn: "Name,Institution,Date,Quote,Photograph,Format,Quantity",
  },
  {
    slug: "soy-mi-proyecto-mas-importante",
    intents: "inspirar,regalar",
    name: "Soy mi proyecto más importante",
    nameEn: "I am my most important project",
    category: "prendas-con-mensaje",
    tagline: "Bolso de tela con la frase que necesitas leerte a diario.",
    taglineEn: "A canvas tote with the phrase you need to read every day.",
    description:
      "Un bolso de algodón con una frase que no es decorativa: es un recordatorio. Se estampa a color y aguanta el uso diario.\nPuedes pedirlo con esta frase o con la tuya, en la tipografía y los colores que elijas.",
    descriptionEn:
      "A cotton tote with a phrase that isn't decorative — it's a reminder. Full-color print, made for daily use.\nOrder it with this phrase or with your own, in the type and colors you choose.",
    basePrice: 28,
    palette: "rose",
    image: "/producto-tote.jpg",
    featured: true,
    order: 0,
    customFields: "Frase,Colores,Talla,Cantidad",
    customFieldsEn: "Phrase,Colors,Size,Quantity",
  },
  {
    slug: "renacer-venezuela",
    intents: "inspirar,homenajear",
    name: "Renacer · Venezuela",
    nameEn: "Renacer · Venezuela",
    category: "mensajes-especiales",
    tagline: "Polera de la serie Renacer, con caja de regalo.",
    taglineEn: "A tee from the Renacer series, gift box included.",
    description:
      "Siempre es posible renacer. Esta pieza nació para quienes dejaron un país y siguieron adelante, y se entrega en caja de regalo con el mensaje impreso en la tapa.\nDisponible para otros países y para frases propias.",
    descriptionEn:
      "It's always possible to be reborn. This piece was made for those who left a country and kept going, and it ships in a gift box with the message printed on the lid.\nAvailable for other countries and for your own phrases.",
    basePrice: 42,
    palette: "gold",
    image: "/producto-renacer.jpg",
    featured: true,
    order: 1,
    customFields: "País,Frase,Talla,Colores,Cantidad",
    customFieldsEn: "Country,Phrase,Size,Colors,Quantity",
  },
  {
    slug: "un-ano-mas-contigo",
    intents: "celebrar,regalar,compartir",
    name: "Un año más contigo",
    nameEn: "One more year with you",
    category: "fechas-importantes",
    tagline: "Pieza de aniversario con la línea de tiempo de una relación.",
    taglineEn: "An anniversary piece with the timeline of a relationship.",
    description:
      "Una línea de tiempo ilustrada con los hitos que ustedes eligen: el día que se conocieron, el viaje, la casa, el perro.\nCrece: cada año se puede actualizar con un hito nuevo.",
    descriptionEn:
      "An illustrated timeline with the milestones you choose: the day you met, the trip, the house, the dog.\nIt grows: every year it can be updated with a new milestone.",
    basePrice: 85,
    palette: "rose",
    order: 9,
    customFields: "Nombres,Hitos,Fechas,Fotografías,Colores,Formato",
    customFieldsEn: "Names,Milestones,Dates,Photographs,Colors,Format",
  },
];

const POSTS = [
  {
    slug: "no-todo-lo-que-duele-es-un-problema-que-resolver",
    title: "No todo lo que duele es un problema que resolver",
    titleEn: "Not everything that hurts is a problem to solve",
    kind: "BLOG",
    tag: "Procesos",
    tagEn: "Processes",
    readMinutes: 5,
    excerpt:
      "Hay dolores que piden solución y otros que piden ser habitados. Confundirlos es la razón por la que muchos procesos se atascan.",
    excerptEn:
      "Some pain asks to be solved, and some asks to be lived in. Confusing the two is why so many processes stall.",
    content:
      "Llega mucha gente a consulta con una pregunta bien formada: ¿qué hago con esto? La pregunta es honesta, y casi siempre es la equivocada.\n## La urgencia de arreglar\nVivimos con la idea de que sentir mal es un error de funcionamiento. Algo se rompió, hay que repararlo, y mientras tanto seguimos operando. Esa lógica funciona con una lavadora. Con un duelo, no.\nCuando alguien pierde a su madre, no hay técnica que acorte el proceso. Lo que sí existe es la diferencia entre atravesarlo acompañada o atravesarlo sola.\n## Distinguir antes de actuar\nHay dolores que son señales: te dicen que un límite se cruzó, que una decisión está pendiente, que algo en tu vida no está funcionando. Esos sí piden acción.\nY hay otros que son el precio de haber querido. Esos no piden acción, piden tiempo y compañía.\nEl primer trabajo de una terapia suele ser ese: distinguir cuál de los dos tienes enfrente. Y muchas veces, ya solo con eso, el cuerpo se afloja.\n## Lo que sí puedes hacer\nMientras el proceso ocurre, hay cosas concretas: dormir, sostener rutinas mínimas, no tomar decisiones grandes en la peor semana, hablar con alguien.\nNo son soluciones. Son maneras de no quedarte sola en el intervalo.",
    contentEn:
      "A lot of people arrive with a well-formed question: what do I do about this? The question is honest, and it's almost always the wrong one.\n## The urge to fix\nWe live with the idea that feeling bad is a malfunction. Something broke, it needs repairing, and meanwhile we keep operating. That logic works for a washing machine. Not for grief.\nWhen someone loses their mother, no technique shortens the process. What does exist is the difference between going through it accompanied or going through it alone.\n## Distinguish before acting\nSome pain is a signal: it tells you a boundary was crossed, a decision is pending, something in your life isn't working. That kind does ask for action.\nAnd some is the price of having loved. That kind doesn't ask for action — it asks for time and company.\nThe first work in therapy is usually exactly that: telling which of the two you're facing. And often, just that alone lets the body loosen.\n## What you can do\nWhile the process unfolds, there are concrete things: sleep, keep minimal routines, don't make big decisions in the worst week, talk to someone.\nThey aren't solutions. They're ways of not being alone in the interval.",
  },
  {
    slug: "por-que-un-objeto-puede-sostener-un-recuerdo",
    title: "Por qué un objeto puede sostener un recuerdo",
    titleEn: "Why an object can hold a memory",
    kind: "BLOG",
    tag: "Creación",
    tagEn: "Creation",
    readMinutes: 4,
    excerpt:
      "La memoria es más frágil de lo que creemos. Diseñar una pieza no es decorar: es darle un lugar físico a algo que no queremos perder.",
    excerptEn:
      "Memory is more fragile than we think. Designing a piece isn't decorating — it's giving a physical place to something we don't want to lose.",
    content:
      "Los recuerdos no se guardan intactos. Cada vez que recordamos algo, lo reconstruimos, y en esa reconstrucción se pierde y se agrega.\n## El anclaje\nPor eso las fotografías, las cartas y los objetos hacen algo que la memoria sola no puede: fijan un detalle. La letra exacta. La fecha exacta. La frase que dijo, no la que creemos que dijo.\nCuando alguien me pide una pieza para un homenaje, casi nunca pide algo bonito. Pide algo preciso.\n## Diseñar con propósito\nDe ahí viene el nombre. Una pieza con propósito no es una pieza decorada: es una pieza que resuelve algo. Que alguien pueda mirar a su padre todos los días sin abrir un cajón. Que un nombre no se olvide.\nEsa es la diferencia entre vender un diseño y crear significado.\n## Cómo empieza\nSiempre empieza igual: alguien cuenta una historia. Después vemos qué formato la sostiene mejor.",
    contentEn:
      "Memories aren't stored intact. Every time we remember something we rebuild it, and in that rebuilding things are lost and added.\n## The anchor\nThat's why photographs, letters and objects do something memory alone can't: they fix a detail. The exact handwriting. The exact date. The phrase they said, not the one we think they said.\nWhen someone asks me for a tribute piece, they almost never ask for something pretty. They ask for something precise.\n## Designing with purpose\nThat's where the name comes from. A piece with purpose isn't a decorated piece: it's a piece that solves something. So someone can look at their father every day without opening a drawer. So a name isn't forgotten.\nThat's the difference between selling a design and creating meaning.\n## How it starts\nIt always starts the same way: someone tells a story. Then we figure out which format holds it best.",
  },
  {
    slug: "guia-antes-de-tu-primera-sesion",
    title: "Guía: cómo prepararte para tu primera sesión",
    titleEn: "Guide: how to prepare for your first session",
    kind: "RECURSO",
    tag: "Guía",
    tagEn: "Guide",
    readMinutes: 3,
    excerpt: "Cuatro preguntas para responder antes de tu primera sesión. Con esto, la hora rinde el doble.",
    excerptEn: "Four questions to answer before your first session. With these, the hour goes twice as far.",
    content:
      "La primera sesión suele irse en ponernos al día. Estas preguntas evitan eso. No necesitas respuestas perfectas; escribe lo que aparezca.\n## 1. ¿Qué te trajo hoy y no hace un año?\nAlgo cambió. Puede ser un evento concreto o un cansancio que se acumuló. Identificarlo orienta todo lo demás.\n## 2. ¿Qué has intentado ya?\nLo que ya probaste importa: dice qué recursos tienes y qué caminos ya descartaste.\n## 3. ¿Cómo se vería que esto mejore?\nNo el ideal. Lo mínimo. ¿Qué tendría que pasar para que digas que valió la pena?\n## 4. ¿Qué te da miedo de este proceso?\nCasi todo el mundo tiene una respuesta a esta pregunta y casi nadie la dice. Decirla al principio ahorra meses.",
    contentEn:
      "The first session usually goes to catching up. These questions avoid that. You don't need perfect answers; write whatever shows up.\n## 1. What brought you today and not a year ago?\nSomething changed. It could be a concrete event or an exhaustion that piled up. Naming it orients everything else.\n## 2. What have you already tried?\nWhat you've already tried matters: it says what resources you have and which roads you've ruled out.\n## 3. What would 'better' actually look like?\nNot the ideal. The minimum. What would have to happen for you to say it was worth it?\n## 4. What scares you about this process?\nAlmost everyone has an answer to this and almost nobody says it. Saying it at the start saves months.",
  },
  {
    slug: "ejercicio-de-cierre-de-ciclo",
    title: "Ejercicio: cerrar un ciclo en tres cartas",
    titleEn: "Exercise: closing a chapter in three letters",
    kind: "RECURSO",
    tag: "Ejercicio",
    tagEn: "Exercise",
    readMinutes: 4,
    excerpt:
      "Un ejercicio escrito para cerrar una etapa: una relación, un trabajo, una ciudad. Toma cuarenta minutos.",
    excerptEn:
      "A writing exercise to close a chapter: a relationship, a job, a city. It takes forty minutes.",
    content:
      "Necesitas papel, lápiz y un rato sin interrupciones. No lo hagas en el teléfono.\n## Carta uno: lo que me llevo\nEscribe todo lo que esa etapa te dio. Sin matices ni peros. Solo lo bueno. Cuesta más de lo que parece.\n## Carta dos: lo que dejo\nAhora lo que no quieres seguir cargando. Lo que dolió, lo que no funcionó, lo que aprendiste a la mala.\n## Carta tres: lo que sigue\nEscríbete a ti misma dentro de un año. Cuéntale dónde estás parada hoy y qué esperas de ella.\n## Después\nGuarda la primera. Con la segunda haz lo que necesites: romperla, quemarla, archivarla. La tercera, ábrela en un año.\nSi el ejercicio destapa más de lo que puedes sostener sola, eso también es información útil. Conversémoslo.",
    contentEn:
      "You need paper, a pen and some uninterrupted time. Don't do this on your phone.\n## Letter one: what I take with me\nWrite everything that chapter gave you. No caveats, no buts. Only the good. It's harder than it sounds.\n## Letter two: what I leave behind\nNow what you don't want to keep carrying. What hurt, what didn't work, what you learned the hard way.\n## Letter three: what comes next\nWrite to yourself a year from now. Tell her where you're standing today and what you hope for her.\n## Afterward\nKeep the first one. Do whatever you need with the second: tear it, burn it, file it. Open the third in a year.\nIf the exercise uncovers more than you can hold alone, that's useful information too. Let's talk about it.",
  },
];

async function main() {
  console.log("Sembrando SoyKarengi…");

  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "karen@soykarengi.com";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "karengi2026";

  await db.user.upsert({
    where: { email: adminEmail },
    update: { role: "ADMIN" },
    create: {
      email: adminEmail,
      name: "Karen Ramos",
      role: "ADMIN",
      passwordHash: await bcrypt.hash(adminPassword, 10),
    },
  });

  const demo = await db.user.upsert({
    where: { email: "demo@soykarengi.com" },
    update: {},
    create: {
      email: "demo@soykarengi.com",
      name: "Valentina Soto",
      phone: "+1 (305) 555-0148",
      city: "Miami, FL",
      passwordHash: await bcrypt.hash("demo1234", 10),
    },
  });

  for (const s of SERVICES) {
    await db.service.upsert({ where: { slug: s.slug }, update: s, create: s });
  }

  for (const slug of SERVICIOS_RETIRADOS) {
    await db.service.updateMany({ where: { slug }, data: { active: false } });
  }

  for (const c of CATEGORIES) {
    await db.designCategory.upsert({ where: { slug: c.slug }, update: c, create: c });
  }

  for (const d of DESIGNS) {
    const category = await db.designCategory.findUnique({ where: { slug: d.category } });
    if (!category) continue;
    const { category: _drop, ...rest } = d;
    const data = {
      ...rest,
      categoryId: category.id,
      delivery: DELIVERY_ES,
      deliveryEn: DELIVERY_EN,
    };
    await db.design.upsert({ where: { slug: d.slug }, update: data, create: data });
  }

  for (const p of POSTS) {
    await db.post.upsert({ where: { slug: p.slug }, update: p, create: p });
  }

  // Un poco de actividad, para que el panel no arranque en blanco.
  const existingActivity = await db.designRequest.count();
  if (existingActivity === 0) {
    const homenaje = await db.design.findUnique({ where: { slug: "un-recuerdo-que-permanece" } });
    const primera = await db.service.findUnique({ where: { slug: "primera-conversacion" } });

    if (homenaje) {
      await db.designRequest.create({
        data: {
          code: "DIS-DEMO1",
          userId: demo.id,
          designId: homenaje.id,
          purpose: "Homenaje",
          recipient: "Mi abuela Rosa, que cumpliría 90 este año",
          emotions: "Amor,Gratitud,Recuerdo",
          format: "Ambas",
          quantity: 3,
          details: "Me gustaría que se usaran tonos tierra. Ella siempre usaba café y beige.",
          idea: "Tengo una foto de ella en la cocina de la casa de Maracaibo, del 92. Quiero algo que la muestre así, con su frase: «primero se come, después se conversa». Es para mis dos hermanas y para mí.",
          status: "COTIZADA",
          quoteAmount: 210,
          quoteNotes:
            "Incluye 3 piezas impresas en papel de algodón de 300g más los archivos digitales en alta resolución. Entrega en 12 días hábiles.",
          quotedAt: new Date(),
        },
      });
    }

    if (primera) {
      const startsAt = new Date();
      startsAt.setDate(startsAt.getDate() + 3);
      startsAt.setHours(11, 0, 0, 0);

      await db.appointment.create({
        data: {
          code: "CITA-DEMO1",
          userId: demo.id,
          serviceId: primera.id,
          startsAt,
          modality: "Online",
          status: "PENDIENTE",
          firstTime: true,
          reason:
            "Vengo de un año complicado y no sé bien por dónde empezar. Quiero entender si lo que necesito es terapia o coaching.",
        },
      });
    }
  }

  // Unos movimientos de muestra. Se reparten entre este mes y los dos anteriores
  // para que cualquier rango del panel tenga algo que mostrar el primer día.
  if ((await db.movement.count()) === 0) {
    const hoy = new Date();

    // Un día de este mes, sin pasarse de hoy.
    const esteMes = (dia) => {
      const d = new Date(hoy.getFullYear(), hoy.getMonth(), Math.min(dia, hoy.getDate()), 12, 0, 0, 0);
      return d;
    };
    const mesesAtras = (meses, dia) =>
      new Date(hoy.getFullYear(), hoy.getMonth() - meses, dia, 12, 0, 0, 0);

    await db.movement.createMany({
      data: [
        // Este mes
        { kind: "EGRESO", concept: "Hosting y dominio de la plataforma", category: "PLATAFORMAS", amount: 34, method: "TARJETA", date: esteMes(1) },
        { kind: "EGRESO", concept: "Cajas de regalo y empaque", category: "ENVIOS", amount: 95.5, method: "TARJETA", date: esteMes(2) },
        { kind: "INGRESO", concept: "Taller de bienestar para equipo corporativo", category: "COLABORACION", amount: 450, method: "TRANSFERENCIA", date: esteMes(3) },

        // Mes anterior
        { kind: "EGRESO", concept: "Tela y bastidores para la serie de bolsos", category: "MATERIALES", amount: 180, method: "TRANSFERENCIA", date: mesesAtras(1, 6) },
        { kind: "EGRESO", concept: "Estampado del lote de poleras Renacer", category: "PRODUCCION", amount: 240, method: "TRANSFERENCIA", date: mesesAtras(1, 12) },
        { kind: "INGRESO", concept: "Venta de bolsos en feria de emprendedoras", category: "VENTA_DIRECTA", amount: 320, method: "EFECTIVO", date: mesesAtras(1, 19), notes: "12 piezas" },

        // Dos meses atrás
        { kind: "EGRESO", concept: "Campaña de Instagram", category: "MARKETING", amount: 120, method: "TARJETA", date: mesesAtras(2, 9) },
        { kind: "EGRESO", concept: "Supervisión clínica", category: "FORMACION", amount: 150, method: "TRANSFERENCIA", date: mesesAtras(2, 22) },
      ],
    });
  }

  const counts = await Promise.all([
    db.service.count(),
    db.designCategory.count(),
    db.design.count(),
    db.post.count(),
  ]);
  console.log(
    `Listo: ${counts[0]} servicios, ${counts[1]} categorías, ${counts[2]} diseños, ${counts[3]} entradas.`,
  );
  console.log(`Admin: ${adminEmail}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
