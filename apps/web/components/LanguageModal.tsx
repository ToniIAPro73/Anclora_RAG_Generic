import { FC } from 'react';

type LanguageCode = 'es' | 'en';

interface LanguageModalProps {
  isOpen: boolean;
  selected: LanguageCode;
  onSelect: (language: LanguageCode) => void;
  onClose: () => void;
}

const LANGUAGE_LABEL: Record<LanguageCode, string> = {
  es: 'Español',
  en: 'English',
};

const LanguageModal: FC<LanguageModalProps> = ({
  isOpen,
  selected,
  onSelect,
  onClose,
}) => {
  if (!isOpen) {
    return null;
  }

  const headline =
    selected === 'en' ? 'Select the default language' : 'Selecciona el idioma por defecto';
  const helperText =
    selected === 'en'
      ? 'You can change it later. If the user asks for another language mid-conversation, the assistant will comply.'
      : 'Podrás cambiarlo más adelante. Si el usuario pide otro idioma en la conversación, el asistente lo respetará.';
  const closeLabel = selected === 'en' ? 'Save' : 'Guardar';

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl border border-gray-100 bg-white p-6 shadow-2xl">
        <h2 className="mb-6 text-xl font-semibold text-gray-900">{headline}</h2>

        <div className="space-y-3">
          {(Object.keys(LANGUAGE_LABEL) as LanguageCode[]).map((lang) => (
            <button
              key={lang}
              onClick={() => onSelect(lang)}
              className={`flex w-full items-center justify-between rounded-lg border px-4 py-3 transition-colors ${
                selected === lang
                  ? 'border-anclora-primary bg-anclora-primary/10 text-anclora-primary'
                  : 'border-gray-200 hover:border-anclora-secondary hover:bg-gray-50'
              }`}
            >
              <span className="font-medium">{LANGUAGE_LABEL[lang]}</span>
              <span
                className={`h-5 w-5 rounded-full border-2 ${
                  selected === lang
                    ? 'border-anclora-primary bg-anclora-primary'
                    : 'border-gray-300'
                }`}
              />
            </button>
          ))}
        </div>

        <p className="mt-4 text-sm text-gray-500">{helperText}</p>

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

export default LanguageModal;
