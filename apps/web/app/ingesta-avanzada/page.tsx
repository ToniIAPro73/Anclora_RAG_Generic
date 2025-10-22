"use client";

import { useUISettings } from "@/components/ui-settings-context";

export default function AdvancedIngestionPage() {
  const { language } = useUISettings();

  const features = [
    language === "es"
      ? "Ingesta masiva de documentos (lotes de hasta 1000 archivos)"
      : "Massive document ingestion (batches of up to 1000 files)",
    language === "es"
      ? "Importacion desde repositorios GitHub"
      : "Import from GitHub repositories",
    language === "es"
      ? "Conexion con fuentes de datos estructuradas (APIs, bases de datos)"
      : "Connection to structured data sources (APIs, databases)",
    language === "es"
      ? "Pipeline de procesamiento asincrono con monitorizacion en tiempo real"
      : "Asynchronous processing pipeline with real-time monitoring",
  ];

  return (
    <div className="fixed inset-0 w-full h-full flex flex-col">
      <section className="flex-1 card relative overflow-hidden text-center ingestion-glow flex flex-col pt-20 md:pt-24 lg:pt-28 pb-20 md:pb-24 lg:pb-28">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[var(--anclora-primary)]/20 via-transparent to-[var(--anclora-secondary)]/20 dark:from-[var(--anclora-primary)]/30 dark:to-[var(--anclora-secondary)]/30" />
        <div className="pointer-events-none absolute inset-x-10 -bottom-24 h-48 rounded-full bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.6),transparent)] opacity-60 blur-3xl dark:bg-[radial-gradient(circle_at_top,rgba(148,163,184,0.18),transparent)]" />

        {/* Purple gradient decorative elements */}
        <div className="pointer-events-none absolute -top-20 -right-20 h-32 w-32 rounded-full bg-gradient-to-br from-[var(--anclora-primary)]/30 to-[var(--anclora-secondary)]/20 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-16 h-24 w-24 rounded-full bg-gradient-to-tr from-[var(--anclora-secondary)]/25 to-[var(--anclora-primary)]/15 blur-xl" />
        <div className="pointer-events-none absolute top-1/2 -left-12 h-16 w-16 rounded-full bg-gradient-to-r from-[var(--anclora-primary)]/20 to-transparent blur-lg" />

        <div className="relative w-full max-w-none flex flex-col items-center justify-center gap-24 md:gap-28 lg:gap-32 px-8 md:px-16 lg:px-24 flex-1">
          <div className="space-y-8 md:space-y-10 lg:space-y-12">
            <div className="inline-flex items-center gap-3 rounded-full border border-white/40 bg-white/75 px-6 py-3 text-sm font-semibold text-[var(--anclora-primary)] shadow-sm dark:border-white/20 dark:bg-white/10 dark:text-white">
              <span className="rounded-full bg-white/80 px-3 py-1 text-sm font-semibold text-[var(--anclora-primary)] dark:bg-white/20 dark:text-white">
                PRO
              </span>
              <span>
                {language === "es"
                  ? "Funcionalidad Premium"
                  : "Premium Feature"}
              </span>
            </div>

            <h1 className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold bg-gradient-to-r from-white via-white to-white/80 bg-clip-text text-transparent">
              {language === "es" ? "Ingesta Avanzada" : "Advanced Ingestion"}
            </h1>

            <p className="text-lg md:text-xl text-white/70">
              {language === "es" ? "En desarrollo" : "Under development"}
            </p>
          </div>

          <div className="w-full max-w-7xl mx-auto rounded-3xl border border-white/40 bg-white/90 p-16 md:p-20 lg:p-24 text-center shadow-[0_40px_90px_-70px_rgba(15,23,42,0.45)] backdrop-blur-xl dark:border-slate-700 dark:bg-slate-900/80">
            <p className="mb-16 md:mb-20 lg:mb-24 text-xl md:text-2xl lg:text-3xl text-white/90 font-medium">
              {language === "es"
                ? "Estamos trabajando en esta funcionalidad avanzada que permitirá:"
                : "We are working on this advanced feature that will allow:"}
            </p>

            <ul className="space-y-12 md:space-y-16 lg:space-y-20 text-lg md:text-xl lg:text-2xl leading-relaxed">
              {features.map((item, index) => (
                <li
                  key={item}
                  className="flex items-center gap-6 md:gap-8 lg:gap-10 text-white max-w-5xl mx-auto"
                >
                  <span className="flex h-10 w-10 md:h-12 md:w-12 lg:h-14 lg:w-14 items-center justify-center rounded-full bg-gradient-to-br from-[var(--anclora-primary)] to-[var(--anclora-secondary)] text-base md:text-lg lg:text-xl font-bold text-white shadow-lg flex-shrink-0">
                    {index + 1}
                  </span>
                  <span className="text-left leading-relaxed flex-1">
                    {item}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="w-full max-w-4xl mx-auto rounded-2xl border border-white/40 bg-gradient-to-r from-[var(--anclora-primary)]/15 to-[var(--anclora-secondary)]/10 p-10 md:p-14 lg:p-16 text-center backdrop-blur-md dark:border-slate-700 dark:from-slate-800/70 dark:to-slate-900/70">
            <p className="flex items-center justify-center gap-4 md:gap-6 text-lg md:text-xl lg:text-2xl text-white">
              <span className="flex h-6 w-6 md:h-8 md:w-8 items-center justify-center rounded-full bg-gradient-to-r from-[var(--anclora-primary)] to-[var(--anclora-secondary)] text-base md:text-lg font-bold text-white">
                i
              </span>
              {language === "es"
                ? "Esta página estará disponible próximamente con todas las funcionalidades de ingesta avanzada."
                : "This page will be available soon with all advanced ingestion features."}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
