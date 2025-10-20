'use client';

import { useState } from 'react';

import { faqItems } from '@/content/faq';

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  return (
    <section id="faq" className="relative px-6 pb-28 pt-24 sm:px-10 lg:px-16">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />
      </div>

      <div className="relative mx-auto flex max-w-6xl flex-col gap-12">
        <div className="mx-auto max-w-3xl space-y-5 text-center">
          <span className="text-sm font-semibold uppercase tracking-[0.35em] text-[#06B6D4]">
            FAQ
          </span>
          <h2 className="text-3xl font-semibold sm:text-4xl">
            <span className="bg-gradient-to-r from-[#06B6D4] via-[#5AE2D9] to-[#D946EF] bg-clip-text text-transparent">
              Resolvemos las dudas más comunes antes de que te sumes a la beta
            </span>
          </h2>
          <p className="text-lg text-slate-300">
            Si no encuentras lo que buscas, escríbenos a{' '}
            <a
              href="mailto:hola@anclora.com"
              className="text-[#06B6D4] underline decoration-dotted underline-offset-4 hover:text-[#D946EF]"
            >
              hola@anclora.com
            </a>
            .
          </p>
        </div>

        <div className="rounded-[32px] border border-white/10 bg-[#0C1020]/80 p-6 shadow-[0_40px_120px_-60px_rgba(217,70,239,0.65)] backdrop-blur lg:p-10">
          {faqItems.map((item, index) => {
            const isOpen = openIndex === index;

            return (
              <div key={item.question} className="border-b border-white/5 last:border-none">
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  className="flex w-full items-center justify-between gap-6 py-5 text-left transition hover:text-white"
                >
                  <span className="text-lg font-semibold text-slate-100">{item.question}</span>
                  <span
                    aria-hidden="true"
                    className={`flex h-8 w-8 items-center justify-center rounded-full border border-white/10 text-sm text-slate-200 transition ${
                      isOpen ? 'rotate-45 border-[#06B6D4] text-[#06B6D4]' : ''
                    }`}
                  >
                    {isOpen ? '×' : '+'}
                  </span>
                </button>
                {isOpen && (
                  <div className="pb-5 text-base leading-relaxed text-slate-300">
                    {item.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

    </section>
  );
}
