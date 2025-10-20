'use client';

import { useState } from 'react';

type Feedback = {
  text: string;
  tone: 'success' | 'error';
};

export function EmailCapture() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setFeedback(null);

    try {
      const response = await fetch('/api/waitlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          referral_source: 'landing_page',
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setIsSuccess(true);
        setFeedback({
          text: `¡Listo! Te hemos añadido a la beta. Posición actual: ${data.position}`,
          tone: 'success',
        });
      } else {
        setIsSuccess(false);
        setFeedback({
          text: data.message || 'No pudimos procesar tu solicitud. Inténtalo nuevamente.',
          tone: 'error',
        });
      }
    } catch (error) {
      console.error('Failed to join waitlist from landing', error);
      setIsSuccess(false);
      setFeedback({
        text: 'Error de conexión. Revisa tu internet e inténtalo una vez más.',
        tone: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section id="waitlist" className="relative overflow-hidden px-6 py-24 sm:px-10 lg:px-16">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-x-0 top-[-10%] h-64 bg-[radial-gradient(circle_at_top,rgba(6,182,212,0.25),transparent_70%)] blur-3xl" />
        <div className="absolute bottom-[-20%] right-[-10%] h-96 w-96 rounded-full bg-[radial-gradient(circle,rgba(217,70,239,0.25),transparent_70%)] blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-4xl overflow-hidden rounded-[32px] border border-white/10 bg-gradient-to-br from-[#181C30]/95 via-[#131B28]/95 to-[#0C1020]/95 p-10 shadow-[0_35px_110px_-60px_rgba(6,182,212,0.8)] backdrop-blur">
        <div className="flex flex-col gap-8 text-center md:gap-10">
          <div className="space-y-4">
            <span className="inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1 text-xs font-semibold uppercase tracking-[0.35em] text-[#06B6D4]">
              Early access
            </span>
            <h2 className="text-3xl font-semibold sm:text-4xl">
              <span className="bg-gradient-to-r from-[#D946EF] via-[#AC6CFF] to-[#06B6D4] bg-clip-text text-transparent">
                Únete a las primeras organizaciones que activan Anclora RAG
              </span>
            </h2>
            <p className="text-lg text-slate-300">
              Garantizamos onboarding asistido, soporte en menos de 2 horas y un canal directo con
              el equipo fundador mientras dura la beta privada.
            </p>
          </div>

          {!isSuccess ? (
            <form
              onSubmit={handleSubmit}
              className="mx-auto flex w-full flex-col items-center gap-4 sm:flex-row sm:rounded-full sm:border sm:border-white/10 sm:bg-white/5 sm:p-2 sm:backdrop-blur"
            >
              <label htmlFor="email" className="sr-only">
                Correo electrónico
              </label>
              <input
                id="email"
                type="email"
                value={email}
                autoComplete="email"
                required
                onChange={(event) => setEmail(event.target.value)}
                placeholder="tu@empresa.com"
                className="w-full rounded-full border border-white/10 bg-[#0C1020]/70 px-5 py-3 text-base text-white outline-none ring-0 transition hover:border-[#06B6D4]/40 focus:border-[#06B6D4] focus:ring-4 focus:ring-[#06B6D4]/20 sm:border-none sm:bg-transparent sm:px-6 sm:py-3"
              />
              <button
                type="submit"
                disabled={isLoading}
                className="relative inline-flex w-full items-center justify-center overflow-hidden rounded-full px-6 py-3 text-sm font-semibold uppercase tracking-[0.35em] text-white transition sm:w-auto"
              >
                <span className="absolute inset-0 -z-10 rounded-full bg-gradient-to-r from-[#D946EF] via-[#C26DF6] to-[#06B6D4] opacity-90 transition duration-200 hover:opacity-100 disabled:opacity-60" />
                {isLoading ? 'Procesando…' : 'Solicitar acceso beta'}
              </button>
            </form>
          ) : (
            <div className="mx-auto flex max-w-lg flex-col items-center gap-4 rounded-3xl border border-[#06B6D4]/40 bg-[#0F172A]/80 px-6 py-8 text-center text-slate-100">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#06B6D4]/15 text-2xl text-[#06B6D4]">
                ✓
              </div>
              <h3 className="text-2xl font-semibold text-white">¡Estás en la lista!</h3>
              {feedback?.text && <p className="text-base text-slate-300">{feedback.text}</p>}
              <p className="text-xs uppercase tracking-[0.35em] text-slate-400">
                Te escribiremos cuando abramos tu cupo
              </p>
            </div>
          )}

          {feedback && !isSuccess && (
            <p
              role="status"
              className={`text-sm ${
                feedback.tone === 'success' ? 'text-[#34D399]' : 'text-[#F87171]'
              }`}
            >
              {feedback.text}
            </p>
          )}

          <div className="grid gap-4 text-left text-sm text-slate-300 sm:grid-cols-3 sm:text-center">
            <div>
              <p className="font-semibold text-white">Sin spam ni venta de datos</p>
              <p>Usamos Hostinger SMTP sobre dominio propio.</p>
            </div>
            <div>
              <p className="font-semibold text-white">Respuesta inmediata</p>
              <p>Confirmación automática con tu posición en la lista.</p>
            </div>
            <div>
              <p className="font-semibold text-white">Acceso prioritario</p>
              <p>Primeros 100 registros obtienen onboarding asistido.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
