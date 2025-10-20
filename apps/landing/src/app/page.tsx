import { Hero } from '@/components/Hero';
import { ProblemSolution } from '@/components/ProblemSolution';
import { Features } from '@/components/Features';
import { EmailCapture } from '@/components/EmailCapture';
import { FAQ } from '@/components/FAQ';

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      <Hero />
      <ProblemSolution />
      <Features />
      <EmailCapture />
      <FAQ />
    </div>
  );
}
