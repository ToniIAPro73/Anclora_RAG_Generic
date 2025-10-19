import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getDocumentHistory, DocumentHistoryItem } from "@/lib/api";
import { useUISettings } from "./ui-settings-context";

const MAX_DISPLAY = 5; // Show only last 5 documents

export default function DocumentHistory() {
  const router = useRouter();
  const { language } = useUISettings();
  const [documents, setDocuments] = useState<DocumentHistoryItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadHistory = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await getDocumentHistory(50);
      setTotalCount(response.documents.length);
      setDocuments(response.documents.slice(0, MAX_DISPLAY));
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
      es: "Últimos Documentos",
      en: "Recent Documents",
    },
    empty: {
      es: "No hay documentos ingeridos aún.",
      en: "No documents ingested yet.",
    },
    viewAll: {
      es: (count: number) => `Ver todos (${count})`,
      en: (count: number) => `View all (${count})`,
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
      es: "Cargando...",
      en: "Loading...",
    },
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-4">
        <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-anclora-primary"></div>
        <span className="ml-2 text-sm text-gray-600 dark:text-slate-300">
          {COPY.loading[language]}
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-800">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-gray-800 dark:text-slate-100">
          {COPY.title[language]}
        </h3>
        {totalCount > MAX_DISPLAY && (
          <button
            onClick={() => router.push("/documentos")}
            className="text-sm text-anclora-primary transition-opacity hover:opacity-80"
          >
            {COPY.viewAll[language](totalCount)}
          </button>
        )}
      </div>

      {documents.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-center text-sm text-gray-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-400">
          {COPY.empty[language]}
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white/60 dark:border-slate-600 dark:bg-transparent">
          <div className="max-h-[180px] overflow-y-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-600">
              <thead className="sticky top-0 bg-gradient-to-r from-purple-50 to-cyan-50 dark:from-slate-700 dark:to-slate-700">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-gray-900 dark:text-slate-200">
                    {COPY.filename[language]}
                  </th>
                  <th className="px-4 py-2 text-right text-xs font-semibold uppercase tracking-wider text-gray-900 dark:text-slate-200">
                    {COPY.chunks[language]}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white dark:divide-slate-700 dark:bg-slate-900">
                {documents.map((doc) => (
                  <tr
                    key={doc.id}
                    className="transition-colors hover:bg-purple-50/30 dark:hover:bg-slate-800"
                  >
                    <td className="px-4 py-2.5 text-sm text-gray-900 dark:text-slate-200">
                      <div className="flex items-center">
                        <span className="mr-1.5 text-base">📄</span>
                        <span className="truncate">{doc.filename}</span>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-2.5 text-right text-sm">
                      <span className="inline-flex items-center rounded-full bg-anclora-primary/10 px-2.5 py-0.5 text-xs font-medium text-anclora-primary">
                        {doc.chunks}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
