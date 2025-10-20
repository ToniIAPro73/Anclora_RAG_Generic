import { useState, useRef, useEffect, FormEvent } from "react";
import { isAxiosError } from "axios";
import { queryDocuments } from "@/lib/api";
import Message from "./Message";
import { useUISettings } from "./ui-settings-context";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  sources?: Array<{
    text: string;
    score?: number | null;
    metadata?: Record<string, unknown>;
  }>;
}

const PLACEHOLDER_TEXT = {
  es: "Escribe tu pregunta...",
  en: "Type your question...",
} as const;

const EMPTY_STATE_TEXT = {
  es: "Sube un documento y comienza a hacer preguntas",
  en: "Upload a document and start asking questions",
} as const;

const NEW_CHAT_TEXT = {
  es: "Nuevo chat",
  en: "New chat",
} as const;

export default function Chat() {
  const { language } = useUISettings();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const handleNewChat = () => {
    setMessages([]);
    setInput("");
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      role: "user",
      content: input.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const result = await queryDocuments(userMessage.content, 3, language);

      const assistantMessage: ChatMessage = {
        role: "assistant",
        content: result.answer,
        sources: result.sources,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error: unknown) {
      const fallback =
        error instanceof Error ? error.message : typeof error === "string" ? error : "Unknown error";
      const detail =
        isAxiosError(error) && error.response?.data && typeof error.response.data === "object"
          ? (error.response.data as { detail?: string }).detail ?? fallback
          : fallback;
      const errorMessage: ChatMessage = {
        role: "assistant",
        content: `Error: ${detail}`,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header with New Chat button */}
      {messages.length > 0 && (
        <div className="flex items-center justify-between border-b border-gray-200 bg-white/60 px-4 py-2 dark:border-slate-700 dark:bg-transparent">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-slate-300">
            {language === "es" ? "Conversación" : "Conversation"}
          </h3>
          <button
            onClick={handleNewChat}
            className="flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 transition-colors hover:bg-gray-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
          >
            <span className="text-base">✨</span>
            {NEW_CHAT_TEXT[language]}
          </button>
        </div>
      )}

      {/* Messages area with dynamic scroll */}
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

      {/* Input area */}
      <div className="mt-auto border-t border-gray-100 bg-white/80 p-4 dark:border-slate-700 dark:bg-transparent">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={PLACEHOLDER_TEXT[language]}
            className="flex-1 rounded-lg border border-gray-200 bg-white px-4 py-2 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-anclora-primary/50 focus:border-anclora-primary dark:border-slate-600 dark:bg-slate-900/70 dark:text-slate-100 dark:placeholder-slate-400 dark:focus:ring-anclora-secondary/60"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="rounded-lg bg-gradient-anclora px-6 py-2 text-white shadow-md transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {language === "es" ? "Enviar" : "Send"}
          </button>
        </form>
      </div>
    </div>
  );
}
