'use client';

import { useState } from 'react';
import UploadZone from '@/components/UploadZone';
import Chat from '@/components/Chat';
import LanguageModal from '@/components/LanguageModal';

type LanguageCode = 'es' | 'en';

const LANGUAGE_LABEL: Record<LanguageCode, string> = {
  es: 'Español',
  en: 'English',
};

const COPY = {
  uploadTitle: {
    es: 'Subir Documento',
    en: 'Upload Document',
  },
  chatTitle: {
    es: 'Consultar Documentos',
    en: 'Ask Your Documents',
  },
  success: {
    es: (file: string, chunks: number) =>
      `✅ ${file} indexado con ${chunks} fragmentos`,
    en: (file: string, chunks: number) =>
      `✅ ${file} indexed with ${chunks} chunks`,
  },
  error: {
    es: (error: string) => `⚠️ Error: ${error}`,
    en: (error: string) => `⚠️ Error: ${error}`,
  },
  uploadEmoji: {
    es: '📄',
    en: '📄',
  },
  chatEmoji: {
    es: '💬',
    en: '💬',
  },
};

export default function Home() {
  const [language, setLanguage] = useState<LanguageCode>('es');
  const [isLanguageModalOpen, setIsLanguageModalOpen] = useState(true);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const handleUploadSuccess = (fileName: string, chunks: number) => {
    setNotification({
      type: 'success',
      message: COPY.success[language](fileName, chunks),
    });
    setTimeout(() => setNotification(null), 5000);
  };

  const handleUploadError = (error: string) => {
    setNotification({
      type: 'error',
      message: COPY.error[language](error),
    });
    setTimeout(() => setNotification(null), 5000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-4">
      <div className="flex justify-end">
        <button
          onClick={() => setIsLanguageModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 bg-white shadow-sm hover:border-anclora-secondary transition-colors"
        >
          <span className="text-sm text-gray-500">
            {language === 'es' ? 'Idioma' : 'Language'}
          </span>
          <span className="font-semibold text-gray-900">
            {LANGUAGE_LABEL[language]}
          </span>
        </button>
      </div>

      {notification && (
        <div
          className={`mb-4 p-4 rounded-lg shadow-lg ${
            notification.type === 'success'
              ? 'bg-green-50 text-green-800 border-2 border-green-300'
              : 'bg-red-50 text-red-800 border-2 border-red-300'
          }`}
        >
          {notification.message}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-180px)]">
        <div className="bg-white rounded-lg shadow-lg p-6 border-t-4 border-anclora-primary">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 flex items-center gap-2">
            <span className="text-2xl">{COPY.uploadEmoji[language]}</span>{' '}
            {COPY.uploadTitle[language]}
          </h2>
          <UploadZone
            onUploadSuccess={handleUploadSuccess}
            onUploadError={handleUploadError}
          />
        </div>

        <div className="bg-white rounded-lg shadow-lg flex flex-col border-t-4 border-anclora-secondary">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <span className="text-2xl">{COPY.chatEmoji[language]}</span>{' '}
              {COPY.chatTitle[language]}
            </h2>
          </div>
          <div className="flex-1 min-h-0">
            <Chat language={language} />
          </div>
        </div>
      </div>

      <LanguageModal
        isOpen={isLanguageModalOpen}
        selected={language}
        onSelect={(lang) => setLanguage(lang)}
        onClose={() => setIsLanguageModalOpen(false)}
      />
    </div>
  );
}
