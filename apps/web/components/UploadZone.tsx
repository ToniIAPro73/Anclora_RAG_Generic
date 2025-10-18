import { useState, useRef, DragEvent, ChangeEvent, useEffect } from "react";
import { isAxiosError } from "axios";
import { ingestDocument, getJobStatus } from "@/lib/api";
import { useUISettings } from "./ui-settings-context";

interface UploadZoneProps {
  onUploadSuccess: (fileName: string, chunks: number) => void;
  onUploadError: (error: string) => void;
}

const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  "text/markdown",
  "application/octet-stream",
]);

const ALLOWED_EXTENSIONS = new Set([".pdf", ".docx", ".txt", ".md", ".markdown"]);

export default function UploadZone({ onUploadSuccess, onUploadError }: UploadZoneProps) {
  const { language } = useUISettings();
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [uploadStatus, setUploadStatus] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Poll job status when jobId is set
  useEffect(() => {
    if (!jobId) return;

    const pollJobStatus = async () => {
      try {
        const status = await getJobStatus(jobId);

        // Update status message
        const statusMessages: Record<string, { es: string; en: string }> = {
          queued: { es: "En cola...", en: "Queued..." },
          processing: { es: "Procesando documento...", en: "Processing document..." },
          completed: { es: "Completado", en: "Completed" },
          failed: { es: "Error en procesamiento", en: "Processing failed" },
        };

        setUploadStatus(statusMessages[status.status]?.[language] || status.status);

        // Handle completion
        if (status.status === "completed" && status.result) {
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
          }
          setIsUploading(false);
          setJobId(null);
          onUploadSuccess(status.result.file, status.result.chunks);
        }

        // Handle failure
        if (status.status === "failed") {
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
          }
          setIsUploading(false);
          setJobId(null);
          onUploadError(status.error || "Job failed");
        }
      } catch (error) {
        console.error("Error polling job status:", error);
        // Don't stop polling on network errors, but stop if job not found
        if (isAxiosError(error) && error.response?.status === 404) {
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
          }
          setIsUploading(false);
          setJobId(null);
          onUploadError("Job not found or expired");
        }
      }
    };

    // Start polling immediately and then every 2 seconds
    pollJobStatus();
    pollingIntervalRef.current = setInterval(pollJobStatus, 2000);

    // Cleanup on unmount or when jobId changes
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [jobId, language, onUploadSuccess, onUploadError]);

  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      await uploadFile(files[0]);
    }
  };

  const handleFileSelect = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      await uploadFile(files[0]);
    }
  };

  const isSupportedFile = (file: File) => {
    if (ALLOWED_MIME_TYPES.has(file.type)) {
      return true;
    }
    const dotIndex = file.name.lastIndexOf(".");
    const extension = dotIndex >= 0 ? file.name.slice(dotIndex).toLowerCase() : "";
    return ALLOWED_EXTENSIONS.has(extension);
  };

  const unsupportedFileMessage =
    language === "es"
      ? "Tipo de archivo no soportado. Usa PDF, DOCX, TXT o Markdown."
      : "Unsupported file type. Please upload PDF, DOCX, TXT or Markdown files.";

  const uploadFile = async (file: File) => {
    if (!isSupportedFile(file)) {
      onUploadError(unsupportedFileMessage);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      return;
    }

    setIsUploading(true);
    setUploadStatus(language === "es" ? "Subiendo archivo..." : "Uploading file...");

    try {
      const result = await ingestDocument(file);

      // Check if async mode (has job_id) or sync mode (has chunks directly)
      if (result.job_id) {
        // Async mode: Start polling for job status
        setJobId(result.job_id);
        setUploadStatus(language === "es" ? "En cola..." : "Queued...");
      } else {
        // Sync mode: Handle immediate result
        const chunks = result.chunks ?? result.chunk_count ?? 0;
        onUploadSuccess(result.file, chunks);
        setIsUploading(false);
      }
    } catch (error: unknown) {
      const fallback =
        error instanceof Error ? error.message : typeof error === "string" ? error : "Unknown error";
      const detail =
        isAxiosError(error) && error.response?.data && typeof error.response.data === "object"
          ? (error.response.data as { detail?: string }).detail ?? fallback
          : fallback;
      onUploadError(detail);
      setIsUploading(false);
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div
      className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
        isDragging
          ? "border-anclora-primary bg-purple-50 dark:border-anclora-primary/80 dark:bg-slate-900/70"
          : "border-gray-300 hover:border-anclora-secondary dark:border-slate-600 dark:bg-slate-900/60 dark:hover:border-anclora-secondary/70"
      } ${isUploading ? "pointer-events-none opacity-50" : ""} dark:text-slate-200`}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={handleFileSelect}
        accept=".pdf,.txt,.docx,.md"
        disabled={isUploading}
      />

      {isUploading ? (
        <div className="py-4">
          <div className="mx-auto mb-2 h-10 w-10 animate-spin rounded-full border-b-2 border-anclora-primary"></div>
          <p className="text-gray-600 dark:text-slate-300">
            {uploadStatus || (language === "es" ? "Procesando documento..." : "Processing document...")}
          </p>
          {jobId && (
            <p className="mt-2 text-xs text-gray-400 dark:text-slate-500">Job ID: {jobId}</p>
          )}
        </div>
      ) : (
        <>
          <svg
            className="mx-auto mb-4 h-12 w-12 text-anclora-secondary"
            stroke="currentColor"
            fill="none"
            viewBox="0 0 48 48"
          >
            <path
              d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <p className="mb-2 font-medium text-gray-700 dark:text-slate-100">
            {language === "es"
              ? "Arrastra un documento o haz clic para seleccionar"
              : "Drag & drop a document or click to select"}
          </p>
          <p className="mb-4 text-sm text-gray-500 dark:text-slate-400">
            {language === "es" ? "Soporta: PDF, TXT, DOCX, MD" : "Supported: PDF, TXT, DOCX, MD"}
          </p>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="rounded-lg bg-gradient-anclora px-6 py-2 text-white shadow-md transition-opacity hover:opacity-90"
          >
            {language === "es" ? "Seleccionar archivo" : "Choose file"}
          </button>
        </>
      )}
    </div>
  );
}
