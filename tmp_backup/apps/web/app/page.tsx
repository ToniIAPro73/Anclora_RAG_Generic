'use client';

import { useState } from 'react';
import UploadZone from '@/components/UploadZone';
import Chat from '@/components/Chat';

export default function Home() {
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const handleUploadSuccess = (fileName: string, chunks: number) => {
    setNotification({
      type: 'success',
      message: `✅ ${fileName} indexado con ${chunks} chunks`,
    });
    setTimeout(() => setNotification(null), 5000);
  };

  const handleUploadError = (error: string) => {
    setNotification({
      type: 'error',
      message: `❌ Error: ${error}`,
    });
    setTimeout(() => setNotification(null), 5000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
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
            <span className="text-2xl">📄</span> Subir Documento
          </h2>
          <UploadZone
            onUploadSuccess={handleUploadSuccess}
            onUploadError={handleUploadError}
          />
        </div>

        <div className="bg-white rounded-lg shadow-lg flex flex-col border-t-4 border-anclora-secondary">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <span className="text-2xl">💬</span> Consultar Documentos
            </h2>
          </div>
          <div className="flex-1 min-h-0">
            <Chat />
          </div>
        </div>
      </div>
    </div>
  );
}
