import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/Providers';
import AppShell from '@/components/AppShell';

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
      <body
        className={`${inter.className} bg-[var(--background)] text-[var(--foreground)] transition-colors`}
      >
        <Providers>
          <div className="min-h-screen">
            <AppShell>{children}</AppShell>
          </div>
        </Providers>
      </body>
    </html>
  );
}
