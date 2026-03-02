export type Producto = {
  slug: string;
  nombre: string;
  icono: string;
  gradiente: string;
  descripcionCorta: string;
  descripcionLarga: string;
  caracteristicas: string[];
  badge?: string;
};

export const productos: Producto[] = [
  {
    slug: "redes-de-gas",
    nombre: "Redes de Gas",
    icono: "🔧",
    gradiente: "from-blue-950 to-blue-800",
    descripcionCorta:
      "Diseño, montaje y mantención de redes de gas natural y GLP para instalaciones industriales, hospitales y edificios.",
    descripcionLarga:
      "ELEMEC ejecuta proyectos completos de redes de gas natural y GLP, desde el diseño de ingeniería hasta la puesta en marcha, incluyendo tramitaciones ante la Superintendencia de Electricidad y Combustibles (SEC). Nuestro equipo técnico garantiza cumplimiento normativo y seguridad operacional en cada etapa.",
    caracteristicas: [
      "Diseño de ingeniería y memorias de cálculo",
      "Montaje de tuberías y accesorios en acero y cobre",
      "Tramitaciones SEC y revisión técnica",
      "Pruebas de hermeticidad y puesta en marcha",
      "Mantenciones preventivas y correctivas",
    ],
  },
  {
    slug: "sistemas-de-calefaccion",
    nombre: "Sistemas de Calefacción",
    icono: "🔥",
    gradiente: "from-orange-950 to-orange-800",
    descripcionCorta:
      "Instalación y mantención de sistemas de calefacción central para recintos de alta exigencia en clima austral.",
    descripcionLarga:
      "Diseñamos e instalamos sistemas de calefacción central adaptados a las condiciones climáticas extremas de la Región de Magallanes. Trabajamos con calderas a gas, agua caliente y radiadores, cumpliendo los más altos estándares de eficiencia energética y seguridad.",
    caracteristicas: [
      "Instalación de calderas y caldines",
      "Redes de distribución de agua caliente",
      "Radiadores, fan-coils y sistemas de control",
      "Balanceo y optimización de circuitos",
      "Mantención de temporada y emergencias",
    ],
  },
  {
    slug: "instalaciones-electricas",
    nombre: "Instalaciones Eléctricas",
    icono: "⚡",
    gradiente: "from-yellow-950 to-yellow-700",
    descripcionCorta:
      "Infraestructura eléctrica de potencia, tableros, variadores de frecuencia y bancos de condensadores.",
    descripcionLarga:
      "Ejecutamos proyectos eléctricos industriales de mediana y alta tensión, desde tableros de distribución hasta infraestructura completa de planta. Nuestro equipo está habilitado por la SEC para la ejecución de instalaciones en baja y media tensión.",
    caracteristicas: [
      "Tableros eléctricos y centros de control de motores (CCM)",
      "Variadores de frecuencia e instrumentación",
      "Bancos de condensadores y corrección de factor de potencia",
      "Canalización, bandejas y cableado estructurado",
      "Tramitaciones SEC y certificaciones",
    ],
  },
  {
    slug: "generadores-de-vapor",
    nombre: "Generadores de Vapor",
    icono: "💨",
    gradiente: "from-slate-800 to-slate-600",
    descripcionCorta:
      "Puesta en marcha e instalación de generadores de vapor para procesos industriales continuos.",
    descripcionLarga:
      "Instalamos y ponemos en marcha generadores de vapor industriales para procesos de esterilización, cocción, lavandería industrial y otros usos continuos. Realizamos la ingeniería del sistema, incluyendo redes de vapor, condensado y controles automáticos.",
    caracteristicas: [
      "Instalación de generadores a gas y combustible líquido",
      "Redes de distribución de vapor y retorno de condensado",
      "Instrumentación y automatización",
      "Tramitaciones ante organismos fiscalizadores",
      "Contratos de mantención",
    ],
  },
  {
    slug: "calderas",
    nombre: "Calderas",
    icono: "🏭",
    gradiente: "from-gray-800 to-gray-600",
    descripcionCorta:
      "Mantención preventiva y correctiva de calderas en hospitales, plantas de proceso y recintos críticos.",
    descripcionLarga:
      "La mantención de calderas es crítica para la continuidad operacional de hospitales, plantas industriales y edificios de uso intensivo. ELEMEC entrega servicios de revisión, limpieza, calibración y reparación de calderas, asegurando eficiencia y cumplimiento de normativas de seguridad.",
    caracteristicas: [
      "Mantención preventiva programada",
      "Limpieza y decapado de calderas",
      "Ajuste y calibración de quemadores",
      "Revisión de válvulas de seguridad y controles",
      "Informes técnicos y registro de intervenciones",
    ],
  },
  {
    slug: "aislacion-termica",
    nombre: "Aislación Térmica",
    icono: "🧱",
    gradiente: "from-teal-950 to-teal-700",
    descripcionCorta:
      "Soluciones de aislación térmica con poliuretano expandido para eficiencia energética en climas extremos.",
    descripcionLarga:
      "El clima de Magallanes y Tierra del Fuego exige soluciones de aislación de alta performance. ELEMEC ofrece el diseño e instalación de sistemas de aislación térmica para tuberías, equipos y edificaciones, utilizando materiales certificados que maximizan la eficiencia energética y reducen costos operacionales.",
    caracteristicas: [
      "Aislación de tuberías con poliuretano y lana mineral",
      "Calorifugado de equipos industriales",
      "Sistemas de aislación para cámaras frías",
      "Cubiertas y terminaciones en aluminio",
      "Cálculo de pérdidas térmicas y diseño de espesores",
    ],
    badge: "En desarrollo",
  },
  {
    slug: "utilidades-industriales",
    nombre: "Utilidades Industriales",
    icono: "🔩",
    gradiente: "from-indigo-950 to-indigo-700",
    descripcionCorta:
      "Redes y sistemas de utilidades en plantas industriales: agua, aire comprimido, vapor y combustibles.",
    descripcionLarga:
      "Proyectamos e instalamos redes de utilidades industriales completas: agua de proceso y potable, aire comprimido, aceite, combustibles y otros fluidos. Trabajamos con distintos materiales y presiones según las necesidades del proceso.",
    caracteristicas: [
      "Redes de agua potable e industrial",
      "Distribución de aire comprimido",
      "Tuberías de combustible y lubricantes",
      "Soportería y estructuras para tuberías",
      "Coordinación y gestión de proyecto en terreno",
    ],
  },
  {
    slug: "control-de-costos",
    nombre: "Control de Costos y Obra",
    icono: "📋",
    gradiente: "from-green-950 to-green-700",
    descripcionCorta:
      "Puesta en obra, planificación y control de avance para asegurar cumplimiento de plazos y presupuesto.",
    descripcionLarga:
      "Contamos con profesionales de ingeniería y administración de proyectos dedicados al control de costos y plazos en terreno. Aplicamos metodologías de gestión que aseguran trazabilidad y transparencia en cada fase del proyecto.",
    caracteristicas: [
      "Planificación de obra con carta Gantt",
      "Control de avance semanal con indicadores",
      "Gestión de subcontratos y proveedores",
      "Informes de gestión y estados de pago",
      "Cierre técnico y documental de proyectos",
    ],
  },
  {
    slug: "tramitaciones-normativa",
    nombre: "Tramitaciones y Normativa",
    icono: "📄",
    gradiente: "from-purple-950 to-purple-700",
    descripcionCorta:
      "Gestión de tramitaciones ante entidades reguladoras y cumplimiento normativo en instalaciones de gas y electricidad.",
    descripcionLarga:
      "ELEMEC gestiona todos los procesos de tramitación y aprobación ante la SEC, ENAP, municipalidades y otros organismos públicos. Contamos con instaladores y revisores habilitados para avalar proyectos de gas, electricidad y calderas.",
    caracteristicas: [
      "Tramitaciones SEC para gas y electricidad",
      "Proyectos y memorias técnicas para aprobación",
      "Inspecciones y recepciones de obra",
      "Asesoría en normativa DS66 y NSEG",
      "Gestión de permisos de edificación y sanitarios",
    ],
  },
  {
    slug: "accesorios-complementos",
    nombre: "Accesorios y Complementos",
    icono: "🔑",
    gradiente: "from-rose-950 to-rose-700",
    descripcionCorta:
      "Provisión de accesorios, materiales y equipamiento complementario para obras de ingeniería en terreno.",
    descripcionLarga:
      "Además de la ejecución de proyectos, ELEMEC provee accesorios y materiales especializados para obras de ingeniería. Contamos con stock de accesorios de gas, electricidad y sistemas térmicos para apoyo inmediato en terreno.",
    caracteristicas: [
      "Accesorios y válvulas para gas y vapor",
      "Materiales eléctricos certificados",
      "Instrumentación y elementos de control",
      "Equipamiento de seguridad para obra",
      "Entrega en terreno en Punta Arenas",
    ],
  },
];
