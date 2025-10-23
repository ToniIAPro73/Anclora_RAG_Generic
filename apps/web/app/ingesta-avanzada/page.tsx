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
      {/* Header section */}
      <section className="card bg-white dark:bg-slate-800 p-6 shadow-md">
        <div className="text-left space-y-3">
          <h1 className="text-3xl font-semibold text-gray-900 dark:text-slate-100">
            {language === "es" ? "Ingesta Avanzada" : "Advanced Ingestion"}
          </h1>
          <p className="text-gray-600 dark:text-slate-300">
            {language === "es"
              ? "Funcionalidad avanzada para la ingesta masiva y procesamiento de documentos a gran escala. Actualmente en desarrollo."
              : "Advanced feature for massive document ingestion and large-scale processing. Currently under development."}
          </p>
        </div>
      </section>

      {/* Features section */}
      <section className="card bg-white dark:bg-slate-800 p-6 shadow-md">
        <div className="text-left space-y-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-slate-100">
            {language === "es"
              ? "Estamos trabajando en esta funcionalidad avanzada que permitirá:"
              : "We are working on this advanced feature that will allow:"}
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {features.map((item, index) => (
              <div
                key={index}
                className="flex items-start gap-3 text-gray-700 dark:text-slate-300"
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-anclora-primary text-white text-sm font-bold flex-shrink-0 mt-0.5">
                  ✓
                </span>
                <span className="text-left leading-relaxed">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Coming soon section */}
      <section className="card bg-anclora-primary/10 dark:bg-slate-800/50 p-6 shadow-md border-2 border-anclora-primary/20">
        <div className="text-left">
          <p className="flex items-center gap-3 text-anclora-primary dark:text-anclora-secondary">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-anclora-primary text-white text-sm font-bold">
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
