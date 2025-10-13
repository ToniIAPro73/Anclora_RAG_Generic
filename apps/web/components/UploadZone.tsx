import { useState, useRef, DragEvent, ChangeEvent } from 'react';
import { ingestDocument } from '@/lib/api';
import { useUISettings } from './ui-settings-context';

interface UploadZoneProps {
  onUploadSuccess: (fileName: string, chunks: number) => void;
  onUploadError: (error: string) => void;
}

export default function UploadZone({ onUploadSuccess, onUploadError }: UploadZoneProps) {
  const { language } = useUISettings();
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const uploadFile = async (file: File) => {
    setIsUploading(true);
    try {
      const result = await ingestDocument(file);
      onUploadSuccess(result.file, result.chunks);
    } catch (error: any) {
      onUploadError(error.response?.data?.detail || error.message);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div
      className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
        isDragging
          ? 'border-anclora-primary bg-purple-50 dark:border-anclora-primary/80 dark:bg-slate-900/70'
          : 'border-gray-300 hover:border-anclora-secondary dark:border-slate-600 dark:bg-slate-900/60 dark:hover:border-anclora-secondary/70'
      } ${isUploading ? 'pointer-events-none opacity-50' : ''} dark:text-slate-200`}
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
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-anclora-primary mx-auto mb-2"></div>
          <p className="text-gray-600 dark:text-slate-300">Procesando documento...</p>
        </div>
      ) : (
        <>
          <svg
            className="mx-auto h-12 w-12 text-anclora-secondary mb-4"
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
          <p className="text-gray-700 font-medium dark:text-slate-100 mb-2">
            {language === 'es'
              ? 'Arrastra un documento o haz clic para seleccionar'
              : 'Drag & drop a document or click to select'}
          </p>
          <p className="text-sm text-gray-500 dark:text-slate-400 mb-4">
            {language === 'es' ? 'Soporta: PDF, TXT, DOCX, MD' : 'Supported: PDF, TXT, DOCX, MD'}
          </p>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="bg-gradient-anclora text-white px-6 py-2 rounded-lg hover:opacity-90 transition-opacity shadow-md"
          >
            {language === 'es' ? 'Seleccionar archivo' : 'Choose file'}
          </button>
        </>
      )}
    </div>
  );
}
