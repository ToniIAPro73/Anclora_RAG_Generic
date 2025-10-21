"use client";

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
    language,
    headlineStyle,
    setLanguage,
    theme,
    setTheme,
    isPro,
    isHydrated,
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
        return '🖥️';
      default:
        return '☀️';
    }
  };

  const headlineClass =
    headlineStyle === 'tech'
      ? 'tracking-[0.08em] uppercase font-semibold'
      : 'font-semibold tracking-tight';

  const resolvedTitle = appTitle && appTitle.trim().length > 0 ? appTitle : 'Anclora RAG';

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] transition-colors">
      {isHydrated ? (
        <>
          <header className="shadow-lg">
            <div className="container-app py-3">
              <div className="flex items-center justify-between gap-4">
                <div className="flex-shrink-0" style={{ minWidth: '150px', maxWidth: '280px' }}>
                  <h1 className={`text-2xl truncate ${headlineClass}`} title={resolvedTitle}>
                    {resolvedTitle}
                  </h1>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-white/70 dark:text-white/60">
                    by Anclora
                  </p>
                </div>

                <nav className="flex flex-wrap justify-center gap-2 flex-1">
                  {NAV_LINKS.map(({ href, label, pro }) => {
                    const isActive = pathname === href;
                    const isDisabled = pro && !isPro;
                    return (
                      <Link
                        key={href}
                        href={isDisabled ? '#' : href}
                        onClick={(e) => {
                          if (isDisabled) {
                            e.preventDefault();
                          }
                        }}
                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold transition-colors ${
                          isActive
                            ? 'bg-white text-anclora-primary shadow-lg'
                            : isDisabled
                            ? 'bg-white/10 text-white/40 cursor-not-allowed'
                            : 'bg-white/10 text-white hover:bg-white/20'
                        }`}
                      >
                        <span>{label[language]}</span>
                        {pro ? (
                          <span className="rounded-full bg-white/20 px-1.5 py-0.5 text-[10px] font-semibold">
                            Pro
                          </span>
                        ) : null}
                      </Link>
                    );
                  })}
                </nav>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={cycleTheme}
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-white/40 bg-white/10 text-base backdrop-blur transition-all hover:bg-white/20 hover:scale-110"
                    title={`Tema: ${theme === 'light' ? 'Claro' : theme === 'dark' ? 'Oscuro' : 'Sistema'}`}
                  >
                    <span role="img" aria-label="theme">
                      {getThemeIcon()}
                    </span>
                  </button>
                  <button
                    onClick={toggleLanguage}
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-white/40 bg-white/10 text-xs font-bold backdrop-blur transition-all hover:bg-white/20 hover:scale-110"
                    title={language === 'es' ? 'Español' : 'English'}
                  >
                    <span aria-label="language">{language === 'es' ? 'ES' : 'EN'}</span>
                  </button>
                </div>
              </div>
            </div>
          </header>
          <main>{children}</main>
        </>
      ) : (
        <>
          <header className="shadow-lg">
            <div className="container-app py-3">
              <div className="flex animate-pulse items-center justify-between gap-4">
                <div className="h-9 w-40 rounded-full bg-white/40" />
                <div className="hidden h-8 w-[55%] rounded-full bg-white/20 sm:block" />
                <div className="flex h-9 gap-2">
                  <div className="h-9 w-9 rounded-full bg-white/20" />
                  <div className="h-9 w-9 rounded-full bg-white/20" />
                </div>
              </div>
            </div>
          </header>
          <main className="container-app py-16">
            <div className="mx-auto h-64 max-w-3xl animate-pulse rounded-3xl bg-white/10" />
          </main>
        </>
      )}
    </div>
  );
}
