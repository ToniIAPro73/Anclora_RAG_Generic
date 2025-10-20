"use client";

import { useState } from "react";
import UploadZone from "@/components/UploadZone";
import DocumentHistory from "@/components/DocumentHistory";
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
  const [refreshKey, setRefreshKey] = useState(0);

  const handleUploadSuccess = (fileName: string, chunks: number) => {
    const normalized = normalizeFileName(fileName);
    setNotification({
      type: "success",
      message: COPY.success[language](normalized, chunks),
    });
    setTimeout(() => setNotification(null), 5000);
    // Trigger refresh of document history
    setRefreshKey(prev => prev + 1);
  };

  const handleUploadError = (error: string) => {
    setNotification({
      type: "error",
      message: COPY.error[language](error),
    });
    setTimeout(() => setNotification(null), 5000);
  };

  return (
    <div className="container-app space-y-3 py-3">
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

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 lg:items-start">
        <section className="panel panel-primary flex flex-col">
          <div className="space-y-1">
            <h2 className="text-lg font-bold">
              <span className="text-xl" role="img" aria-hidden>
                📤
              </span>{" "}
              {COPY.uploadTitle[language]}
            </h2>
            <p className="text-xs">
              {COPY.helper[language]}
            </p>
          </div>
          <div className="mt-3 flex flex-col space-y-3">
            <UploadZone
              onUploadSuccess={handleUploadSuccess}
              onUploadError={handleUploadError}
            />
            <DocumentHistory key={refreshKey} />
          </div>
        </section>

        <section className="panel panel-secondary flex flex-col lg:min-h-[440px]">
          <div className="border-b border-gray-100 px-6 pb-2 dark:border-slate-700">
            <h2 className="text-lg font-bold">
              <span className="text-xl" role="img" aria-hidden>
                💬
              </span>{" "}
              {COPY.chatTitle[language]}
            </h2>
            <p className="mt-1 text-xs">
              {language === "es"
                ? "Formula preguntas en tu idioma."
                : "Ask questions in your preferred language."}
            </p>
          </div>
          <div className="flex flex-1 flex-col overflow-hidden">
            <Chat />
          </div>
        </section>
      </div>
    </div>
  );
}
