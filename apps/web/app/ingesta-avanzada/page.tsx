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
    <div className="container-app space-y-3 py-3 lg:py-4 xl:py-5">
      <section className="card relative overflow-hidden border-2 border-white/20 bg-white p-4 text-center text-slate-900 shadow-[0_40px_80px_-60px_rgba(15,23,42,0.35)] dark:border-slate-800 dark:bg-slate-900 dark:text-white">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[var(--anclora-primary)]/20 via-transparent to-[var(--anclora-secondary)]/20 dark:from-[var(--anclora-primary)]/30 dark:to-[var(--anclora-secondary)]/30" />
        <div className="pointer-events-none absolute inset-x-10 -bottom-24 h-48 rounded-full bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.6),transparent)] opacity-60 blur-3xl dark:bg-[radial-gradient(circle_at_top,rgba(148,163,184,0.18),transparent)]" />

        {/* Purple gradient decorative elements */}
        <div className="pointer-events-none absolute -top-20 -right-20 h-32 w-32 rounded-full bg-gradient-to-br from-[var(--anclora-primary)]/30 to-[var(--anclora-secondary)]/20 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-16 h-24 w-24 rounded-full bg-gradient-to-tr from-[var(--anclora-secondary)]/25 to-[var(--anclora-primary)]/15 blur-xl" />
        <div className="pointer-events-none absolute top-1/2 -left-12 h-16 w-16 rounded-full bg-gradient-to-r from-[var(--anclora-primary)]/20 to-transparent blur-lg" />

        <div className="relative mx-auto flex max-w-3xl flex-col items-center gap-3 md:gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/40 bg-white/75 px-3 py-1 text-xs font-semibold text-[var(--anclora-primary)] shadow-sm dark:border-white/20 dark:bg-white/10 dark:text-white">
              <span className="rounded-full bg-white/80 px-1.5 py-0.5 text-xs font-semibold text-[var(--anclora-primary)] dark:bg-white/20 dark:text-white">
                PRO
              </span>
              <span>
                {language === "es"
                  ? "Funcionalidad Premium"
                  : "Premium Feature"}
              </span>
            </div>

            <h1 className="text-lg md:text-xl lg:text-2xl font-semibold">
              {language === "es" ? "Ingesta Avanzada" : "Advanced Ingestion"}
            </h1>

            <p className="text-sm text-slate-600 dark:text-slate-300">
              {language === "es" ? "En desarrollo" : "Under development"}
            </p>
          </div>

          <div className="w-full rounded-2xl border border-white/40 bg-white/90 p-3 text-center shadow-[0_40px_90px_-70px_rgba(15,23,42,0.45)] backdrop-blur-xl dark:border-slate-700 dark:bg-slate-900/80 md:px-4 md:py-4">
            <p className="mb-2 text-xs text-slate-700 dark:text-slate-200 md:text-sm">
              {language === "es"
                ? "Estamos trabajando en esta funcionalidad avanzada que permitirá:"
                : "We are working on this advanced feature that will allow:"}
            </p>

            <ul className="space-y-1.5 text-xs leading-tight">
              {features.map((item) => (
                <li
                  key={item}
                  className="flex items-center justify-center gap-2 text-slate-800 dark:text-slate-100"
                >
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-gradient-to-br from-[var(--anclora-primary)] to-[var(--anclora-secondary)] text-xs font-bold text-white shadow-sm">
                    ✓
                  </span>
                  <span className="max-w-xl text-center leading-tight">
                    {item}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="w-full rounded-xl border border-white/40 bg-gradient-to-r from-[var(--anclora-primary)]/15 to-[var(--anclora-secondary)]/10 p-2 text-xs text-[var(--anclora-primary)] backdrop-blur-md dark:border-slate-700 dark:from-slate-800/70 dark:to-slate-900/70 dark:text-slate-200">
            <p className="flex items-center justify-center gap-2">
              <span className="flex h-3 w-3 items-center justify-center rounded-full bg-gradient-to-r from-[var(--anclora-primary)] to-[var(--anclora-secondary)] text-xs font-bold text-white">
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
