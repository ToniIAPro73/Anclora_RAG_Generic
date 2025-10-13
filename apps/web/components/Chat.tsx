import { useState, useRef, useEffect, FormEvent } from 'react';
import { queryDocuments } from '@/lib/api';
import Message from './Message';
import { useUISettings } from './ui-settings-context';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  sources?: Array<{
    text: string;
    score: number;
  }>;
}

const PLACEHOLDER_TEXT = {
  es: 'Escribe tu pregunta...',
  en: 'Type your question...',
} as const;

const EMPTY_STATE_TEXT = {
  es: 'Sube un documento y comienza a hacer preguntas',
  en: 'Upload a document and start asking questions',
} as const;

export default function Chat() {
  const { language } = useUISettings();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: input.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const result = await queryDocuments(userMessage.content, 3, language);

      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: result.response,
        sources: result.sources,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error: any) {
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: `Error: ${error.response?.data?.detail || error.message}`,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center text-gray-500 dark:text-slate-400">
            <p>{EMPTY_STATE_TEXT[language]}</p>
          </div>
        ) : (
          <>
            {messages.map((msg, idx) => (
              <Message
                key={idx}
                role={msg.role}
                content={msg.content}
                language={language}
                sources={msg.sources}
              />
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-md dark:border-slate-700 dark:bg-slate-900/80">
                  <div className="flex space-x-2">
                    <div className="h-2 w-2 animate-bounce rounded-full bg-anclora-primary"></div>
                    <div className="h-2 w-2 animate-bounce rounded-full bg-anclora-secondary delay-100"></div>
                    <div className="h-2 w-2 animate-bounce rounded-full bg-anclora-primary delay-200"></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      <div className="mt-auto border-t border-gray-200 bg-white p-4 dark:border-slate-700 dark:bg-transparent">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={PLACEHOLDER_TEXT[language]}
            className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-anclora-primary dark:border-slate-600 dark:bg-slate-900/70 dark:text-slate-100 dark:placeholder-slate-400 dark:focus:ring-anclora-secondary/60"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="rounded-lg bg-gradient-anclora px-6 py-2 text-white shadow-md transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {language === 'es' ? 'Enviar' : 'Send'}
          </button>
        </form>
      </div>
    </div>
  );
}
