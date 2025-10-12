'use client';

import { FC } from 'react';
import { ThemeMode, LanguageCode } from './ui-settings-context';

interface ThemeModalProps {
  isOpen: boolean;
  selected: ThemeMode;
  onSelect: (theme: ThemeMode) => void;
  onClose: () => void;
  language: LanguageCode;
}

const OPTIONS: Array<{ value: ThemeMode; icon: string; label: { es: string; en: string } }> = [
  { value: 'light', icon: '☀️', label: { es: 'Modo claro', en: 'Light' } },
  { value: 'dark', icon: '🌙', label: { es: 'Modo oscuro', en: 'Dark' } },
  { value: 'system', icon: '💻', label: { es: 'Usar sistema', en: 'System' } },
];

const ThemeModal: FC<ThemeModalProps> = ({ isOpen, selected, onSelect, onClose, language }) => {
  if (!isOpen) return null;

  const title =
    language === 'es' ? 'Selecciona tu tema preferido' : 'Choose your preferred theme';
  const subtitle =
    language === 'es'
      ? 'Puedes elegir entre modo claro, oscuro o mantener la configuración del sistema operativo.'
      : 'Select light, dark or follow your operating system preference.';
  const closeLabel = language === 'es' ? 'Cerrar' : 'Close';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl border border-gray-100 bg-white p-6 shadow-2xl">
        <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
        <p className="mt-2 text-sm text-gray-500">{subtitle}</p>

        <div className="mt-5 grid gap-3">
          {OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => onSelect(option.value)}
              className={`flex items-center justify-between rounded-lg border px-4 py-3 transition-colors ${
                selected === option.value
                  ? 'border-anclora-primary bg-anclora-primary/10 text-anclora-primary'
                  : 'border-gray-200 hover:border-anclora-secondary hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-3 text-left">
                <span className="text-2xl" role="img" aria-hidden>
                  {option.icon}
                </span>
                <div>
                  <p className="font-medium">{option.label[language]}</p>
                  <p className="text-sm text-gray-500">
                    {language === 'es' ? option.label.en : option.label.es}
                  </p>
                </div>
              </div>
              <span
                className={`h-5 w-5 rounded-full border-2 ${
                  selected === option.value
                    ? 'border-anclora-primary bg-anclora-primary'
                    : 'border-gray-300'
                }`}
              />
            </button>
          ))}
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-lg bg-gradient-anclora px-5 py-2 text-white shadow-md transition-opacity hover:opacity-90"
          >
            {closeLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ThemeModal;
