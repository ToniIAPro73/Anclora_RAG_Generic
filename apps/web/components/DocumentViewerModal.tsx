"use client";

import { useEffect, useState } from "react";
import { useUISettings } from "./ui-settings-context";

interface Chunk {
  chunk_id: string;
  text: string;
  page?: number;
  chunk_index?: number;
}

interface DocumentDetails {
  document_id: string;
  filename: string;
  chunk_count: number;
  chunks: Chunk[];
}

interface DocumentViewerModalProps {
  isOpen: boolean;
  documentId: string | null;
  onClose: () => void;
}

const COPY = {
  title: {
    es: "Visor de Documento",
    en: "Document Viewer",
  },
  close: {
    es: "Cerrar",
    en: "Close",
  },
  loading: {
    es: "Cargando documento...",
    en: "Loading document...",
  },
  error: {
    es: "Error al cargar el documento",
    en: "Error loading document",
  },
  chunks: {
    es: "fragmentos",
    en: "chunks",
  },
  chunk: {
    es: "Fragmento",
    en: "Chunk",
  },
  page: {
    es: "Página",
    en: "Page",
  },
  copyChunk: {
    es: "Copiar",
    en: "Copy",
  },
  copied: {
    es: "Copiado",
    en: "Copied",
  },
};

export default function DocumentViewerModal({
  isOpen,
  documentId,
  onClose,
}: DocumentViewerModalProps) {
  const { language } = useUISettings();
  const [document, setDocument] = useState<DocumentDetails | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedChunkId, setCopiedChunkId] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !documentId) {
      setDocument(null);
      setError(null);
      return;
    }

    const fetchDocument = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const encodedId = encodeURIComponent(documentId);
        const response = await fetch(`http://localhost:8030/documents/${encodedId}`);

        if (!response.ok) {
          throw new Error("Failed to fetch document");
        }

        const data = await response.json();
        setDocument(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setIsLoading(false);
      }
    };

    fetchDocument();
  }, [isOpen, documentId]);

  const handleCopyChunk = async (text: string, chunkId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedChunkId(chunkId);
      setTimeout(() => setCopiedChunkId(null), 2000);
    } catch (err) {
      console.error("Failed to copy text:", err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-xl bg-white shadow-2xl dark:bg-slate-900">
        {/* Header */}
        <div className="border-b border-gray-200 bg-gradient-anclora px-6 py-4 dark:border-slate-700">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-semibold text-white">
                {COPY.title[language]}
              </h2>
              {document && (
                <p className="mt-1 text-sm text-white/80">
                  {document.filename} • {document.chunk_count} {COPY.chunks[language]}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-2 text-white/80 transition-colors hover:bg-white/10 hover:text-white"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="max-h-[calc(90vh-140px)] overflow-y-auto p-6">
          {isLoading && (
            <div className="flex items-center justify-center py-16">
              <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-anclora-primary"></div>
              <span className="ml-3 text-gray-600 dark:text-slate-300">
                {COPY.loading[language]}
              </span>
            </div>
          )}

          {error && (
            <div className="rounded-lg border-2 border-red-300 bg-red-50 p-4 text-red-800 dark:border-red-700 dark:bg-red-900/20 dark:text-red-400">
              {COPY.error[language]}: {error}
            </div>
          )}

          {document && !isLoading && (
            <div className="space-y-4">
              {document.chunks.map((chunk, idx) => (
                <div
                  key={chunk.chunk_id}
                  className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-slate-700 dark:bg-slate-800"
                >
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-slate-400">
                      <span className="font-medium">
                        {COPY.chunk[language]} {idx + 1}
                      </span>
                      {chunk.page && (
                        <span className="text-xs">
                          {COPY.page[language]} {chunk.page}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => handleCopyChunk(chunk.text, chunk.chunk_id)}
                      className={`rounded px-3 py-1 text-xs font-medium transition-colors ${
                        copiedChunkId === chunk.chunk_id
                          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                          : "bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
                      }`}
                    >
                      {copiedChunkId === chunk.chunk_id
                        ? COPY.copied[language]
                        : COPY.copyChunk[language]}
                    </button>
                  </div>
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700 dark:text-slate-300">
                    {chunk.text}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 bg-gray-50 px-6 py-4 dark:border-slate-700 dark:bg-slate-800">
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="rounded-lg bg-anclora-primary px-6 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
            >
              {COPY.close[language]}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
