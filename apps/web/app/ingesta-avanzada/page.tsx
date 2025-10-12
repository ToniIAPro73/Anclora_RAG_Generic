'use client';

import { FormEvent, useState } from 'react';
import { useUISettings } from '@/components/ui-settings-context';

type TabId = 'documents' | 'github' | 'structured';

const COPY = {
  es: {
    heroTitle: 'Ingesta Avanzada',
    heroSubtitle:
      'Orquesta pipelines asincrónicos para ingerir repositorios, lotes masivos y fuentes estructuradas con control total.',
    proBadge: 'Pro',
    proCallout:
      'La ingesta avanzada forma parte de Anclora Pro. Visualiza el flujo completo y solicita acceso para habilitarla.',
    requestButton: 'Solicitar acceso',
    featuresTitle: 'Capacidades destacadas',
    proReminder:
      'Inicia sesión con una suscripción Anclora Pro para ejecutar la ingesta avanzada. Te mostraremos cómo se organiza el pipeline mientras tanto.',
    pipelineTitle: 'Pipeline orquestado',
    timeline: [
      {
        title: 'Gestión de lotes',
        description:
          'Batch Manager agrupa documentos, valida tamaños y controla el ciclo de vida (pending → processing → completed).',
      },
      {
        title: 'Validación y normalización',
        description:
          'Detecta duplicados con SimHash, aplica antivirus opcional y normaliza a UTF-8 antes del parseo.',
      },
      {
        title: 'Parseo especializado',
        description:
          'Selecciona automáticamente el parser óptimo: unstructured.io, extractores específicos o tree-sitter para código.',
      },
      {
        title: 'Chunking semántico',
        description:
          'Fragmentación inteligente con LlamaIndex SentenceSplitter (512 tokens / solape 80).',
      },
      {
        title: 'Embeddings y enriquecimiento',
        description:
          'Generación de embeddings con nomic-embed-text v1.5 y enriquecimiento con metadatos contextuales.',
      },
      {
        title: 'Indexación y auditoría',
        description:
          'Inserción en Qdrant, registro en Supabase y logging detallado con auditoría de eventos.',
      },
    ],
    featureCards: [
      {
        title: 'Gestor de lotes',
        bullets: [
          'IDs trazables, descripción y owner asignado.',
          'Tracking en tiempo real (progreso, fallos parciales).',
          'Retentiva de metadatos y colección destino en Qdrant.',
        ],
      },
      {
        title: 'Procesamiento multiformato',
        bullets: [
          '15+ tipos: PDF, DOCX, Markdown, HTML, CSV, JSON, repos Git, etc.',
          'Soporte de repositorios con include/exclude patterns.',
          'Parsers específicos para código (tree-sitter) y documentos enriquecidos.',
        ],
      },
      {
        title: 'Colas dedicadas',
        bullets: [
          'Redis + RQ con colas ingestion / enrichment / embedding.',
          'Workers escalables con límites de concurrencia.',
          'Reintentos con backoff y circuit-breaker.',
        ],
      },
      {
        title: 'Observabilidad',
        bullets: [
          'Estados auditables, métricas de tamaño y velocidad.',
          'Webhooks opcionales y streaming por WebSocket.',
          'Alertas de fallos con clasificación root-cause.',
        ],
      },
    ],
    tabs: {
      documents: {
        label: 'Documentos',
        helper:
          'Carga archivos individuales o comprimidos. El sistema dividirá automáticamente en fragmentos semánticos.',
        nameLabel: 'Nombre del lote',
        descriptionLabel: 'Descripción',
        collectionLabel: 'Colección destino en Qdrant',
        fileLabel: 'Selecciona archivos',
      },
      github: {
        label: 'Repositorio Git',
        helper:
          'Sincroniza repositorios completos o parciales definiendo patrones de inclusión y exclusión.',
        repoLabel: 'URL del repositorio',
        branchLabel: 'Rama',
        includeLabel: 'Incluir patrones (uno por línea)',
        excludeLabel: 'Excluir patrones (uno por línea)',
      },
      structured: {
        label: 'Fuente estructurada',
        helper:
          'Conecta bases de datos o APIs que devuelven JSON/CSV. Define el mapeo para generar embeddings de columnas clave.',
        endpointLabel: 'Endpoint / conexión',
        authLabel: 'Cabecera de autenticación',
        mappingLabel: 'Mapa de campos (JSON)',
        scheduleLabel: 'Frecuencia de actualización',
      },
    },
    proFormMessage:
      'Disponible únicamente para cuentas Pro. Completa los campos y solicita una demo guiada.',
  },
  en: {
    heroTitle: 'Advanced Ingestion',
    heroSubtitle:
      'Orchestrate asynchronous pipelines to ingest repositories, large batches and structured sources with full control.',
    proBadge: 'Pro',
    proCallout:
      'Advanced ingestion ships with Anclora Pro. Explore the workflow below and request access to unlock it.',
    requestButton: 'Request access',
    featuresTitle: 'Key capabilities',
    proReminder:
      'Sign in with an Anclora Pro subscription to run advanced ingestion. Meanwhile we expose the end-to-end pipeline.',
    pipelineTitle: 'Orchestrated pipeline',
    timeline: [
      {
        title: 'Batch management',
        description:
          'Batch Manager groups uploads, validates size limits and controls lifecycle (pending → processing → completed).',
      },
      {
        title: 'Validation & normalization',
        description:
          'Detect duplicates with SimHash, run optional antivirus and normalize everything to UTF-8 before parsing.',
      },
      {
        title: 'Specialized parsing',
        description:
          'Auto-selects the best parser: unstructured.io, domain-specific extractors or tree-sitter for repositories.',
      },
      {
        title: 'Semantic chunking',
        description:
          'Smart fragmentation powered by LlamaIndex SentenceSplitter (512 tokens / overlap 80).',
      },
      {
        title: 'Embeddings & enrichment',
        description:
          'Embeds with nomic-embed-text v1.5 and enriches with contextual metadata.',
      },
      {
        title: 'Indexing & audit',
        description:
          'Push vectors to Qdrant, register metadata in Supabase and persist audit logs for full traceability.',
      },
    ],
    featureCards: [
      {
        title: 'Batch manager',
        bullets: [
          'Traceable IDs, description and assigned owner.',
          'Live tracking (progress, partial failures).',
          'Metadata retention and target Qdrant collection.',
        ],
      },
      {
        title: 'Multi-format processing',
        bullets: [
          '15+ formats: PDF, DOCX, Markdown, HTML, CSV, JSON, Git repos, etc.',
          'Repository ingestion with include/exclude patterns.',
          'Dedicated parsers for code (tree-sitter) and enriched docs.',
        ],
      },
      {
        title: 'Dedicated queues',
        bullets: [
          'Redis + RQ with ingestion / enrichment / embedding queues.',
          'Scalable workers with concurrency caps.',
          'Retries with exponential backoff and circuit-breaker.',
        ],
      },
      {
        title: 'Observability',
        bullets: [
          'Auditable statuses, size and throughput metrics.',
          'Optional webhooks and WebSocket streaming.',
          'Failure alerts with root-cause tagging.',
        ],
      },
    ],
    tabs: {
      documents: {
        label: 'Documents',
        helper:
          'Upload individual files or archives. The system will automatically chunk them semantically.',
        nameLabel: 'Batch name',
        descriptionLabel: 'Description',
        collectionLabel: 'Destination Qdrant collection',
        fileLabel: 'Choose files',
      },
      github: {
        label: 'Git repository',
        helper:
          'Sync full repositories or subsets by defining include and exclude patterns.',
        repoLabel: 'Repository URL',
        branchLabel: 'Branch',
        includeLabel: 'Include patterns (one per line)',
        excludeLabel: 'Exclude patterns (one per line)',
      },
      structured: {
        label: 'Structured source',
        helper:
          'Connect databases or APIs returning JSON/CSV. Define a mapping to build embeddings from key fields.',
        endpointLabel: 'Endpoint / connection',
        authLabel: 'Auth header',
        mappingLabel: 'Field mapping (JSON)',
        scheduleLabel: 'Refresh cadence',
      },
    },
    proFormMessage:
      'Only available for Pro accounts. Fill in the form and request a guided demo to enable it.',
  },
} as const;

export default function AdvancedIngestionPage() {
  const { language } = useUISettings();
  const text = COPY[language];
  const [activeTab, setActiveTab] = useState<TabId>('documents');
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleProSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFeedback(
      language === 'es'
        ? 'Inicia sesión con una cuenta Pro o contacta con el equipo de Anclora para habilitar la ingesta avanzada.'
        : 'Sign in with a Pro account or contact the Anclora team to enable advanced ingestion.',
    );
  };

  const tab = text.tabs[activeTab];

  return (
    <div className="container-app py-6 space-y-6">
      <section className="relative overflow-hidden rounded-2xl border border-anclora-primary bg-white p-8 shadow-xl">
        <div className="absolute -right-16 top-6 rotate-45 bg-anclora-primary px-20 py-2 text-sm font-semibold text-white shadow-lg">
          {text.proBadge}
        </div>
        <div className="space-y-4 max-w-3xl">
          <h1 className="text-3xl font-semibold text-gray-900">{text.heroTitle}</h1>
          <p className="text-lg text-gray-600">{text.heroSubtitle}</p>
          <div className="rounded-xl border border-dashed border-anclora-primary/60 bg-anclora-primary/5 p-4 text-sm text-anclora-primary">
            {text.proCallout}
          </div>
          <button className="button-primary w-fit">{text.requestButton}</button>
        </div>
      </section>

      <section className="card p-6 bg-white shadow-lg">
        <h2 className="card-header mb-4 text-gray-900">{text.featuresTitle}</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {text.featureCards.map((card) => (
            <div
              key={card.title}
              className="rounded-xl border border-gray-200 bg-white/60 p-5 shadow-sm"
            >
              <h3 className="text-lg font-semibold text-gray-900">{card.title}</h3>
              <ul className="mt-3 space-y-2 text-sm text-gray-600">
                {card.bullets.map((bullet) => (
                  <li key={bullet} className="flex items-start gap-2">
                    <span className="mt-1 text-anclora-primary">•</span>
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className="card p-6 bg-white shadow-lg">
        <h2 className="card-header mb-6 text-gray-900">{text.pipelineTitle}</h2>
        <div className="space-y-4">
          {text.timeline.map((item, index) => (
            <div key={item.title} className="relative rounded-xl border border-gray-100 bg-gray-50 p-4">
              <span className="absolute -left-3 top-4 flex h-6 w-6 items-center justify-center rounded-full bg-anclora-primary text-xs font-semibold text-white">
                {index + 1}
              </span>
              <h3 className="pl-6 text-base font-semibold text-gray-900">{item.title}</h3>
              <p className="pl-6 text-sm text-gray-600">{item.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="relative card overflow-hidden bg-white shadow-xl">
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-br from-anclora-primary/5 via-white to-anclora-secondary/5" />
        <div className="relative p-6 space-y-6">
          <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
            {text.proReminder}
          </div>

          {feedback && (
            <div className="rounded-xl border border-anclora-primary/40 bg-anclora-primary/10 p-4 text-sm text-anclora-primary">
              {feedback}
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            {Object.entries(text.tabs).map(([key, value]) => {
              const id = key as TabId;
              const isActive = activeTab === id;
              return (
                <button
                  key={key}
                  onClick={() => setActiveTab(id)}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                    isActive
                      ? 'bg-anclora-primary text-white shadow-lg'
                      : 'bg-white border border-gray-200 text-gray-700 hover:border-anclora-secondary'
                  }`}
                >
                  {value.label}
                </button>
              );
            })}
          </div>

          <form onSubmit={handleProSubmit} className="space-y-4">
            <p className="text-sm text-gray-600">{tab.helper}</p>

            {activeTab === 'documents' && (
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">
                    {tab.nameLabel}
                  </label>
                  <input
                    type="text"
                    className="input-control"
                    placeholder="Customer success - Q4 rollout"
                    disabled
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">
                    {tab.collectionLabel}
                  </label>
                  <input
                    type="text"
                    className="input-control"
                    placeholder="cs_rollout_q4"
                    disabled
                  />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <label className="text-sm font-semibold text-gray-700">
                    {tab.descriptionLabel}
                  </label>
                  <textarea
                    className="input-control min-h-[120px]"
                    placeholder="Notas internas, manuales de soporte y flujos de onboarding para el equipo de Customer Success."
                    disabled
                  />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <label className="text-sm font-semibold text-gray-700">
                    {tab.fileLabel}
                  </label>
                  <div className="flex items-center justify-between rounded-lg border border-dashed border-anclora-secondary/60 bg-white px-4 py-3 text-sm text-gray-600">
                    <span>knowledge_base.zip</span>
                    <span className="rounded-full bg-anclora-secondary/10 px-3 py-1 text-xs font-semibold text-anclora-secondary">
                      128 MB
                    </span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'github' && (
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">
                    {tab.repoLabel}
                  </label>
                  <input
                    type="text"
                    className="input-control"
                    placeholder="https://github.com/anclora/example"
                    disabled
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">
                    {tab.branchLabel}
                  </label>
                  <input type="text" className="input-control" placeholder="main" disabled />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">
                    {tab.includeLabel}
                  </label>
                  <textarea
                    className="input-control min-h-[120px]"
                    placeholder="docs/**&#10;src/**/*.py&#10;src/**/*.md"
                    disabled
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">
                    {tab.excludeLabel}
                  </label>
                  <textarea
                    className="input-control min-h-[120px]"
                    placeholder="**/tests/**&#10;**/*.png"
                    disabled
                  />
                </div>
              </div>
            )}

            {activeTab === 'structured' && (
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">
                    {tab.endpointLabel}
                  </label>
                  <input
                    type="text"
                    className="input-control"
                    placeholder="postgresql://analytics.internal:5432/supabase"
                    disabled
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">
                    {tab.authLabel}
                  </label>
                  <input
                    type="text"
                    className="input-control"
                    placeholder="Bearer ***"
                    disabled
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-semibold text-gray-700">
                    {tab.mappingLabel}
                  </label>
                  <textarea
                    className="input-control min-h-[140px] font-mono text-sm"
                    placeholder={`{\n  "title": "record.title",\n  "summary": "record.description",\n  "metadata": {\n    "owner": "record.owner_email",\n    "segment": "record.segment"\n  }\n}`}
                    disabled
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">
                    {tab.scheduleLabel}
                  </label>
                  <input
                    type="text"
                    className="input-control"
                    placeholder="Cada 6 horas"
                    disabled
                  />
                </div>
              </div>
            )}

            <div className="flex items-center justify-between border-t border-gray-100 pt-4">
              <p className="text-sm text-gray-500">{text.proFormMessage}</p>
              <button
                type="submit"
                className="button-primary"
              >
                {text.requestButton}
              </button>
            </div>
          </form>
        </div>
      </section>
    </div>
  );
}
