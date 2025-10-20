import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { GoogleAnalytics } from '@/components/GoogleAnalytics';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Anclora RAG - Sistema RAG Colaborativo e Inteligente",
  description: "La primera plataforma RAG verdaderamente colaborativa. Sube documentos, haz preguntas complejas y obtén respuestas con citas verificables. Beta cerrado disponible.",
  keywords: "RAG, inteligencia artificial, colaboración, documentos, búsqueda inteligente, beta",
  authors: [{ name: "Anclora" }],
  openGraph: {
    title: "Anclora RAG - Sistema RAG Colaborativo",
    description: "La primera plataforma RAG verdaderamente colaborativa para equipos",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <head>
        <GoogleAnalytics />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
