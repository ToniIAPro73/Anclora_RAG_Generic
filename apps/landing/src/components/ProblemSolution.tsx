const painPoints = [
  {
    title: 'Ventana de contexto limitada',
    description:
      'Los sistemas tradicionales procesan menos de 500k palabras por fuente y fragmentan la información crítica.',
    metric: '70% del conocimiento queda fuera',
  },
  {
    title: 'Experiencia individual',
    description:
      'Sin espacios compartidos, los equipos duplican trabajo, pierden trazabilidad y multiplican herramientas.',
    metric: '3 herramientas paralelas por equipo',
  },
  {
    title: 'Citas poco confiables',
    description:
      'Las respuestas apuntan a referencias incorrectas, generan riesgo regulatorio y requieren verificación manual.',
    metric: '40% de las citas se corrigen a mano',
  },
];

const solutionHighlights = [
  {
    title: 'Memoria extendida y viva',
    description:
      'Anclora memoriza documentos completos, preserva contexto y elimina duplicados para todo el equipo.',
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
];

export function ProblemSolution() {
  return (
    <section id="valor" className="relative px-6 py-24 sm:px-10 lg:px-16">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

      <div className="relative mx-auto flex max-w-6xl flex-col gap-14">
        <div className="mx-auto max-w-4xl space-y-6 text-center">
          <span className="text-sm font-semibold uppercase tracking-[0.35em] text-[#06B6D4]">
            Problema vs solución
          </span>
          <h2 className="text-3xl font-semibold text-white sm:text-4xl">
            Los RAG convencionales se quedan cortos
            <span className="block text-slate-300">
              Diseñamos Anclora pensando en equipos exigentes y regulados.
            </span>
          </h2>
          <p className="text-lg text-slate-300">
            El 64% de las organizaciones abandona sus pruebas de RAG en las primeras semanas por falta
            de colaboración real, citas poco confiables y límites técnicos. Cambiamos las reglas con una
            aproximación integral lista para producción.
          </p>
        </div>

        <div className="space-y-10">
          <div className="rounded-3xl border border-white/10 bg-white/3 p-8 shadow-[0_25px_60px_-30px_rgba(15,23,42,0.65)] backdrop-blur">
            <div className="flex flex-col gap-8">
              <p className="text-xs uppercase tracking-[0.28em] text-rose-200">Retos actuales</p>
              <div className="grid gap-6 md:grid-cols-3">
                {painPoints.map((point) => (
                  <div
                    key={point.title}
                    className="rounded-2xl border border-rose-200/20 bg-white/5 p-6 text-left text-slate-100"
                  >
                    <h3 className="text-lg font-semibold text-white">{point.title}</h3>
                    <p className="mt-3 text-sm text-slate-200">{point.description}</p>
                    <p className="mt-4 text-xs uppercase tracking-wide text-rose-200/80">
                      {point.metric}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-[#06B6D4]/40 bg-gradient-to-br from-[#101A2D] via-[#131B33] to-[#0F172A] p-8 shadow-[0_35px_80px_-40px_rgba(6,182,212,0.65)]">
            <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-6 text-left text-slate-100">
              <div className="absolute -right-16 -top-16 h-44 w-44 rounded-full bg-[radial-gradient(circle,rgba(6,182,212,0.35),transparent_70%)] blur-2xl" />
              <div className="relative z-10 flex flex-col gap-8">
                <p className="text-xs uppercase tracking-[0.28em] text-[#A3E635]">Nuestra solución</p>
                <div className="grid gap-6 md:grid-cols-3">
                  {solutionHighlights.map((item) => (
                    <div key={item.title} className="rounded-2xl border border-white/10 bg-[#0F172A]/70 p-6">
                      <h3 className="text-lg font-semibold text-white">{item.title}</h3>
                      <p className="mt-3 text-sm text-slate-200">{item.description}</p>
                      <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-[#06B6D4]">
                        {item.benefit}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="rounded-2xl border border-white/10 bg-[#0F172A]/90 p-6 text-sm text-slate-200">
                  <p className="font-semibold text-white">Resultado</p>
                  <p className="mt-2 text-slate-200">
                    Equipos legales, compliance y operaciones toman decisiones con evidencia única,
                    reduciendo riesgos regulatorios y ganando velocidad operativa desde el primer día.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
