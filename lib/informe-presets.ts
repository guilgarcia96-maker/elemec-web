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
  secciones: SeccionPreset[];
}

export const PRESETS: Record<string, PresetConfig> = {
  montaje: {
    nombre: 'Montaje e Instalaciones',
    icono: 'wrench',
    descripcion: 'Montaje de equipos, estructuras e instalaciones industriales',
    secciones: [
      { titulo: 'Antecedentes', tipo: 'texto', placeholder: 'Contexto del proyecto...' },
      { titulo: 'Alcance de los Trabajos', tipo: 'texto', placeholder: 'Descripción del alcance...' },
      { titulo: 'Desarrollo de los Trabajos', tipo: 'texto', placeholder: 'Detalle de actividades realizadas...' },
      { titulo: 'Control Dimensional', tipo: 'texto', placeholder: 'Verificaciones y mediciones...' },
      { titulo: 'Registro Fotográfico', tipo: 'fotos', placeholder: '' },
      { titulo: 'Conclusiones', tipo: 'conclusion', placeholder: 'Resumen de resultados...' },
      { titulo: 'Recomendaciones', tipo: 'conclusion', placeholder: 'Sugerencias para el cliente...' },
    ],
  },
  mantenimiento: {
    nombre: 'Mantención de Equipos',
    icono: 'cog',
    descripcion: 'Mantención preventiva o correctiva de equipos industriales',
    secciones: [
      { titulo: 'Antecedentes', tipo: 'texto', placeholder: 'Equipo y contexto...' },
      { titulo: 'Diagnóstico Inicial', tipo: 'texto', placeholder: 'Estado del equipo antes de intervención...' },
      { titulo: 'Trabajos Realizados', tipo: 'texto', placeholder: 'Detalle de mantención ejecutada...' },
      { titulo: 'Hallazgos', tipo: 'texto', placeholder: 'Observaciones encontradas durante la mantención...' },
      { titulo: 'Registro Fotográfico', tipo: 'fotos', placeholder: '' },
      { titulo: 'Conclusiones', tipo: 'conclusion', placeholder: 'Estado final del equipo...' },
      { titulo: 'Recomendaciones', tipo: 'conclusion', placeholder: 'Próximas mantenciones sugeridas...' },
    ],
  },
  aislacion: {
    nombre: 'Aislación Térmica',
    icono: 'thermometer',
    descripcion: 'Aislación térmica de equipos, cañerías y ductos',
    secciones: [
      { titulo: 'Antecedentes', tipo: 'texto', placeholder: 'Proyecto y especificaciones...' },
      { titulo: 'Especificaciones Técnicas', tipo: 'texto', placeholder: 'Materiales, espesores, normas...' },
      { titulo: 'Desarrollo de los Trabajos', tipo: 'texto', placeholder: 'Procedimiento de aplicación...' },
      { titulo: 'Control de Calidad', tipo: 'texto', placeholder: 'Verificaciones de espesor, adherencia...' },
      { titulo: 'Registro Fotográfico', tipo: 'fotos', placeholder: '' },
      { titulo: 'Conclusiones', tipo: 'conclusion', placeholder: 'Cumplimiento de especificaciones...' },
      { titulo: 'Recomendaciones', tipo: 'conclusion', placeholder: 'Mantenimiento de la aislación...' },
    ],
  },
  ingenieria: {
    nombre: 'Ingeniería y Diseño',
    icono: 'compass',
    descripcion: 'Estudios, análisis y diseño de soluciones industriales',
    secciones: [
      { titulo: 'Antecedentes', tipo: 'texto', placeholder: 'Contexto del estudio...' },
      { titulo: 'Objetivo', tipo: 'texto', placeholder: 'Propósito del análisis...' },
      { titulo: 'Metodología', tipo: 'texto', placeholder: 'Enfoque y herramientas utilizadas...' },
      { titulo: 'Análisis y Resultados', tipo: 'texto', placeholder: 'Hallazgos del estudio...' },
      { titulo: 'Registro Fotográfico', tipo: 'fotos', placeholder: '' },
      { titulo: 'Conclusiones', tipo: 'conclusion', placeholder: 'Resumen de resultados...' },
      { titulo: 'Recomendaciones', tipo: 'conclusion', placeholder: 'Acciones sugeridas...' },
    ],
  },
  otro: {
    nombre: 'Otro Servicio',
    icono: 'file',
    descripcion: 'Otros servicios no clasificados',
    secciones: [
      { titulo: 'Antecedentes', tipo: 'texto', placeholder: 'Contexto general...' },
      { titulo: 'Descripción de Trabajos', tipo: 'texto', placeholder: 'Detalle de actividades...' },
      { titulo: 'Registro Fotográfico', tipo: 'fotos', placeholder: '' },
      { titulo: 'Conclusiones', tipo: 'conclusion', placeholder: 'Resumen...' },
      { titulo: 'Recomendaciones', tipo: 'conclusion', placeholder: 'Sugerencias...' },
    ],
  },
};

/** Tipos de servicio disponibles */
export const TIPOS_SERVICIO = Object.keys(PRESETS) as Array<keyof typeof PRESETS>;
