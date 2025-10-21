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
      <div className="absolute inset-0 bg-linear-to-br from-[#4926FF] via-[#9123FF] to-[#02B8FF]" />
      <div className="absolute inset-0 bg-linear-to-b from-transparent via-black/40 to-black/75" />
      <div className="container-app relative flex min-h-[calc(100vh-200px)] items-center justify-center">
        <div className="flex max-w-3xl flex-col items-center gap-8 text-center text-white">
          <div className="flex justify-center">
            <div className="rounded-full bg-white/15 p-6 text-white backdrop-blur-sm">
              <span className="block text-5xl">⚗️</span>
            </div>
          </div>

          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full bg-black/30 px-4 py-2 text-sm font-semibold backdrop-blur">
              <span className="rounded-full bg-white/30 px-2 py-0.5 text-xs font-semibold text-white">
                PRO
              </span>
              <span>{language === 'es' ? 'Funcionalidad Premium' : 'Premium Feature'}</span>
            </div>

            <h1 className="text-4xl font-semibold">{language === 'es' ? 'Ingesta Avanzada' : 'Advanced Ingestion'}</h1>

            <p className="text-lg text-white/80">
              {language === 'es' ? 'En desarrollo' : 'Under development'}
            </p>
          </div>

          <div className="w-full rounded-3xl border border-white/15 bg-white/12 p-10 text-left shadow-[0_45px_110px_-60px_rgba(4,0,48,0.65)] backdrop-blur-xl">
            <p className="mb-6 text-lg text-white/85">
              {language === 'es'
                ? 'Estamos trabajando en esta funcionalidad avanzada que permitirá:'
                : 'We are working on this advanced feature that will allow:'}
            </p>

            <ul className="space-y-3">
              {features.map((item) => (
                <li key={item} className="flex items-start gap-3 text-white/85">
                  <span className="mt-1 text-lime-300">✓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="w-full rounded-2xl border border-white/15 bg-black/30 p-4 text-sm text-white/80 backdrop-blur">
            <p>
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
