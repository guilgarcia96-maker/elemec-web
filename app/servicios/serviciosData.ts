export type Servicio = {
  slug: string;
  titulo: string;
  icono: string;
  gradiente: string;
  imagen?: string;
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
    gradiente: "from-orange-500 to-orange-700",
    descripcionCorta:
      "Experiencia y calidad en obras de instalación y desmontaje con personal altamente calificado y certificado.",
    descripcionLarga:
      "En ELEMEC contamos con la experiencia, respaldo y calidad en obras de instalación y desmontaje. Personal altamente calificado, para entregar un servicio que cumple con los más altos estándares de seguridad. Avalados por nuestras certificaciones y experiencia en las principales obras de la Región de Magallanes.",
    items: [
      "Montaje sala de calderas.",
      "Montaje y desmontaje de equipos industriales.",
      "Montaje matriz de gas y agua.",
      "Montaje sala de tableros.",
      "Montaje generadores eléctricos y de Potencia.",
      "Montaje generadores de vapor y sistemas asociados.",
      "Redes de Utilidades Industriales.",
      "Estructuras y soportería especial.",
    ],
  },
  {
    slug: "mantencion-equipos",
    titulo: "Mantención de Equipos y Redes",
    icono: "🏭",
    gradiente: "from-amber-500 to-orange-700",
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
    gradiente: "from-gray-700 to-gray-900",
    descripcionCorta:
      "Departamento técnico con experiencia en proyectos de Magallanes: diseño, cálculo, tramitaciones y eficiencia.",
    descripcionLarga:
      "Nuestro departamento técnico cuenta con el conocimiento, experiencia y respaldo de innumerables proyectos ejecutados en la Región de Magallanes y Tierra del Fuego. Modulación de equipos en obra, diseño de instalaciones, cálculo estructural, tramitaciones normativas y desarrollo de procesos enfocados en eficiencia y seguridad.",
    items: [
      "Diseño de instalaciones de gas, agua, vapor y electricidad.",
      "Memorias de cálculo y planos de ingeniería.",
      "Tramitaciones SEC y aprobaciones normativas.",
      "Modulación y layout de equipos en obra.",
      "Ingeniería de detalle para proyectos industriales.",
      "Cierre técnico y documental de obras.",
    ],
  },
  {
    slug: "asesoria-tecnica",
    titulo: "Asesoría Técnica",
    icono: "💡",
    gradiente: "from-yellow-400 to-orange-500",
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
    slug: "aislacion-termica",
    titulo: "Aislación Térmica",
    icono: "🧱",
    gradiente: "from-stone-500 to-stone-700",
    imagen: "/portada-aislacion-termica.jpg",
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
    slug: "servicios-basicos-industriales",
    titulo: "Servicios Básicos Industriales",
    icono: "🏗️",
    gradiente: "from-cyan-900 to-cyan-700",
    descripcionCorta:
      "Provisión y mantención de servicios básicos para instalaciones industriales: agua, gas, electricidad y calefacción integrados en un solo proveedor.",
    descripcionLarga:
      "ELEMEC integra en un solo contrato la provisión, instalación y mantención de los servicios básicos que toda instalación industrial requiere para operar con continuidad y seguridad. Con 18 años de trayectoria en la Región de Magallanes, nuestro equipo técnico garantiza la ejecución coordinada de redes de agua, gas, electricidad y calefacción, eliminando la necesidad de múltiples proveedores y reduciendo tiempos y costos operacionales. Trabajamos con clientes industriales, hospitalarios, educacionales y de construcción en toda la zona austral.",
    items: [
      "Redes de agua potable e industrial para plantas y recintos.",
      "Distribución de gas natural y GLP con tramitaciones SEC incluidas.",
      "Instalaciones eléctricas de baja tensión y tableros de distribución.",
      "Sistemas de calefacción central para edificios e instalaciones industriales.",
      "Gestión unificada de todos los servicios básicos bajo un solo contrato.",
      "Mantención preventiva y correctiva integrada con respuesta en menos de 24 horas.",
    ],
  },
];

