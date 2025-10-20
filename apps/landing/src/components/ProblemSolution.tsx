const painPoints = [
  {
    title: 'Ventana de contexto limitada',
    description: 'Procesan menos de 500k palabras por fuente y fragmentan la información crítica.',
    metric: '70% del conocimiento queda fuera',
  },
  {
    title: 'Experiencia individual',
    description: 'Sin espacios compartidos, los equipos duplican trabajo y pierden trazabilidad.',
    metric: '3 herramientas paralelas por equipo',
  },
  {
    title: 'Citas poco confiables',
    description: 'Las respuestas apuntan a referencias incorrectas y generan riesgo regulatorio.',
    metric: '40% de las citas requieren verificación manual',
  },
];

const solutionHighlights = [
  {
    title: 'Memoria extendida y viva',
    description:
      'Anclora memoriza los documentos completos y conserva el contexto entre sesiones y equipos.',
    benefit: 'Cobertura del 100% del corpus',
  },
  {
    title: 'Colaboración en tiempo real',
    description:
      'Flujos compartidos con roles, comentarios anclados y sesiones sincronizadas para legal, compliance y operaciones.',
    benefit: 'Hasta 85% menos tiempo en revisiones',
  },
  {
    title: 'Citas verificables',
    description:
      'Cada respuesta se entrega con evidencias, score de similitud y trazabilidad automática.',
    benefit: 'Confianza auditada para reguladores',
  },
];

export function ProblemSolution() {
  return (
    <section id="valor" className="relative px-6 py-24 sm:px-10 lg:px-16">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      <div className="mx-auto flex max-w-6xl flex-col gap-12 lg:flex-row lg:items-center">
        <div className="max-w-xl space-y-6">
          <span className="text-sm font-semibold uppercase tracking-[0.35em] text-[#06B6D4]">
            Problema vs solución
          </span>
          <h2 className="text-3xl font-semibold text-white sm:text-4xl">
            Los RAG tradicionales se quedan cortos para organizaciones
            <span className="block text-slate-300">
              Nosotros diseñamos la experiencia pensando en equipos exigentes.
            </span>
          </h2>
          <p className="text-lg text-slate-300">
            El 64% de los equipos abandona las pruebas de RAG en las primeras semanas por falta de
            colaboración, citas poco confiables y límites técnicos. Anclora cambia las reglas con
            una aproximación integral.
          </p>
        </div>

        <div className="grid w-full gap-8 text-left lg:max-w-3xl lg:grid-cols-2">
          <div className="rounded-3xl border border-white/10 bg-white/3 p-6 shadow-[0_25px_60px_-30px_rgba(15,23,42,0.65)] backdrop-blur">
            <p className="text-xs uppercase tracking-[0.28em] text-rose-200">Retos actuales</p>
            <div className="mt-6 space-y-6">
              {painPoints.map((point) => (
                <div
                  key={point.title}
                  className="border-l-2 border-rose-400/70 pl-4 text-slate-200"
                >
                  <h3 className="text-lg font-semibold text-white">{point.title}</h3>
                  <p className="mt-2 text-sm text-slate-300">{point.description}</p>
                  <p className="mt-3 text-xs uppercase tracking-wide text-rose-200/80">
                    {point.metric}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative overflow-hidden rounded-3xl border border-[#06B6D4]/40 bg-gradient-to-br from-[#101A2D] via-[#131B33] to-[#0F172A] p-6 shadow-[0_35px_80px_-40px_rgba(6,182,212,0.65)]">
            <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-[radial-gradient(circle,rgba(6,182,212,0.35),transparent_70%)] blur-xl" />
            <p className="text-xs uppercase tracking-[0.28em] text-[#A3E635]">Nuestra solución</p>
            <div className="mt-6 space-y-6 text-slate-100">
              {solutionHighlights.map((item) => (
                <div key={item.title} className="rounded-2xl border border-white/5 bg-white/5 p-5">
                  <h3 className="text-lg font-semibold text-white">{item.title}</h3>
                  <p className="mt-2 text-sm text-slate-300">{item.description}</p>
                  <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-[#06B6D4]">
                    {item.benefit}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-8 rounded-2xl border border-white/10 bg-[#0F172A]/80 p-5 text-sm text-slate-200">
              <p className="font-semibold text-white">Resultado</p>
              <p className="mt-2 text-slate-300">
                Equipos legales, compliance y operaciones toman decisiones con evidencia única,
                reduciendo riesgos regulatorios y ganando velocidad operativa.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
