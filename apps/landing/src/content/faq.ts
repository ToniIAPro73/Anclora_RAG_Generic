export type FAQItem = {
  question: string;
  answer: string;
};

export const faqItems: FAQItem[] = [
  {
    question: '¿Qué hace diferente a Anclora RAG?',
    answer:
      'Somos el primer RAG verdaderamente colaborativo: sesiones multirol, memoria contextual compartida y un sistema de citas verificables diseñado para entornos regulados.',
  },
  {
    question: '¿Cuánto cuesta durante la beta?',
    answer:
      'La beta cerrada es gratuita para las primeras 100 organizaciones. Tras el lanzamiento mantendremos un plan free limitado y planes profesionales escalables.',
  },
  {
    question: '¿Qué tipos de documentos puedo subir?',
    answer:
      'Soportamos PDF (incluidos escaneados), DOCX, TXT, Markdown, imágenes y código fuente. Nuestro pipeline multimodal procesa tablas, diagramas y anexos técnicos sin perder estructura.',
  },
  {
    question: '¿Es seguro subir documentos sensibles?',
    answer:
      'Sí. Infraestructura en Europa, cifrado extremo a extremo y cumplimiento GDPR/AI Act. Tus datos nunca entrenan modelos externos y puedes solicitar borrado inmediato.',
  },
  {
    question: '¿Cuántos usuarios por equipo?',
    answer:
      'Durante la beta aceptamos hasta 10 usuarios por organización. En producción ofreceremos planes para equipos desde 5 hasta 100+ asientos.',
  },
  {
    question: '¿Necesito conocimientos técnicos?',
    answer:
      'No. Anclora RAG está pensada para usuarios de negocio. Subes documentos, preguntas en lenguaje natural y recibes respuestas con citas verificables.',
  },
  {
    question: '¿En qué idiomas funciona?',
    answer:
      'Disponible en español e inglés con detección automática. Roadmap 2026: francés, italiano y alemán.',
  },
  {
    question: '¿Puedo integrar Anclora RAG con otras herramientas?',
    answer:
      'Sí. Contamos con integraciones nativas con Slack, Teams, Google Drive, GitHub y Notion. API abierta para automatizar tus propios flujos.',
  },
  {
    question: '¿Cuánto tiempo toma el setup?',
    answer:
      'Menos de 2 minutos: crea cuenta, sube documentos y empieza a preguntar. Opcionalmente conectas tus integraciones empresariales.',
  },
  {
    question: '¿Qué pasa si tengo problemas?',
    answer:
      'Soporte priorizado por email y chat durante la beta con respuesta en menos de 2 horas. Canal privado con el equipo fundador para feedback crítico.',
  },
];
