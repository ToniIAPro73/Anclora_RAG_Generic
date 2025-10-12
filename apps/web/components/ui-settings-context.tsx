'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from 'react';

type LanguageCode = 'es' | 'en';
type ThemeMode = 'light' | 'dark' | 'system';
type AccentId = 'aurora' | 'marina' | 'solstice';
type AccentSelection = AccentId | 'custom';
type HeadlineStyle = 'rounded' | 'tech';
type BodyFont = 'sans' | 'serif' | 'mono';
type DensityMode = 'comfortable' | 'compact';

interface UISettingsState {
  language: LanguageCode;
  theme: ThemeMode;
  accent: AccentSelection;
  customAccent?: { primary: string; secondary: string };
  appTitle: string;
  tagline: string;
  headlineStyle: HeadlineStyle;
  bodyFont: BodyFont;
  density: DensityMode;
}

interface AccentPreset {
  primary: string;
  secondary: string;
  ring: string;
}

type AccentValidationIssue =
  | 'primary_light_contrast'
  | 'primary_dark_contrast'
  | 'secondary_light_contrast'
  | 'secondary_dark_contrast'
  | 'primary_secondary_contrast'
  | 'invalid_format';

interface UISettingsContext extends UISettingsState {
  setLanguage: (language: LanguageCode) => void;
  setTheme: (theme: ThemeMode) => void;
  setAccent: (accent: AccentId) => void;
  setCustomAccent: (accent: { primary: string; secondary: string }) => AccentValidationIssue[];
  setAppTitle: (title: string) => void;
  setTagline: (tagline: string) => void;
  setHeadlineStyle: (style: HeadlineStyle) => void;
  setBodyFont: (font: BodyFont) => void;
  setDensity: (density: DensityMode) => void;
  accentPresets: Record<AccentId, AccentPreset & { label: string }>;
}

const STORAGE_KEY = 'anclora.uiSettings.v1';

const ACCENT_PRESETS: Record<AccentId, AccentPreset & { label: string }> = {
  aurora: {
    label: 'Aurora',
    primary: '#D946EF',
    secondary: '#06B6D4',
    ring: '#F0ABFC',
  },
  marina: {
    label: 'Marina',
    primary: '#2563EB',
    secondary: '#38BDF8',
    ring: '#60A5FA',
  },
  solstice: {
    label: 'Solstice',
    primary: '#F97316',
    secondary: '#FACC15',
    ring: '#FDBA74',
  },
};

const DEFAULT_SETTINGS: UISettingsState = {
  language: 'es',
  theme: 'system',
  accent: 'aurora',
  appTitle: 'Anclora RAG',
  tagline: 'Ollama + HuggingFace + Qdrant',
  headlineStyle: 'rounded',
  bodyFont: 'sans',
  density: 'comfortable',
};

const UISettingsContext = createContext<UISettingsContext | null>(null);

function normalizeHex(color: string): string | null {
  const hex = color.trim().startsWith('#') ? color.trim().slice(1) : color.trim();
  if (!/^[0-9a-fA-F]{6}$/.test(hex)) {
    return null;
  }
  return `#${hex.toLowerCase()}`;
}

function hexToRgb(color: string) {
  const hex = normalizeHex(color);
  if (!hex) return null;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return { r, g, b };
}

function relativeLuminance({ r, g, b }: { r: number; g: number; b: number }) {
  const transform = (value: number) => {
    const srgb = value / 255;
    return srgb <= 0.03928 ? srgb / 12.92 : Math.pow((srgb + 0.055) / 1.055, 2.4);
  };
  const R = transform(r);
  const G = transform(g);
  const B = transform(b);
  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}

function contrastRatio(colorA: string, colorB: string) {
  const rgbA = hexToRgb(colorA);
  const rgbB = hexToRgb(colorB);
  if (!rgbA || !rgbB) {
    return 0;
  }
  const luminanceA = relativeLuminance(rgbA);
  const luminanceB = relativeLuminance(rgbB);
  const brightest = Math.max(luminanceA, luminanceB);
  const darkest = Math.min(luminanceA, luminanceB);
  return (brightest + 0.05) / (darkest + 0.05);
}

function validateAccent(primary: string, secondary: string): AccentValidationIssue[] {
  const issues: AccentValidationIssue[] = [];
  const MIN_CONTRAST = 3; // AA (large text)
  const MIN_DIFFERENCE = 1.4;

  if (contrastRatio(primary, '#ffffff') < MIN_CONTRAST) {
    issues.push('primary_light_contrast');
  }
  if (contrastRatio(primary, '#0a0a0a') < MIN_CONTRAST) {
    issues.push('primary_dark_contrast');
  }
  if (contrastRatio(secondary, '#ffffff') < MIN_CONTRAST) {
    issues.push('secondary_light_contrast');
  }
  if (contrastRatio(secondary, '#0a0a0a') < MIN_CONTRAST) {
    issues.push('secondary_dark_contrast');
  }
  if (contrastRatio(primary, secondary) < MIN_DIFFERENCE) {
    issues.push('primary_secondary_contrast');
  }

  return issues;
}

function resolveAccent(state: UISettingsState): AccentPreset {
  if (state.accent === 'custom' && state.customAccent) {
    const primary = normalizeHex(state.customAccent.primary);
    const secondary = normalizeHex(state.customAccent.secondary);
    if (primary && secondary) {
      return {
        label: 'Custom',
        primary,
        secondary,
        ring: primary,
      };
    }
  }

  return ACCENT_PRESETS[state.accent as AccentId] ?? ACCENT_PRESETS.aurora;
}

function applyAccent(state: UISettingsState) {
  const preset = resolveAccent(state);
  const root = document.documentElement;
  root.style.setProperty('--anclora-primary', preset.primary);
  root.style.setProperty('--anclora-secondary', preset.secondary);
  root.style.setProperty('--anclora-ring', preset.ring);
  root.style.setProperty(
    '--anclora-gradient',
    `linear-gradient(135deg, ${preset.primary} 0%, ${preset.secondary} 100%)`,
  );
}

function applyTheme(mode: ThemeMode) {
  const root = document.documentElement;

  const resolve = () => {
    if (mode === 'system') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return mode;
  };

  const resolved = resolve();
  root.dataset.theme = resolved;
  root.classList.toggle('dark', resolved === 'dark');

  const background = resolved === 'dark' ? '#0a0a0a' : '#ffffff';
  const foreground = resolved === 'dark' ? '#f3f4f6' : '#171717';
  root.style.setProperty('--background', background);
  root.style.setProperty('--foreground', foreground);
}

export function UISettingsProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<UISettingsState>(DEFAULT_SETTINGS);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<UISettingsState>;
        setState((prev) => ({
          ...prev,
          ...parsed,
        }));
      }
    } catch {
      // keep defaults
    } finally {
      setIsHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    applyTheme(state.theme);
  }, [state.theme, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    applyAccent(state);
  }, [state.accent, state.customAccent, isHydrated]);

  useEffect(() => {
    if (!isHydrated || state.theme !== 'system') return;
    const listener = (event: MediaQueryListEvent) => {
      const resolved = event.matches ? 'dark' : 'light';
      const root = document.documentElement;
      root.dataset.theme = resolved;
      root.classList.toggle('dark', resolved === 'dark');
      root.style.setProperty('--background', resolved === 'dark' ? '#0a0a0a' : '#ffffff');
      root.style.setProperty('--foreground', resolved === 'dark' ? '#f3f4f6' : '#171717');
    };
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, [state.theme, isHydrated]);

  const setLanguage = useCallback((language: LanguageCode) => {
    setState((prev) => ({ ...prev, language }));
  }, []);

  const setTheme = useCallback((theme: ThemeMode) => {
    setState((prev) => ({ ...prev, theme }));
  }, []);

  const setAccent = useCallback((accent: AccentId) => {
    setState((prev) => ({ ...prev, accent, customAccent: undefined }));
  }, []);

  const setCustomAccent = useCallback(
    (accent: { primary: string; secondary: string }): AccentValidationIssue[] => {
      const normalizedPrimary = normalizeHex(accent.primary);
      const normalizedSecondary = normalizeHex(accent.secondary);

      if (!normalizedPrimary || !normalizedSecondary) {
        setState((prev) => ({
          ...prev,
          accent: DEFAULT_SETTINGS.accent,
          customAccent: undefined,
        }));
        return ['invalid_format'];
      }

      const issues = validateAccent(normalizedPrimary, normalizedSecondary);

      if (issues.length > 0) {
        setState((prev) => ({
          ...prev,
          accent: DEFAULT_SETTINGS.accent,
          customAccent: undefined,
        }));
        return issues;
      }

      setState((prev) => ({
        ...prev,
        accent: 'custom',
        customAccent: { primary: normalizedPrimary, secondary: normalizedSecondary },
      }));

      return [];
    },
    [],
  );

  const setAppTitle = useCallback((appTitle: string) => {
    setState((prev) => ({ ...prev, appTitle }));
  }, []);

  const setTagline = useCallback((tagline: string) => {
    setState((prev) => ({ ...prev, tagline }));
  }, []);

  const setHeadlineStyle = useCallback((headlineStyle: HeadlineStyle) => {
    setState((prev) => ({ ...prev, headlineStyle }));
  }, []);

  const setBodyFont = useCallback((bodyFont: BodyFont) => {
    setState((prev) => ({ ...prev, bodyFont }));
  }, []);

  const setDensity = useCallback((density: DensityMode) => {
    setState((prev) => ({ ...prev, density }));
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    const root = document.documentElement;
    const FONT_MAP: Record<BodyFont, string> = {
      sans: '"Inter", "Segoe UI", system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
      serif: '"Source Serif Pro", "Georgia", "Times New Roman", serif',
      mono: '"JetBrains Mono", "Fira Code", "Consolas", monospace',
    };
    root.style.setProperty('--font-body', FONT_MAP[state.bodyFont]);
  }, [state.bodyFont, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    document.body.dataset.density = state.density;
  }, [state.density, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    document.documentElement.lang = state.language;
  }, [state.language, isHydrated]);

  const value = useMemo<UISettingsContext>(
    () => ({
      ...state,
      setLanguage,
      setTheme,
      setAccent,
      setCustomAccent,
      setAppTitle,
      setTagline,
      setHeadlineStyle,
      setBodyFont,
      setDensity,
      accentPresets: ACCENT_PRESETS,
    }),
    [
      state,
      setLanguage,
      setTheme,
      setAccent,
      setCustomAccent,
      setAppTitle,
      setTagline,
      setHeadlineStyle,
      setBodyFont,
      setDensity,
    ],
  );

  return <UISettingsContext.Provider value={value}>{children}</UISettingsContext.Provider>;
}

export function useUISettings() {
  const ctx = useContext(UISettingsContext);
  if (!ctx) {
    throw new Error('useUISettings must be used within UISettingsProvider');
  }
  return ctx;
}

export type {
  LanguageCode,
  ThemeMode,
  AccentId,
  AccentSelection,
  HeadlineStyle,
  BodyFont,
  DensityMode,
  AccentValidationIssue,
};
