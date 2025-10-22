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
    <div className="container-app space-y-6 py-6">
      {/* Background gradient and decorative elements */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[var(--anclora-primary)]/20 via-transparent to-[var(--anclora-secondary)]/20 dark:from-[var(--anclora-primary)]/30 dark:to-[var(--anclora-secondary)]/30" />
      <div className="pointer-events-none absolute inset-x-10 -bottom-24 h-48 rounded-full bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.6),transparent)] opacity-60 blur-3xl dark:bg-[radial-gradient(circle_at_top,rgba(148,163,184,0.18),transparent)]" />
      <div className="pointer-events-none absolute -top-20 -right-20 h-32 w-32 rounded-full bg-gradient-to-br from-[var(--anclora-primary)]/30 to-[var(--anclora-secondary)]/20 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-16 -left-16 h-24 w-24 rounded-full bg-gradient-to-tr from-[var(--anclora-secondary)]/25 to-[var(--anclora-primary)]/15 blur-xl" />
      <div className="pointer-events-none absolute top-1/2 -left-12 h-16 w-16 rounded-full bg-gradient-to-r from-[var(--anclora-primary)]/20 to-transparent blur-lg" />

      {/* Main content sections */}
      <section className="w-full max-w-6xl mx-auto card relative overflow-hidden bg-white/90 dark:bg-slate-900/80 p-6 md:p-8 lg:p-10 shadow-xl">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent dark:from-white/5" />
        <div className="relative text-center">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-white via-white to-white/80 bg-clip-text text-transparent mb-4 md:mb-6">
            {language === "es" ? "Ingesta Avanzada" : "Advanced Ingestion"}
          </h1>
          <p className="text-lg md:text-xl text-white/70 leading-relaxed">
            {language === "es"
              ? "Funcionalidad avanzada para la ingesta masiva y procesamiento de documentos a gran escala. Actualmente en desarrollo."
              : "Advanced feature for massive document ingestion and large-scale processing. Currently under development."}
          </p>
        </div>
      </section>

      <section className="w-full max-w-6xl mx-auto card relative overflow-hidden bg-white/90 dark:bg-slate-900/80 p-6 md:p-8 lg:p-10 shadow-xl flex-1 flex flex-col justify-center min-h-0">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent dark:from-white/5" />
        <div className="relative text-center">
          <p className="mb-6 md:mb-8 text-xl md:text-2xl lg:text-3xl text-white/90 font-medium">
            {language === "es"
              ? "Estamos trabajando en esta funcionalidad avanzada que permitirá:"
              : "We are working on this advanced feature that will allow:"}
          </p>
          <ul className="space-y-4 md:space-y-6 lg:space-y-8 text-lg md:text-xl lg:text-2xl leading-relaxed overflow-y-auto">
            {features.map((item) => (
              <li
                key={item}
                className="flex items-start gap-4 md:gap-6 text-white"
              >
                <span className="flex h-8 w-8 md:h-10 md:w-10 items-center justify-center rounded-full bg-gradient-to-br from-[var(--anclora-primary)] to-[var(--anclora-secondary)] text-base md:text-lg font-bold text-white shadow-lg flex-shrink-0">
                  ✓
                </span>
                <span className="text-left leading-relaxed flex-1">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="w-full max-w-6xl mx-auto card relative overflow-hidden bg-gradient-to-r from-[var(--anclora-primary)]/15 to-[var(--anclora-secondary)]/10 dark:from-slate-800/70 dark:to-slate-900/70 p-4 md:p-6 lg:p-8 shadow-xl backdrop-blur-md">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent dark:from-white/5" />
        <div className="relative text-center">
          <p className="flex items-center justify-center gap-3 md:gap-4 text-lg md:text-xl lg:text-2xl text-white">
            <span className="flex h-6 w-6 md:h-8 md:w-8 items-center justify-center rounded-full bg-gradient-to-r from-[var(--anclora-primary)] to-[var(--anclora-secondary)] text-base md:text-lg font-bold text-white">
              i
            </span>
            {language === "es"
              ? "Esta página estará disponible próximamente con todas las funcionalidades de ingesta avanzada."
              : "This page will be available soon with all advanced ingestion features."}
          </p>
        </div>
      </section>
    </div>
  );
}
