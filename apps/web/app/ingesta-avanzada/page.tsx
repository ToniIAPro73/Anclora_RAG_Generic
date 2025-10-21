"use client";

import { useUISettings } from '@/components/ui-settings-context';

export default function AdvancedIngestionPage() {
  const { language } = useUISettings();

  const features = [
    language === 'es'
      ? 'Ingesta masiva de documentos (lotes de hasta 1000 archivos)'
      : 'Massive document ingestion (batches of up to 1000 files)',
    language === 'es'
      ? 'Importación desde repositorios GitHub'
      : 'Import from GitHub repositories',
    language === 'es'
      ? 'Conexión con fuentes de datos estructuradas (APIs, bases de datos)'
      : 'Connection to structured data sources (APIs, databases)',
    language === 'es'
      ? 'Pipeline de procesamiento asíncrono con monitorización en tiempo real'
      : 'Asynchronous processing pipeline with real-time monitoring',
  ];

  return (
    <div className="relative min-h-[calc(100vh-200px)] overflow-hidden py-16">
      <div className="absolute inset-0 bg-black/10 backdrop-blur-sm dark:bg-black/40" />
      <div className="container-app relative flex min-h-[calc(100vh-200px)] items-center justify-center">
        <div className="flex max-w-3xl flex-col items-center gap-8 text-center">
          <div className="flex justify-center">
            <div className="rounded-full bg-anclora-primary/15 p-6 text-anclora-primary dark:bg-anclora-primary/25 dark:text-anclora-secondary">
              <span className="block text-5xl">⚗️</span>
            </div>
          </div>

          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/70 px-4 py-2 text-anclora-primary shadow-sm dark:bg-white/10 dark:text-white">
              <span className="rounded-full bg-white/80 px-2 py-0.5 text-xs font-semibold text-anclora-primary dark:bg-white/20 dark:text-white">
                PRO
              </span>
              <span className="text-sm font-semibold">
                {language === 'es' ? 'Funcionalidad Premium' : 'Premium Feature'}
              </span>
            </div>

            <h1 className="text-4xl font-semibold text-slate-900 dark:text-white">
              {language === 'es' ? 'Ingesta Avanzada' : 'Advanced Ingestion'}
            </h1>

            <p className="text-lg text-slate-600 dark:text-slate-300">
              {language === 'es' ? 'En desarrollo' : 'Under development'}
            </p>
          </div>

          <div className="w-full rounded-3xl border border-white/40 bg-white/90 p-10 text-left shadow-[0_35px_90px_-60px_rgba(15,23,42,0.55)] dark:border-white/10 dark:bg-[#0B1424]/90 dark:text-slate-100">
            <p className="mb-6 text-lg text-slate-800 dark:text-slate-200">
              {language === 'es'
                ? 'Estamos trabajando en esta funcionalidad avanzada que permitirá:'
                : 'We are working on this advanced feature that will allow:'}
            </p>

            <ul className="space-y-3">
              {features.map((item) => (
                <li key={item} className="flex items-start gap-3 text-slate-800 dark:text-slate-100">
                  <span className="mt-1 text-green-500">✓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="w-full rounded-2xl border border-blue-200 bg-blue-50/90 p-4 text-blue-900 shadow-sm dark:border-blue-900 dark:bg-blue-950/50 dark:text-blue-200">
            <p className="text-sm">
              💡{' '}
              {language === 'es'
                ? 'Esta página estará disponible próximamente con todas las funcionalidades de ingesta avanzada.'
                : 'This page will be available soon with all advanced ingestion features.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
