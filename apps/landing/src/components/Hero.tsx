export function Hero() {
  return (
    <section className="relative overflow-hidden px-6 pb-24 pt-28 sm:px-10 lg:px-16">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-x-0 top-[-40%] mx-auto h-[620px] w-[620px] rounded-full bg-[radial-gradient(circle_at_top,#D946EF40,transparent_65%)] blur-3xl md:h-[780px] md:w-[780px]" />
        <div className="absolute right-[-10%] top-[-20%] h-[520px] w-[520px] rotate-12 rounded-full bg-[radial-gradient(circle_at_center,#06B6D440,transparent_70%)] blur-3xl" />
      </div>

      <div className="relative mx-auto grid max-w-7xl gap-16 lg:grid-cols-[1.1fr,0.9fr] lg:items-center">
        <div className="space-y-10 text-center lg:text-left">
          <div className="inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1 text-sm font-medium text-slate-200 shadow-[0_0_30px_rgba(217,70,239,0.25)] backdrop-blur">
            <span className="inline-flex h-2 w-2 rounded-full bg-gradient-to-r from-[#D946EF] to-[#06B6D4]" />
            Beta privada abierta · cupos limitados
          </div>

          <div className="space-y-6">
            <h1 className="text-4xl font-semibold leading-tight text-slate-100 sm:text-5xl lg:text-6xl">
              Inteligencia RAG
              <span className="block bg-gradient-to-r from-[#D946EF] via-[#AC6CFF] to-[#06B6D4] bg-clip-text text-transparent">
                colaborativa y verificada
              </span>
              para tus equipos.
            </h1>
            <p className="mx-auto max-w-2xl text-lg text-slate-300 lg:mx-0 lg:text-xl">
              Anclora RAG combina orquestación avanzada, memoria contextual persistente y flujos
              colaborativos para que cada respuesta llegue con citas auditables y contexto completo.
            </p>
          </div>

          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center lg:justify-start">
            <a
              href="#waitlist"
              className="relative inline-flex w-full items-center justify-center overflow-hidden rounded-full px-10 py-3 text-base font-semibold text-white transition-transform duration-200 hover:scale-[1.02] sm:w-auto"
            >
              <span className="absolute inset-0 -z-10 rounded-full bg-gradient-to-r from-[#D946EF] via-[#C26DF6] to-[#06B6D4] opacity-90 shadow-[0_25px_45px_-20px_rgba(6,182,212,0.65)]" />
              Solicitar acceso beta
            </a>
            <a
              href="#features"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-white/15 px-8 py-3 text-base font-semibold text-slate-100 transition hover:border-[#06B6D4] hover:text-white"
            >
              Ver demo en 90 segundos
              <span aria-hidden className="text-[#06B6D4]">↗</span>
            </a>
          </div>

          <div className="flex flex-col items-center gap-6 text-sm text-slate-300 sm:flex-row sm:justify-center lg:justify-start">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#34D399]" />
              Sin tarjeta · Activación en 2 minutos
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#FDE047]" />
              Hasta 10 usuarios gratis durante la beta
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#D946EF]" />
              Respuestas con evidencias verificables
            </div>
          </div>
        </div>

        <div
          className="relative isolate overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-8 shadow-[0_40px_80px_-45px_rgba(217,70,239,0.75)] backdrop-blur-lg"
          aria-label="Vista previa de Anclora RAG"
        >
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,rgba(217,70,239,0.35),transparent_70%)]" />
          <div className="grid gap-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.28em] text-slate-400">Dashboard</p>
                <p className="text-lg font-semibold text-white">Anclora RAG</p>
              </div>
              <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-slate-200">
                Tiempo real
              </span>
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-5 shadow-inner">
              <p className="text-xs uppercase tracking-wide text-slate-400">Consulta</p>
              <p className="mt-3 text-base font-medium text-slate-100">
                &ldquo;Resume los principales riesgos regulatorios para operar IA generativa en la UE.&rdquo;
              </p>
              <div className="mt-5 space-y-3 text-sm text-slate-300">
                <div className="rounded-xl border border-[#06B6D4]/30 bg-[#0F172A]/80 p-3">
                  <p className="font-semibold text-white">Respuesta verificada</p>
                  <p className="mt-2 text-slate-300">
                    ✓ Cumple con la AI Act (Capítulo II) · ✓ GDPR Art. 22 · ✓ Directrices CNIL 2024
                  </p>
                </div>
                <div className="grid gap-2 rounded-xl border border-white/5 bg-white/3 p-3 text-xs text-slate-200 md:grid-cols-3">
                  <div>• 8 documentos</div>
                  <div>• 23 citas con score &gt; 0.86</div>
                  <div>• Flujo compartido con Legal</div>
                </div>
              </div>
            </div>

            <div className="grid gap-4 rounded-2xl border border-white/10 bg-slate-900/60 p-5 text-sm text-slate-100 md:grid-cols-2">
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-400">Integraciones</p>
                <ul className="mt-3 space-y-2 text-slate-300">
                  <li>• Slack · Teams · Google Drive</li>
                  <li>• GitHub · Notion · Confluence</li>
                </ul>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-400">Colaboración</p>
                <ul className="mt-3 space-y-2 text-slate-300">
                  <li>• Sesiones sincronizadas multirol</li>
                  <li>• Comentarios anclados a citas</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
