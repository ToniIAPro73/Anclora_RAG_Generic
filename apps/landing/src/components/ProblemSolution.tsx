export function ProblemSolution() {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            El problema que resuelve Anclora
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Los sistemas RAG actuales tienen limitaciones críticas que impiden su adopción empresarial
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Problema */}
          <div className="space-y-6">
            <h3 className="text-2xl font-semibold text-red-600 mb-6">
              ❌ Problemas actuales
            </h3>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center mt-0.5">
                  <span className="text-red-600 text-sm">✗</span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">Ventana de contexto limitada</h4>
                  <p className="text-gray-600">Máximo 500,000 palabras por fuente</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center mt-0.5">
                  <span className="text-red-600 text-sm">✗</span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">Uso individual</h4>
                  <p className="text-gray-600">Sin capacidades de colaboración</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center mt-0.5">
                  <span className="text-red-600 text-sm">✗</span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">Citas incorrectas</h4>
                  <p className="text-gray-600">Información errónea frecuente</p>
                </div>
              </div>
            </div>
          </div>

          {/* Solución */}
          <div className="space-y-6">
            <h3 className="text-2xl font-semibold text-green-600 mb-6">
              ✅ Nuestra solución
            </h3>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mt-0.5">
                  <span className="text-green-600 text-sm">✓</span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">Memoria extendida</h4>
                  <p className="text-gray-600">Procesamiento completo de documentos largos</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mt-0.5">
                  <span className="text-green-600 text-sm">✓</span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">Colaboración en tiempo real</h4>
                  <p className="text-gray-600">Múltiples usuarios trabajando simultáneamente</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mt-0.5">
                  <span className="text-green-600 text-sm">✓</span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">Citas 100% precisas</h4>
                  <p className="text-gray-600">Sistema híbrido graph + vector search</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}