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
