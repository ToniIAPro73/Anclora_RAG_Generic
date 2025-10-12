'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useUISettings } from './ui-settings-context';
import LanguageModal from './LanguageModal';
import ThemeModal from './ThemeModal';

const NAV_LINKS = [
  { href: '/', label: { es: 'Dashboard', en: 'Dashboard' } },
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
  const [isLanguageModalOpen, setLanguageModalOpen] = useState(false);
  const [isThemeModalOpen, setThemeModalOpen] = useState(false);

  useEffect(() => {
    const acknowledged = window.localStorage.getItem('anclora.languageAcknowledged');
    if (!acknowledged) {
      setLanguageModalOpen(true);
    }
  }, []);

  const closeLanguageModal = () => {
    setLanguageModalOpen(false);
    window.localStorage.setItem('anclora.languageAcknowledged', 'true');
  };

  const headlineClass =
    headlineStyle === 'tech'
      ? 'tracking-[0.08em] uppercase font-semibold'
      : 'font-semibold tracking-tight';

  return (
    <>
      <header className="bg-gradient-anclora text-white shadow-lg">
        <div className="container-app space-y-4 py-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className={`text-3xl md:text-4xl ${headlineClass}`}>{appTitle}</h1>
              <p className="mt-1 text-sm opacity-90 md:text-base">{tagline}</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setThemeModalOpen(true)}
                className="flex items-center gap-2 rounded-lg border border-white/40 bg-white/10 px-4 py-2 text-sm font-medium backdrop-blur transition-colors hover:bg-white/20"
              >
                <span role="img" aria-label="theme">
                  🎨
                </span>
                {language === 'es' ? 'Tema' : 'Theme'}
              </button>
              <button
                onClick={() => setLanguageModalOpen(true)}
                className="flex items-center gap-2 rounded-lg border border-white/40 bg-white/10 px-4 py-2 text-sm font-medium backdrop-blur transition-colors hover:bg-white/20"
              >
                <span role="img" aria-label="language">
                  🌐
                </span>
                {language === 'es' ? 'Idioma' : 'Language'}
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
      <LanguageModal
        isOpen={isLanguageModalOpen}
        selected={language}
        onSelect={(value) => setLanguage(value)}
        onClose={closeLanguageModal}
      />
      <ThemeModal
        isOpen={isThemeModalOpen}
        selected={theme}
        onSelect={(value) => setTheme(value)}
        onClose={() => setThemeModalOpen(false)}
        language={language}
      />
    </>
  );
}
