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
    <div className="container-app space-y-10 py-12 lg:py-16">
      <section className="card relative overflow-hidden border-2 border-white/20 bg-white p-10 text-center text-slate-900 shadow-[0_40px_80px_-60px_rgba(15,23,42,0.35)] dark:border-slate-800 dark:bg-slate-900 dark:text-white">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[var(--anclora-primary)]/20 via-transparent to-[var(--anclora-secondary)]/20 dark:from-[var(--anclora-primary)]/30 dark:to-[var(--anclora-secondary)]/30" />
        <div className="pointer-events-none absolute inset-x-10 -bottom-24 h-48 rounded-full bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.6),transparent)] opacity-60 blur-3xl dark:bg-[radial-gradient(circle_at_top,rgba(148,163,184,0.18),transparent)]" />

        <div className="relative mx-auto flex max-w-4xl flex-col items-center gap-10">
          <div className="flex justify-center">
            <div className="rounded-full border border-white/50 bg-white/80 p-6 text-5xl shadow-inner dark:border-white/10 dark:bg-slate-800/60">
              <span role="img" aria-label="advanced ingestion">
                ??
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/40 bg-white/75 px-4 py-2 text-sm font-semibold text-[var(--anclora-primary)] shadow-sm dark:border-white/20 dark:bg-white/10 dark:text-white">
              <span className="rounded-full bg-white/80 px-2 py-0.5 text-xs font-semibold text-[var(--anclora-primary)] dark:bg-white/20 dark:text-white">
                PRO
              </span>
              <span>{language === "es" ? "Funcionalidad Premium" : "Premium Feature"}</span>
            </div>

            <h1 className="text-4xl font-semibold">
              {language === "es" ? "Ingesta Avanzada" : "Advanced Ingestion"}
            </h1>

            <p className="text-lg text-slate-600 dark:text-slate-300">
              {language === "es" ? "En desarrollo" : "Under development"}
            </p>
          </div>

          <div className="w-full rounded-3xl border border-white/40 bg-white/90 p-10 text-center shadow-[0_40px_90px_-70px_rgba(15,23,42,0.45)] backdrop-blur-xl dark:border-slate-700 dark:bg-slate-900/80 md:px-16 md:py-14">
            <p className="mb-6 text-lg text-slate-700 dark:text-slate-200 md:text-xl">
              {language === "es"
                ? "Estamos trabajando en esta funcionalidad avanzada que permitira:"
                : "We are working on this advanced feature that will allow:"}
            </p>

            <ul className="space-y-5 text-base leading-relaxed md:text-lg">
              {features.map((item) => (
                <li
                  key={item}
                  className="flex flex-col items-center gap-3 text-slate-800 text-center dark:text-slate-100"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--anclora-primary)]/15 text-lg text-[var(--anclora-primary)] dark:bg-[var(--anclora-primary)]/25 dark:text-[var(--anclora-secondary)]">
                    V
                  </span>
                  <span className="max-w-3xl">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="w-full rounded-2xl border border-white/40 bg-[var(--anclora-primary)]/10 p-4 text-sm text-[var(--anclora-primary)] backdrop-blur-md dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200">
            <p>
              ??{" "}
              {language === "es"
                ? "Esta pagina estara disponible proximamente con todas las funcionalidades de ingesta avanzada."
                : "This page will be available soon with all advanced ingestion features."}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
