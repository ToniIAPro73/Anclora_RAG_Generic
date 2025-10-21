export type LandingCopy = {
  hero: {
    title: string;
    subtitle: string;
    description: string;
    primaryCta: string;
    secondaryCta: string;
  };
  problem: {
    headline: string;
    subheadline: string;
    context: string;
    painPoints: { title: string; description: string; metric: string }[];
  };
  solution: {
    headline: string;
    result: string;
    highlights: { title: string; description: string; benefit: string }[];
  };
  features: {
    sectionLabel: string;
    heading: string;
    intro: string;
    items: {
      title: string;
      description: string;
      bullets: string[];
      badge: string;
    }[];
  };
  useCases: {
    label: string;
    heading: string;
    intro: string;
    cases: {
      title: string;
      description: string;
      highlight: string;
    }[];
  };
  waitlist: {
    label: string;
    headline: string;
    description: string;
    trust: { title: string; description: string }[];
    successHeadline: string;
    successSubheadline: string;
  };
  faq: {
    label: string;
    heading: string;
    intro: string;
    contactEmail: string;
  };
};

export const landingCopy: LandingCopy = {
  hero: {
    title: 'Inteligencia RAG colaborativa y verificada para tus equipos.',
    subtitle: 'Anclora RAG',
    description:
      'Anclora RAG combina orquestación avanzada, memoria contextual persistente y flujos colaborativos para que cada respuesta llegue con citas auditables y contexto completo.',
    primaryCta: 'Solicitar acceso beta',
    secondaryCta: 'Ver demo en 90 segundos',
  },
  problem: {
    headline: 'Los RAG convencionales se quedan cortos.',
    subheadline: 'Diseñamos Anclora RAG para equipos exigentes y regulados.',
    context:
      'El 64% de las organizaciones abandona las pruebas de RAG en pocas semanas por falta de colaboración real, citas poco confiables y límites técnicos. Anclora RAG cambia las reglas con una aproximación integral lista para producción.',
    painPoints: [
      {
        title: 'Ventana de contexto limitada',
        description: 'Los sistemas tradicionales procesan menos de 500.000 palabras por fuente y fragmentan la información crítica.',
        metric: '70% del conocimiento queda fuera',
      },
      {
        title: 'Experiencia individual',
        description: 'Sin espacios compartidos, los equipos duplican trabajo, pierden trazabilidad y multiplican herramientas.',
        metric: '3 herramientas paralelas por equipo',
      },
      {
        title: 'Citas poco confiables',
        description: 'Las respuestas apuntan a referencias incorrectas, generan riesgo regulatorio y requieren verificación manual.',
        metric: '40% de las citas se corrigen a mano',
      },
    ],
  },
  solution: {
    headline: 'Nuestra solución',
    result:
      'Equipos legales, compliance y operaciones toman decisiones con evidencia única, reduciendo riesgos regulatorios y ganando velocidad operativa desde el primer día.',
    highlights: [
      {
        title: 'Memoria extendida y viva',
        description:
          'Anclora RAG memoriza documentos completos, preserva contexto y elimina duplicados para todo el equipo.',
        benefit: 'Cobertura del 100% del corpus',
      },
      {
        title: 'Colaboración en tiempo real',
        description:
          'Flujos compartidos con roles, sesiones sincronizadas y comentarios anclados para legal, compliance y operaciones.',
        benefit: 'Hasta 85% menos tiempo en revisiones',
      },
      {
        title: 'Citas verificables',
        description:
          'Cada respuesta se entrega con evidencias, score de similitud y trazabilidad automática lista para auditorías.',
        benefit: 'Confianza auditada para reguladores',
      },
    ],
  },
  features: {
    sectionLabel: 'Valor tangible',
    heading: 'Para equipos que necesitan velocidad, precisión y colaboración',
    intro:
      'Cada pilar de Anclora RAG está diseñado para disminuir el riesgo operativo y garantizar decisiones informadas con la mitad de esfuerzo.',
    items: [
      {
        title: 'Ingesta avanzada sin límites (Pro)',
        description:
          'Carga lotes masivos de documentos o conecta repositorios completos (GitHub, Notion, bases de datos y almacenamiento cloud) para mantener tu conocimiento siempre sincronizado.',
        bullets: [
          'Procesa archivos ofimáticos, comprimidos, imágenes, CSV, código (py, js, ts…), registros de BD y colecciones enteras',
          'Importa sitios web, enlaces de YouTube, podcasts, transcripts y PDF complejos con OCR (escaneados, tablas e imágenes) con normalización semántica',
          'Jobs programados y deduplicación inteligente con versionado por lote',
        ],
        badge: 'Feature',
      },
      {
        title: 'Chat con citas verificadas',
        description:
          'Recibe respuestas con citas jerarquizadas, score de similitud y enlaces directos al fragmento relevante para auditar en segundos.',
        bullets: ['Citas accionables y exportables', 'Panel lateral con contexto vivo', 'Modo dual: análisis corto o informe extenso'],
        badge: 'Feature',
      },
      {
        title: 'Multilenguaje listo para producción',
        description:
          'Procesa y consulta en español e inglés sin cambiar de interfaz. El motor detecta el idioma y responde respetando tono y terminología.',
        bullets: ['Detección automática', 'Glosarios personalizados', 'Soporte roadmap: francés, italiano, alemán'],
        badge: 'Feature',
      },
      {
        title: 'Búsqueda inteligente y orquestación',
        description:
          'Combina búsqueda semántica, filtros estructurados y orquestación de flujos para localizar la evidencia precisa en menos pasos.',
        bullets: ['Filtros facetados en tiempo real', 'Workflows reutilizables con aprobación', 'KPIs operativos integrados'],
        badge: 'Feature',
      },
    ],
  },
  useCases: {
    label: 'Casos de uso',
    heading: 'Impacto real en áreas críticas del negocio',
    intro:
      'Anclora RAG se adapta a cada equipo convirtiendo documentación dispersa en decisiones basadas en evidencia. Estos son los cuatro escenarios donde vemos mayor tracción inicial.',
    cases: [
      {
        title: 'Soporte interno',
        description:
          'Convierte manuales y tickets históricos en respuestas instantáneas para agentes de helpdesk sin salir de su flujo.',
        highlight: '30% menos tiempo medio de resolución',
      },
      {
        title: 'Equipos legales',
        description:
          'Centraliza jurisprudencia, contratos y normativas para obtener argumentos con citas trazables en segundos.',
        highlight: 'Cumplimiento reforzado con evidencia auditada',
      },
      {
        title: 'Onboarding de talento',
        description:
          'Ofrece a nuevas incorporaciones un copiloto que contesta políticas, procesos y documentación interna.',
        highlight: 'Ramp-up de nuevos perfiles en la mitad de tiempo',
      },
      {
        title: 'Operaciones técnicas',
        description:
          'Documentación técnica, runbooks y logs accesibles con contexto para mitigar incidentes y automatizar respuestas.',
        highlight: 'Resolución de incidentes 40% más rápida',
      },
    ],
  },
  waitlist: {
    label: 'Early access',
    headline: 'Únete a las primeras organizaciones que activan Anclora RAG',
    description:
      'Garantizamos onboarding asistido, soporte en menos de 2 horas y un canal directo con el equipo fundador mientras dura la beta privada.',
    trust: [
      { title: 'Sin spam ni venta de datos', description: 'Usamos Hostinger SMTP sobre dominio propio.' },
      { title: 'Respuesta inmediata', description: 'Confirmación automática con tu posición en la lista.' },
      { title: 'Acceso prioritario', description: 'Primeros 100 registros obtienen onboarding asistido.' },
    ],
    successHeadline: '¡Estás en la lista!',
    successSubheadline: 'Te escribiremos cuando abramos tu cupo.',
  },
  faq: {
    label: 'FAQ',
    heading: 'Resolvemos las dudas más comunes antes de que te sumes a la beta',
    intro: 'Si no encuentras lo que buscas, escríbenos a hola@anclora.com.',
    contactEmail: 'hola@anclora.com',
  },
};
