export function Features() {
  const features = [
    {
      title: "🤝 Colaboración en Tiempo Real",
      description: "Múltiples usuarios trabajando simultáneamente en consultas y documentos RAG",
      benefit: "85% reducción en tiempo de búsqueda colaborativa"
    },
    {
      title: "🧠 Inteligencia Multimodal",
      description: "Procesamiento conjunto de texto, imágenes, tablas y diagramas técnicos",
      benefit: "Mayoría de competidores limitados a texto"
    },
    {
      title: "⚡ Automatización Inteligente",
      description: "Flujos de trabajo que aprenden y se adaptan automáticamente",
      benefit: "90% automatización de procesos documentales"
    },
    {
      title: "💭 Memoria Contextual Persistente",
      description: "Sistema que mantiene contexto y conocimiento del equipo a largo plazo",
      benefit: "100% del conocimiento organizacional retenido"
    }
  ];

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Características que marcan la diferencia
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Cinco diferenciadores clave que posicionan a Anclora como líder en el espacio RAG
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="bg-white p-8 rounded-lg shadow-sm border border-gray-100">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                {feature.title}
              </h3>
              <p className="text-gray-600 mb-4">
                {feature.description}
              </p>
              <p className="text-sm font-medium text-blue-600">
                {feature.benefit}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}