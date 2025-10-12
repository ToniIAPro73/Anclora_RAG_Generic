'use client';

import { FormEvent, useMemo, useState, useEffect } from 'react';
import {
  useUISettings,
  AccentId,
  AccentValidationIssue,
} from '@/components/ui-settings-context';

const ERROR_MESSAGES: Record<
  'es' | 'en',
  Record<AccentValidationIssue, string>
> = {
  es: {
    invalid_format: 'El formato de color no es válido. Usa códigos hexadecimales como #112233.',
    primary_light_contrast:
      'El color primario no tiene contraste suficiente sobre fondos claros.',
    primary_dark_contrast:
      'El color primario no tiene contraste suficiente sobre fondos oscuros.',
    secondary_light_contrast:
      'El color secundario no tiene contraste suficiente sobre fondos claros.',
    secondary_dark_contrast:
      'El color secundario no tiene contraste suficiente sobre fondos oscuros.',
    primary_secondary_contrast:
      'Los colores primario y secundario son demasiado similares. Aumenta el contraste entre ellos.',
  },
  en: {
    invalid_format: 'Invalid color format. Use hexadecimal codes such as #112233.',
    primary_light_contrast:
      'The primary color lacks sufficient contrast on light backgrounds.',
    primary_dark_contrast:
      'The primary color lacks sufficient contrast on dark backgrounds.',
    secondary_light_contrast:
      'The secondary color lacks sufficient contrast on light backgrounds.',
    secondary_dark_contrast:
      'The secondary color lacks sufficient contrast on dark backgrounds.',
    primary_secondary_contrast:
      'Primary and secondary colors are too similar. Increase the contrast between them.',
  },
};

const HEADLINE_OPTIONS = [
  {
    id: 'rounded',
    label: { es: 'Tipografía redondeada', en: 'Rounded typography' },
    description: {
      es: 'Títulos suaves, ideales para experiencias amistosas y cercanas.',
      en: 'Smooth titles, ideal for friendly and approachable experiences.',
    },
  },
  {
    id: 'tech',
    label: { es: 'Estilo tecnológico', en: 'Tech uppercase' },
    description: {
      es: 'Títulos en mayúsculas con tracking amplio, perfectos para dashboards técnicos.',
      en: 'Uppercase titles with wide tracking, perfect for technical dashboards.',
    },
  },
] as const;

export default function ConfigurationPage() {
  const {
    language,
    accent,
    accentPresets,
    customAccent,
    setAccent,
    setCustomAccent,
    appTitle,
    tagline,
    setAppTitle,
    setTagline,
    headlineStyle,
    setHeadlineStyle,
  } = useUISettings();
  const text = useMemo(
    () =>
      language === 'es'
        ? {
            heroTitle: 'Configuración del Dashboard',
            heroSubtitle:
              'Personaliza el branding de tu espacio Anclora manteniendo legibilidad, accesibilidad y coherencia visual.',
            identityTitle: 'Identidad visual',
            identityHelper:
              'Ajusta el título y la descripción visible del dashboard. Siempre incluiremos una referencia a Anclora para preservar la marca.',
            accentTitle: 'Tema cromático',
            accentHelper:
              'Selecciona un tema validado o define tus propios colores. Comprobamos el contraste automáticamente para garantizar la accesibilidad.',
            headlineTitle: 'Estilo de encabezados',
            feedbackTitle: 'Estado de la configuración',
            customLabel: 'Colores personalizados',
            applyCustom: 'Aplicar colores',
            reset: 'Restablecer valores por defecto',
            identitySaved: 'Identidad actualizada correctamente.',
            invalidConfig:
              'La configuración propuesta no cumple los requisitos de accesibilidad. Recuperamos los colores predeterminados.',
          }
        : {
            heroTitle: 'Dashboard configuration',
            heroSubtitle:
              'Customize the branding of your Anclora workspace while preserving legibility, accessibility and visual coherence.',
            identityTitle: 'Visual identity',
            identityHelper:
              'Adjust the dashboard title and description. We always keep a reference to Anclora to preserve the brand.',
            accentTitle: 'Color theme',
            accentHelper:
              'Pick a validated theme or define your own colors. We automatically check contrast to ensure accessibility.',
            headlineTitle: 'Headline style',
            feedbackTitle: 'Configuration status',
            customLabel: 'Custom colors',
            applyCustom: 'Apply colors',
            reset: 'Restore defaults',
            identitySaved: 'Identity updated successfully.',
            invalidConfig:
              'The requested configuration does not meet accessibility requirements. Defaults restored.',
          },
    [language],
  );

  const [customPrimary, setCustomPrimary] = useState(customAccent?.primary ?? '#2563EB');
  const [customSecondary, setCustomSecondary] = useState(
    customAccent?.secondary ?? '#38BDF8',
  );
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (accent === 'custom' && customAccent) {
      setCustomPrimary(customAccent.primary);
      setCustomSecondary(customAccent.secondary);
    } else if (accent !== 'custom') {
      const preset = accentPresets[accent as AccentId];
      if (preset) {
        setCustomPrimary(preset.primary);
        setCustomSecondary(preset.secondary);
      }
    }
  }, [accent, customAccent, accentPresets]);

  const handlePresetSelect = (preset: AccentId) => {
    setAccent(preset);
    setFeedback(null);
  };

  const handleCustomSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const issues = setCustomAccent({
      primary: customPrimary,
      secondary: customSecondary,
    });
    if (issues.length === 0) {
      setFeedback(null);
      return;
    }
    const messages = issues.map((issue) => ERROR_MESSAGES[language][issue]);
    setFeedback([text.invalidConfig, ...messages].join('\n'));
    setCustomPrimary('#D946EF');
    setCustomSecondary('#06B6D4');
  };

  const handleReset = () => {
    setAccent('aurora');
    setCustomPrimary('#D946EF');
    setCustomSecondary('#06B6D4');
    setFeedback(null);
  };

  return (
    <div className="container-app py-6 space-y-6">
      <section className="card relative overflow-hidden bg-white p-6 shadow-xl">
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-r from-anclora-primary/10 via-transparent to-anclora-secondary/10" />
        <div className="relative space-y-3">
          <h1 className="text-3xl font-semibold text-gray-900">{text.heroTitle}</h1>
          <p className="text-gray-600">{text.heroSubtitle}</p>
        </div>
      </section>

      <section className="card bg-white p-6 shadow-md">
        <div className="flex flex-col gap-3 border-b border-gray-100 pb-4">
          <h2 className="card-header text-gray-900">{text.identityTitle}</h2>
          <p className="text-sm text-gray-500">{text.identityHelper}</p>
        </div>
        <form
          className="mt-4 grid gap-4 md:grid-cols-2"
          onSubmit={(event) => {
            event.preventDefault();
            setFeedback(text.identitySaved);
          }}
        >
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">
              {language === 'es' ? 'Título del dashboard' : 'Dashboard title'}
            </label>
            <input
              type="text"
              value={appTitle}
              onChange={(event) => setAppTitle(event.target.value)}
              className="input-control"
              placeholder="Anclora RAG"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">
              {language === 'es' ? 'Descripción' : 'Tagline'}
            </label>
            <input
              type="text"
              value={tagline}
              onChange={(event) => setTagline(event.target.value)}
              className="input-control"
              placeholder="LLM + Embeddings + Qdrant"
            />
          </div>
        </form>
      </section>

      <section className="card bg-white p-6 shadow-md">
        <div className="flex flex-col gap-3 border-b border-gray-100 pb-4">
          <h2 className="card-header text-gray-900">{text.accentTitle}</h2>
          <p className="text-sm text-gray-500">{text.accentHelper}</p>
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {(Object.keys(accentPresets) as AccentId[]).map((preset) => {
            const colors = accentPresets[preset];
            const isActive = accent === preset;
            return (
              <button
                key={preset}
                onClick={() => handlePresetSelect(preset)}
                className={`rounded-xl border p-4 text-left shadow-sm transition-colors ${
                  isActive
                    ? 'border-anclora-primary ring-2 ring-anclora-primary'
                    : 'border-gray-200 hover:border-anclora-secondary'
                }`}
                type="button"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-gray-900">{colors.label}</span>
                  {isActive && (
                    <span className="text-xs font-semibold text-anclora-primary">
                      {language === 'es' ? 'Activo' : 'Active'}
                    </span>
                  )}
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <span
                    className="h-8 w-8 rounded-full border border-white shadow"
                    style={{ background: colors.primary }}
                  />
                  <span
                    className="h-8 w-8 rounded-full border border-white shadow"
                    style={{ background: colors.secondary }}
                  />
                </div>
              </button>
            );
          })}
        </div>

        <form className="mt-6 space-y-4" onSubmit={handleCustomSubmit}>
          <h3 className="text-sm font-semibold text-gray-700">{text.customLabel}</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 p-4">
              <div>
                <p className="text-sm font-semibold text-gray-700">
                  {language === 'es' ? 'Primario' : 'Primary'}
                </p>
                <p className="text-xs text-gray-500">
                  {language === 'es' ? 'For buttons & highlights' : 'Para botones y destacados'}
                </p>
              </div>
              <input
                type="color"
                value={customPrimary}
                onChange={(event) => setCustomPrimary(event.target.value)}
                className="h-10 w-16 cursor-pointer rounded border border-gray-300 bg-white"
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 p-4">
              <div>
                <p className="text-sm font-semibold text-gray-700">
                  {language === 'es' ? 'Secundario' : 'Secondary'}
                </p>
                <p className="text-xs text-gray-500">
                  {language === 'es' ? 'Para acentos y trazos' : 'For accents and outlines'}
                </p>
              </div>
              <input
                type="color"
                value={customSecondary}
                onChange={(event) => setCustomSecondary(event.target.value)}
                className="h-10 w-16 cursor-pointer rounded border border-gray-300 bg-white"
              />
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button type="submit" className="button-primary">
              {text.applyCustom}
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:border-anclora-secondary"
            >
              {text.reset}
            </button>
          </div>
        </form>
      </section>

      <section className="card bg-white p-6 shadow-md">
        <h2 className="card-header border-b border-gray-100 pb-4 text-gray-900">
          {text.headlineTitle}
        </h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {HEADLINE_OPTIONS.map((option) => {
            const isActive = headlineStyle === option.id;
            return (
              <button
                key={option.id}
                onClick={() => setHeadlineStyle(option.id)}
                className={`text-left rounded-xl border p-4 transition-colors ${
                  isActive
                    ? 'border-anclora-primary ring-2 ring-anclora-primary'
                    : 'border-gray-200 hover:border-anclora-secondary'
                }`}
                type="button"
              >
                <p className="font-semibold text-gray-900">{option.label[language]}</p>
                <p className="mt-2 text-sm text-gray-500">{option.description[language]}</p>
              </button>
            );
          })}
        </div>
      </section>

      <section className="card bg-white p-6 shadow-md">
        <h2 className="card-header text-gray-900">{text.feedbackTitle}</h2>
        <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
          <p>
            {language === 'es'
              ? 'Estado actual del tema:'
              : 'Current theme status:'}{' '}
            <span className="font-semibold text-anclora-primary">
              {accent === 'custom'
                ? language === 'es'
                  ? 'Personalizado'
                  : 'Custom'
                : accentPresets[accent as AccentId]?.label ?? 'Aurora'}
            </span>
          </p>
          <p className="mt-2">
            {language === 'es'
              ? 'Título visible:'
              : 'Visible title:'}{' '}
            <span className="font-semibold text-gray-900">{appTitle}</span>
          </p>
          <p className="mt-2">
            {language === 'es' ? 'Lema actual:' : 'Tagline:'}{' '}
            <span className="font-semibold text-gray-900">{tagline}</span>
          </p>
          {feedback && (
            <div className="mt-4 rounded-lg border border-amber-300 bg-amber-50 p-3 text-amber-900 whitespace-pre-line">
              {feedback}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
