import { useState, useEffect } from "react";
import { getDocumentHistory, DocumentHistoryItem } from "@/lib/api";
import { useUISettings } from "./ui-settings-context";

export default function DocumentHistory() {
  const { language } = useUISettings();
  const [documents, setDocuments] = useState<DocumentHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadHistory = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await getDocumentHistory(50);
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

  const COPY = {
    title: {
      es: "Historial de Documentos",
      en: "Document History",
    },
    empty: {
      es: "No hay documentos ingeridos aún.",
      en: "No documents ingested yet.",
    },
    refresh: {
      es: "Actualizar",
      en: "Refresh",
    },
    filename: {
      es: "Nombre del archivo",
      en: "Filename",
    },
    chunks: {
      es: "Fragmentos",
      en: "Chunks",
    },
    loading: {
      es: "Cargando historial...",
      en: "Loading history...",
    },
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-anclora-primary"></div>
        <span className="ml-3 text-gray-600 dark:text-slate-300">
          {COPY.loading[language]}
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border-2 border-red-300 bg-red-50 p-4 text-red-800">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-slate-200">
          {COPY.title[language]}
        </h3>
        <button
          onClick={loadHistory}
          className="rounded-lg bg-anclora-secondary px-4 py-2 text-sm text-white transition-opacity hover:opacity-90"
        >
          {COPY.refresh[language]}
        </button>
      </div>

      {documents.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-8 text-center text-gray-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-400">
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
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-slate-400">
                  {COPY.chunks[language]}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white dark:divide-slate-700 dark:bg-slate-900">
              {documents.map((doc) => (
                <tr
                  key={doc.id}
                  className="transition-colors hover:bg-gray-50 dark:hover:bg-slate-800"
                >
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900 dark:text-slate-200">
                    {doc.filename}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right text-sm text-gray-500 dark:text-slate-400">
                    <span className="inline-flex items-center rounded-full bg-anclora-primary/10 px-3 py-1 text-xs font-medium text-anclora-primary">
                      {doc.chunks}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
