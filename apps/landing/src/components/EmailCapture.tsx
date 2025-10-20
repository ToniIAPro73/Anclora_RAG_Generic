'use client';

import { useState } from 'react';

export function EmailCapture() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/waitlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          referral_source: 'landing_page'
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setIsSuccess(true);
        setMessage(`¡Genial! Te hemos añadido a la lista de espera. Posición: ${data.position}`);
      } else {
        setMessage(data.message || 'Error al procesar la solicitud');
      }
    } catch (error) {
      setMessage('Error de conexión. Por favor, inténtalo de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-blue-600">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
          ¿Listo para revolucionar tu flujo de trabajo?
        </h2>
        <p className="text-xl text-blue-100 mb-12">
          Únete a las primeras 100 empresas que probarán Anclora RAG
        </p>

        {!isSuccess ? (
          <form onSubmit={handleSubmit} className="max-w-md mx-auto">
            <div className="flex flex-col sm:flex-row gap-4">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                className="flex-1 px-4 py-3 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-300"
                required
              />
              <button
                type="submit"
                disabled={isLoading}
                className="bg-white text-blue-600 font-semibold py-3 px-8 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                {isLoading ? 'Procesando...' : 'Únete a la Beta'}
              </button>
            </div>
            {message && (
              <p className="text-red-200 text-sm mt-4">{message}</p>
            )}
          </form>
        ) : (
          <div className="bg-white rounded-lg p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-green-600 text-2xl">✓</span>
            </div>
            <h3 className="text-2xl font-semibold text-gray-900 mb-2">
              ¡Estás en la lista!
            </h3>
            <p className="text-gray-600 mb-6">
              {message}
            </p>
            <p className="text-sm text-gray-500">
              Te enviaremos un email cuando sea tu turno
            </p>
          </div>
        )}

        <div className="mt-8 text-blue-100 text-sm">
          <p>🔒 Sin spam • 🚫 Sin compartir datos • 📧 Email de confirmación inmediato</p>
        </div>
      </div>
    </section>
  );
}