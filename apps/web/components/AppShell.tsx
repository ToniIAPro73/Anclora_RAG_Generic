'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUISettings } from './ui-settings-context';

const NAV_LINKS = [
  { href: '/', label: { es: 'Dashboard', en: 'Dashboard' } },
  { href: '/documentos', label: { es: 'Documentos', en: 'Documents' } },
  {
    href: '/ingesta-avanzada',
    label: { es: 'Ingesta Avanzada', en: 'Advanced Ingestion' },
    pro: true,
  },
  { href: '/configuracion', label: { es: 'Configuración', en: 'Configuration' } },
] as const;

export default function AppShell({ children }: { children: React.ReactNode }) {
  const {
    appTitle,
    tagline,
    language,
    headlineStyle,
    setLanguage,
    theme,
    setTheme,
  } = useUISettings();
  const pathname = usePathname();

  const cycleTheme = () => {
    const themes: Array<'light' | 'dark' | 'system'> = ['light', 'dark', 'system'];
    const currentIndex = themes.indexOf(theme);
    const nextIndex = (currentIndex + 1) % themes.length;
    setTheme(themes[nextIndex]);
  };

  const toggleLanguage = () => {
    setLanguage(language === 'es' ? 'en' : 'es');
  };

  const getThemeIcon = () => {
    switch (theme) {
      case 'light':
        return '☀️';
      case 'dark':
        return '🌙';
      case 'system':
        return '💻';
      default:
        return '☀️';
    }
  };

  const headlineClass =
    headlineStyle === 'tech'
      ? 'tracking-[0.08em] uppercase font-semibold'
      : 'font-semibold tracking-tight';

  const resolvedTitle = appTitle && appTitle.trim().length > 0 ? appTitle : 'Anclora RAG';
  const resolvedTagline =
    tagline && tagline.trim().length > 0
      ? tagline
      : language === 'es'
      ? 'Ollama + HuggingFace + Qdrant'
      : 'Ollama + HuggingFace + Qdrant';

  return (
    <>
      <header className="bg-gradient-anclora text-white shadow-lg">
        <div className="container-app space-y-4 py-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className={`text-3xl md:text-4xl ${headlineClass}`}>{resolvedTitle}</h1>
              <p className="mt-1 text-sm opacity-90 md:text-base">{resolvedTagline}</p>
              <p className="mt-1 text-xs font-semibold uppercase tracking-[0.2em] text-white/80">
                by Anclora
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={cycleTheme}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/40 bg-white/10 text-lg backdrop-blur transition-all hover:bg-white/20 hover:scale-110"
                title={`Tema: ${theme === 'light' ? 'Claro' : theme === 'dark' ? 'Oscuro' : 'Sistema'}`}
              >
                <span role="img" aria-label="theme">
                  {getThemeIcon()}
                </span>
              </button>
              <button
                onClick={toggleLanguage}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/40 bg-white/10 text-sm font-bold backdrop-blur transition-all hover:bg-white/20 hover:scale-110"
                title={language === 'es' ? 'Español' : 'English'}
              >
                <span aria-label="language">
                  {language === 'es' ? 'ES' : 'EN'}
                </span>
              </button>
            </div>
          </div>
          <nav className="flex flex-wrap gap-2">
            {NAV_LINKS.map(({ href, label, pro }) => {
              const isActive = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                    isActive
                      ? 'bg-white text-anclora-primary shadow-lg'
                      : 'bg-white/10 hover:bg-white/20'
                  }`}
                >
                  <span>{label[language]}</span>
                  {pro ? (
                    <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs font-semibold">
                      Pro
                    </span>
                  ) : null}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>
      <main>{children}</main>
    </>
  );
}
