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
          <header className="bg-gradient-anclora text-white shadow-lg">
            <div className="max-w-7xl mx-auto px-4 py-6">
              <h1 className="text-3xl font-bold">
                🚀 Anclora RAG
              </h1>
              <p className="text-sm opacity-90 mt-1">
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
