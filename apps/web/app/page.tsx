"use client";

import { useState } from "react";
import UploadZone from "@/components/UploadZone";
import Chat from "@/components/Chat";
import { useUISettings } from "@/components/ui-settings-context";

const COPY = {
  uploadTitle: {
    es: "Subir Documento",
    en: "Upload Document",
  },
  chatTitle: {
    es: "Consultar Documentos",
    en: "Ask Your Documents",
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
  helper: {
    es: "Carga archivos PDF, DOCX, TXT o Markdown para enriquecer tu espacio de conocimiento.",
    en: "Upload PDF, DOCX, TXT or Markdown files to enrich your knowledge workspace.",
  },
};

function normalizeFileName(original: string) {
  try {
    return decodeURIComponent(escape(original));
  } catch {
    return original;
  }
}

export default function Home() {
  const { language } = useUISettings();
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const handleUploadSuccess = (fileName: string, chunks: number) => {
    const normalized = normalizeFileName(fileName);
    setNotification({
      type: "success",
      message: COPY.success[language](normalized, chunks),
    });
    setTimeout(() => setNotification(null), 5000);
  };

  const handleUploadError = (error: string) => {
    setNotification({
      type: "error",
      message: COPY.error[language](error),
    });
    setTimeout(() => setNotification(null), 5000);
  };

  return (
    <div className="container-app space-y-6 py-6">
      {notification && (
        <div
          className={`rounded-xl border-2 p-4 shadow-lg ${
            notification.type === "success"
              ? "border-green-300 bg-green-50 text-green-800"
              : "border-red-300 bg-red-50 text-red-800"
          }`}
        >
          {notification.message}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:items-start lg:min-h-[calc(100vh-280px)]">
        <section className="panel panel-primary flex h-full flex-col bg-white">
          <div className="space-y-3">
            <h2 className="card-header text-gray-900">
              <span className="text-2xl" role="img" aria-hidden>
                📤
              </span>
              {COPY.uploadTitle[language]}
            </h2>
            <p className="text-sm text-gray-500 dark:text-slate-400">
              {COPY.helper[language]}
            </p>
          </div>
          <div className="mt-4 flex flex-1 flex-col">
            <UploadZone
              onUploadSuccess={handleUploadSuccess}
              onUploadError={handleUploadError}
            />
          </div>
        </section>

        <section className="panel panel-secondary flex h-full flex-col bg-white">
          <div className="border-b border-gray-100 px-6 pb-4 dark:border-slate-700">
            <h2 className="card-header text-gray-900 dark:text-slate-200">
              <span className="text-2xl" role="img" aria-hidden>
                💬
              </span>
              {COPY.chatTitle[language]}
            </h2>
            <p className="mt-2 text-sm text-gray-500 dark:text-slate-400">
              {language === "es"
                ? "Formula preguntas en tu idioma. Cambia a otra lengua en cualquier momento desde el selector superior."
                : "Ask questions in your preferred language. Switch languages at any time from the top selector."}
            </p>
          </div>
          <div className="flex flex-1 flex-col">
            <Chat />
          </div>
        </section>
      </div>
    </div>
  );
}
