import { EmailCapture } from '@/components/EmailCapture';
import { FAQ } from '@/components/FAQ';
import { Features } from '@/components/Features';
import { Hero } from '@/components/Hero';
import { ProblemSolution } from '@/components/ProblemSolution';
import { faqItems } from '@/content/faq';

export default function Home() {
  const faqStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqItems.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };

  return (
    <main className="relative flex min-h-screen flex-col overflow-hidden">
      <div className="absolute inset-x-0 top-0 z-[-1] h-[400px] bg-[radial-gradient(circle_at_top,rgba(217,70,239,0.25),transparent_70%)] blur-3xl" />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqStructuredData) }}
      />
      <Hero />
      <ProblemSolution />
      <Features />
      <EmailCapture />
      <FAQ />
      <footer className="border-t border-white/10 px-6 py-10 text-center text-sm text-slate-400 sm:px-10 lg:px-16">
        © {new Date().getFullYear()} Anclora RAG · Construyendo la plataforma RAG colaborativa para equipos.
      </footer>
    </main>
  );
}
