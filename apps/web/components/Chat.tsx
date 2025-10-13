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
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500">
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
                <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-md">
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 bg-anclora-primary rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-anclora-secondary rounded-full animate-bounce delay-100"></div>
                    <div className="w-2 h-2 bg-anclora-primary rounded-full animate-bounce delay-200"></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      <div className="border-t bg-white p-4 mt-auto">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={PLACEHOLDER_TEXT[language]}
            className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-anclora-primary"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="bg-gradient-anclora text-white px-6 py-2 rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity shadow-md"
          >
            {language === 'es' ? 'Enviar' : 'Send'}
          </button>
        </form>
      </div>
    </div>
  );
}
