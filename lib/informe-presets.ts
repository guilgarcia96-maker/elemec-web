/**
 * Presets de secciones para informes según tipo de servicio.
 * Cada preset define las secciones que se crean automáticamente al seleccionar el tipo.
 */

export interface SeccionPreset {
  titulo: string;
  tipo: 'texto' | 'fotos' | 'conclusion';
  placeholder: string;
}

export interface PresetConfig {
  nombre: string;
  icono: string;
  descripcion: string;
  /** Descripción ampliada para la tarjeta de selección */
  descripcionLarga: string;
  /** Número estimado de secciones de texto */
  seccionesCount: number;
  secciones: SeccionPreset[];
}

export const PRESETS: Record<string, PresetConfig> = {
  montaje: {
    nombre: 'Montaje e Instalaciones',
    icono: 'wrench',
    descripcion: 'Montaje de equipos e instalaciones industriales',
    descripcionLarga: 'Informes de montaje de equipos, estructuras metálicas, cañerías e instalaciones industriales. Incluye control dimensional y verificaciones.',
    seccionesCount: 7,
    secciones: [
      {
        titulo: 'Antecedentes',
        tipo: 'texto',
        placeholder: 'Describe el contexto del proyecto: cliente, planta, equipo a montar, normativa aplicable, documentos de referencia (planos, especificaciones técnicas, procedimientos)...',
      },
      {
        titulo: 'Alcance de los Trabajos',
        tipo: 'texto',
        placeholder: 'Detalla el alcance específico de los trabajos: qué equipos se instalan, qué sistemas se intervienen, límites físicos del trabajo, exclusiones...',
      },
      {
        titulo: 'Desarrollo de los Trabajos',
        tipo: 'texto',
        placeholder: 'Describe cronológicamente las actividades ejecutadas: preparación de área, instalación de equipos de izaje, alineamiento, nivelación, conexiones, pruebas de ajuste...',
      },
      {
        titulo: 'Control Dimensional',
        tipo: 'texto',
        placeholder: 'Registra las mediciones y verificaciones realizadas: cotas de instalación, verticalidad, horizontalidad, alineamiento de ejes, torques de apriete, tolerancias admisibles vs obtenidas...',
      },
      {
        titulo: 'Registro Fotográfico',
        tipo: 'fotos',
        placeholder: '',
      },
      {
        titulo: 'Conclusiones',
        tipo: 'conclusion',
        placeholder: 'Resume los resultados del montaje: conformidad con especificaciones, estado final del equipo, pruebas realizadas y sus resultados, conformidad del cliente...',
      },
      {
        titulo: 'Recomendaciones',
        tipo: 'conclusion',
        placeholder: 'Indica acciones sugeridas al cliente: commissioning pendiente, inspecciones de seguimiento, mantenciones programadas, precauciones operacionales...',
      },
    ],
  },
  mantenimiento: {
    nombre: 'Mantención de Equipos',
    icono: 'cog',
    descripcion: 'Mantención preventiva o correctiva de equipos',
    descripcionLarga: 'Informes de mantención preventiva y correctiva de equipos industriales. Documenta diagnóstico, intervenciones, hallazgos y estado final.',
    seccionesCount: 7,
    secciones: [
      {
        titulo: 'Antecedentes',
        tipo: 'texto',
        placeholder: 'Describe el equipo intervenido: tipo de equipo, tag, ubicación en planta, historial de mantención relevante, motivo de la intervención (PM programado, falla detectada, solicitud cliente)...',
      },
      {
        titulo: 'Diagnóstico Inicial',
        tipo: 'texto',
        placeholder: 'Describe el estado del equipo previo a la intervención: síntomas reportados, mediciones iniciales (vibraciones, temperaturas, presiones, fugas observadas), inspección visual inicial...',
      },
      {
        titulo: 'Trabajos Realizados',
        tipo: 'texto',
        placeholder: 'Detalla todas las actividades de mantención ejecutadas: desmontaje, limpieza, inspección de componentes, reemplazo de partes (indica part numbers si aplica), ajustes, pruebas...',
      },
      {
        titulo: 'Hallazgos',
        tipo: 'texto',
        placeholder: 'Documenta las observaciones y anomalías encontradas durante la intervención: desgaste prematuro de piezas, corrosión, desalineamientos, fugas internas, daños estructurales...',
      },
      {
        titulo: 'Registro Fotográfico',
        tipo: 'fotos',
        placeholder: '',
      },
      {
        titulo: 'Conclusiones',
        tipo: 'conclusion',
        placeholder: 'Indica el estado final del equipo: conformidad con parámetros de diseño, pruebas funcionales realizadas y resultados, disponibilidad del equipo para operación...',
      },
      {
        titulo: 'Recomendaciones',
        tipo: 'conclusion',
        placeholder: 'Sugiere acciones de seguimiento: próxima mantención programada, repuestos críticos a gestionar, monitoreo especial requerido, mejoras detectadas a implementar...',
      },
    ],
  },
  aislacion: {
    nombre: 'Aislación Térmica',
    icono: 'thermometer',
    descripcion: 'Aislación térmica de equipos, cañerías y ductos',
    descripcionLarga: 'Informes de aplicación de aislación térmica en equipos, cañerías, ductos y superficies industriales. Incluye especificaciones de materiales y control de calidad.',
    seccionesCount: 7,
    secciones: [
      {
        titulo: 'Antecedentes',
        tipo: 'texto',
        placeholder: 'Describe el proyecto: líneas o equipos a aislar, temperatura de operación, fluido contenido, normativa aplicable (ASTM, ISO, normas cliente), documentos de referencia...',
      },
      {
        titulo: 'Especificaciones Técnicas',
        tipo: 'texto',
        placeholder: 'Detalla materiales utilizados: tipo de aislante (lana mineral, espuma elastomérica, etc.), espesor nominal, densidad, conductividad térmica, terminación exterior (chapa galvanizada, aluminio), adhesivos y fijaciones...',
      },
      {
        titulo: 'Desarrollo de los Trabajos',
        tipo: 'texto',
        placeholder: 'Describe el procedimiento de aplicación: preparación de superficie, corte y conformado del material, instalación de capas, fijaciones, sellos en extremos, instalación de terminación exterior, protección de accesorios...',
      },
      {
        titulo: 'Control de Calidad',
        tipo: 'texto',
        placeholder: 'Registra las verificaciones realizadas: medición de espesores en puntos representativos (tabla con valores), inspección visual de terminaciones, pruebas de adherencia, conformidad con especificaciones...',
      },
      {
        titulo: 'Registro Fotográfico',
        tipo: 'fotos',
        placeholder: '',
      },
      {
        titulo: 'Conclusiones',
        tipo: 'conclusion',
        placeholder: 'Confirma el cumplimiento de especificaciones técnicas, metros lineales / m² ejecutados, conformidad con normas aplicables, aprobación de QC...',
      },
      {
        titulo: 'Recomendaciones',
        tipo: 'conclusion',
        placeholder: 'Indica cuidados para el mantenimiento de la aislación: inspecciones periódicas, puntos de atención, precauciones para futuras intervenciones en equipos aislados...',
      },
    ],
  },
  ingenieria: {
    nombre: 'Ingeniería y Diseño',
    icono: 'compass',
    descripcion: 'Estudios, análisis y diseño de soluciones industriales',
    descripcionLarga: 'Informes de ingeniería para estudios técnicos, análisis de fallas, diseño de soluciones y proyectos de mejora. Rigor técnico y metodología documentada.',
    seccionesCount: 7,
    secciones: [
      {
        titulo: 'Antecedentes',
        tipo: 'texto',
        placeholder: 'Describe el contexto del estudio: problemática detectada o requerimiento del cliente, equipos o sistemas involucrados, alcance del análisis, datos de entrada utilizados...',
      },
      {
        titulo: 'Objetivo',
        tipo: 'texto',
        placeholder: 'Define claramente el objetivo del informe: qué se busca determinar, diseñar o evaluar, criterios de éxito, entregables esperados...',
      },
      {
        titulo: 'Metodología',
        tipo: 'texto',
        placeholder: 'Describe el enfoque técnico utilizado: normas y estándares aplicados, software de cálculo, procedimientos de medición, modelos utilizados, supuestos y limitaciones...',
      },
      {
        titulo: 'Análisis y Resultados',
        tipo: 'texto',
        placeholder: 'Presenta los resultados del análisis: cálculos realizados, comparación con valores admisibles, tablas de resultados, interpretación técnica de los hallazgos...',
      },
      {
        titulo: 'Registro Fotográfico',
        tipo: 'fotos',
        placeholder: '',
      },
      {
        titulo: 'Conclusiones',
        tipo: 'conclusion',
        placeholder: 'Resume los resultados clave: conformidad o no conformidad con criterios de diseño, viabilidad técnica de la solución propuesta, impacto estimado de las mejoras...',
      },
      {
        titulo: 'Recomendaciones',
        tipo: 'conclusion',
        placeholder: 'Propone acciones concretas: plan de implementación sugerido, priorización de intervenciones, monitoreo post-implementación, estudios adicionales recomendados...',
      },
    ],
  },
  otro: {
    nombre: 'Otro Servicio',
    icono: 'file',
    descripcion: 'Otros servicios no clasificados',
    descripcionLarga: 'Informe de formato libre para servicios que no encajan en las categorías anteriores. Estructura básica adaptable a cualquier tipo de trabajo.',
    seccionesCount: 5,
    secciones: [
      {
        titulo: 'Antecedentes',
        tipo: 'texto',
        placeholder: 'Describe el contexto general: cliente, instalación, motivo del servicio, documentos de referencia...',
      },
      {
        titulo: 'Descripción de Trabajos',
        tipo: 'texto',
        placeholder: 'Detalla las actividades realizadas, metodología aplicada, recursos utilizados (personal, equipos, herramientas)...',
      },
      {
        titulo: 'Registro Fotográfico',
        tipo: 'fotos',
        placeholder: '',
      },
      {
        titulo: 'Conclusiones',
        tipo: 'conclusion',
        placeholder: 'Resume los resultados obtenidos, conformidad con los objetivos planteados, estado final de los trabajos...',
      },
      {
        titulo: 'Recomendaciones',
        tipo: 'conclusion',
        placeholder: 'Indica acciones de seguimiento sugeridas, observaciones para el cliente, trabajos pendientes...',
      },
    ],
  },
};

/** Tipos de servicio disponibles */
export const TIPOS_SERVICIO = Object.keys(PRESETS) as Array<keyof typeof PRESETS>;
