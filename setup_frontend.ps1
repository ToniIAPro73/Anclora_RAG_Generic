# setup_frontend.ps1
# Script completo para configurar frontend Next.js de Anclora RAG

$ErrorActionPreference = "Stop"

Write-Host "`n🚀 Iniciando configuración del Frontend Anclora RAG..." -ForegroundColor Cyan

# Paso 1: Navegar y hacer backup
Write-Host "`n📁 Paso 1: Preparando directorios..." -ForegroundColor Yellow
Set-Location apps
if (Test-Path web) {
    Write-Host "   Haciendo backup de web existente..." -ForegroundColor DarkGray
    if (Test-Path web_backup) { Remove-Item -Recurse -Force web_backup }
    Rename-Item web web_backup
}
New-Item -ItemType Directory -Path web -Force | Out-Null
Set-Location web

# Paso 2: Inicializar Next.js
Write-Host "`n📦 Paso 2: Inicializando Next.js con TypeScript y Tailwind..." -ForegroundColor Yellow
npx -y create-next-app@latest . --typescript --tailwind --app --no-src-dir --eslint --no-turbopack --import-alias "@/*"

# Paso 3: Instalar axios
Write-Host "`n📦 Paso 3: Instalando axios..." -ForegroundColor Yellow
npm install axios

# Paso 3.1: Configurar puerto 3030 en package.json
Write-Host "`n⚙️  Paso 3.1: Configurando puerto 3030..." -ForegroundColor Yellow
$packageJsonPath = "package.json"
$packageContent = Get-Content $packageJsonPath -Raw | ConvertFrom-Json
$packageContent.scripts.dev = "next dev -p 3030"
$packageContent | ConvertTo-Json -Depth 10 | Set-Content $packageJsonPath

# Paso 4: Crear estructura de directorios
Write-Host "`n📂 Paso 4: Creando estructura de directorios..." -ForegroundColor Yellow
New-Item -ItemType Directory -Path lib -Force | Out-Null
New-Item -ItemType Directory -Path components -Force | Out-Null

# Paso 5: Crear lib/api.ts
Write-Host "`n📝 Paso 5: Creando lib/api.ts..." -ForegroundColor Yellow
@'
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8030';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface IngestResponse {
  file: string;
  chunks: number;
}

export interface QueryResponse {
  query: string;
  response: string;
  sources: Array<{
    text: string;
    score: number;
  }>;
}

export const ingestDocument = async (file: File): Promise<IngestResponse> => {
  const formData = new FormData();
  formData.append('file', file);

  const { data } = await apiClient.post<IngestResponse>('/ingest', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return data;
};

export const queryDocuments = async (
  query: string,
  topK: number = 3
): Promise<QueryResponse> => {
  const { data } = await apiClient.post<QueryResponse>('/query', {
    query,
    top_k: topK,
  });

  return data;
};
'@ | Out-File -Encoding utf8 lib/api.ts

# Paso 6a: Crear components/Message.tsx
Write-Host "`n📝 Paso 6a: Creando components/Message.tsx..." -ForegroundColor Yellow
@'
interface MessageProps {
  role: 'user' | 'assistant';
  content: string;
  sources?: Array<{
    text: string;
    score: number;
  }>;
}

export default function Message({ role, content, sources }: MessageProps) {
  const isUser = role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div
        className={`max-w-[70%] rounded-lg p-4 ${
          isUser
            ? 'bg-blue-600 text-white'
            : 'bg-gray-100 text-gray-900 border border-gray-200'
        }`}
      >
        <p className="whitespace-pre-wrap">{content}</p>
        
        {sources && sources.length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-300">
            <p className="text-xs font-semibold mb-2 opacity-75">Fuentes:</p>
            {sources.map((source, idx) => (
              <div key={idx} className="text-xs opacity-70 mb-1">
                <span className="font-mono">({(source.score * 100).toFixed(1)}%)</span>{' '}
                {source.text.substring(0, 100)}...
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
'@ | Out-File -Encoding utf8 components/Message.tsx

# Paso 6b: Crear components/UploadZone.tsx
Write-Host "`n📝 Paso 6b: Creando components/UploadZone.tsx..." -ForegroundColor Yellow
@'
import { useState, useRef, DragEvent, ChangeEvent } from 'react';
import { ingestDocument } from '@/lib/api';

interface UploadZoneProps {
  onUploadSuccess: (fileName: string, chunks: number) => void;
  onUploadError: (error: string) => void;
}

export default function UploadZone({ onUploadSuccess, onUploadError }: UploadZoneProps) {
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
          ? 'border-blue-500 bg-blue-50'
          : 'border-gray-300 hover:border-gray-400'
      } ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}
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
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-gray-600">Procesando documento...</p>
        </div>
      ) : (
        <>
          <svg
            className="mx-auto h-12 w-12 text-gray-400 mb-4"
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
          <p className="text-gray-700 font-medium mb-2">
            Arrastra un documento o haz clic para seleccionar
          </p>
          <p className="text-sm text-gray-500 mb-4">
            Soporta: PDF, TXT, DOCX, MD
          </p>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Seleccionar archivo
          </button>
        </>
      )}
    </div>
  );
}
'@ | Out-File -Encoding utf8 components/UploadZone.tsx

# Paso 6c: Crear components/Chat.tsx
Write-Host "`n📝 Paso 6c: Creando components/Chat.tsx..." -ForegroundColor Yellow
@'
import { useState, useRef, useEffect, FormEvent } from 'react';
import { queryDocuments } from '@/lib/api';
import Message from './Message';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  sources?: Array<{
    text: string;
    score: number;
  }>;
}

export default function Chat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: input.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const result = await queryDocuments(userMessage.content);
      
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: result.response,
        sources: result.sources,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error: any) {
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: `Error: ${error.response?.data?.detail || error.message}`,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            <p>Sube un documento y comienza a hacer preguntas</p>
          </div>
        ) : (
          <>
            {messages.map((msg, idx) => (
              <Message
                key={idx}
                role={msg.role}
                content={msg.content}
                sources={msg.sources}
              />
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-lg p-4 border border-gray-200">
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      <div className="border-t bg-white p-4">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Escribe tu pregunta..."
            className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            Enviar
          </button>
        </form>
      </div>
    </div>
  );
}
'@ | Out-File -Encoding utf8 components/Chat.tsx

# Paso 6d: Crear app/layout.tsx
Write-Host "`n📝 Paso 6d: Creando app/layout.tsx..." -ForegroundColor Yellow
@'
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Anclora RAG',
  description: 'Sistema RAG con LLM local y embeddings de HuggingFace',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <div className="min-h-screen bg-gray-50">
          <header className="bg-white border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 py-4">
              <h1 className="text-2xl font-bold text-gray-900">
                🚀 Anclora RAG
              </h1>
              <p className="text-sm text-gray-600">
                Ollama + HuggingFace + Qdrant
              </p>
            </div>
          </header>
          <main>{children}</main>
        </div>
      </body>
    </html>
  );
}
'@ | Out-File -Encoding utf8 app/layout.tsx

# Paso 6e: Crear app/page.tsx
Write-Host "`n📝 Paso 6e: Creando app/page.tsx..." -ForegroundColor Yellow
@'
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
          className={`mb-4 p-4 rounded-lg ${
            notification.type === 'success'
              ? 'bg-green-100 text-green-800 border border-green-200'
              : 'bg-red-100 text-red-800 border border-red-200'
          }`}
        >
          {notification.message}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-180px)]">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">
            📄 Subir Documento
          </h2>
          <UploadZone
            onUploadSuccess={handleUploadSuccess}
            onUploadError={handleUploadError}
          />
        </div>

        <div className="bg-white rounded-lg shadow flex flex-col">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold text-gray-900">
              💬 Consultar Documentos
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
'@ | Out-File -Encoding utf8 app/page.tsx

# Paso 7: Crear .env.local
Write-Host "`n📝 Paso 7: Creando .env.local..." -ForegroundColor Yellow
@'
NEXT_PUBLIC_API_URL=http://localhost:8030
'@ | Out-File -Encoding utf8 .env.local

# Paso 8: Arrancar servidor de desarrollo
Write-Host "`n🚀 Paso 8: Arrancando servidor de desarrollo en puerto 3030..." -ForegroundColor Yellow
Write-Host "`n✅ Frontend configurado correctamente!" -ForegroundColor Green
Write-Host "`n📍 Puertos asignados:" -ForegroundColor Cyan
Write-Host "   Frontend:  http://localhost:3030" -ForegroundColor White
Write-Host "   Backend:   http://localhost:8030" -ForegroundColor White
Write-Host "   Qdrant:    http://localhost:6363" -ForegroundColor White
Write-Host "   Ollama:    http://localhost:11464" -ForegroundColor White
Write-Host "`nPresiona Ctrl+C para detener el servidor`n" -ForegroundColor DarkGray

npm run dev