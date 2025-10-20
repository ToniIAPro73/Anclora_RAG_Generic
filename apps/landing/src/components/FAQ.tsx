'use client';

import { useState } from 'react';

const faqData = [
  {
    question: "¿Qué hace diferente a Anclora RAG?",
    answer: "Anclora es el primer RAG verdaderamente colaborativo. Mientras que herramientas como NotebookLM son individuales, Anclora permite que múltiples usuarios trabajen simultáneamente en consultas y documentos, con memoria contextual persistente del equipo."
  },
  {
    question: "¿Cuánto cuesta durante la beta?",
    answer: "Durante la beta cerrada, Anclora es completamente gratuito para los primeros 100 usuarios. Después del lanzamiento, mantendremos un tier gratuito limitado y planes pagos para empresas."
  },
  {
    question: "¿Qué tipos de documentos puedo subir?",
    answer: "Anclora procesa texto, imágenes, tablas y diagramas técnicos. Soporta PDF, DOCX, TXT, Markdown, y varios formatos de imagen. Nuestro sistema multimodal es único en el mercado."
  },
  {
    question: "¿Es seguro subir documentos sensibles?",
    answer: "Sí, la seguridad es nuestra prioridad. Todos los documentos se procesan en servidores seguros en Europa, con encriptación end-to-end. No compartimos datos con terceros ni usamos tu información para entrenar modelos."
  },
  {
    question: "¿Cuántos usuarios por equipo?",
    answer: "Durante la beta, hasta 10 usuarios por organización. En el lanzamiento comercial, ofreceremos planes desde 5 hasta 100+ usuarios con diferentes límites de documentos."
  },
  {
    question: "¿Necesito conocimientos técnicos?",
    answer: "Para nada. Anclora está diseñado para usuarios empresariales sin conocimientos técnicos. El proceso es: subir documentos → hacer preguntas en lenguaje natural → obtener respuestas con citas."
  },
  {
    question: "¿En qué idiomas funciona?",
    answer: "Actualmente soporta español e inglés, con planes de añadir más idiomas europeos. El sistema detecta automáticamente el idioma de tus documentos y consultas."
  },
  {
    question: "¿Puedo integrar Anclora con otras herramientas?",
    answer: "Sí, durante la beta soportamos Slack, Teams, Google Drive, GitHub y Notion. Estamos trabajando en más integraciones para el lanzamiento comercial."
  },
  {
    question: "¿Cuánto tiempo toma el setup?",
    answer: "Menos de 2 minutos. Solo necesitas: 1) Crear cuenta, 2) Subir tus primeros documentos, 3) Empezar a hacer preguntas. No requiere configuración técnica."
  },
  {
    question: "¿Qué pasa si tengo problemas?",
    answer: "Durante la beta ofrecemos soporte prioritario por email y chat. Nuestro equipo responde en menos de 2 horas y muchos usuarios reciben soporte directo del equipo fundador."
  }
];

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Preguntas frecuentes
          </h2>
          <p className="text-lg text-gray-600">
            Resolvemos las dudas más comunes sobre Anclora RAG
          </p>
        </div>

        <div className="space-y-4">
          {faqData.map((faq, index) => (
            <div key={index} className="border border-gray-200 rounded-lg">
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 focus:outline-none focus:bg-gray-50"
              >
                <span className="font-semibold text-gray-900">{faq.question}</span>
                <span className="text-blue-600 ml-4">
                  {openIndex === index ? '−' : '+'}
                </span>
              </button>
              {openIndex === index && (
                <div className="px-6 pb-4">
                  <p className="text-gray-600">{faq.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <p className="text-gray-600 mb-4">
            ¿No encuentras respuesta a tu pregunta?
          </p>
          <a
            href="mailto:hola@anclora.com"
            className="text-blue-600 hover:text-blue-700 font-semibold"
          >
            Contáctanos: hola@anclora.com
          </a>
        </div>
      </div>
    </section>
  );
}