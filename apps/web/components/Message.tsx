import { useEffect, useState } from 'react';
import { useUISettings } from './ui-settings-context';

type LanguageCode = 'es' | 'en';

interface MessageProps {
  role: 'user' | 'assistant';
  content: string;
  language: LanguageCode;
  sources?: Array<{
    text: string;
    score: number;
  }>;
}

const SOURCES_LABEL: Record<LanguageCode, string> = {
  es: 'Fuentes:',
  en: 'Sources:',
};

export default function Message({ role, content, sources, language }: MessageProps) {
  const isUser = role === 'user';
  const { theme } = useUISettings();
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const update = () => {
      if (typeof document !== 'undefined') {
        setIsDark(document.documentElement.classList.contains('dark'));
      }
    };
    update();
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, [theme]);

  const assistantClasses = isDark
    ? 'bg-slate-900/80 text-slate-100 border border-slate-700'
    : 'bg-white text-gray-900 border border-gray-200';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div
        className={`max-w-[70%] rounded-lg p-4 shadow-md ${
          isUser ? 'bg-gradient-anclora text-white' : assistantClasses
        }`}
      >
        <p className="whitespace-pre-wrap">{content}</p>

        {sources && sources.length > 0 && (
          <div
            className={`mt-3 pt-3 border-t ${
              isDark ? 'border-slate-700' : 'border-gray-200'
            }`}
          >
            <p className="text-xs font-semibold mb-2 opacity-75">
              {SOURCES_LABEL[language]}
            </p>
            {sources.map((source, idx) => (
              <div
                key={idx}
                className={`text-xs mb-1 ${
                  isDark ? 'text-slate-200/80' : 'opacity-70'
                }`}
              >
                <span className="font-mono bg-anclora-secondary/20 px-1 rounded">
                  {(source.score * 100).toFixed(1)}%
                </span>{' '}
                {source.text.substring(0, 100)}...
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
