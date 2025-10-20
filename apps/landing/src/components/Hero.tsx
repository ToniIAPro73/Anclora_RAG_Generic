export function Hero() {
  return (
    <section className="relative bg-gradient-to-br from-blue-50 to-indigo-100 py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto text-center">
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
          Anclora RAG
        </h1>
        <p className="text-xl sm:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto">
          La primera plataforma RAG verdaderamente colaborativa para equipos
        </p>
        <p className="text-lg text-gray-700 mb-12 max-w-2xl mx-auto">
          Sube documentos, haz preguntas complejas y obtén respuestas con citas verificables.
          Colabora en tiempo real con tu equipo.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg text-lg transition-colors">
            Únete a la Beta
          </button>
          <button className="border border-gray-300 hover:border-gray-400 text-gray-700 font-semibold py-3 px-8 rounded-lg text-lg transition-colors">
            Ver Demo
          </button>
        </div>
        <p className="text-sm text-gray-500 mt-6">
          ✅ Sin tarjeta de crédito • 🚀 Setup en 2 minutos • 👥 Hasta 10 usuarios gratis
        </p>
      </div>
    </section>
  );
}