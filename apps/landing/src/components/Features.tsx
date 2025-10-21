const features = [
  {
    title: 'Ingesta avanzada sin límites (Pro)',
    description:
      'Carga lotes masivos de documentos o conecta repositorios completos (GitHub, Notion, Bases de datos y almacenamiento cloud) para mantener tu conocimiento siempre sincronizado.',
    points: [
      'Procesa ficheros ofimáticos, código (py, js, ts…), registros de BD y colecciones enteras',
      'Importa sitios web, enlaces de YouTube, podcasts, transcripts y PDF complejos con OCR (escaneados, tablas e imágenes) con normalización semántica',
      'Jobs programados y deduplicación inteligente con versionado por lote',
    ],
    mediaGradient: 'from-[#D946EF]/70 via-[#F472B6]/40 to-transparent',
  },
  {
    title: 'Chat con citas verificadas',
    description:
      'Recibe respuestas con citas jerarquizadas, score de similitud y enlaces directos al fragmento relevante para auditar en segundos.',
    points: ['Citas accionables y exportables', 'Panel lateral con contexto vivo', 'Modo dual: análisis corto o informe extenso'],
    mediaGradient: 'from-[#06B6D4]/70 via-[#38BDF8]/40 to-transparent',
  },
  {
    title: 'Multilenguaje listo para producción',
    description:
      'Procesa y consulta en español e inglés sin cambiar de interfaz. El motor detecta el idioma y responde respetando tono y terminología.',
    points: ['Detección automática', 'Glosarios personalizados', 'Soporte roadmap: francés, italiano, alemán'],
    mediaGradient: 'from-[#A3E635]/70 via-[#4ADE80]/35 to-transparent',
  },
  {
    title: 'Búsqueda inteligente y orquestación',
    description:
      'Combina búsqueda semántica, filtros estructurados y orquestación de flujos para localizar la evidencia precisa en menos pasos.',
    points: ['Filtros facetados en tiempo real', 'Workflows reutilizables con aprobación', 'KPIs operativos integrados'],
    mediaGradient: 'from-[#FDE047]/70 via-[#FACC15]/35 to-transparent',
  },
] as const;

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
          <h2 className="text-3xl font-semibold sm:text-4xl">
            <span className="bg-gradient-to-r from-[#D946EF] via-[#AC6CFF] to-[#06B6D4] bg-clip-text text-transparent">
              Para equipos que necesitan velocidad, precisión y colaboración
            </span>
          </h2>
          <p className="mx-auto max-w-3xl text-lg text-slate-300">
            Cada pilar de Anclora RAG está diseñado para disminuir el riesgo operativo y garantizar
            decisiones informadas con la mitad de esfuerzo.
          </p>
        </div>

        <div className="space-y-14">
          {features.map((feature, index) => {
            const textOrder = index % 2 === 0 ? 'order-2 lg:order-1' : 'order-2 lg:order-2';
            const mediaOrder = index % 2 === 0 ? 'order-1 lg:order-2' : 'order-1 lg:order-1';

            return (
              <div
                key={feature.title}
                className="relative grid gap-10 rounded-[36px] border border-white/10 bg-white/5 px-6 py-8 text-left shadow-[0_40px_100px_-60px_rgba(217,70,239,0.65)] backdrop-blur md:px-10 lg:grid-cols-2 lg:items-center"
              >
                <div
                  className={`${mediaOrder} relative h-full overflow-hidden rounded-3xl border border-white/10 bg-[#0F172A]/80 p-6`}
                >
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${feature.mediaGradient} `}
                  />
                  <div className="relative flex h-full flex-col justify-between gap-6 text-slate-100">
                    <p className="text-sm font-semibold uppercase tracking-[0.3em] text-white/70">
                      Vista previa
                    </p>
                    <div className="rounded-2xl border border-white/15 bg-white/10 p-4 text-sm leading-relaxed text-white/90">
                      {feature.description}
                    </div>
                    <div className="rounded-2xl border border-white/15 bg-black/20 p-4 text-xs uppercase tracking-wide text-white/80">
                      {feature.points[0]}
                    </div>
                  </div>
                </div>

                <div className={`${textOrder} space-y-5`}>
                  <span className="text-xs font-semibold uppercase tracking-[0.3em] text-[#06B6D4]/80">
                    Feature
                  </span>
                  <h3 className="text-2xl font-semibold text-white">{feature.title}</h3>
                  <p className="text-sm text-slate-200">{feature.description}</p>
                  <ul className="space-y-3 text-sm text-slate-200">
                    {feature.points.map((point) => (
                      <li key={point} className="flex items-start gap-2">
                        <span className="mt-1 inline-flex h-2.5 w-2.5 flex-none rounded-full bg-gradient-to-r from-[#D946EF] to-[#06B6D4]" />
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}


