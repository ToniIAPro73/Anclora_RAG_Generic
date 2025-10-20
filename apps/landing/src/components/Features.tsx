const valuePillars = [
  {
    title: 'Decisiones 4× más rápidas',
    description: 'Automatizamos la extracción y validación de evidencia crítica.',
    metric: '85% menos tiempo de búsqueda',
  },
  {
    title: 'Control de costes',
    description: 'Flujos optimizados y coordinación multi-equipo sin licencias extra.',
    metric: 'Hasta 60% de ahorro operacional',
  },
  {
    title: 'Confianza total',
    description: 'Trazabilidad automática con citas auditables en cada respuesta.',
    metric: '100% de respuestas con evidencia',
  },
];

const featureCards = [
  {
    badge: 'Colaboración',
    icon: '🤝',
    title: 'Sesiones multirol en tiempo real',
    description:
      'Comparte tableros con Legal, Compliance y Operaciones. Comentarios anclados y control de versiones automático.',
    detail: 'Roles y permisos granulares · Hilos contextuales',
  },
  {
    badge: 'Inteligencia multimodal',
    icon: '🧠',
    title: 'Texto, imágenes y tablas en conjunto',
    description:
      'Procesamos anexos, diagramas y documentación técnica manteniendo estructura y relaciones clave.',
    detail: 'Embeddings híbridos · Normalización semántica',
  },
  {
    badge: 'Automatización',
    icon: '⚙️',
    title: 'Flujos que aprenden de tu equipo',
    description:
      'Automatiza preguntas frecuentes, crea resúmenes recurrentes y activa alertas cuando cambia la normativa.',
    detail: 'Workflows adaptativos · Integraciones con Slack/Teams',
  },
  {
    badge: 'Memoria contextual',
    icon: '🧾',
    title: 'Conocimiento colectivo persistente',
    description:
      'Cada sesión alimenta una memoria compartida que se mantiene actualizada y libre de duplicados.',
    detail: 'Deduplicación inteligente · Historias auditables',
  },
];

export function Features() {
  return (
    <section id="features" className="relative overflow-hidden px-6 py-24 sm:px-10 lg:px-16">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-x-0 top-1/2 h-[1px] w-full bg-gradient-to-r from-transparent via-white/15 to-transparent" />
        <div className="absolute bottom-[-20%] left-[-10%] h-[520px] w-[520px] rounded-full bg-[radial-gradient(circle_at_center,rgba(217,70,239,0.2),transparent_70%)] blur-3xl" />
      </div>

      <div className="relative mx-auto flex max-w-6xl flex-col gap-16">
        <div className="space-y-6 text-center">
          <span className="text-sm font-semibold uppercase tracking-[0.35em] text-[#D946EF]">
            Valor tangible
          </span>
          <h2 className="text-3xl font-semibold text-white sm:text-4xl">
            Para equipos que necesitan velocidad, precisión y colaboración
          </h2>
          <p className="mx-auto max-w-3xl text-lg text-slate-300">
            Cada pilar de Anclora RAG está diseñado para disminuir el riesgo operativo y garantizar
            decisiones informadas con la mitad de esfuerzo.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {valuePillars.map((pillar) => (
            <div
              key={pillar.title}
              className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#1A2239] via-[#131B33] to-[#0F172A] p-6 text-left shadow-[0_30px_80px_-50px_rgba(217,70,239,0.8)]"
            >
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
              <h3 className="text-xl font-semibold text-white">{pillar.title}</h3>
              <p className="mt-3 text-sm text-slate-300">{pillar.description}</p>
              <p className="mt-6 inline-flex rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-[#A3E635]">
                {pillar.metric}
              </p>
            </div>
          ))}
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {featureCards.map((feature) => (
            <article
              key={feature.title}
              className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-6 transition duration-300 hover:border-transparent hover:bg-gradient-to-br hover:from-[#1D1F3C]/95 hover:via-[#141A33]/95 hover:to-[#10152B]/95"
            >
              <div className="absolute inset-0 -z-10 opacity-0 transition duration-300 group-hover:opacity-100">
                <div className="absolute -right-10 top-10 h-40 w-40 rounded-full bg-[radial-gradient(circle,rgba(6,182,212,0.35),transparent_70%)] blur-2xl" />
              </div>
              <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.28em] text-slate-300">
                <span className="text-lg">{feature.icon}</span>
                {feature.badge}
              </div>
              <h3 className="mt-4 text-2xl font-semibold text-white">{feature.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-slate-300">{feature.description}</p>
              <p className="mt-6 text-xs font-semibold uppercase tracking-wide text-[#06B6D4]">
                {feature.detail}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
