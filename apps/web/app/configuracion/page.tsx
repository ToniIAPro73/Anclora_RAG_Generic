'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import {
  useUISettings,
  AccentId,
  AccentValidationIssue,
  BodyFont,
  DensityMode,
} from '@/components/ui-settings-context';

const ERROR_MESSAGES: Record<'es' | 'en', Record<AccentValidationIssue, string>> = {
  es: {
    invalid_format: 'El formato de color no es válido. Utiliza códigos hexadecimales como #112233.',
    primary_light_contrast:
      'El color primario no tiene suficiente contraste sobre fondos claros.',
    primary_dark_contrast:
      'El color primario no tiene suficiente contraste sobre fondos oscuros.',
    secondary_light_contrast:
      'El color secundario no tiene suficiente contraste sobre fondos claros.',
    secondary_dark_contrast:
      'El color secundario no tiene suficiente contraste sobre fondos oscuros.',
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
    id: 'rounded' as const,
    label: { es: 'Tipografía redondeada', en: 'Rounded typography' },
    description: {
      es: 'Títulos suaves, ideales para experiencias amistosas y cercanas.',
      en: 'Smooth titles, ideal for friendly and approachable experiences.',
    },
  },
  {
    id: 'tech' as const,
    label: { es: 'Estilo tecnológico', en: 'Tech uppercase' },
    description: {
      es: 'Títulos en mayúsculas con tracking amplio, perfectos para dashboards técnicos.',
      en: 'Uppercase titles with wide tracking, perfect for technical dashboards.',
    },
  },
] as const;

const FONT_OPTIONS: Array<{ id: BodyFont; label: { es: string; en: string }; sample: string }> = [
  {
    id: 'sans',
    label: { es: 'Sans (moderna)', en: 'Sans (modern)' },
    sample: 'Ag',
  },
  {
    id: 'serif',
    label: { es: 'Serif (editorial)', en: 'Serif (editorial)' },
    sample: 'Ag',
  },
  {
    id: 'mono',
    label: { es: 'Mono (código)', en: 'Mono (code)' },
    sample: '{}',
  },
];

const DENSITY_OPTIONS: Array<{
  id: DensityMode;
  label: { es: string; en: string };
  helper: { es: string; en: string };
}> = [
  {
    id: 'comfortable',
    label: { es: 'Cómodo', en: 'Comfortable' },
    helper: {
      es: 'Espaciado amplio para sesiones prolongadas.',
      en: 'Generous spacing for long work sessions.',
    },
  },
  {
    id: 'compact',
    label: { es: 'Compacto', en: 'Compact' },
    helper: {
      es: 'Reduce márgenes y paddings para pantallas pequeñas.',
      en: 'Tighter layout that fits smaller displays.',
    },
  },
];

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
    bodyFont,
    setBodyFont,
    density,
    setDensity,
  } = useUISettings();

  const text = useMemo(
    () =>
      language === 'es'
        ? {
            heroTitle: 'Configuración del dashboard',
            heroSubtitle:
              'Personaliza tu espacio Anclora preservando la accesibilidad, la legibilidad y la coherencia visual.',
            identityTitle: 'Identidad visual',
            identityHelper:
              'Ajusta el título visible en la cabecera. Máximo 30 caracteres para mantener un diseño equilibrado.',
            accentTitle: 'Tema cromático',
            accentHelper:
              'Elige un tema validado o define tus propios colores. Comprobamos automáticamente el contraste para garantizar la accesibilidad.',
            typographyTitle: 'Tipografía y estilo',
            layoutTitle: 'Distribución y espaciado',
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
              'Customize your Anclora workspace while preserving accessibility, legibility, and visual coherence.',
            identityTitle: 'Visual identity',
            identityHelper:
              'Adjust the title shown in the header. Maximum 30 characters to maintain a balanced design.',
            accentTitle: 'Color theme',
            accentHelper:
              'Pick a validated theme or define your own palette. We automatically check contrast to ensure accessibility.',
            typographyTitle: 'Typography & style',
            layoutTitle: 'Layout & spacing',
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
  const [customSecondary, setCustomSecondary] = useState(customAccent?.secondary ?? '#38BDF8');
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
    const presetColors = accentPresets[preset];
    setAccent(preset);
    if (presetColors) {
      setCustomPrimary(presetColors.primary);
      setCustomSecondary(presetColors.secondary);
    }
    setFeedback(null);
  };

  const handleCustomSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedPrimary = customPrimary.trim().toLowerCase();
    const normalizedSecondary = customSecondary.trim().toLowerCase();

    const presetMatch = (Object.keys(accentPresets) as AccentId[]).find((key) => {
      const preset = accentPresets[key];
      return (
        preset.primary.toLowerCase() === normalizedPrimary &&
        preset.secondary.toLowerCase() === normalizedSecondary
      );
    });

    if (presetMatch && accent !== 'custom') {
      setAccent(presetMatch);
      setFeedback(null);
      return;
    }

    const issues = setCustomAccent({
      primary: customPrimary,
      secondary: customSecondary,
    });
    if (issues.length === 0) {
      setFeedback(null);
      return;
    }
    const messages = [text.invalidConfig, ...issues.map((issue) => ERROR_MESSAGES[language][issue])];
    setFeedback(messages.join('\n'));
    // fallback to default accent colors
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
    <div className="container-app space-y-6 py-6">
      <section className="card relative overflow-hidden bg-white dark:bg-slate-800 p-6 shadow-xl">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-anclora-primary/10 via-transparent to-anclora-secondary/10" />
        <div className="relative space-y-3">
          <h1 className="text-3xl font-semibold text-gray-900 dark:text-slate-100">{text.heroTitle}</h1>
          <p className="text-gray-600 dark:text-slate-300">{text.heroSubtitle}</p>
        </div>
      </section>

      <section className="card bg-white dark:bg-slate-800 p-6 shadow-md">
        <div className="flex items-start justify-between gap-6">
          <div className="flex-1">
            <h2 className="card-header text-gray-900 dark:text-slate-100 mb-2">{text.identityTitle}</h2>
            <p className="text-sm text-gray-500 dark:text-slate-400">{text.identityHelper}</p>
          </div>
          <form
            className="w-80"
            onSubmit={(event) => {
              event.preventDefault();
              setFeedback(text.identitySaved);
            }}
          >
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 dark:text-slate-300">
                {language === 'es' ? 'Título del dashboard' : 'Dashboard title'}
              </label>
              <input
                type="text"
                value={appTitle}
                onChange={(event) => {
                  const value = event.target.value;
                  if (value.length <= 30) {
                    setAppTitle(value);
                  }
                }}
                className="input-control"
                placeholder="Anclora RAG"
                maxLength={30}
              />
              <p className="text-xs text-gray-500 dark:text-slate-400">
                {appTitle.length}/30 {language === 'es' ? 'caracteres' : 'characters'}
              </p>
            </div>
          </form>
        </div>
      </section>

      <section className="card bg-white dark:bg-slate-800 p-6 shadow-md">
        <div className="flex flex-col gap-3 border-b border-gray-100 dark:border-slate-700 pb-4">
          <h2 className="card-header text-gray-900 dark:text-slate-100">{text.accentTitle}</h2>
          <p className="text-sm text-gray-500 dark:text-slate-400">{text.accentHelper}</p>
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {(Object.keys(accentPresets) as AccentId[]).map((preset) => {
            const colors = accentPresets[preset];
            const isActive = accent === preset;
            return (
              <button
                key={preset}
                onClick={() => handlePresetSelect(preset)}
                type="button"
                className={`rounded-xl border p-4 text-left shadow-sm transition-colors ${
                  isActive
                    ? 'border-anclora-primary ring-2 ring-anclora-primary bg-white dark:bg-slate-700'
                    : 'border-gray-200 dark:border-slate-600 hover:border-anclora-secondary bg-white dark:bg-slate-700/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-gray-900 dark:text-slate-100">{colors.label}</span>
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
          <h3 className="text-sm font-semibold text-gray-700 dark:text-slate-300">{text.customLabel}</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex items-center justify-between rounded-lg border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700/50 p-4">
              <div>
                <p className="text-sm font-semibold text-gray-700 dark:text-slate-200">
                  {language === 'es' ? 'Primario' : 'Primary'}
                </p>
                <p className="text-xs text-gray-500 dark:text-slate-400">
                  {language === 'es' ? 'Botones y elementos destacados.' : 'Buttons and highlights.'}
                </p>
              </div>
              <input
                type="color"
                value={customPrimary}
                onChange={(event) => setCustomPrimary(event.target.value)}
                className="h-10 w-16 cursor-pointer rounded border border-gray-300 dark:border-slate-500 bg-white dark:bg-slate-800"
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700/50 p-4">
              <div>
                <p className="text-sm font-semibold text-gray-700 dark:text-slate-200">
                  {language === 'es' ? 'Secundario' : 'Secondary'}
                </p>
                <p className="text-xs text-gray-500 dark:text-slate-400">
                  {language === 'es' ? 'Acentos y elementos auxiliares.' : 'Accents and outlines.'}
                </p>
              </div>
              <input
                type="color"
                value={customSecondary}
                onChange={(event) => setCustomSecondary(event.target.value)}
                className="h-10 w-16 cursor-pointer rounded border border-gray-300 dark:border-slate-500 bg-white dark:bg-slate-800"
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
              className="rounded-lg border border-gray-200 dark:border-slate-600 px-4 py-2 text-sm font-semibold text-gray-700 dark:text-slate-300 transition-colors hover:border-anclora-secondary"
            >
              {text.reset}
            </button>
          </div>
        </form>
      </section>

      <section className="card bg-white dark:bg-slate-800 p-6 shadow-md">
        <div className="flex flex-col gap-3 border-b border-gray-100 dark:border-slate-700 pb-4">
          <h2 className="card-header text-gray-900 dark:text-slate-100">{text.typographyTitle}</h2>
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {FONT_OPTIONS.map((option) => {
            const isActive = bodyFont === option.id;
            return (
              <button
                key={option.id}
                onClick={() => setBodyFont(option.id)}
                type="button"
                className={`flex items-center justify-between rounded-xl border p-4 transition-colors ${
                  isActive
                    ? 'border-anclora-primary ring-2 ring-anclora-primary bg-white dark:bg-slate-700'
                    : 'border-gray-200 dark:border-slate-600 hover:border-anclora-secondary bg-white dark:bg-slate-700/50'
                }`}
              >
                <div>
                  <p className="font-semibold text-gray-900 dark:text-slate-100">{option.label[language]}</p>
                  <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
                    {language === 'es'
                      ? option.id === 'mono'
                        ? 'Ideal para mantener bloques de código alineados.'
                        : option.id === 'serif'
                        ? 'Aporta un tono editorial y formal.'
                        : 'Equilibrio entre legibilidad y modernidad.'
                      : option.id === 'mono'
                      ? 'Keeps code blocks aligned and readable.'
                      : option.id === 'serif'
                      ? 'Adds an editorial, formal tone.'
                      : 'Balanced choice for everyday dashboards.'}
                  </p>
                </div>
                <span
                  className="text-2xl font-semibold text-gray-700 dark:text-slate-300"
                  style={{
                    fontFamily:
                      option.id === 'mono'
                        ? '"JetBrains Mono", monospace'
                        : option.id === 'serif'
                        ? '"Source Serif Pro", serif'
                        : 'inherit',
                  }}
                >
                  {option.sample}
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-6 flex flex-col gap-3 border-t border-gray-100 dark:border-slate-700 pt-4">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-slate-300">{text.layoutTitle}</h3>
          <div className="grid gap-3 md:grid-cols-2">
            {DENSITY_OPTIONS.map((option) => {
              const isActive = density === option.id;
              return (
                <button
                  key={option.id}
                  onClick={() => setDensity(option.id)}
                  type="button"
                  className={`text-left rounded-xl border p-4 transition-colors ${
                    isActive
                      ? 'border-anclora-primary ring-2 ring-anclora-primary bg-white dark:bg-slate-700'
                      : 'border-gray-200 dark:border-slate-600 hover:border-anclora-secondary bg-white dark:bg-slate-700/50'
                  }`}
                >
                  <p className="font-semibold text-gray-900 dark:text-slate-100">{option.label[language]}</p>
                  <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">{option.helper[language]}</p>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <section className="card bg-white dark:bg-slate-800 p-6 shadow-md">
        <h2 className="card-header text-gray-900 dark:text-slate-100">{text.headlineTitle}</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {HEADLINE_OPTIONS.map((option) => {
            const isActive = headlineStyle === option.id;
            return (
              <button
                key={option.id}
                onClick={() => setHeadlineStyle(option.id)}
                type="button"
                className={`text-left rounded-xl border p-4 transition-colors ${
                  isActive
                    ? 'border-anclora-primary ring-2 ring-anclora-primary bg-white dark:bg-slate-700'
                    : 'border-gray-200 dark:border-slate-600 hover:border-anclora-secondary bg-white dark:bg-slate-700/50'
                }`}
              >
                <p className="font-semibold text-gray-900 dark:text-slate-100">{option.label[language]}</p>
                <p className="mt-2 text-sm text-gray-500 dark:text-slate-400">{option.description[language]}</p>
              </button>
            );
          })}
        </div>
      </section>

      <section className="card bg-white dark:bg-slate-800 p-6 shadow-md">
        <h2 className="card-header text-gray-900 dark:text-slate-100">{text.feedbackTitle}</h2>
        <div className="mt-4 rounded-xl border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700/50 p-4 text-sm text-gray-600 dark:text-slate-300">
          <p>
            {language === 'es' ? 'Estado actual del tema:' : 'Current theme status:'}{' '}
            <span className="font-semibold text-anclora-primary">
              {accent === 'custom'
                ? language === 'es'
                  ? 'Personalizado'
                  : 'Custom'
                : accentPresets[accent as AccentId]?.label ?? 'Aurora'}
            </span>
          </p>
          <p className="mt-2">
            {language === 'es' ? 'Título visible:' : 'Visible title:'}{' '}
            <span className="font-semibold text-gray-900 dark:text-slate-100">{appTitle}</span>
          </p>
          <p className="mt-2">
            {language === 'es' ? 'Lema actual:' : 'Tagline:'}{' '}
            <span className="font-semibold text-gray-900 dark:text-slate-100">{tagline}</span>
          </p>
          <p className="mt-2">
            {language === 'es' ? 'Fuente seleccionada:' : 'Selected font:'}{' '}
            <span className="font-semibold text-gray-900 dark:text-slate-100">
              {language === 'es'
                ? bodyFont === 'mono'
                  ? 'Monoespaciada'
                  : bodyFont === 'serif'
                  ? 'Serif'
                  : 'Sans'
                : bodyFont === 'mono'
                ? 'Mono'
                : bodyFont.charAt(0).toUpperCase() + bodyFont.slice(1)}
            </span>
          </p>
          <p className="mt-2">
            {language === 'es' ? 'Distribución:' : 'Layout density:'}{' '}
            <span className="font-semibold text-gray-900 dark:text-slate-100">
              {language === 'es'
                ? density === 'compact'
                  ? 'Compacta'
                  : 'Cómoda'
                : density === 'compact'
                ? 'Compact'
                : 'Comfortable'}
            </span>
          </p>
          {feedback && (
            <div className="mt-4 whitespace-pre-line rounded-lg border border-amber-300 bg-amber-50 p-3 text-amber-900">
              {feedback}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
