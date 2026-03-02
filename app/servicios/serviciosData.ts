export type Servicio = {
  slug: string;
  titulo: string;
  icono: string;
  gradiente: string;
  descripcionCorta: string;
  descripcionLarga: string;
  items: string[];
  badge?: string;
};

export const servicios: Servicio[] = [
  {
    slug: "montaje-instalaciones",
    titulo: "Montaje y Desmontaje",
    icono: "🔧",
    gradiente: "from-blue-950 to-blue-800",
    descripcionCorta:
      "Experiencia y calidad en obras de instalación y desmontaje con personal altamente calificado y certificado.",
    descripcionLarga:
      "En ELEMEC contamos con la experiencia, respaldo y calidad en obras de instalación y desmontaje. Personal altamente calificado, para entregar un servicio que cumple con los más altos estándares de seguridad. Avalados por nuestras certificaciones y experiencia en las principales obras de la Región de Magallanes.",
    items: [
      "Redes de Gas Natural y GLP.",
      "Sistemas de Calefacción Central.",
      "Instalaciones Eléctricas y de Potencia.",
      "Generadores de Vapor y sistemas asociados.",
      "Redes de Utilidades Industriales.",
      "Estructuras y soportería especial.",
    ],
  },
  {
    slug: "mantencion-equipos",
    titulo: "Mantención de Equipos",
    icono: "🏭",
    gradiente: "from-orange-950 to-orange-800",
    descripcionCorta:
      "Mantención en faena o en dependencias propias, con protocolos de calidad total en calderas y sistemas industriales.",
    descripcionLarga:
      "Ya sea en nuestras dependencias o en faena, ELEMEC entrega experiencia y protocolos de trabajo que garantizan calidad total en el proceso y un equipo humano altamente calificado, para efectuar un servicio de mantenimiento altamente efectivo en calderas, sistemas térmicos e instalaciones industriales.",
    items: [
      "Mantención preventiva y correctiva de calderas.",
      "Revisión y calibración de quemadores.",
      "Mantención de sistemas de calefacción central.",
      "Inspección de redes de gas y detección de fugas.",
      "Mantención de instalaciones eléctricas industriales.",
      "Registro técnico e informes de cada intervención.",
    ],
  },
  {
    slug: "ingenieria-diseno",
    titulo: "Ingeniería y Diseño",
    icono: "📐",
    gradiente: "from-slate-800 to-slate-600",
    descripcionCorta:
      "Departamento técnico con experiencia en proyectos de Magallanes: diseño, cálculo, tramitaciones y eficiencia.",
    descripcionLarga:
      "Nuestro departamento técnico cuenta con el conocimiento, experiencia y respaldo de innumerables proyectos ejecutados en la Región de Magallanes y Tierra del Fuego. Modulación de equipos en obra, diseño de instalaciones, cálculo estructural, tramitaciones normativas y desarrollo de procesos enfocados en eficiencia y seguridad.",
    items: [
      "Diseño de instalaciones de gas, vapor y electricidad.",
      "Memorias de cálculo y planos de ingeniería.",
      "Tramitaciones SEC y aprobaciones normativas.",
      "Modulación y layout de equipos en obra.",
      "Ingeniería de detalle para proyectos industriales.",
      "Coordinación con arquitectura y obra civil.",
    ],
  },
  {
    slug: "asesoria-tecnica",
    titulo: "Asesoría Técnica",
    icono: "💡",
    gradiente: "from-yellow-950 to-yellow-700",
    descripcionCorta:
      "Personal técnico en terreno para atender requerimientos de cualquier tipo de obra en la zona austral.",
    descripcionLarga:
      "A través de nuestro departamento técnico, contamos con personal altamente capacitado y dispuesto para ayudarlo en la búsqueda de las mejores soluciones a sus requerimientos. Contamos con personal técnico en terreno para atender de manera efectiva los requerimientos de cualquier tipo de obra en la zona austral.",
    items: [
      "Diagnóstico técnico de instalaciones existentes.",
      "Recomendaciones para mejora de eficiencia energética.",
      "Asesoría en cumplimiento normativo.",
      "Evaluación de equipos y vida útil.",
      "Apoyo técnico para licitaciones y proyectos.",
      "Visitas a terreno sin costo inicial.",
    ],
  },
  {
    slug: "logistica-coordinacion",
    titulo: "Logística y Coordinación",
    icono: "🗺️",
    gradiente: "from-teal-950 to-teal-700",
    descripcionCorta:
      "Cobertura logística en toda la Región de Magallanes: Punta Arenas, Porvenir, Isla Dawson y más.",
    descripcionLarga:
      "ELEMEC ofrece capacidad logística orientada a atender los proyectos de nuestros clientes de la manera más efectiva en la Región de Magallanes y Tierra del Fuego, con cobertura en Punta Arenas, Porvenir, Isla Dawson, Cerro Sombrero y otras zonas de la región.",
    items: [
      "Coordinación de equipos y materiales en terreno.",
      "Cobertura en toda la Región de Magallanes.",
      "Logística para faenas en zonas remotas.",
      "Gestión de proveedores y subcontratos.",
      "Planificación de accesos y permisos.",
      "Respuesta a emergencias en menos de 24 horas.",
    ],
  },
  {
    slug: "aislacion-termica",
    titulo: "Aislación Térmica",
    icono: "🧱",
    gradiente: "from-indigo-950 to-indigo-700",
    descripcionCorta:
      "Línea en desarrollo para eficiencia energética y confort térmico en climas extremos del sur de Chile.",
    descripcionLarga:
      "Línea en desarrollo orientada a eficiencia energética y confort térmico para climas extremos. Desarrollo de capacidad productiva para aislación térmica, incluyendo poliuretano expandido como complemento técnico para la zona austral de Chile.",
    items: [
      "Aislación de tuberías con poliuretano y lana mineral.",
      "Calorifugado de equipos y calderas.",
      "Cubiertas y terminaciones en aluminio.",
      "Cálculo de espesores y pérdidas térmicas.",
      "Sistemas para cámaras frías y recintos criogénicos.",
    ],
    badge: "En desarrollo",
  },
  {
    slug: "control-de-costos",
    titulo: "Control de Costos",
    icono: "📋",
    gradiente: "from-green-950 to-green-700",
    descripcionCorta:
      "Gestión integral de proyecto: planificación, avance y control de costos desde inicio hasta cierre.",
    descripcionLarga:
      "Gestión integral de ejecución: planificación, coordinación de obra, control de avance y control de costos desde inicio hasta cierre de proyecto. Aseguramos el cumplimiento de plazos y presupuesto con menor tasa de desviaciones.",
    items: [
      "Planificación con carta Gantt y línea base.",
      "Control de avance semanal con indicadores (KPI).",
      "Gestión de estados de pago y contratos.",
      "Informes de gestión para mandantes.",
      "Cierre técnico y documental de obras.",
      "Coordinación con proveedores y subcontratos.",
    ],
  },
];
