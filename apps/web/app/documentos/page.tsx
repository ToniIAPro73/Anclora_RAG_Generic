"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { getDocumentHistory, DocumentHistoryItem } from "@/lib/api";
import { useUISettings } from "@/components/ui-settings-context";
import DocumentViewerModal from "@/components/DocumentViewerModal";

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
  search: {
    es: "Buscar documentos...",
    en: "Search documents...",
  },
  export: {
    es: "Exportar CSV",
    en: "Export CSV",
  },
  deleteAll: {
    es: "Eliminar Todo",
    en: "Delete All",
  },
  confirmDeleteAll: {
    es: "¿Estás ABSOLUTAMENTE seguro de eliminar TODOS los documentos del RAG? Esta acción NO SE PUEDE DESHACER y borrará permanentemente toda tu base de conocimiento.",
    en: "Are you ABSOLUTELY sure you want to delete ALL documents from the RAG? This action CANNOT BE UNDONE and will permanently erase your entire knowledge base.",
  },
  deleteAllSuccess: {
    es: (count: number) => `Se eliminaron exitosamente ${count} chunks de la base de conocimiento`,
    en: (count: number) => `Successfully deleted ${count} chunks from the knowledge base`,
  },
  deleteAllError: {
    es: "Error al eliminar todos los documentos",
    en: "Error deleting all documents",
  },
  showing: {
    es: (start: number, end: number, total: number) => `Mostrando ${start}-${end} de ${total}`,
    en: (start: number, end: number, total: number) => `Showing ${start}-${end} of ${total}`,
  },
  previous: {
    es: "Anterior",
    en: "Previous",
  },
  next: {
    es: "Siguiente",
    en: "Next",
  },
  noResults: {
    es: "No se encontraron documentos que coincidan con tu búsqueda",
    en: "No documents found matching your search",
  },
};

const ITEMS_PER_PAGE = 20;

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
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [viewerDocumentId, setViewerDocumentId] = useState<string | null>(null);

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

  const handleDeleteAll = async () => {
    if (!confirm(COPY.confirmDeleteAll[language])) {
      return;
    }

    // Double confirmation for safety
    const secondConfirm = language === "es"
      ? "Escribe 'ELIMINAR TODO' para confirmar:"
      : "Type 'DELETE ALL' to confirm:";
    const confirmText = language === "es" ? "ELIMINAR TODO" : "DELETE ALL";

    const userInput = prompt(secondConfirm);
    if (userInput !== confirmText) {
      return;
    }

    try {
      const response = await fetch("http://localhost:8030/documents", {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete all documents");
      }

      const data = await response.json();

      setNotification({
        type: "success",
        message: COPY.deleteAllSuccess[language](data.deleted_count || 0),
      });

      // Reload the document list
      await loadHistory();

      setTimeout(() => setNotification(null), 5000);
    } catch (err) {
      setNotification({
        type: "error",
        message: COPY.deleteAllError[language],
      });
      setTimeout(() => setNotification(null), 5000);
    }
  };

  // Filter and paginate documents
  const filteredDocuments = useMemo(() => {
    if (!searchQuery.trim()) return documents;

    const query = searchQuery.toLowerCase();
    return documents.filter((doc) =>
      doc.filename.toLowerCase().includes(query)
    );
  }, [documents, searchQuery]);

  const paginatedDocuments = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return filteredDocuments.slice(startIndex, endIndex);
  }, [filteredDocuments, currentPage]);

  const totalPages = Math.ceil(filteredDocuments.length / ITEMS_PER_PAGE);

  // Reset to page 1 when search query changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const handleExportCSV = () => {
    const headers = ["Filename", "Chunks", "Uploaded At"];
    const rows = filteredDocuments.map((doc) => [
      doc.filename,
      doc.chunks.toString(),
      doc.uploaded_at || "N/A",
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    link.setAttribute("href", url);
    link.setAttribute("download", `documents_${new Date().toISOString().split("T")[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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

      <div className="panel panel-primary">
        <div className="border-b border-gray-100 pb-4 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="card-header">
                <span className="text-2xl" role="img" aria-hidden>
                  📚
                </span>{" "}
                {COPY.title[language]}
              </h1>
              <p className="mt-2 text-sm">
                {COPY.subtitle[language]}
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => router.push("/")}
                className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-800 transition-colors hover:bg-gray-50 hover:border-anclora-primary/30 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
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

        {/* Search and Export */}
        {!isLoading && !error && documents.length > 0 && (
          <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={COPY.search[language]}
                className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2 pl-10 text-gray-900 placeholder-gray-500 focus:border-anclora-primary focus:outline-none focus:ring-2 focus:ring-anclora-primary/50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:placeholder-slate-400"
              />
              <svg
                className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleExportCSV}
                className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                {COPY.export[language]}
              </button>
              <button
                onClick={handleDeleteAll}
                className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
                {COPY.deleteAll[language]}
              </button>
            </div>
          </div>
        )}

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
          ) : filteredDocuments.length === 0 ? (
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-16 text-center text-gray-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-400">
              <span className="mb-4 block text-4xl">🔍</span>
              {COPY.noResults[language]}
            </div>
          ) : (
            <>
              <div className="overflow-hidden rounded-lg border border-gray-200 bg-white/60 dark:border-slate-600 dark:bg-transparent">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-600">
                  <thead className="sticky top-0 bg-gradient-to-r from-purple-50 to-cyan-50 dark:from-slate-700 dark:to-slate-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-900 dark:text-slate-200">
                        {COPY.filename[language]}
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-900 dark:text-slate-200">
                        {COPY.chunks[language]}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-900 dark:text-slate-200">
                        {COPY.uploadedAt[language]}
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-900 dark:text-slate-200">
                        {COPY.actions[language]}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white dark:divide-slate-700 dark:bg-slate-900">
                    {paginatedDocuments.map((doc) => (
                      <tr
                        key={doc.id}
                        className="transition-colors hover:bg-purple-50/30 dark:hover:bg-slate-800"
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
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600 dark:text-slate-400">
                          {doc.uploaded_at ? formatDate(doc.uploaded_at) : "-"}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-center text-sm">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => setViewerDocumentId(String(doc.id))}
                              className="rounded-lg border border-blue-300 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 transition-colors hover:bg-blue-100 dark:border-blue-700 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/30"
                            >
                              {COPY.view[language]}
                            </button>
                            <button
                              onClick={() => handleDelete(doc.id, doc.filename)}
                              className="rounded-lg border border-red-300 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 transition-colors hover:bg-red-100 dark:border-red-700 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30"
                            >
                              {COPY.delete[language]}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-6 flex items-center justify-between border-t border-gray-200 pt-4 dark:border-slate-700">
                <div className="text-sm text-gray-500 dark:text-slate-400">
                  {COPY.showing[language](
                    (currentPage - 1) * ITEMS_PER_PAGE + 1,
                    Math.min(currentPage * ITEMS_PER_PAGE, filteredDocuments.length),
                    filteredDocuments.length
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
                  >
                    {COPY.previous[language]}
                  </button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter((page) => {
                        // Show first, last, current, and adjacent pages
                        return (
                          page === 1 ||
                          page === totalPages ||
                          Math.abs(page - currentPage) <= 1
                        );
                      })
                      .map((page, idx, arr) => {
                        // Add ellipsis if there's a gap
                        const showEllipsis = idx > 0 && page - arr[idx - 1] > 1;
                        return (
                          <div key={page} className="flex items-center gap-1">
                            {showEllipsis && (
                              <span className="px-2 text-gray-400">...</span>
                            )}
                            <button
                              onClick={() => setCurrentPage(page)}
                              className={`h-10 w-10 rounded-lg text-sm font-medium transition-colors ${
                                currentPage === page
                                  ? "bg-anclora-primary text-white"
                                  : "border border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
                              }`}
                            >
                              {page}
                            </button>
                          </div>
                        );
                      })}
                  </div>
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
                  >
                    {COPY.next[language]}
                  </button>
                </div>
              </div>
            )}
            </>
          )}
        </div>
      </div>

      {/* Document Viewer Modal */}
      <DocumentViewerModal
        isOpen={viewerDocumentId !== null}
        documentId={viewerDocumentId}
        onClose={() => setViewerDocumentId(null)}
      />
    </div>
  );
}
