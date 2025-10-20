'use client';

import { useUISettings } from '@/components/ui-settings-context';

export default function AdvancedIngestionPage() {
  const { language } = useUISettings();

  return (
    <div className="container-app flex min-h-[calc(100vh-200px)] items-center justify-center py-12">
      <div className="text-center space-y-6 max-w-2xl">
        {/* Icono */}
        <div className="flex justify-center">
          <div className="rounded-full bg-gradient-to-br from-anclora-primary/20 to-anclora-secondary/20 p-8">
            <svg
              className="h-24 w-24 text-anclora-primary"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
              />
            </svg>
          </div>
        </div>

        {/* Título */}
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-anclora-primary/10 px-4 py-2">
            <span className="rounded-full bg-anclora-primary/20 px-2 py-0.5 text-xs font-semibold text-anclora-primary">
              PRO
            </span>
            <span className="text-sm font-semibold text-anclora-primary">
              {language === 'es' ? 'Funcionalidad Premium' : 'Premium Feature'}
            </span>
          </div>

          <h1 className="text-4xl font-bold text-gray-900 dark:text-slate-100">
            {language === 'es' ? 'Ingesta Avanzada' : 'Advanced Ingestion'}
          </h1>

          <p className="text-xl text-gray-600 dark:text-slate-400">
            {language === 'es' ? 'En desarrollo' : 'Under development'}
          </p>
        </div>

        {/* Descripción */}
        <div className="rounded-xl border-2 border-anclora-primary/20 bg-white/60 dark:bg-slate-800/60 p-8 shadow-lg">
          <p className="text-lg text-gray-700 dark:text-slate-300 mb-6">
            {language === 'es'
              ? 'Estamos trabajando en esta funcionalidad avanzada que permitirá:'
              : 'We are working on this advanced feature that will allow:'}
          </p>

          <ul className="space-y-3 text-left">
            <li className="flex items-start gap-3">
              <span className="mt-1 text-green-500">✓</span>
              <span className="text-gray-700 dark:text-slate-300">
                {language === 'es'
                  ? 'Ingesta masiva de documentos (lotes de hasta 1000 archivos)'
                  : 'Massive document ingestion (batches of up to 1000 files)'}
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-1 text-green-500">✓</span>
              <span className="text-gray-700 dark:text-slate-300">
                {language === 'es'
                  ? 'Importación desde repositorios GitHub'
                  : 'Import from GitHub repositories'}
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-1 text-green-500">✓</span>
              <span className="text-gray-700 dark:text-slate-300">
                {language === 'es'
                  ? 'Conexión con fuentes de datos estructuradas (APIs, bases de datos)'
                  : 'Connection to structured data sources (APIs, databases)'}
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-1 text-green-500">✓</span>
              <span className="text-gray-700 dark:text-slate-300">
                {language === 'es'
                  ? 'Pipeline de procesamiento asíncrono con monitorización en tiempo real'
                  : 'Asynchronous processing pipeline with real-time monitoring'}
              </span>
            </li>
          </ul>
        </div>

        {/* Nota temporal */}
        <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4">
          <p className="text-sm text-blue-800 dark:text-blue-400">
            💡 {language === 'es'
              ? 'Esta página estará disponible próximamente con todas las funcionalidades de ingesta avanzada.'
              : 'This page will be available soon with all advanced ingestion features.'}
          </p>
        </div>
      </div>
    </div>
  );
}
