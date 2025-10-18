"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getDocumentHistory, DocumentHistoryItem } from "@/lib/api";
import { useUISettings } from "@/components/ui-settings-context";

const COPY = {
  title: {
    es: "Gestión de Documentos",
    en: "Document Management",
  },
  subtitle: {
    es: "Administra los documentos indexados en tu base de conocimiento",
    en: "Manage indexed documents in your knowledge base",
  },
  empty: {
    es: "No hay documentos ingeridos aún.",
    en: "No documents ingested yet.",
  },
  refresh: {
    es: "Actualizar",
    en: "Refresh",
  },
  back: {
    es: "Volver",
    en: "Back",
  },
  filename: {
    es: "Nombre del archivo",
    en: "Filename",
  },
  chunks: {
    es: "Fragmentos",
    en: "Chunks",
  },
  uploadedAt: {
    es: "Fecha de ingesta",
    en: "Upload date",
  },
  actions: {
    es: "Acciones",
    en: "Actions",
  },
  delete: {
    es: "Eliminar",
    en: "Delete",
  },
  view: {
    es: "Ver",
    en: "View",
  },
  loading: {
    es: "Cargando documentos...",
    en: "Loading documents...",
  },
  confirmDelete: {
    es: (filename: string) => `¿Estás seguro de eliminar "${filename}"? Esta acción no se puede deshacer.`,
    en: (filename: string) => `Are you sure you want to delete "${filename}"? This action cannot be undone.`,
  },
  deleteSuccess: {
    es: "Documento eliminado correctamente",
    en: "Document deleted successfully",
  },
  deleteError: {
    es: "Error al eliminar el documento",
    en: "Error deleting document",
  },
};

export default function DocumentosPage() {
  const router = useRouter();
  const { language } = useUISettings();
  const [documents, setDocuments] = useState<DocumentHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const loadHistory = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await getDocumentHistory(1000); // Load all documents
      setDocuments(response.documents);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error loading history");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const handleDelete = async (docId: string | number, filename: string) => {
    if (!confirm(COPY.confirmDelete[language](filename))) {
      return;
    }

    try {
      // URL encode the document ID to handle special characters
      const encodedId = encodeURIComponent(String(docId));
      const response = await fetch(`http://localhost:8030/documents/${encodedId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete document");
      }

      setNotification({
        type: "success",
        message: COPY.deleteSuccess[language],
      });

      // Reload the document list
      await loadHistory();

      setTimeout(() => setNotification(null), 3000);
    } catch (err) {
      setNotification({
        type: "error",
        message: COPY.deleteError[language],
      });
      setTimeout(() => setNotification(null), 5000);
    }
  };

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleString(language === "es" ? "es-ES" : "en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
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

      <div className="panel panel-primary bg-white">
        <div className="border-b border-gray-100 pb-4 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="card-header text-gray-900 dark:text-slate-200">
                <span className="text-2xl" role="img" aria-hidden>
                  📚
                </span>
                {COPY.title[language]}
              </h1>
              <p className="mt-2 text-sm text-gray-500 dark:text-slate-400">
                {COPY.subtitle[language]}
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => router.push("/")}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              >
                {COPY.back[language]}
              </button>
              <button
                onClick={loadHistory}
                className="rounded-lg bg-anclora-secondary px-4 py-2 text-sm text-white transition-opacity hover:opacity-90"
              >
                {COPY.refresh[language]}
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-anclora-primary"></div>
              <span className="ml-3 text-gray-600 dark:text-slate-300">
                {COPY.loading[language]}
              </span>
            </div>
          ) : error ? (
            <div className="rounded-lg border-2 border-red-300 bg-red-50 p-4 text-red-800">
              {error}
            </div>
          ) : documents.length === 0 ? (
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-16 text-center text-gray-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-400">
              <span className="mb-4 block text-4xl">📄</span>
              {COPY.empty[language]}
            </div>
          ) : (
            <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-slate-600">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-600">
                <thead className="bg-gray-50 dark:bg-slate-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-slate-400">
                      {COPY.filename[language]}
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-slate-400">
                      {COPY.chunks[language]}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-slate-400">
                      {COPY.uploadedAt[language]}
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-slate-400">
                      {COPY.actions[language]}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white dark:divide-slate-700 dark:bg-slate-900">
                  {documents.map((doc) => (
                    <tr
                      key={doc.id}
                      className="transition-colors hover:bg-gray-50 dark:hover:bg-slate-800"
                    >
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-slate-200">
                        <div className="flex items-center">
                          <span className="mr-2 text-lg">📄</span>
                          <span className="font-medium">{doc.filename}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center text-sm">
                        <span className="inline-flex items-center rounded-full bg-anclora-primary/10 px-3 py-1 text-xs font-medium text-anclora-primary">
                          {doc.chunks}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-slate-400">
                        {doc.uploaded_at ? formatDate(doc.uploaded_at) : "-"}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-center text-sm">
                        <button
                          onClick={() => handleDelete(doc.id, doc.filename)}
                          className="rounded-lg border border-red-300 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 transition-colors hover:bg-red-100 dark:border-red-700 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30"
                        >
                          {COPY.delete[language]}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
