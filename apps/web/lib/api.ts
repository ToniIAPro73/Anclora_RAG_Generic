import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8030';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface IngestResponse {
  file: string;
  chunks?: number;
  chunk_count?: number;
  status?: string;
  job_id?: string;
  message?: string;
}

export interface JobStatusResponse {
  job_id: string;
  status: 'queued' | 'processing' | 'completed' | 'failed' | 'deferred' | 'scheduled' | 'stopped' | 'canceled';
  created_at: string | null;
  started_at: string | null;
  ended_at: string | null;
  result?: {
    file: string;
    chunks: number;
    status: string;
  };
  error?: string;
}

export interface QueryResponseSource {
  text: string;
  score: number | null;
  metadata?: Record<string, unknown>;
}

export interface QueryResponse {
  query: string;
  answer: string;
  sources: QueryResponseSource[];
  metadata?: Record<string, unknown>;
}

export const ingestDocument = async (file: File): Promise<IngestResponse> => {
  const formData = new FormData();
  formData.append('file', file);

  const { data } = await apiClient.post<IngestResponse>('/ingest', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return data;
};

export const getJobStatus = async (jobId: string): Promise<JobStatusResponse> => {
  const { data } = await apiClient.get<JobStatusResponse>(`/ingest/status/${jobId}`);
  return data;
};

export interface DocumentHistoryItem {
  id: string;
  filename: string;
  chunks: number;
  created_at: string | null;
}

export interface DocumentHistoryResponse {
  documents: DocumentHistoryItem[];
  total: number;
}

export const getDocumentHistory = async (limit: number = 50): Promise<DocumentHistoryResponse> => {
  const { data } = await apiClient.get<DocumentHistoryResponse>(`/ingest/history?limit=${limit}`);
  return data;
};

export const queryDocuments = async (
  query: string,
  topK: number = 3,
  language: 'es' | 'en' = 'es'
): Promise<QueryResponse> => {
  const { data } = await apiClient.post<QueryResponse>('/query', {
    query,
    top_k: topK,
    language,
  });

  return data;
};
