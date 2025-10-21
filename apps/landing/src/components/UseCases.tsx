const useCases = [
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
] as const;

export function UseCases() {
  return (
    <section className="relative px-6 py-20 sm:px-10 lg:px-16">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />

      <div className="relative mx-auto flex max-w-6xl flex-col gap-10 text-center lg:text-left">
        <div className="mx-auto max-w-3xl space-y-4 text-center">
          <span className="text-sm font-semibold uppercase tracking-[0.35em] text-[#A3E635]">
            Casos de uso
          </span>
          <h2 className="text-3xl font-semibold sm:text-4xl">
            <span className="bg-gradient-to-r from-[#A3E635] via-[#06B6D4] to-[#D946EF] bg-clip-text text-transparent">
              Impacto real en áreas críticas del negocio
            </span>
          </h2>
          <p className="text-base text-slate-300 sm:text-lg">
            Anclora RAG se adapta a cada equipo convirtiendo documentación dispersa en decisiones basadas
            en evidencia. Estos son los cuatro escenarios donde vemos mayor tracción inicial.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {useCases.map((useCase) => (
            <div
              key={useCase.title}
              className="group relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#141B33]/95 via-[#0E1426]/95 to-[#0A0F1F]/95 p-6 text-left text-slate-100 shadow-[0_30px_80px_-50px_rgba(6,182,212,0.6)] transition duration-300 hover:border-[#06B6D4]/60"
            >
              <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-[#06B6D4] via-[#D946EF] to-[#A3E635] opacity-70 transition-opacity group-hover:opacity-100" />
              <div className="relative ps-6">
                <h3 className="text-xl font-semibold text-white">{useCase.title}</h3>
                <p className="mt-3 text-sm text-slate-200">{useCase.description}</p>
                <p className="mt-5 inline-flex rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-[#06B6D4]">
                  {useCase.highlight}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
